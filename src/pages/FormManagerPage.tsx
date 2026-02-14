import { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { useConfirm } from '../contexts/ConfirmContext';
import type { FormTemplate, FormSubmission } from '../types/form';
import { mockMembers } from '../data/mockData';
import { getFormTemplate, getFormSubmissions, getFormSubmission, updateFormTemplate, deleteFormTemplate, createFormTemplate } from '../services/formService';
import { DynamicFormRenderer } from '../components/forms/DynamicFormRenderer';
import { FormBuilder } from '../components/forms/FormBuilder';
import type { FormBuilderHandle } from '../components/forms/FormBuilder';
import { 
  ChevronLeft, ChevronRight, Eye, Share2, 
  Calendar, Lock, Download, User, Trash2, PlayCircle, StopCircle, Copy
} from 'lucide-react';
import {
  PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer
} from 'recharts';
import * as XLSX from 'xlsx';
import { format } from 'date-fns';
import debounce from 'lodash/debounce';
import isEqual from 'lodash/isEqual';

export default function FormManagerPage() {
  const { templateId } = useParams<{ templateId: string }>();
  const navigate = useNavigate();
  const { confirm } = useConfirm();
  
  // State
  const [template, setTemplate] = useState<FormTemplate | null>(null);
  const [loadingTemplate, setLoadingTemplate] = useState(false);
  const [activeTab, setActiveTab] = useState<'questions' | 'responses'>('questions');
  
  // Form Builder Ref
  const formBuilderRef = useRef<FormBuilderHandle>(null);

  // Auto-save Status
  const [saveStatus, setSaveStatus] = useState<'saved' | 'saving' | 'error'>('saved');

  // Submissions State
  const [submissions, setSubmissions] = useState<FormSubmission[]>([]);
  const [allSubmissionDetails, setAllSubmissionDetails] = useState<FormSubmission[]>([]);
  // const [loadingSubmissions, setLoadingSubmissions] = useState(false);
  
  // Response View State
  const [responseSubTab, setResponseSubTab] = useState<'summary' | 'question' | 'individual'>('summary');
  const [currentSubmissionIndex, setCurrentSubmissionIndex] = useState(0);
  // const [selectedQuestionId, setSelectedQuestionId] = useState<number | null>(null);
  
  // Cell Report Filter State
  const [selectedTargetDate, setSelectedTargetDate] = useState<string>('ALL');

  // Reset indices when filter changes
  useEffect(() => {
    setCurrentSubmissionIndex(0);
  }, [selectedTargetDate, activeTab]);

  useEffect(() => {
    if (templateId) {
      fetchTemplate(Number(templateId));
    }
  }, [templateId]);

  useEffect(() => {
    if (activeTab === 'responses' && template?.id) {
      fetchSubmissions(template.id);
    }
  }, [activeTab, template?.id]);

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

  const fetchSubmissions = async (id: number) => {
    try {
      // setLoadingSubmissions(true);
      // 1. Get Summary List
      const summaryList = await getFormSubmissions(id);
      setSubmissions(summaryList);

      // 2. Fetch Details for all
      // In a real app, optimize this or use pagination
      const details = await Promise.all(summaryList.map(s => getFormSubmission(s.id)));
      
      // Merge summary info into details
      const mergedDetails = details.map(d => {
        const summary = summaryList.find(s => s.id === d.id);
        return {
          ...d,
          submitterName: summary?.submitterName || d.submitterName,
          status: summary?.status || d.status,
          targetSundayDate: summary?.targetSundayDate || d.targetSundayDate
        };
      });
      
      setAllSubmissionDetails(mergedDetails);
    } catch (error) {
      console.error('Failed to fetch submissions:', error);
    } finally {
      // setLoadingSubmissions(false);
    }
  };

  // Auto-save Logic
  const debouncedSave = useCallback(
    debounce(async (updatedData: Partial<FormTemplate>) => {
      if (!templateId) return;
      try {
        setSaveStatus('saving');
        const savedTemplate = await updateFormTemplate(Number(templateId), updatedData);
        setSaveStatus('saved');
        
        // Update local template state with the response from server
        // This is critical to get real IDs for newly created sections/questions
        if (savedTemplate) {
          setTemplate(savedTemplate);
        }
      } catch (error) {
        console.error('Auto-save failed:', error);
        setSaveStatus('error');
      }
    }, 3000),
    [templateId]
  );

  const handleDataChange = (data: Partial<FormTemplate>) => {
    // 1. If template is not loaded yet, ignore
    if (!template) return;

    // 2. Check if changed (Deep Comparison)
    // Merge data into current template to check if it results in any effective change
    const merged = { ...template, ...data };
    
    // Use isEqual for deep comparison of arrays/objects
    if (isEqual(merged, template)) {
      return;
    }

    setTemplate(merged);
    setSaveStatus('saving');
    debouncedSave(data);
  };

  // Filtered Submissions Logic
  const filteredSubmissions = useMemo(() => {
    if (template?.category !== 'CELL_REPORT' || selectedTargetDate === 'ALL') {
      return allSubmissionDetails;
    }
    return allSubmissionDetails.filter(s => s.targetSundayDate === selectedTargetDate);
  }, [allSubmissionDetails, selectedTargetDate, template?.category]);

  const availableDates = useMemo(() => {
    const dates = Array.from(new Set(allSubmissionDetails.map(s => s.targetSundayDate).filter(Boolean)));
    return dates.sort().reverse(); // Newest first
  }, [allSubmissionDetails]);

  // Export Excel
  const handleExportExcel = () => {
    if (filteredSubmissions.length === 0) {
      toast.error('내보낼 응답이 없습니다.');
      return;
    }

    const questions = template?.questions || [];
    const data = filteredSubmissions.map(sub => {
      const row: any = {
        'ID': sub.id,
        '제출자': sub.submitterName,
        '제출일': sub.submitDate ? format(new Date(sub.submitDate), 'yyyy-MM-dd HH:mm') : '',
        '보고서 기준일': sub.targetSundayDate || '',
        '상태': sub.status
      };
      
      questions.forEach(q => {
        const answer = sub.answers.find(a => a.questionId === q.id);
        const value = answer ? (Array.isArray(answer.value) ? answer.value.join(', ') : answer.value) : '';
        row[q.label] = value;
      });
      
      return row;
    });

    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "응답");
    XLSX.writeFile(wb, `${template?.title}_응답.xlsx`);
  };

  const handleToggleActive = async () => {
    if (!template) return;
    const newActive = !template.isActive;
    
    if (!newActive) {
      const isConfirmed = await confirm({
        title: '게시 중단',
        message: '정말 이 양식을 게시 중단하시겠습니까? 더 이상 응답을 받을 수 없습니다.',
        type: 'warning'
      });
      if (!isConfirmed) return;
    }

    try {
      // 0. Cancel any pending auto-saves to prevent race conditions
      debouncedSave.cancel();

      // 1. Optimistically update UI
      setTemplate(prev => prev ? { ...prev, isActive: newActive } : null);

      let updateData: Partial<FormTemplate> = { isActive: newActive };

      // 2. Decide whether to save everything or just the status
      // If FormBuilder is active, we should save current work along with status
      if (activeTab === 'questions' && formBuilderRef.current) {
         const currentData = formBuilderRef.current.getTemplateData();
         updateData = { ...currentData, isActive: newActive };
         const result = await updateFormTemplate(template.id, updateData);
         setTemplate(result);
      } else {
         // If on responses tab, just update the status via specialized API if available, 
         // or use updateFormTemplate with partial data
         const result = await updateFormTemplate(template.id, { isActive: newActive });
         setTemplate(prev => prev ? { ...prev, ...result } : null);
      }
      
      toast.success(newActive ? '양식이 게시되었습니다.' : '양식이 게시 중단되었습니다.');
    } catch (error) {
      console.error('Failed to update status:', error);
      // Revert optimistic update on error
      setTemplate(prev => prev ? { ...prev, isActive: !newActive } : null);
      toast.error('상태 변경에 실패했습니다.');
    }
  };

  // Actions
  const handleOpenPreview = () => {
    formBuilderRef.current?.openPreview();
  };

  const handleOpenAccessSettings = () => {
    formBuilderRef.current?.openAccessSettings();
  };

  const handleOpenDateSettings = () => {
    formBuilderRef.current?.openDateSettings();
  };

  const copyLink = () => {
    const link = `${window.location.origin}/reports/write/${templateId}`;
    navigator.clipboard.writeText(link);
    toast.success('설문 링크가 복사되었습니다.');
  };

  const handleCopyForm = async () => {
    if (!formBuilderRef.current) return;
    
    const isConfirmed = await confirm({
      title: '양식 복사',
      message: '이 양식을 복사하여 새로운 양식을 만드시겠습니까?',
      type: 'info'
    });
    
    if (!isConfirmed) return;

    try {
      const currentData = formBuilderRef.current.getTemplateData();
      
      const newData: any = {
        ...currentData,
        title: `[복사본] ${currentData.title || ''}`,
        isActive: false,
        id: undefined,
        sections: currentData.sections?.map(section => ({
            ...section,
            id: undefined,
            questions: section.questions.map(q => ({
                ...q,
                id: undefined
            }))
        }))
      };

      const created = await createFormTemplate(newData);
      toast.success('양식이 복사되었습니다.');
      navigate(`/manage/forms/${created.id}`);
    } catch (error) {
      console.error('Failed to copy form:', error);
      toast.error('양식 복사에 실패했습니다.');
    }
  };

  const handleDeleteForm = async () => {
    if (!template) return;
    
    const isConfirmed = await confirm({
      title: '양식 삭제',
      message: '정말 이 양식을 삭제하시겠습니까? 삭제된 양식은 복구할 수 없습니다.',
      type: 'danger'
    });
    
    if (!isConfirmed) return;

    try {
      await deleteFormTemplate(template.id);
      toast.success('양식이 삭제되었습니다.');
      navigate('/manage/reports');
    } catch (error) {
      console.error('Failed to delete form:', error);
      toast.error('양식 삭제에 실패했습니다.');
    }
  };

  // --- Render Helpers ---

  const renderSummary = () => {
    if (!template) return null;
    const questions = template.questions || [];

    return (
      <div className="space-y-8 max-w-3xl mx-auto py-8 px-4">
        {questions.map(q => {
          const answers = filteredSubmissions.flatMap(s => s.answers.filter(a => a.questionId === q.id));
          const hasAnswers = answers.length > 0;
          
          return (
            <div key={q.id} className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
              <h3 className="font-bold text-slate-900 mb-2">{q.label}</h3>
              <div className="text-xs text-slate-400 mb-4">응답 {answers.length}개</div>
              
              {!hasAnswers ? (
                <div className="text-sm text-slate-400 italic py-4">응답이 없습니다.</div>
              ) : (q.inputType === 'SINGLE_CHOICE' || q.inputType === 'BOOLEAN' || q.inputType === 'MULTIPLE_CHOICE') ? (
                 <div className="h-64 w-full">
                   <ResponsiveContainer width="100%" height="100%">
                     <PieChart>
                       <Pie
                         data={Object.entries(answers.reduce((acc, curr) => {
                           const values = Array.isArray(curr.value) ? curr.value : [curr.value];
                           values.forEach(v => {
                             if (v !== undefined && v !== null && v !== '') {
                               const displayValue = v === 'true' ? '예' : v === 'false' ? '아니오' : v;
                               acc[displayValue] = (acc[displayValue] || 0) + 1;
                             }
                           });
                           return acc;
                         }, {} as Record<string, number>))
                         .map(([name, value]) => ({ name, value }))
                         .sort((a, b) => b.value - a.value)}
                         cx="50%"
                         cy="50%"
                         outerRadius={80}
                         fill="#8884d8"
                         dataKey="value"
                         label={({name, percent}) => `${name} (${((percent || 0) * 100).toFixed(0)}%)`}
                       >
                         {Object.keys(answers).map((_, index) => (
                           <Cell key={`cell-${index}`} fill={['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899'][index % 6]} />
                         ))}
                       </Pie>
                       <Tooltip />
                       <Legend />
                     </PieChart>
                   </ResponsiveContainer>
                </div>
              ) : (q.inputType === 'WORSHIP_ATTENDANCE' || q.inputType === 'SCHEDULE_ATTENDANCE' || q.memberSpecific) ? (
                <div className="space-y-4">
                  {/* 통계 요약 */}
                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div className="bg-blue-50 p-3 rounded-lg text-center">
                      <div className="text-xs text-blue-600 font-medium mb-1">참석/예</div>
                      <div className="text-xl font-bold text-blue-700">
                        {answers.filter(a => a.value === 'true').length}
                      </div>
                    </div>
                    <div className="bg-slate-50 p-3 rounded-lg text-center">
                      <div className="text-xs text-slate-500 font-medium mb-1">결석/아니오</div>
                      <div className="text-xl font-bold text-slate-700">
                        {answers.filter(a => a.value === 'false').length}
                      </div>
                    </div>
                  </div>
                  
                  <div className="space-y-2 max-h-60 overflow-y-auto bg-slate-50 p-4 rounded border border-slate-100">
                    {answers.map((a, i) => (
                      <div key={i} className="flex justify-between items-center bg-white p-2 rounded border border-slate-100 text-sm">
                        <span className="text-slate-600 font-medium">{a.targetMemberName || '익명'}</span>
                        <span className={`font-bold ${a.value === 'true' ? 'text-blue-600' : 'text-slate-400'}`}>
                          {a.value === 'true' ? '참석' : '결석'}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="space-y-2 max-h-60 overflow-y-auto bg-slate-50 p-4 rounded border border-slate-100">
                  {answers.map((a, i) => (
                    <div key={i} className="bg-white p-3 rounded border border-slate-100 text-sm text-slate-700 shadow-sm">
                      <div className="flex justify-between mb-1">
                        <span className="text-[10px] text-slate-400">{a.targetMemberName || ''}</span>
                      </div>
                      {Array.isArray(a.value) ? a.value.join(', ') : String(a.value || '')}
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    );
  };

  const renderByQuestion = () => {
    if (!template) return null;
    const questions = template.questions || [];
    
    return (
      <div className="max-w-4xl mx-auto py-8 px-4 space-y-8">
        {questions.map(q => {
          const answers = filteredSubmissions.flatMap(s => 
            s.answers
              .filter(a => a.questionId === q.id)
              .map(a => ({
                submissionId: s.id,
                submitter: s.submitterName,
                targetMemberName: a.targetMemberName,
                date: s.submitDate,
                value: a.value
              }))
          ).filter(a => a.value !== null && a.value !== '');

          return (
            <div key={q.id} className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="bg-slate-50 px-6 py-4 border-b border-slate-200 flex justify-between items-center">
                <h3 className="font-bold text-slate-900">{typeof q.label === 'string' ? q.label : ''}</h3>
                <span className="text-xs font-medium text-slate-500 bg-white px-2 py-1 rounded-full border border-slate-200">
                  응답 {answers.length}개
                </span>
              </div>
              <div className="divide-y divide-slate-100 max-h-[400px] overflow-y-auto">
                {answers.map((ans, idx) => (
                  <div key={idx} className="p-4 hover:bg-slate-50 transition-colors">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-slate-700 text-xs">
                          {ans.submitter}
                          {ans.targetMemberName && ans.targetMemberName !== ans.submitter && (
                            <span className="text-slate-400 font-normal ml-1">
                              (대상: {ans.targetMemberName})
                            </span>
                          )}
                        </span>
                      </div>
                      <span className="text-[10px] text-slate-400">
                        {ans.date ? format(new Date(ans.date), 'yyyy.MM.dd HH:mm') : '-'}
                      </span>
                    </div>
                    <div className="text-sm text-slate-600 leading-relaxed">
                      {q.inputType === 'BOOLEAN' || q.inputType === 'WORSHIP_ATTENDANCE' || q.inputType === 'SCHEDULE_ATTENDANCE' ? (
                        <span className={`font-bold ${ans.value === 'true' ? 'text-blue-600' : 'text-slate-400'}`}>
                          {ans.value === 'true' ? '참석/예' : '결석/아니오'}
                        </span>
                      ) : (
                        Array.isArray(ans.value) ? ans.value.join(', ') : String(ans.value || '')
                      )}
                    </div>
                  </div>
                ))}
                {answers.length === 0 && (
                  <div className="p-8 text-center text-slate-400 text-sm italic">응답이 없습니다.</div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  const renderIndividual = () => {
    if (filteredSubmissions.length === 0) return <div className="p-8 text-center text-slate-500">응답이 없습니다.</div>;

    // Ensure index is valid after filtering
    const safeIndex = Math.min(Math.max(0, currentSubmissionIndex), filteredSubmissions.length - 1);
    const submission = filteredSubmissions[safeIndex];

    if (!submission) return <div className="p-8 text-center text-slate-500">선택된 응답이 없습니다.</div>;

    return (
      <div className="max-w-3xl mx-auto py-8 px-4">
        <div className="flex items-center justify-between mb-6 bg-white p-4 rounded-xl border border-slate-200 shadow-sm sticky top-20 z-10">
          <div className="flex items-center gap-4">
             <button 
               onClick={() => setCurrentSubmissionIndex(Math.max(0, safeIndex - 1))}
               disabled={safeIndex === 0}
               className="p-1 hover:bg-slate-100 rounded disabled:opacity-30 transition-colors"
             >
               <ChevronLeft className="h-6 w-6" />
             </button>
             <span className="text-sm font-medium min-w-[60px] text-center">
               {safeIndex + 1} / {filteredSubmissions.length}
             </span>
             <button 
               onClick={() => setCurrentSubmissionIndex(Math.min(filteredSubmissions.length - 1, safeIndex + 1))}
               disabled={safeIndex === filteredSubmissions.length - 1}
               className="p-1 hover:bg-slate-100 rounded disabled:opacity-30 transition-colors"
             >
               <ChevronRight className="h-6 w-6" />
             </button>
          </div>
          <div className="text-sm text-slate-600 flex items-center gap-2">
            <User className="h-4 w-4" />
            <span className="font-bold">{submission.submitterName}</span>
            <span className="text-slate-300">|</span>
            <span className="text-xs">{submission.submitDate ? format(new Date(submission.submitDate), 'yyyy.MM.dd HH:mm') : ''}</span>
          </div>
        </div>

        <DynamicFormRenderer
          template={template!}
          answers={submission.answers.reduce((acc, curr) => {
            acc[curr.questionId] = curr.value;
            return acc;
          }, {} as Record<number, any>)}
          onChange={() => {}} // Read-only
          readOnly={true}
          members={mockMembers} // For display purposes
        />
      </div>
    );
  };

  if (loadingTemplate) {
    return <div className="flex h-screen items-center justify-center">로딩 중...</div>;
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* 1. Top Navigation Bar */}
      <div className="sticky top-0 z-40 bg-white border-b border-slate-200 shadow-sm">
        <div className="flex items-center justify-between px-4 py-2 sm:px-6">
          <div className="flex items-center gap-4">
            <button onClick={() => navigate('/manage/reports')} className="p-2 hover:bg-slate-100 rounded-full text-slate-500 transition-colors">
              <ChevronLeft className="h-6 w-6" />
            </button>
            <div className="flex flex-col">
              <div className="flex items-center gap-2">
                <span className="text-lg font-bold text-slate-900">{template?.title || '제목 없음'}</span>
                {saveStatus === 'saving' && <span className="text-xs text-slate-400">저장 중...</span>}
                {saveStatus === 'saved' && <span className="text-xs text-slate-400">모든 변경사항이 저장됨</span>}
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
             <button
                onClick={handleOpenDateSettings}
                className="p-2 rounded-full text-slate-600 hover:bg-slate-100 tooltip-trigger"
                title="설정 (기간/카테고리)"
             >
                <Calendar className="h-5 w-5" />
             </button>
             <button
                onClick={handleOpenAccessSettings}
                className="p-2 rounded-full text-slate-600 hover:bg-slate-100 tooltip-trigger"
                title="접근 권한 설정"
             >
                <Lock className="h-5 w-5" />
             </button>
             
             {/* Active/Inactive Toggle */}
             <div className="flex items-center gap-2 px-2">
               <button
                  onClick={handleToggleActive}
                  className={`p-2 rounded-full hover:bg-slate-100 tooltip-trigger ${template?.isActive ? 'text-blue-600' : 'text-slate-400'}`}
                  title={template?.isActive ? "게시 중단" : "게시하기"}
               >
                  {template?.isActive ? <StopCircle className="h-5 w-5" /> : <PlayCircle className="h-5 w-5" />}
               </button>
             </div>

             <button
                onClick={handleOpenPreview}
                className="p-2 rounded-full text-slate-600 hover:bg-slate-100 tooltip-trigger"
                title="미리보기"
             >
                <Eye className="h-5 w-5" />
             </button>
             <button
                onClick={handleCopyForm}
                className="p-2 rounded-full text-slate-600 hover:bg-slate-100 tooltip-trigger"
                title="양식 복사"
             >
                <Copy className="h-5 w-5" />
             </button>
             <button
                onClick={handleDeleteForm}
                className="p-2 rounded-full text-rose-500 hover:bg-rose-50 tooltip-trigger"
                title="양식 삭제"
             >
                <Trash2 className="h-5 w-5" />
             </button>
             <button
                onClick={copyLink}
                className="hidden sm:flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-semibold"
             >
                <Share2 className="h-4 w-4" />
                보내기
             </button>
          </div>
        </div>
        
        {/* Tabs */}
        <div className="flex justify-center border-t border-slate-100">
           <div className="flex gap-8">
             <button
               onClick={() => setActiveTab('questions')}
               className={`py-3 px-2 text-sm font-medium border-b-2 transition-colors ${
                 activeTab === 'questions' 
                   ? 'border-blue-600 text-blue-600' 
                   : 'border-transparent text-slate-500 hover:text-slate-700'
               }`}
             >
               질문
             </button>
             <button
               onClick={() => setActiveTab('responses')}
               className={`py-3 px-2 text-sm font-medium border-b-2 transition-colors ${
                 activeTab === 'responses' 
                   ? 'border-blue-600 text-blue-600' 
                   : 'border-transparent text-slate-500 hover:text-slate-700'
               }`}
             >
               응답
               {submissions.length > 0 && (
                 <span className="ml-1.5 bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded-full text-xs">
                   {submissions.length}
                 </span>
               )}
             </button>
           </div>
        </div>
      </div>

      {/* 2. Main Content Area */}
      <div className="flex-1 overflow-y-auto">
        {activeTab === 'questions' && (
          <div className="h-full">
            <FormBuilder 
              ref={formBuilderRef}
              initialTemplate={template || undefined}
              onSave={async () => {}} // Not used with auto-save
              onCancel={() => navigate('/manage/reports')}
              hideHeader={true}
              onDataChange={handleDataChange}
            />
          </div>
        )}

        {activeTab === 'responses' && (
          <div className="max-w-5xl mx-auto w-full px-4 py-6">
             {/* Response Summary Header */}
             <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm mb-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
               <div>
                 <h2 className="text-2xl font-bold text-slate-900">{filteredSubmissions.length}개의 응답</h2>
                 {template?.category === 'CELL_REPORT' && (
                    <div className="mt-2 flex items-center gap-2">
                       <Calendar className="h-4 w-4 text-slate-400" />
                       <select
                         value={selectedTargetDate}
                         onChange={(e) => setSelectedTargetDate(e.target.value)}
                         className="text-sm border-none bg-slate-50 rounded px-2 py-1 focus:ring-0 cursor-pointer"
                       >
                         <option value="ALL">전체 기간</option>
                         {availableDates.map(date => (
                           <option key={date} value={date}>{date}</option>
                         ))}
                       </select>
                    </div>
                 )}
               </div>
               <div className="flex gap-2">
                 <button 
                   onClick={handleExportExcel}
                   className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-green-700 bg-green-50 hover:bg-green-100 rounded-lg transition-colors"
                 >
                   <Download className="h-4 w-4" />
                   Excel 다운로드
                 </button>
               </div>
             </div>

             {/* Sub Tabs */}
             <div className="mb-6 flex gap-4 border-b border-slate-200">
                <button
                  onClick={() => setResponseSubTab('summary')}
                  className={`pb-2 text-sm font-medium transition-colors ${
                    responseSubTab === 'summary' 
                      ? 'border-b-2 border-slate-900 text-slate-900' 
                      : 'text-slate-500 hover:text-slate-700'
                  }`}
                >
                  요약
                </button>
                <button
                  onClick={() => setResponseSubTab('question')}
                  className={`pb-2 text-sm font-medium transition-colors ${
                    responseSubTab === 'question' 
                      ? 'border-b-2 border-slate-900 text-slate-900' 
                      : 'text-slate-500 hover:text-slate-700'
                  }`}
                >
                  질문 보기
                </button>
                <button
                  onClick={() => setResponseSubTab('individual')}
                  className={`pb-2 text-sm font-medium transition-colors ${
                    responseSubTab === 'individual' 
                      ? 'border-b-2 border-slate-900 text-slate-900' 
                      : 'text-slate-500 hover:text-slate-700'
                  }`}
                >
                  개별 보기
                </button>
             </div>

             {responseSubTab === 'summary' && renderSummary()}
             {responseSubTab === 'question' && renderByQuestion()}
             {responseSubTab === 'individual' && renderIndividual()}
          </div>
        )}
      </div>
    </div>
  );
}