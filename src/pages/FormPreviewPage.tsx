import { useEffect, useState } from 'react';
import { toast } from 'react-hot-toast';
import type { FormTemplate } from '../types/form';
import { DynamicFormRenderer } from '../components/forms/DynamicFormRenderer';
import { mockMembers } from '../data/mockData';
import { X } from 'lucide-react';

export default function FormPreviewPage() {
  const [template, setTemplate] = useState<FormTemplate | null>(null);

  useEffect(() => {
    const storedData = localStorage.getItem('formPreviewData');
    if (storedData) {
      try {
        const parsedData = JSON.parse(storedData);
        setTemplate(parsedData);
      } catch (error) {
        console.error('Failed to parse preview data:', error);
      }
    }
  }, []);

  if (!template) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-slate-500">로딩 중...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Preview Header Indicator */}
      <div className="sticky top-0 z-50 flex items-center justify-between bg-slate-900 px-6 py-3 text-white shadow-md">
        <div className="flex items-center gap-3">
          <div className="rounded bg-yellow-500 px-2 py-0.5 text-xs font-bold text-slate-900">
            PREVIEW
          </div>
          <span className="font-medium">미리보기 화면입니다</span>
        </div>
        <button
          onClick={() => window.close()}
          className="flex items-center gap-1 rounded-lg bg-slate-800 px-3 py-1.5 text-sm font-medium text-slate-200 hover:bg-slate-700 hover:text-white"
        >
          <X className="h-4 w-4" />
          닫기
        </button>
      </div>

      <div className="mx-auto max-w-3xl px-4 py-8">
        <DynamicFormRenderer
          template={template}
          answers={{}}
          members={mockMembers}
          onChange={() => {}} // Read-only or interactive but not saving
          onSubmit={async () => {
            toast.error('미리보기에서는 제출할 수 없습니다.');
          }}
        />
      </div>
    </div>
  );
}
