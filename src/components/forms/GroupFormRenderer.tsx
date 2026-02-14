import React, { useState } from 'react';
import type { FormTemplate, NextActionType, QuestionOption } from '../../types/form';
import { FormInput } from './FormInput';
import { ChevronRight, ChevronLeft, Check } from 'lucide-react';
import { getFileUrl } from '../../services/albumService';

interface GroupFormRendererProps {
  template: FormTemplate;
  members: string[];
  answers: Record<string, Record<string, string | number | boolean | string[] | null>>; // { [memberName]: { [questionId]: value } }
  onChange: (memberName: string, questionId: number, value: string | number | boolean | string[] | null) => void;
  onSubmit: () => void;
  readOnly?: boolean;
}

export const GroupFormRenderer: React.FC<GroupFormRendererProps> = ({
  template,
  members,
  answers,
  onChange,
  onSubmit,
  readOnly = false,
}) => {
  const [currentSectionIndex, setCurrentSectionIndex] = useState(0);
  const [historyStack, setHistoryStack] = useState<number[]>([]);

  // Section Mode Logic
  const isSectionMode = template.sections && template.sections.length > 0;
  
  // Determine questions to display
  let questionsToDisplay = template.questions;
  if (isSectionMode) {
    const currentSection = template.sections![currentSectionIndex];
    questionsToDisplay = currentSection.questions;
  }

  const sortedQuestions = [...questionsToDisplay].sort((a, b) => a.orderIndex - b.orderIndex);
  
  const memberQuestions = sortedQuestions.filter(q => q.memberSpecific);
  const groupQuestions = sortedQuestions.filter(q => !q.memberSpecific);

  // 다음 단계 계산 로직
  const getNextStep = (): { action: NextActionType; targetIndex?: number | null } => {
    if (!isSectionMode) return { action: 'SUBMIT' };

    const currentSection = template.sections![currentSectionIndex];
    
    // Check COMMON questions for branching
    const commonQuestions = currentSection.questions.filter(q => !q.memberSpecific);

    for (const q of commonQuestions) {
      const commonAnswer = answers['COMMON']?.[q.id];
      if ((q.inputType === 'SINGLE_CHOICE' || q.inputType === 'MULTIPLE_CHOICE') && commonAnswer) {
         
         let options: QuestionOption[] = [];
         // Priority: richOptions (from Builder/State) > optionsJson (from Backend)
         if ((q as any).richOptions) {
           options = (q as any).richOptions;
         } else if (q.optionsJson) {
           try {
             options = JSON.parse(q.optionsJson);
           } catch (e) {
             console.error("Invalid optionsJson", e);
           }
         }

         if (options.length > 0) {
           const selectedOption = options.find(o => o.label === commonAnswer);
           if (selectedOption && selectedOption.nextAction) {
             return { 
               action: selectedOption.nextAction, 
               targetIndex: selectedOption.targetSectionIndex 
             };
           }
         }
      }
    }

    // Default Section Logic
    if (currentSection.defaultNextAction) {
      // Special case: If action is CONTINUE and we are at the last section, treat as SUBMIT
      // unless there is a specific target index (e.g. looping back)
      if (currentSection.defaultNextAction === 'CONTINUE' && 
          currentSectionIndex === (template.sections!.length - 1) && 
          (currentSection.defaultTargetSectionIndex === null || currentSection.defaultTargetSectionIndex === undefined)) {
        return { action: 'SUBMIT' };
      }

      return { 
        action: currentSection.defaultNextAction, 
        targetIndex: currentSection.defaultTargetSectionIndex 
      };
    }

    if (currentSectionIndex === (template.sections!.length - 1)) {
      return { action: 'SUBMIT' };
    } else {
      return { action: 'CONTINUE', targetIndex: currentSectionIndex + 1 };
    }
  };

  const handleNext = () => {
    const { action, targetIndex } = getNextStep();

    if (action === 'SUBMIT') {
      onSubmit();
      return;
    }

    let nextIndex = -1;

    if (action === 'GO_TO_SECTION' && targetIndex !== undefined && targetIndex !== null) {
      if (targetIndex >= 0 && targetIndex < template.sections!.length) {
        nextIndex = targetIndex;
      }
    } else if (action === 'CONTINUE') {
      if (targetIndex !== undefined && targetIndex !== null) {
        nextIndex = targetIndex;
      } else {
        nextIndex = currentSectionIndex + 1;
      }
    }

    if (nextIndex !== -1 && nextIndex < template.sections!.length) {
      setHistoryStack(prev => [...prev, currentSectionIndex]);
      setCurrentSectionIndex(nextIndex);
      window.scrollTo(0, 0);
    } else {
       if (currentSectionIndex === template.sections!.length - 1) {
        onSubmit();
      }
    }
  };

  const handlePrev = () => {
    if (historyStack.length > 0) {
      const prevIndex = historyStack[historyStack.length - 1];
      setHistoryStack(prev => prev.slice(0, -1));
      setCurrentSectionIndex(prevIndex);
      window.scrollTo(0, 0);
    } else if (currentSectionIndex > 0) {
      setCurrentSectionIndex(prev => prev - 1);
      window.scrollTo(0, 0);
    }
  };

  const nextStepInfo = getNextStep();
  const isSubmitStep = nextStepInfo.action === 'SUBMIT';

  return (
    <div className="space-y-6">
      {/* Section Header */}
      {isSectionMode && (
        <div className="mb-6">
          <div className="mb-4 flex items-center justify-between text-sm text-slate-500">
            <span>
              <span className="font-bold text-slate-900">Step {currentSectionIndex + 1}</span>
              {' / '}
              {template.sections!.length}
            </span>
            <span>{Math.round(((currentSectionIndex + 1) / template.sections!.length) * 100)}%</span>
          </div>
          <div className="mb-6 h-2 w-full overflow-hidden rounded-full bg-slate-100">
            <div
              className="h-full bg-blue-600 transition-all duration-300 ease-out"
              style={{ width: `${((currentSectionIndex + 1) / template.sections!.length) * 100}%` }}
            />
          </div>
          
          <div className="mt-4">
             {currentSectionIndex === 0 ? (
                <div className="rounded-xl border border-t-[12px] border-slate-200 border-t-purple-700 bg-white p-6 shadow-sm">
                   <h1 className="text-3xl font-bold text-slate-900">{template.title}</h1>
                   {template.description && (
                     <p className="mt-4 text-base text-slate-600 whitespace-pre-wrap">{template.description}</p>
                   )}
                </div>
             ) : (
                <div className="space-y-4">
                   <h3 className="text-2xl font-bold text-slate-900 px-1">{template.title}</h3>
                   <div className="rounded-xl bg-purple-700 p-4 text-white shadow-sm">
                      <h2 className="text-xl font-bold">{template.sections![currentSectionIndex].title}</h2>
                      {template.sections![currentSectionIndex].description && (
                         <p className="mt-1 text-sm text-purple-100">{template.sections![currentSectionIndex].description}</p>
                      )}
                   </div>
                </div>
             )}
          </div>
        </div>
      )}

      <div className="space-y-8">
        {/* 1. Member Specific Questions (Table) */}
        {memberQuestions.length > 0 ? (
          <div className="space-y-3">
            <h3 className="font-bold text-slate-800">• 순원별 보고</h3>
            <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
              <table className="w-full border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50">
                    <th className="border border-slate-300 px-3 py-2 text-left font-semibold text-slate-700 min-w-[80px]">
                      이름
                    </th>
                    {memberQuestions.map((q) => (
                      <th
                        key={q.id}
                        className="border border-slate-300 px-3 py-2 text-left font-semibold text-slate-700 min-w-[100px]"
                      >
                        {q.label}
                        {q.required && <span className="ml-1 text-rose-500">*</span>}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {members.map((member) => (
                    <tr key={member} className="hover:bg-slate-50 transition-colors">
                      <td className="border border-slate-300 px-3 py-2 font-medium text-slate-900 bg-white">
                        {member}
                      </td>
                      {memberQuestions.map((q) => {
                        const val = answers[member]?.[q.id];
                        return (
                          <td key={q.id} className="border border-slate-300 px-3 py-2 bg-white">
                             <FormInput
                              question={q}
                              value={val}
                              onChange={(newVal) => onChange(member, q.id, newVal)}
                              disabled={readOnly}
                              compact={true} // Table mode
                            />
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          <div className="rounded-lg border border-dashed border-slate-300 bg-slate-50 p-6 text-center">
            <p className="text-sm font-medium text-slate-900">순원별 질문이 없습니다.</p>
            <p className="mt-1 text-xs text-slate-500">질문 설정에서 '순원 개인 질문'을 체크하면 순원 목록이 표시됩니다.</p>
          </div>
        )}

        {/* 2. Group Common Questions (List) */}
        {groupQuestions.length > 0 && (
          <div className="space-y-3">
             <h3 className="font-bold text-slate-800">• 전체 보고</h3>
             <div className="space-y-4 rounded-xl border border-slate-200 bg-white p-6">
              {groupQuestions.map((q) => {
                const val = answers['COMMON']?.[q.id]; 
                return (
                  <div key={q.id}>
                    {q.imageUrl && (
                      <div className="mb-2">
                        <img 
                          src={getFileUrl(q.imageUrl)} 
                          alt={q.label} 
                          className="max-h-60 rounded-lg border border-slate-200 object-contain"
                        />
                      </div>
                    )}
                    <label className="mb-1 block text-sm font-medium text-slate-700">
                      {typeof q.label === 'string' ? q.label : ''}
                      {q.required && <span className="ml-1 text-rose-500">*</span>}
                    </label>
                    <FormInput
                      question={q}
                      value={val}
                      onChange={(newVal) => onChange('COMMON', q.id, newVal)} 
                      disabled={readOnly}
                    />
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Navigation Buttons */}
      <div className="mt-8 flex justify-between pt-4 border-t border-slate-200">
        <button
          onClick={handlePrev}
          disabled={currentSectionIndex === 0 && historyStack.length === 0}
          className={`flex items-center gap-1 rounded-lg px-4 py-2 text-sm font-medium transition-colors
            ${(currentSectionIndex === 0 && historyStack.length === 0)
              ? 'text-slate-300 cursor-not-allowed' 
              : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'}`}
        >
          <ChevronLeft className="h-4 w-4" />
          이전
        </button>

        {!readOnly || !isSubmitStep ? (
          <button
            onClick={isSubmitStep ? onSubmit : handleNext}
            className={`flex items-center gap-1 rounded-lg px-6 py-2 text-sm font-bold text-white shadow-sm transition-colors
              ${isSubmitStep 
                ? 'bg-green-600 hover:bg-green-700' 
                : 'bg-blue-600 hover:bg-blue-700'}`}
          >
            {isSubmitStep ? (
              <>
                <Check className="h-4 w-4" />
                제출하기
              </>
            ) : (
              <>
                다음
                <ChevronRight className="h-4 w-4" />
              </>
            )}
          </button>
        ) : (
          <div className="flex items-center gap-2 text-slate-400 text-sm font-medium italic">
            <Check className="h-4 w-4" />
            마지막 페이지입니다
          </div>
        )}
      </div>
    </div>
  );
};
