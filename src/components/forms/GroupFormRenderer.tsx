import React, { useState } from 'react';
import type { FormTemplate } from '../../types/form';
import { FormInput } from './FormInput';
import { ChevronRight, ChevronLeft, Check } from 'lucide-react';

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

  // Section Mode Logic
  const isSectionMode = template.sections && template.sections.length > 0;
  
  // Determine questions to display
  let questionsToDisplay = template.questions;
  let currentSectionTitle = '';
  let currentSectionDescription = '';

  if (isSectionMode) {
    const currentSection = template.sections![currentSectionIndex];
    questionsToDisplay = currentSection.questions;
    currentSectionTitle = currentSection.title;
    currentSectionDescription = currentSection.description || '';
  }

  const sortedQuestions = [...questionsToDisplay].sort((a, b) => a.orderIndex - b.orderIndex);
  
  const memberQuestions = sortedQuestions.filter(q => q.memberSpecific);
  const groupQuestions = sortedQuestions.filter(q => !q.memberSpecific);

  const isLastSection = !isSectionMode || currentSectionIndex === (template.sections!.length - 1);

  const handlePrev = () => {
    if (currentSectionIndex > 0) {
      setCurrentSectionIndex(prev => prev - 1);
      window.scrollTo(0, 0);
    }
  };

  const handleNext = () => {
    if (isLastSection) {
      onSubmit();
    } else {
      setCurrentSectionIndex(prev => prev + 1);
      window.scrollTo(0, 0);
    }
  };

  return (
    <div className="space-y-6">
      {/* Section Header */}
      {isSectionMode && (
        <div className="mb-6 border-b border-slate-200 pb-4">
          <h2 className="text-lg font-bold text-slate-800">{currentSectionTitle}</h2>
          {currentSectionDescription && (
            <p className="mt-1 text-sm text-slate-500">{currentSectionDescription}</p>
          )}
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
                    <label className="mb-1 block text-sm font-medium text-slate-700">
                      {q.label}
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
      {!readOnly && (
        <div className="mt-8 flex justify-between pt-4 border-t border-slate-200">
          <button
            onClick={handlePrev}
            disabled={currentSectionIndex === 0}
            className={`flex items-center gap-1 rounded-lg px-4 py-2 text-sm font-medium transition-colors
              ${currentSectionIndex === 0 
                ? 'text-slate-300 cursor-not-allowed' 
                : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'}`}
          >
            <ChevronLeft className="h-4 w-4" />
            이전
          </button>

          <button
            onClick={handleNext}
            className={`flex items-center gap-1 rounded-lg px-6 py-2 text-sm font-bold text-white shadow-sm transition-colors
              ${isLastSection 
                ? 'bg-green-600 hover:bg-green-700' 
                : 'bg-blue-600 hover:bg-blue-700'}`}
          >
            {isLastSection ? (
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
        </div>
      )}
    </div>
  );
};
