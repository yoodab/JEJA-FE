import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import type { FormTemplate } from '../types/form';
import { mockMembers } from '../data/mockData';
import { getFormTemplates, createFormTemplate, getFormTemplate, deleteFormTemplate } from '../services/formService';
import { DynamicFormRenderer } from '../components/forms/DynamicFormRenderer';
import { Plus, Users, FileText, ChevronRight, ListChecks, Calendar, MoreVertical, Copy, Trash2 } from 'lucide-react';

function ReportManagePage() {
  const navigate = useNavigate();
  const [templates, setTemplates] = useState<FormTemplate[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTemplates();
  }, []);

  const fetchTemplates = async () => {
    try {
      setLoading(true);
      const data = await getFormTemplates();
      setTemplates(data);
    } catch (error) {
      console.error('Failed to fetch templates:', error);
      alert('양식 목록을 불러오는데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  // Create Template Modal State
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [selectedTemplate, setSelectedTemplate] = useState<FormTemplate | null>(null)
  const [isPreviewModalOpen, setIsPreviewModalOpen] = useState(false);
  const [newTemplateTitle, setNewTemplateTitle] = useState('');
  const [newTemplateType, setNewTemplateType] = useState<'CELL_REPORT' | 'EVENT_APPLICATION'>('CELL_REPORT');

  const handleCreateNewTemplate = () => {
    if (!newTemplateTitle.trim()) {
      alert('양식 제목을 입력해주세요.');
      return;
    }

    const category = newTemplateType;
    const formType = newTemplateType === 'CELL_REPORT' ? 'GROUP' : 'PERSONAL';

    navigate('/manage/forms/builder', {
      state: {
        initialTitle: newTemplateTitle,
        initialCategory: category,
        initialFormType: formType,
      },
    });
  };

  // handleTemplateClick removed

  // Menu Actions
  const [menuOpenId, setMenuOpenId] = useState<number | null>(null);

  useEffect(() => {
    const handleClickOutside = () => setMenuOpenId(null);
    window.addEventListener('click', handleClickOutside);
    return () => window.removeEventListener('click', handleClickOutside);
  }, []);

  const handleMenuClick = (e: React.MouseEvent, id: number) => {
    e.stopPropagation();
    setMenuOpenId(menuOpenId === id ? null : id);
  };

  const handleDelete = async (e: React.MouseEvent, id: number) => {
    e.stopPropagation();
    if (!window.confirm('정말 이 양식을 삭제하시겠습니까?')) return;

    try {
      await deleteFormTemplate(id);
      alert('양식이 삭제되었습니다.');
      fetchTemplates();
    } catch (error) {
      console.error('Failed to delete template:', error);
      alert('양식 삭제에 실패했습니다.');
    }
  };

  const handleCopy = async (e: React.MouseEvent, id: number) => {
    e.stopPropagation();
    if (!window.confirm('이 양식을 복사하시겠습니까?')) return;

    try {
      const fullTemplate = await getFormTemplate(id);
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { id: _unused, ...templateData } = fullTemplate;
      const newTemplate = {
        ...templateData,
        title: `${fullTemplate.title} (복사본)`,
        questions: fullTemplate.questions || [],
        sections: fullTemplate.sections || []
      };
      await createFormTemplate(newTemplate);
      alert('양식이 복사되었습니다.');
      fetchTemplates();
    } catch (error) {
      console.error('Failed to copy template:', error);
      alert('양식 복사에 실패했습니다.');
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 px-4 py-6 text-slate-900 sm:px-6 sm:py-10">
      <div className="mx-auto max-w-6xl space-y-6">
        {/* Header */}
        <header className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => navigate('/dashboard')}
              className="rounded-lg px-3 py-1.5 text-sm font-semibold text-slate-600 hover:bg-slate-100"
            >
              ←
            </button>
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100 text-xl">
                📄
              </div>
              <div>
                <p className="text-base font-bold text-slate-900">보고서 양식 관리</p>
                <p className="text-xs text-slate-500">생성된 보고서 양식을 확인하고 관리합니다</p>
              </div>
            </div>
          </div>
          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
          >
            <Plus className="h-4 w-4" />
            새 양식 만들기
          </button>
        </header>

        {/* Template List */}
        {loading ? (
          <div className="flex h-64 items-center justify-center">
            <div className="text-center">
              <div className="mx-auto h-8 w-8 animate-spin rounded-full border-4 border-slate-200 border-t-blue-600"></div>
              <p className="mt-2 text-sm text-slate-500">양식을 불러오는 중...</p>
            </div>
          </div>
        ) : templates.length === 0 ? (
          <div className="flex h-64 items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-slate-50">
            <div className="text-center">
              <p className="text-lg font-semibold text-slate-600">생성된 양식이 없습니다</p>
              <p className="mt-1 text-sm text-slate-500">새로운 양식을 만들어보세요.</p>
              <button
                onClick={() => setIsCreateModalOpen(true)}
                className="mt-4 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
              >
                + 새 양식 만들기
              </button>
            </div>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {templates.map((template) => {
              const isCellReport = template.category === 'CELL_REPORT';
              const Icon = isCellReport ? Users : FileText;
              const badgeColor = isCellReport ? 'bg-blue-50 text-blue-600' : 'bg-emerald-50 text-emerald-600';
              const iconBg = isCellReport ? 'bg-blue-100 text-blue-600' : 'bg-emerald-100 text-emerald-600';
              
              // Date formatting helper
              const formatDate = (isoString?: string) => {
                if (!isoString) return '';
                const date = new Date(isoString);
                return `${date.getFullYear()}.${String(date.getMonth() + 1).padStart(2, '0')}.${String(date.getDate()).padStart(2, '0')}`;
              };
              
              const dateRange = template.startDate && template.endDate
                ? `${formatDate(template.startDate)} ~ ${formatDate(template.endDate)}`
                : '기간 설정 없음';

              return (
                <div
                  key={template.id}
                  className="group relative flex flex-col justify-between rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition-all hover:-translate-y-1 hover:shadow-md cursor-pointer"
                  onClick={() => {
                    setSelectedTemplate(template);
                    setIsPreviewModalOpen(true);
                  }}
                >
                  <div className="mb-4 flex items-start justify-between">
                    <div className="flex gap-2">
                      <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${iconBg}`}>
                        <Icon className="h-5 w-5" />
                      </div>
                      <span className={`rounded-full px-2.5 py-1 text-xs font-bold h-fit ${badgeColor}`}>
                        {isCellReport ? '셀 보고서' : '행사 신청'}
                      </span>
                    </div>
                    
                    <div className="relative">
                      <button
                        onClick={(e) => handleMenuClick(e, template.id)}
                        className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors"
                      >
                        <MoreVertical className="h-5 w-5" />
                      </button>
                      
                      {menuOpenId === template.id && (
                        <div className="absolute right-0 top-8 z-10 w-32 rounded-lg border border-slate-200 bg-white shadow-lg py-1">
                          <button
                            onClick={(e) => handleCopy(e, template.id)}
                            className="flex w-full items-center gap-2 px-3 py-2 text-sm text-slate-700 hover:bg-slate-50"
                          >
                            <Copy className="h-4 w-4" />
                            복사
                          </button>
                          <button
                            onClick={(e) => handleDelete(e, template.id)}
                            className="flex w-full items-center gap-2 px-3 py-2 text-sm text-rose-600 hover:bg-rose-50"
                          >
                            <Trash2 className="h-4 w-4" />
                            삭제
                          </button>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="mb-4 flex-1">
                    <h3 className="mb-1 text-lg font-bold text-slate-900 group-hover:text-blue-600">
                      {template.title}
                    </h3>
                    <p className="line-clamp-2 text-sm text-slate-500">
                      {template.description || '설명이 없습니다.'}
                    </p>
                  </div>

                  <div className="flex items-center justify-between border-t border-slate-100 pt-4 text-xs text-slate-400">
                    <div className="flex gap-3">
                      <span className="flex items-center gap-1">
                        <ListChecks className="h-3.5 w-3.5" />
                        {template.questions?.length || 0}개 항목
                      </span>
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3.5 w-3.5" />
                        {dateRange}
                      </span>
                    </div>
                    <ChevronRight className="h-4 w-4 text-slate-300 transition-transform group-hover:translate-x-1 group-hover:text-blue-500" />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Create Template Modal */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-xl">
            <h3 className="mb-1 text-lg font-bold text-slate-900">새 양식 만들기</h3>
            <p className="mb-6 text-sm text-slate-500">생성할 보고서 양식의 기본 정보를 입력하세요.</p>

            <div className="space-y-4">
              <div>
                <label className="mb-1 block text-sm font-semibold text-slate-700">양식 제목</label>
                <input
                  type="text"
                  value={newTemplateTitle}
                  onChange={(e) => setNewTemplateTitle(e.target.value)}
                  placeholder="예: 2026년 상반기 순 보고서"
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  autoFocus
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700">양식 유형</label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={() => setNewTemplateType('CELL_REPORT')}
                    className={`flex flex-col items-center justify-center rounded-xl border p-4 text-center transition-all ${
                      newTemplateType === 'CELL_REPORT'
                        ? 'border-blue-600 bg-blue-50 text-blue-700 ring-1 ring-blue-600'
                        : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50 text-slate-600'
                    }`}
                  >
                    <span className="mb-1 text-xl">👥</span>
                    <span className="text-sm font-bold">순 보고서</span>
                    <span className="text-[10px] opacity-70">그룹형 (표)</span>
                  </button>
                  <button
                    onClick={() => setNewTemplateType('EVENT_APPLICATION')}
                    className={`flex flex-col items-center justify-center rounded-xl border p-4 text-center transition-all ${
                      newTemplateType === 'EVENT_APPLICATION'
                        ? 'border-blue-600 bg-blue-50 text-blue-700 ring-1 ring-blue-600'
                        : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50 text-slate-600'
                    }`}
                  >
                    <span className="mb-1 text-xl">📝</span>
                    <span className="text-sm font-bold">신청서</span>
                    <span className="text-[10px] opacity-70">개인형 (설문)</span>
                  </button>
                </div>
              </div>
            </div>

            <div className="mt-8 flex justify-end gap-2">
              <button
                onClick={() => setIsCreateModalOpen(false)}
                className="rounded-lg px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-100"
              >
                취소
              </button>
              <button
                onClick={handleCreateNewTemplate}
                className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
              >
                생성하기
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Preview Modal */}
      {isPreviewModalOpen && selectedTemplate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-5xl rounded-2xl border border-slate-200 bg-white p-6 shadow-lg max-h-[90vh] overflow-y-auto">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h3 className="text-xl font-bold text-slate-900">{selectedTemplate.title}</h3>
                <p className="text-sm text-slate-500">양식 미리보기 (입력값은 저장되지 않습니다)</p>
              </div>
              <button
                onClick={() => setIsPreviewModalOpen(false)}
                className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
              >
                ✕
              </button>
            </div>

            <div className="mb-6">
              <DynamicFormRenderer
                template={selectedTemplate}
                answers={{}}
                onChange={() => {}}
                members={mockMembers}
                readOnly={false} // Allow interaction for preview
              />
            </div>

            <div className="flex justify-end gap-2 border-t border-slate-100 pt-4">
              <button
                onClick={() => setIsPreviewModalOpen(false)}
                className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
              >
                닫기
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default ReportManagePage;
