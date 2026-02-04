import React from 'react';
import type { FormQuestion } from '../../types/form';

interface FormInputProps {
  question: FormQuestion;
  value: string | number | boolean | string[] | null;
  onChange: (value: string | number | boolean | string[] | null) => void;
  disabled?: boolean;
  className?: string; // For additional styling overrides
  compact?: boolean;
}

export const FormInput: React.FC<FormInputProps> = ({
  question,
  value,
  onChange,
  disabled = false,
  className = '',
  compact = false,
}) => {
  const commonClasses = `rounded border border-slate-300 ${compact ? 'px-1 py-0.5 text-xs' : 'px-2 py-1 text-sm'} disabled:bg-slate-100 ${className}`;

  switch (question.inputType) {
    case 'SHORT_TEXT':
      return (
        <input
          type="text"
          value={typeof value === 'string' || typeof value === 'number' ? value : ''}
          onChange={(e) => onChange(e.target.value)}
          className={`w-full ${commonClasses}`}
          disabled={disabled}
        />
      );

    case 'LONG_TEXT':
      return (
        <textarea
          value={typeof value === 'string' || typeof value === 'number' ? value : ''}
          onChange={(e) => onChange(e.target.value)}
          className={`w-full ${commonClasses}`}
          rows={compact ? 1 : 3}
          disabled={disabled}
        />
      );

    case 'NUMBER':
      return (
        <input
          type="number"
          value={typeof value === 'string' || typeof value === 'number' ? value : ''}
          onChange={(e) => onChange(e.target.value)}
          className={`w-full ${commonClasses}`}
          disabled={disabled}
        />
      );

    case 'BOOLEAN':
      return (
        <div className="flex items-center justify-center">
          <input
            type="checkbox"
            checked={!!value}
            onChange={(e) => onChange(e.target.checked)}
            className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
            disabled={disabled}
          />
        </div>
      );

    case 'SINGLE_CHOICE': {
      const singleOptions = question.options?.length 
        ? question.options 
        : (question.optionsJson ? JSON.parse(question.optionsJson).map((o: { label: string }) => o.label) : []);
      
      return (
        <div className="space-y-2">
          {singleOptions.map((opt: string) => (
            <label key={opt} className="flex items-center space-x-2 cursor-pointer">
              <input
                type="radio"
                name={`question-${question.id}`}
                value={opt}
                checked={value === opt}
                onChange={(e) => onChange(e.target.value)}
                disabled={disabled}
                className="h-4 w-4 border-slate-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="text-sm text-slate-700">{opt}</span>
            </label>
          ))}
        </div>
      );
    }

    case 'MULTIPLE_CHOICE': {
      // Simplified for now - assumes value is array of strings
      const currentValues = (Array.isArray(value) ? value : []) as string[];
      const multiOptions = question.options?.length 
        ? question.options 
        : (question.optionsJson ? JSON.parse(question.optionsJson).map((o: { label: string }) => o.label) : []);

      return (
        <div className="space-y-1">
          {multiOptions.map((opt: string) => (
            <label key={opt} className="flex items-center space-x-2 cursor-pointer">
              <input
                type="checkbox"
                checked={currentValues.includes(opt)}
                onChange={(e) => {
                  const newValues = e.target.checked
                    ? [...currentValues, opt]
                    : currentValues.filter((v) => v !== opt);
                  onChange(newValues);
                }}
                disabled={disabled}
                className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="text-sm text-slate-700">{opt}</span>
            </label>
          ))}
        </div>
      );
    }

    case 'WORSHIP_ATTENDANCE':
      return (
        <div className="flex items-center justify-center py-2">
          <label className="flex items-center justify-center cursor-pointer rounded-lg border border-slate-200 bg-slate-50 px-6 py-2 hover:bg-slate-100">
            <input
              type="checkbox"
              checked={!!value}
              onChange={(e) => onChange(e.target.checked)}
              className="h-5 w-5 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
              disabled={disabled}
            />
          </label>
        </div>
      );

    case 'SCHEDULE_ATTENDANCE': {
      // Frontend grouping populates linkedSchedules
      const schedules = question.linkedSchedules || [];
      const currentIds = (Array.isArray(value) ? value : []) as string[];

      if (schedules && schedules.length > 1) {
        // Multi-select mode
        const allIds = schedules.map(s => s.id.toString());
        const isAllSelected = allIds.length > 0 && allIds.every(id => currentIds.includes(id));

        const handleSelectAll = (checked: boolean) => {
          onChange(checked ? allIds : []);
        };

        const handleToggle = (id: string, checked: boolean) => {
          if (checked) {
            onChange([...currentIds, id]);
          } else {
            onChange(currentIds.filter(v => v !== id));
          }
        };

        return (
          <div className="rounded-lg border border-slate-200 p-3 bg-white">
            <div className="flex items-center space-x-2 border-b border-slate-100 pb-2 mb-2">
              <input
                type="checkbox"
                checked={isAllSelected}
                onChange={(e) => handleSelectAll(e.target.checked)}
                className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                disabled={disabled}
              />
              <span className="font-semibold text-sm text-slate-700">전체 참석</span>
            </div>
            <div className="space-y-2 pl-1 max-h-60 overflow-y-auto">
              {schedules.map((s) => (
                <label key={s.id} className="flex items-center space-x-2 cursor-pointer hover:bg-slate-50 p-1 rounded transition-colors">
                  <input
                    type="checkbox"
                    checked={currentIds.includes(s.id.toString())}
                    onChange={(e) => handleToggle(s.id.toString(), e.target.checked)}
                    className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                    disabled={disabled}
                  />
                  <span className="text-sm text-slate-700 flex flex-col sm:flex-row sm:items-center sm:gap-1">
                    <span className="text-xs text-slate-500 font-medium bg-slate-100 px-1.5 py-0.5 rounded">
                      {s.startDate.substring(5, 10)}
                    </span>
                    <span>{s.title}</span>
                  </span>
                </label>
              ))}
            </div>
          </div>
        );
      } else if (schedules && schedules.length === 1) {
        // Single schedule mode
        const s = schedules[0];
        const isChecked = currentIds.includes(s.id.toString());

        return (
          <div className="flex items-center justify-center py-2">
            <label className="flex items-center space-x-2 cursor-pointer rounded-lg border border-slate-200 bg-slate-50 px-4 py-2 hover:bg-slate-100">
              <input
                type="checkbox"
                checked={isChecked}
                onChange={(e) => {
                   if (e.target.checked) onChange([s.id.toString()]);
                   else onChange([]);
                }}
                className="h-5 w-5 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                disabled={disabled}
              />
              <span className="text-sm font-medium text-slate-700">
                [{s.startDate.substring(5, 10)}] {s.title}
              </span>
            </label>
          </div>
        );
      }

      return <div className="text-sm text-slate-500">일정이 연결되지 않았습니다.</div>;
    }

    default:
      return <div className="text-red-500">Unknown input type</div>;
  }
};
