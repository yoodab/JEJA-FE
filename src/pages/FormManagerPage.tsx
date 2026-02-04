import { useState, useMemo, useEffect } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import type { FormSubmission, FormTemplate, FormQuestion } from '../types/form';
import { mockMembers } from '../data/mockData';
import { getFormTemplate, getFormSubmissions, getFormSubmission, updateTemplateStatus } from '../services/formService';
import { DynamicFormRenderer } from '../components/forms/DynamicFormRenderer';
import { Calendar, ChevronLeft, ChevronRight, X, Edit3, Power, Clock, CheckCircle, XCircle } from 'lucide-react';

export default function FormManagerPage() {
  const { templateId } = useParams<{ templateId: string }>();
  const location = useLocation();
  const navigate = useNavigate();
  const stateTemplate = location.state?.template as FormTemplate | undefined;

  const [template, setTemplate] = useState<FormTemplate | null>(stateTemplate || null);
  const [loadingTemplate, setLoadingTemplate] = useState(false);

  // Submissions State
  const [submissions, setSubmissions] = useState<FormSubmission[]>([]);

  const [activeTab, setActiveTab] = useState<'preview' | 'submissions'>('preview');

  // Preview Members
  const [previewMembers, setPreviewMembers] = useState<string[]>(mockMembers);

  // --- Submission Manager States ---
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [detailedSubmission, setDetailedSubmission] = useState<FormSubmission | null>(null);

  useEffect(() => {
    const id = templateId ? Number(templateId) : stateTemplate?.id;
    if (id) {
      fetchTemplate(id);
    }
    // For preview, we use mock members to show how the matrix looks like
    setPreviewMembers(mockMembers);
  }, [templateId, stateTemplate?.id]);

  const fetchTemplate = async (id: number) => {
    try {
      setLoadingTemplate(true);
      const data = await getFormTemplate(id);
      setTemplate(data);
    } catch (error) {
      console.error('Failed to fetch template:', error);
    } finally {
      setLoadingTemplate(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'submissions' && template?.id) {
      fetchSubmissions(template.id);
    }
  }, [activeTab, template?.id]);

  const fetchSubmissions = async (templateId: number) => {
    try {
      const data = await getFormSubmissions(templateId);
      setSubmissions(data);
    } catch (error) {
      console.error('Failed to fetch submissions:', error);
    }
  };

  const handleSubmissionClick = async (id: number) => {
    try {
      const [detailData, summaryData] = await Promise.all([
        getFormSubmission(id),
        Promise.resolve(submissions.find(s => s.id === id))
      ]);
      
      // Merge summary info (name, status) into detail data if missing
      if (summaryData) {
        setDetailedSubmission({
          ...detailData,
          submitterName: summaryData.submitterName,
          status: summaryData.status,
          targetSundayDate: summaryData.targetSundayDate || detailData.targetSundayDate
        });
      } else {
        setDetailedSubmission(detailData);
      }
    } catch (error) {
      console.error('Failed to fetch submission detail:', error);
      alert('상세 정보를 불러오는데 실패했습니다.');
    }
  };

  const closeDetailModal = () => {
    setDetailedSubmission(null);
  };

  // --- Helpers ---
  const getWeekRange = (date: Date) => {
    const sunday = new Date(date);
    sunday.setDate(date.getDate() - date.getDay()); // Go to Sunday
    const saturday = new Date(sunday);
    saturday.setDate(sunday.getDate() + 6); // Go to Saturday
    return {
      start: sunday.toISOString().split('T')[0],
      end: saturday.toISOString().split('T')[0],
    };
  };

  const { start, end } = getWeekRange(selectedDate);

  // --- Filter Logic ---
  const filteredSubmissions = useMemo(() => {
    if (!template) return [];
    
    // Filter by submitDate being within the selected week
    return submissions.filter(sub => {
        if (!sub.submitDate) return false;
        // sub.submitDate is YYYY-MM-DD string
        return sub.submitDate >= start && sub.submitDate <= end;
    });
  }, [template, submissions, start, end]);

  // --- Handlers ---
  const moveWeek = (direction: 'prev' | 'next') => {
    const newDate = new Date(selectedDate);
    newDate.setDate(selectedDate.getDate() + (direction === 'next' ? 7 : -7));
    setSelectedDate(newDate);
  };

  const handleToggleActive = async () => {
    console.log('handleToggleActive called');
    if (!template) {
      console.log('No template');
      return;
    }
    
    const newActiveState = !template.isActive;
    console.log('Toggling active state to:', newActiveState);

    const confirmMsg = newActiveState 
      ? '이 양식을 활성화하시겠습니까? 활성화되면 사용자들이 양식을 작성할 수 있습니다.' 
      : '이 양식을 비활성화하시겠습니까? 비활성화되면 더 이상 양식을 작성할 수 없습니다.';
    
    if (!window.confirm(confirmMsg)) {
      console.log('User cancelled');
      return;
    }

    try {
      console.log('Sending request to update status...');
      await updateTemplateStatus(template.id, newActiveState);
      console.log('Request success');
      setTemplate({ ...template, isActive: newActiveState });
      alert(newActiveState ? '양식이 활성화되었습니다.' : '양식이 비활성화되었습니다.');
    } catch (error) {
      console.error('Failed to update template status:', error);
      alert('상태 변경에 실패했습니다.');
    }
  };

  if (!template) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-center">
          <p className="text-lg text-slate-500">선택된 양식이 없습니다.</p>
          <button
            onClick={() => navigate('/manage/reports')}
            className="mt-4 rounded-lg bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
          >
            목록으로 돌아가기
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 px-4 py-6 text-slate-900 sm:px-6 sm:py-10">
      <div className="mx-auto max-w-6xl space-y-6">
        {/* Header */}
        <header className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => navigate('/manage/reports')}
              className="rounded-lg px-3 py-1.5 text-sm font-semibold text-slate-600 hover:bg-slate-100"
            >
              ← 목록으로
            </button>
            <div className="h-6 w-px bg-slate-200"></div>
            <div>
              <div className="flex items-center gap-2">
                <span className="rounded bg-blue-50 px-2 py-0.5 text-xs font-semibold text-blue-600">
                  {template.category}
                </span>
                <span className="text-xs text-slate-400">{template.type}</span>
                <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${template.isActive ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-500'}`}>
                    {template.isActive ? '운영중' : '미운영'}
                </span>
              </div>
              <h1 className="text-lg font-bold text-slate-900">{template.title}</h1>
            </div>
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleToggleActive}
              className={`flex items-center gap-2 rounded-lg px-3 py-1.5 text-sm font-semibold transition-colors ${
                template.isActive
                  ? 'bg-rose-100 text-rose-700 hover:bg-rose-200'
                  : 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200'
              }`}
            >
              <Power className="h-4 w-4" />
              {template.isActive ? '비활성화' : '활성화'}
            </button>
            <button
              onClick={() => navigate('/manage/forms/builder', { state: { template } })}
              className="flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm font-semibold text-slate-700 hover:bg-slate-50"
            >
              <Edit3 className="h-4 w-4" />
              양식 수정
            </button>
          </div>
        </header>

        {/* Tabs */}
        <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="flex border-b border-slate-200">
            <button
              onClick={() => setActiveTab('preview')}
              className={`flex-1 border-b-2 px-4 py-3 text-sm font-semibold transition ${
                activeTab === 'preview'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-slate-600 hover:text-slate-900'
              }`}
            >
              양식 미리보기
            </button>
            <button
              onClick={() => setActiveTab('submissions')}
              className={`flex-1 border-b-2 px-4 py-3 text-sm font-semibold transition ${
                activeTab === 'submissions'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-slate-600 hover:text-slate-900'
              }`}
            >
              보고서 결과 관리
            </button>
          </div>

          <div className="p-6">
            {activeTab === 'preview' && (
              <div className="space-y-6">
                <div className="flex items-center justify-between rounded-lg bg-blue-50 p-4 text-blue-900">
                  <div className="flex items-center gap-2 text-sm">
                    <span className="flex h-5 w-5 items-center justify-center rounded-full bg-blue-200 text-xs font-bold">i</span>
                    실제 사용자가 보게 될 입력 화면입니다. (입력값은 저장되지 않습니다)
                  </div>
                  <button
                    onClick={() => navigate('/manage/forms/builder', { state: { template } })}
                    className="flex items-center gap-1.5 rounded-lg bg-white px-3 py-1.5 text-xs font-bold text-blue-600 shadow-sm hover:bg-blue-50"
                  >
                    <Edit3 className="h-3.5 w-3.5" />
                    양식 수정하기
                  </button>
                </div>
                
                <div className="mx-auto max-w-4xl rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
                  {loadingTemplate ? (
                    <div className="flex h-64 items-center justify-center">
                      <div className="text-center">
                        <div className="mx-auto h-8 w-8 animate-spin rounded-full border-4 border-slate-200 border-t-blue-600"></div>
                        <p className="mt-2 text-sm text-slate-500">양식 정보를 불러오는 중...</p>
                      </div>
                    </div>
                  ) : (
                    <DynamicFormRenderer
                      template={template}
                      answers={{}}
                      onChange={() => {}}
                      members={previewMembers}
                      readOnly={false}
                    />
                  )}
                </div>
              </div>
            )}

            {activeTab === 'submissions' && (
              <div className="space-y-6">
                {/* 1. Week Picker */}
                <div className="flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50 p-4">
                  <div className="flex items-center gap-4">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white text-blue-600 shadow-sm">
                      <Calendar className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-slate-500">조회 주차</p>
                      <div className="flex items-center gap-2">
                        <button onClick={() => moveWeek('prev')} className="rounded p-1 hover:bg-slate-200">
                          <ChevronLeft className="h-4 w-4" />
                        </button>
                        <span className="text-lg font-bold text-slate-900">
                          {start} ~ {end}
                        </span>
                        <button onClick={() => moveWeek('next')} className="rounded p-1 hover:bg-slate-200">
                          <ChevronRight className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-slate-500">제출된 보고서</p>
                    <p className="text-xl font-bold text-slate-900">{filteredSubmissions.length}건</p>
                  </div>
                </div>

                {/* 2. Submission List */}
                <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
                  <table className="w-full text-left text-sm">
                    <thead className="bg-slate-50 text-slate-500">
                      <tr>
                        <th className="px-6 py-3 font-medium">제출자</th>
                        <th className="px-6 py-3 font-medium">제출일</th>
                        <th className="px-6 py-3 font-medium">상태</th>
                        <th className="px-6 py-3 font-medium text-right">관리</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {filteredSubmissions.length === 0 ? (
                        <tr>
                          <td colSpan={4} className="py-12 text-center text-slate-400">
                            해당 주차에 제출된 보고서가 없습니다.
                          </td>
                        </tr>
                      ) : (
                        filteredSubmissions.map((sub) => (
                          <tr
                            key={sub.id}
                            onClick={() => handleSubmissionClick(sub.id)}
                            className="group cursor-pointer hover:bg-slate-50"
                          >
                            <td className="px-6 py-4">
                              <div className="flex items-center gap-3">
                                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-100 text-xs font-bold text-blue-600">
                                  {sub.submitterName.charAt(0)}
                                </div>
                                <span className="font-semibold text-slate-900 group-hover:text-blue-600">
                                  {sub.submitterName}
                                </span>
                              </div>
                            </td>
                            <td className="px-6 py-4 text-slate-500">
                              <div className="flex items-center gap-1.5">
                                <Clock className="h-3.5 w-3.5" />
                                {sub.submitDate}
                              </div>
                            </td>
                            <td className="px-6 py-4">
                              <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${
                                sub.status === 'APPROVED' ? 'bg-green-100 text-green-700' :
                                sub.status === 'REJECTED' ? 'bg-red-100 text-red-700' :
                                'bg-yellow-100 text-yellow-700'
                              }`}>
                                {sub.status === 'APPROVED' && <CheckCircle className="h-3 w-3" />}
                                {sub.status === 'REJECTED' && <XCircle className="h-3 w-3" />}
                                {sub.status === 'PENDING' && <Clock className="h-3 w-3" />}
                                {sub.status === 'APPROVED' ? '승인됨' : sub.status === 'REJECTED' ? '반려됨' : '대기중'}
                              </span>
                            </td>
                            <td className="px-6 py-4 text-right">
                              <button className="rounded-lg px-2 py-1 text-xs font-semibold text-slate-400 hover:bg-slate-100 hover:text-slate-600">
                                상세보기
                              </button>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 3. Detail Modal (Matrix View) */}
      {detailedSubmission && template && (
        <MatrixDetailModal
          submission={detailedSubmission}
          template={template}
          onClose={closeDetailModal}
        />
      )}
    </div>
  );
}

// --- Sub Components ---

function MatrixDetailModal({
  submission,
  template,
  onClose,
}: {
  submission: FormSubmission;
  template: FormTemplate;
  onClose: () => void;
}) {
  // 1. Identify Rows (Members) & Columns (Questions)
  // Get unique members from answers (for GROUP type)
  const memberNames = Array.from(
    new Set(submission.answers.map((a) => a.targetMemberName).filter((n): n is string => !!n))
  );

  const memberQuestions = template.questions
    .filter((q) => q.memberSpecific)
    .sort((a, b) => a.orderIndex - b.orderIndex);

  const commonQuestions = template.questions
    .filter((q) => !q.memberSpecific)
    .sort((a, b) => a.orderIndex - b.orderIndex);

  // Helper to find answer
  const getAnswer = (questionId: number, memberName?: string) => {
    return submission.answers.find(
      (a) => a.questionId === questionId && a.targetMemberName === memberName
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
      <div className="flex max-h-[90vh] w-full max-w-7xl flex-col rounded-2xl bg-white shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
          <div>
            <h3 className="text-xl font-bold text-slate-900">{template.title}</h3>
            <p className="mt-1 text-sm text-slate-500">
              {submission.submitterName} | {submission.targetSundayDate} (제출일: {submission.submitDate})
            </p>
          </div>
          <button
            onClick={onClose}
            className="rounded-full p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {/* Section 1: Member Matrix (Group Type Only) */}
          {template.type === 'GROUP' && memberNames.length > 0 && (
            <div className="mb-8 space-y-3">
              <h4 className="font-bold text-slate-800 flex items-center gap-2">
                <span className="flex h-6 w-6 items-center justify-center rounded bg-blue-100 text-xs font-bold text-blue-700">1</span>
                순원별 보고 내용
              </h4>
              <div className="overflow-x-auto rounded-xl border border-slate-200">
                <table className="w-full min-w-max border-collapse text-sm">
                  <thead>
                    <tr className="bg-slate-50">
                      <th className="sticky left-0 z-10 border-b border-r border-slate-200 bg-slate-50 px-4 py-3 text-left font-semibold text-slate-700">
                        성명
                      </th>
                      {memberQuestions.map((q) => (
                        <th
                          key={q.id}
                          className="border-b border-r border-slate-200 px-4 py-3 text-left font-semibold text-slate-700 min-w-[100px]"
                        >
                          {q.label}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 bg-white">
                    {memberNames.map((member) => (
                      <tr key={member} className="hover:bg-slate-50">
                        <td className="sticky left-0 z-10 border-r border-slate-200 bg-white px-4 py-3 font-bold text-slate-900 group-hover:bg-slate-50">
                          {member}
                        </td>
                        {memberQuestions.map((q) => {
                          const ans = getAnswer(q.id, member);
                          return (
                            <td key={q.id} className="border-r border-slate-200 px-4 py-3 align-top">
                              <AnswerCell question={q} value={ans?.value} />
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Section 2: Common Questions (Non-Member Specific) */}
          {commonQuestions.length > 0 && (
            <div className="space-y-3">
              <h4 className="font-bold text-slate-800 flex items-center gap-2">
                <span className="flex h-6 w-6 items-center justify-center rounded bg-blue-100 text-xs font-bold text-blue-700">2</span>
                전체 보고 내용
              </h4>
              <div className="grid gap-4 rounded-xl border border-slate-200 bg-slate-50 p-6">
                {commonQuestions.map((q) => {
                  const ans = getAnswer(q.id);
                  return (
                    <div key={q.id} className="rounded-lg bg-white p-4 shadow-sm border border-slate-100">
                      <p className="mb-2 text-sm font-semibold text-slate-500">{q.label}</p>
                      <div className="text-slate-900">
                        <AnswerCell question={q} value={ans?.value} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="flex justify-end gap-3 border-t border-slate-200 px-6 py-4 bg-slate-50 rounded-b-2xl">
          <button
             onClick={() => alert('반려 처리되었습니다.')}
             className="rounded-lg border border-rose-200 bg-white px-4 py-2 text-sm font-semibold text-rose-600 hover:bg-rose-50"
          >
            반려하기
          </button>
          <button
             onClick={() => alert('승인 처리되었습니다.')}
             className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 shadow-sm"
          >
            승인하기
          </button>
        </div>
      </div>
    </div>
  );
}

function AnswerCell({ question, value }: { question: FormQuestion; value?: string }) {
  if (value === undefined || value === null) return <span className="text-slate-300">-</span>;

  if (question.inputType === 'BOOLEAN') {
    return value === 'true' ? (
      <div className="flex items-center justify-center w-full">
         <CheckCircle className="h-5 w-5 text-emerald-500" />
      </div>
    ) : (
      <div className="flex items-center justify-center w-full">
         <X className="h-5 w-5 text-slate-300" />
      </div>
    );
  }

  return <span className="whitespace-pre-wrap text-sm leading-relaxed text-slate-700">{value}</span>;
}
