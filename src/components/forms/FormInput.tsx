import React from 'react';
import type { FormQuestion } from '../../types/form';
import { Check } from 'lucide-react';

interface FormInputProps {
  question: FormQuestion;
  value: string | number | boolean | string[] | null;
  onChange: (value: string | number | boolean | string[] | null) => void;
  disabled?: boolean;
  className?: string; // For additional styling overrides
  compact?: boolean;
}

// Custom Checkbox Component for better styling
const CustomCheckbox = ({ 
  checked, 
  onChange, 
  disabled, 
  label,
  subLabel 
}: { 
  checked: boolean; 
  onChange: (checked: boolean) => void; 
  disabled?: boolean;
  label?: React.ReactNode;
  subLabel?: React.ReactNode;
}) => (
  <label className={`flex items-start gap-2.5 cursor-pointer group ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}>
    <div className={`
      relative flex items-center justify-center flex-shrink-0 mt-0.5
      h-5 w-5 rounded border transition-all duration-200 ease-in-out
      ${checked 
        ? 'bg-blue-600 border-blue-600 shadow-sm' 
        : 'bg-white border-slate-300 group-hover:border-blue-400 shadow-sm'}
    `}>
      <Check 
        className={`h-3.5 w-3.5 text-white transition-transform duration-200 ${checked ? 'scale-100' : 'scale-0'}`} 
        strokeWidth={3} 
      />
      <input
        type="checkbox"
        className="sr-only"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        disabled={disabled}
      />
    </div>
    {(label || subLabel) && (
      <div className="flex flex-col">
        {label && <span className={`text-sm ${checked ? 'text-slate-900 font-medium' : 'text-slate-700'}`}>{label}</span>}
        {subLabel && <span className="text-xs text-slate-500">{subLabel}</span>}
      </div>
    )}
  </label>
);

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
          className={`w-full ${commonClasses} focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500`}
          disabled={disabled}
        />
      );

    case 'LONG_TEXT':
      return (
        <textarea
          value={typeof value === 'string' || typeof value === 'number' ? value : ''}
          onChange={(e) => onChange(e.target.value)}
          className={`w-full ${commonClasses} focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500`}
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
          className={`w-full ${commonClasses} focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500`}
          disabled={disabled}
        />
      );

    case 'BOOLEAN':
      return (
        <div className="flex items-center justify-center py-1">
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={!!value}
              onChange={(e) => onChange(e.target.checked)}
              className="sr-only peer"
              disabled={disabled}
            />
            <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
            <span className="ml-3 text-sm font-medium text-slate-700">
              {!!value ? '예 (Yes)' : '아니오 (No)'}
            </span>
          </label>
        </div>
      );

    case 'SINGLE_CHOICE': {
      const singleOptions = question.options?.length 
        ? question.options 
        : (question.optionsJson ? JSON.parse(question.optionsJson).map((o: string | { label: string }) => typeof o === 'string' ? o : o.label) : []);
      
      return (
        <div className="space-y-2">
          {singleOptions.map((opt: any) => {
            const displayLabel = typeof opt === 'string' ? opt : (opt?.label || '');
            const optValue = typeof opt === 'string' ? opt : (opt?.label || '');
            
            return (
              <label key={optValue} className={`flex items-center p-2 rounded border cursor-pointer transition-all ${value === optValue ? 'border-blue-500 bg-blue-50' : 'border-slate-200 hover:bg-slate-50'}`}>
                <div className={`flex h-5 w-5 items-center justify-center rounded-full border ${value === optValue ? 'border-blue-600' : 'border-slate-300'}`}>
                  {value === optValue && <div className="h-2.5 w-2.5 rounded-full bg-blue-600" />}
                </div>
                <input
                  type="radio"
                  name={`question-${question.id}`}
                  value={optValue}
                  checked={value === optValue}
                  onChange={(e) => onChange(e.target.value)}
                  disabled={disabled}
                  className="sr-only"
                />
                <span className={`ml-3 text-sm ${value === optValue ? 'font-medium text-blue-700' : 'text-slate-700'}`}>{displayLabel}</span>
              </label>
            );
          })}
        </div>
      );
    }

    case 'MULTIPLE_CHOICE': {
      const currentValues = (Array.isArray(value) ? value : []) as string[];
      const multiOptions = question.options?.length 
        ? question.options 
        : (question.optionsJson ? JSON.parse(question.optionsJson).map((o: string | { label: string }) => typeof o === 'string' ? o : o.label) : []);

      return (
        <div className="space-y-2">
          {multiOptions.map((opt: any) => {
            const displayLabel = typeof opt === 'string' ? opt : (opt?.label || '');
            const optValue = typeof opt === 'string' ? opt : (opt?.label || '');
            
            return (
              <div key={optValue} className={`rounded border p-2 transition-colors ${currentValues.includes(optValue) ? 'bg-blue-50 border-blue-200' : 'border-transparent'}`}>
                <CustomCheckbox
                  checked={currentValues.includes(optValue)}
                  onChange={(checked) => {
                    const newValues = checked
                      ? [...currentValues, optValue]
                      : currentValues.filter((v) => v !== optValue);
                    onChange(newValues);
                  }}
                  disabled={disabled}
                  label={displayLabel}
                />
              </div>
            );
          })}
        </div>
      );
    }

    case 'WORSHIP_ATTENDANCE':
      if (compact) {
        return (
          <div className="flex items-center justify-center">
            <input
              type="checkbox"
              checked={!!value}
              onChange={(e) => onChange(e.target.checked)}
              className="h-5 w-5 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
              disabled={disabled}
            />
          </div>
        );
      }
      return (
        <div className="flex items-center justify-center py-2">
          <label className={`flex items-center justify-center cursor-pointer rounded-lg border px-6 py-3 transition-all ${!!value ? 'bg-blue-600 border-blue-600 text-white shadow-md' : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'}`}>
            <input
              type="checkbox"
              checked={!!value}
              onChange={(e) => onChange(e.target.checked)}
              className="sr-only"
              disabled={disabled}
            />
            <div className="flex items-center gap-2">
              <div className={`flex h-5 w-5 items-center justify-center rounded border ${!!value ? 'border-white bg-transparent' : 'border-slate-300 bg-white'}`}>
                {!!value && <Check className="h-3.5 w-3.5" strokeWidth={3} />}
              </div>
              <span className="font-semibold">출석 체크</span>
            </div>
          </label>
        </div>
      );

    case 'SCHEDULE_ATTENDANCE': {
      // Frontend grouping populates linkedSchedules
      const schedules = question.linkedSchedules || [];
      const currentIds = (Array.isArray(value) ? value : []) as string[];

      if (schedules && schedules.length > 1) {
        if (compact) {
          // In table mode with multiple schedules, use a simpler multi-checkbox layout
          return (
            <div className="flex flex-col gap-1 min-w-[120px]">
              {schedules.map((s) => (
                <label key={s.id} className="flex items-center gap-1.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={currentIds.includes(s.id.toString())}
                    onChange={(e) => {
                      if (e.target.checked) {
                        onChange([...currentIds, s.id.toString()]);
                      } else {
                        onChange(currentIds.filter(v => v !== s.id.toString()));
                      }
                    }}
                    className="h-3.5 w-3.5 rounded border-slate-300 text-blue-600"
                    disabled={disabled}
                  />
                  <span className="text-[10px] text-slate-600 truncate max-w-[80px]" title={s.title}>
                    {s.title}
                  </span>
                </label>
              ))}
            </div>
          );
        }
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
          <div className="rounded-lg border border-slate-200 bg-white overflow-hidden">
            <div className="flex items-center gap-2 border-b border-slate-100 bg-slate-50 px-3 py-2.5">
              <CustomCheckbox
                checked={isAllSelected}
                onChange={handleSelectAll}
                disabled={disabled}
                label={<span className="font-semibold text-slate-700">전체 참석</span>}
              />
            </div>
            <div className="max-h-60 overflow-y-auto p-2 space-y-1">
              {schedules.map((s) => (
                <div key={s.id} className={`rounded p-1.5 transition-colors ${currentIds.includes(s.id.toString()) ? 'bg-blue-50' : 'hover:bg-slate-50'}`}>
                  <CustomCheckbox
                    checked={currentIds.includes(s.id.toString())}
                    onChange={(checked) => handleToggle(s.id.toString(), checked)}
                    disabled={disabled}
                    label={s.title}
                    subLabel={s.startDate.substring(5, 10)}
                  />
                </div>
              ))}
            </div>
          </div>
        );
      } else if (schedules && schedules.length === 1) {
        // Single schedule mode
        const s = schedules[0];
        const isChecked = currentIds.includes(s.id.toString());

        if (compact) {
          return (
            <div className="flex items-center justify-center">
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
            </div>
          );
        }

        return (
          <div className="flex items-center justify-center py-2">
             <label className={`flex items-center gap-3 cursor-pointer rounded-lg border px-4 py-3 transition-all ${isChecked ? 'bg-blue-50 border-blue-300 shadow-sm' : 'bg-white border-slate-200 hover:bg-slate-50'}`}>
               <div className={`flex h-5 w-5 items-center justify-center rounded border ${isChecked ? 'bg-blue-600 border-blue-600' : 'bg-white border-slate-300'}`}>
                 {isChecked && <Check className="h-3.5 w-3.5 text-white" strokeWidth={3} />}
               </div>
               <input
                type="checkbox"
                checked={isChecked}
                onChange={(e) => {
                   if (e.target.checked) onChange([s.id.toString()]);
                   else onChange([]);
                }}
                className="sr-only"
                disabled={disabled}
              />
               <div className="flex flex-col">
                 <span className="text-xs font-medium text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded w-fit mb-0.5">
                   {s.startDate.substring(5, 10)}
                 </span>
                 <span className={`text-sm font-semibold ${isChecked ? 'text-blue-700' : 'text-slate-700'}`}>
                   {typeof s.title === 'string' ? s.title : ''}
                 </span>
               </div>
            </label>
          </div>
        );
      }

      return <div className="text-sm text-slate-500 italic">연동된 일정이 없습니다.</div>;
    }

    default:
      return <div className="text-red-500 text-sm">지원하지 않는 입력 형식입니다 ({question.inputType})</div>;
  }
};
