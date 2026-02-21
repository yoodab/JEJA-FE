import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { useConfirm } from '../contexts/ConfirmContext';
import type { FormTemplate } from '../types/form';
import { mockMembers } from '../data/mockData';
import { getFormTemplates, createFormTemplate, getFormTemplate, deleteFormTemplate } from '../services/formService';
import { DynamicFormRenderer } from '../components/forms/DynamicFormRenderer';
import { Plus, Users, FileText, ChevronRight, MoreVertical, Copy, Trash2 } from 'lucide-react';

function ReportManagePage() {
  const navigate = useNavigate();
  const { confirm } = useConfirm();
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
      toast.error('양식 목록을 불러오는데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  // Create Template Modal State
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [isPreviewModalOpen, setIsPreviewModalOpen] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<FormTemplate | null>(null);
  const [newTemplateTitle, setNewTemplateTitle] = useState('');
  const [newTemplateType, setNewTemplateType] = useState<'CELL_REPORT' | 'EVENT_APPLICATION'>('CELL_REPORT');

  const handleCreateNewTemplate = async () => {
    if (!newTemplateTitle.trim()) {
      toast.error('양식 제목을 입력해주세요.');
      return;
    }

    try {
      const category = newTemplateType;
      const formType = newTemplateType === 'CELL_REPORT' ? 'GROUP' : 'PERSONAL';

      const newTemplate = await createFormTemplate({
        title: newTemplateTitle,
        category,
        type: formType,
        isActive: false, // Default to inactive so user can edit before publishing
        sections: [{
          id: Date.now(),
          title: '기본 섹션',
          description: '',
          orderIndex: 0,
          defaultNextAction: 'CONTINUE' as any,
          questions: []
        }],
        accessList: category === 'CELL_REPORT' ? [
          {
            accessType: 'RESPONDENT',
            targetType: 'ROLE',
            targetValue: 'CELL_LEADER'
          },
          {
            accessType: 'RESPONDENT',
            targetType: 'ROLE',
            targetValue: 'CELL_SUB_LEADER'
          }
        ] : []
      });

      navigate(`/manage/forms/${newTemplate.id}`);
    } catch (error) {
      console.error('Failed to create template:', error);
      toast.error('양식 생성에 실패했습니다.');
    }
  };

  const handleTemplateClick = (template: FormTemplate) => {
    navigate(`/manage/forms/${template.id}`);
  };

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
    
    const isConfirmed = await confirm({
      title: '양식 삭제',
      message: '정말 이 양식을 삭제하시겠습니까?',
      type: 'danger',
      confirmText: '삭제',
      cancelText: '취소'
    });
    
    if (!isConfirmed) return;

    try {
      await deleteFormTemplate(id);
      toast.success('양식이 삭제되었습니다.');
      fetchTemplates();
    } catch (error) {
      console.error('Failed to delete template:', error);
      toast.error('양식 삭제에 실패했습니다.');
    }
  };

  const handleCopy = async (e: React.MouseEvent, id: number) => {
    e.stopPropagation();
    
    const isConfirmed = await confirm({
      title: '양식 복사',
      message: '이 양식을 복사하시겠습니까?',
      type: 'warning',
      confirmText: '복사',
      cancelText: '취소'
    });

    if (!isConfirmed) return;

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
      toast.success('양식이 복사되었습니다.');
      fetchTemplates();
    } catch (error) {
      console.error('Failed to copy template:', error);
      toast.error('양식 복사에 실패했습니다.');
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 px-4 py-6 text-slate-900 sm:px-6 sm:py-10">
      <div className="mx-auto max-w-6xl">
        <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
        {/* Header */}
        <div className="flex flex-col gap-4 border-b border-slate-200 px-6 py-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
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
        </div>

        {/* Template List */}
        <div className="p-6">
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

              return (
                <div
                  key={template.id}
                  className="group relative flex flex-col justify-between rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition-all hover:-translate-y-1 hover:shadow-md cursor-pointer"
                  onClick={() => handleTemplateClick(template)}
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
                            onClick={async (e) => {
                              e.stopPropagation();
                              setMenuOpenId(null);
                              try {
                                const fullTemplate = await getFormTemplate(template.id);
                                setSelectedTemplate(fullTemplate);
                                setIsPreviewModalOpen(true);
                              } catch (error) {
                                console.error('Failed to fetch template for preview:', error);
                                toast.error('미리보기를 불러오는데 실패했습니다.');
                              }
                            }}
                            className="flex w-full items-center gap-2 px-3 py-2 text-sm text-slate-700 hover:bg-slate-50"
                          >
                            <FileText className="h-4 w-4" />
                            미리보기
                          </button>
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
                      <span className="flex items-center gap-1 font-medium text-slate-500">
                        {template.statusMessage || '-'}
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
      </div>
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
