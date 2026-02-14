import React, { useState } from 'react';
import type { FormTemplate, NextActionType, QuestionOption } from '../../types/form';
import { FormInput } from './FormInput';
import { ChevronRight, ChevronLeft, Check } from 'lucide-react';
import { getFileUrl } from '../../services/albumService';

interface PersonalFormRendererProps {
  template: FormTemplate;
  answers: Record<string, string | number | boolean | string[] | null>;
  onChange: (questionId: number, value: string | number | boolean | string[] | null) => void;
  onSubmit: () => void;
  readOnly?: boolean;
}

export const PersonalFormRenderer: React.FC<PersonalFormRendererProps> = ({
  template,
  answers,
  onChange,
  onSubmit,
  readOnly = false,
}) => {
  const [currentSectionIndex, setCurrentSectionIndex] = useState(0);
  const [historyStack, setHistoryStack] = useState<number[]>([]);

  // 섹션 모드인지 확인 (sections 배열이 있고 비어있지 않은 경우)
  const isSectionMode = template.sections && template.sections.length > 0;
  
  // 렌더링할 질문 목록 결정
  const currentQuestions = isSectionMode
    ? template.sections![currentSectionIndex].questions
    : template.questions;

  // 다음 단계 계산 로직
  const getNextStep = (): { action: NextActionType; targetIndex?: number | null } => {
    // 섹션 모드가 아니면 바로 제출
    if (!isSectionMode) return { action: 'SUBMIT' };

    const currentSection = template.sections![currentSectionIndex];
    const isLastSection = currentSectionIndex === (template.sections!.length - 1);

    // 1. 질문 기반 분기 (1순위)
    for (const q of currentQuestions) {
      if ((q.inputType === 'SINGLE_CHOICE' || q.inputType === 'MULTIPLE_CHOICE') && answers[q.id]) {
        
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
          const answerVal = answers[q.id];
          
          // 답변과 일치하는 옵션 찾기
          const selectedOption = options.find(o => o.label === answerVal);
          
          // nextAction이 설정되어 있다면 그 설정을 최우선으로 따름
          if (selectedOption && selectedOption.nextAction) {
            return { 
              action: selectedOption.nextAction, 
              targetIndex: selectedOption.targetSectionIndex 
            };
          }
        }
      }
    }

    // 2. 섹션 기본 설정 (2순위)
    if (currentSection.defaultNextAction) {
      // Special case: If action is CONTINUE and we are at the last section, treat as SUBMIT
      if (currentSection.defaultNextAction === 'CONTINUE' && 
          isLastSection && 
          (currentSection.defaultTargetSectionIndex === null || currentSection.defaultTargetSectionIndex === undefined)) {
        return { action: 'SUBMIT' };
      }

      return { 
        action: currentSection.defaultNextAction, 
        targetIndex: currentSection.defaultTargetSectionIndex 
      };
    }

    // 3. 기본 동작 (3순위)
    if (isLastSection) {
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
      // 타겟 인덱스가 유효한지 확인
      if (targetIndex >= 0 && targetIndex < template.sections!.length) {
        nextIndex = targetIndex;
      }
    } else if (action === 'CONTINUE') {
      // 명시적 타겟이 있으면 거기로, 없으면 +1
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
      // 갈 곳이 없거나 잘못된 경우 제출로 처리하거나 종료
      // 여기서는 안전하게 마지막 섹션이라면 제출로 유도
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
      // 스택이 비었지만 0이 아닌 경우 (혹시 모를 상황) -> 바로 앞 섹션으로
      setCurrentSectionIndex(prev => prev - 1);
      window.scrollTo(0, 0);
    }
  };

  // 현재 단계에서 "다음" 버튼이 "제출" 버튼이 되어야 하는지 확인
  const nextStepInfo = getNextStep();
  const isSubmitStep = nextStepInfo.action === 'SUBMIT';

  return (
    <div className="space-y-6">
      {/* Progress Indicator (Only in Section Mode) */}
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

      {/* Questions List */}
      <div className="space-y-8">
        {currentQuestions
          .sort((a, b) => a.orderIndex - b.orderIndex)
          .map((question) => (
            <div key={question.id} className="space-y-2">
              {question.imageUrl && (
                <div className="mb-2">
                  <img 
                    src={getFileUrl(question.imageUrl)} 
                    alt={question.label} 
                    className="max-h-60 rounded-lg border border-slate-200 object-contain"
                  />
                </div>
              )}
              <label className="block text-sm font-semibold text-slate-700">
                {typeof question.label === 'string' ? question.label : ''}
                {question.required && <span className="ml-1 text-rose-500">*</span>}
              </label>
              <FormInput
                question={question}
                value={answers[question.id]}
                onChange={(val) => onChange(question.id, val)}
                disabled={readOnly}
              />
            </div>
          ))}
      </div>

      {/* Navigation Buttons */}
      <div className="flex items-center justify-between border-t border-slate-200 pt-6 mt-8">
        {isSectionMode ? (
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
        ) : (
          <div /> // Spacer
        )}

        {!readOnly || !isSubmitStep ? (
          <button
            onClick={handleNext}
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
