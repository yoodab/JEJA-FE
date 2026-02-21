import { useState, useEffect } from 'react';
import { useNavigate, useParams, useSearchParams, useLocation } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { useConfirm } from '../contexts/ConfirmContext';
import UserHeader from '../components/UserHeader';
import Footer from '../components/Footer';
import { DynamicFormRenderer } from '../components/forms/DynamicFormRenderer';
import { getTemplateDetail, submitForm, getLastSubmission, updateSubmission, getFormSubmission } from '../services/formService';
import { getMyCell } from '../services/cellService';
import { isLoggedIn } from '../utils/auth';
import type { FormTemplate } from '../types/form';
import { Calendar, Info, AlertCircle } from 'lucide-react';

function ReportWritePage() {
  const { templateId } = useParams();
  const [searchParams] = useSearchParams();
  const { confirm } = useConfirm();
  const submissionIdParam = searchParams.get('submissionId');
  const dateParam = searchParams.get('date');
  const navigate = useNavigate();
  const location = useLocation();
  
  const [template, setTemplate] = useState<FormTemplate | null>(location.state?.template || null);
  const [answers, setAnswers] = useState<Record<string, any>>({});
  const [targetDate, setTargetDate] = useState<string>('');
  const [loading, setLoading] = useState(!template);
  const [displayMembers, setDisplayMembers] = useState<string[]>([]);
  const [memberMap, setMemberMap] = useState<Record<string, number>>({});
  const [selectedSubmissionId, setSelectedSubmissionId] = useState<number | null>(null);
  const [submissionStatus, setSubmissionStatus] = useState<string | null>(null);
  const [isEditExpired, setIsEditExpired] = useState(false);
  const [currentCellId, setCurrentCellId] = useState<number | null>(null);
  
  useEffect(() => {
    const init = async () => {
      if (!templateId) return;
      
      try {
        setLoading(true);
        // Always fetch detail to ensure we have questions and full config
        const tmpl = await getTemplateDetail(Number(templateId));
        
        // Force GROUP type for CELL_REPORT
        if (tmpl.category === 'CELL_REPORT') {
          tmpl.type = 'GROUP';
        }
        
        setTemplate(tmpl);
        
        // If Group form, fetch cell members
        if (tmpl.type === 'GROUP') {
          try {
            const cellInfo = await getMyCell();
            setCurrentCellId(cellInfo.cellId);
            const allMembers = [];
            if (cellInfo.leader) allMembers.push(cellInfo.leader);
            if (cellInfo.subLeader) allMembers.push(cellInfo.subLeader);
            allMembers.push(...cellInfo.members);
            
            // Deduplicate by ID just in case
            const uniqueMembers = Array.from(new Map(allMembers.map(m => [m.memberId, m])).values());
            
            const members = uniqueMembers.map(m => m.name);
            const map: Record<string, number> = {};
            uniqueMembers.forEach(m => {
              map[m.name] = m.memberId;
            });
            
            setDisplayMembers(members);
            setMemberMap(map);
          } catch (error) {
            console.error('Failed to fetch cell members:', error);
            // Fallback? Or show error?
          }
        }
      } catch (error) {
        console.error('Failed to load form:', error);
        toast.error('양식을 불러오는데 실패했습니다.');
      } finally {
        setLoading(false);
      }
    };
    
    init();
  }, [templateId, navigate]);

  useEffect(() => {
    // Set default target date based on current day or query param
    if (dateParam) {
      setTargetDate(dateParam);
      return;
    }

    const today = new Date();
    const day = today.getDay(); // 0(Sun) ~ 6(Sat)
    const target = new Date(today);

    // 월(1)~수(3)요일인 경우: 지난 주일을 기본값으로 (아직 제출 기간임)
    if (day >= 1 && day <= 3) {
      target.setDate(today.getDate() - day);
    } else {
      // 목(4)~토(6) 또는 일(0)인 경우: 다가오는/오늘 주일을 기본값으로
      const diff = day === 0 ? 0 : 7 - day;
      target.setDate(today.getDate() + diff);
    }
    
    const yyyy = target.getFullYear();
    const mm = String(target.getMonth() + 1).padStart(2, '0');
    const dd = String(target.getDate()).padStart(2, '0');
    setTargetDate(`${yyyy}-${mm}-${dd}`);
  }, [dateParam]);

  // Check for existing submission
  useEffect(() => {
    const checkPreviousSubmission = async () => {
      // Only proceed if we have template and (if cell report) targetDate
      if (!templateId || !template) return;

      try {
        let submissionToLoad = null;

        // 1. If date is explicitly provided in URL, load that submission
        if (dateParam) {
          submissionToLoad = await getLastSubmission(Number(templateId), dateParam, currentCellId || undefined);
        } 
        // 2. Fallback to submissionId if present (mostly for admin/manager use)
        else if (submissionIdParam) {
          submissionToLoad = await getFormSubmission(Number(submissionIdParam));
        } 
        // 3. Auto-check for CELL_REPORT with targetDate (default current week)
        else if (template.category === 'CELL_REPORT' && targetDate) {
          submissionToLoad = await getLastSubmission(Number(templateId), targetDate, currentCellId || undefined);
          
          if (submissionToLoad) {
            const isConfirmed = await confirm({
              title: '이전 작성 내용',
              message: '이전에 작성한 내용이 있습니다.\n\n이어서 수정하시겠습니까?',
              confirmText: '이어서 수정',
              cancelText: '새로 작성'
            });
            if (!isConfirmed) submissionToLoad = null;
          }
        }

        if (submissionToLoad) {
          setSelectedSubmissionId(submissionToLoad.id || (submissionToLoad as any).submissionId);
          setSubmissionStatus(submissionToLoad.status);
          
          // 작성 후 1주일 경과 여부 확인
          if (submissionToLoad.submitTime) {
            const submitDate = new Date(submissionToLoad.submitTime);
            const now = new Date();
            const diffDays = (now.getTime() - submitDate.getTime()) / (1000 * 60 * 60 * 24);
            setIsEditExpired(diffDays > 7);
          } else {
            setIsEditExpired(false);
          }

          if (submissionToLoad.targetSundayDate) {
            setTargetDate(submissionToLoad.targetSundayDate);
          }
          
          // Transform answers
          const newAnswers: Record<string, any> = {};
          
          if (template.type === 'PERSONAL') {
            submissionToLoad.answers.forEach(item => {
              newAnswers[item.questionId] = item.value;
            });
          } else {
            // GROUP
            submissionToLoad.answers.forEach(ans => {
              const memberName = ans.targetMemberName || 'COMMON';
              if (!newAnswers[memberName]) {
                newAnswers[memberName] = {};
              }
              newAnswers[memberName][ans.questionId] = ans.value;
            });
          }
          
          setAnswers(newAnswers);
        } else {
          // No submission to load
          setSelectedSubmissionId(null);
          setSubmissionStatus(null);
          // Don't reset targetDate here as it might have been set by the default logic
          setAnswers({}); 
        }
      } catch (error) {
        console.error('Failed to check previous submission:', error);
      }
    };

    checkPreviousSubmission();
  }, [templateId, template, targetDate, submissionIdParam, dateParam, currentCellId]);

  const getPeriodInfo = (dateStr: string) => {
    if (!dateStr) return null;
    
    // Parse YYYY-MM-DD manually to ensure local time midnight
    const [year, month, day] = dateStr.split('-').map(Number);
    const target = new Date(year, month - 1, day);
    
    // 시작일: 월요일 (6일 전)
    const start = new Date(target);
    start.setDate(target.getDate() - 6);
    
    // 마감일: 수요일 (3일 후)
    const deadline = new Date(target);
    deadline.setDate(target.getDate() + 3);
    
    const formatDate = (d: Date) => `${d.getMonth() + 1}.${d.getDate()}`;
    
    // Check if deadline has passed (today > deadline)
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const isPast = today > deadline;
    
    return {
      startStr: `${formatDate(start)}(월)`,
      endStr: `${formatDate(target)}(일)`,
      deadlineStr: `${formatDate(deadline)}(수)`,
      isPast
    };
  };

  const periodInfo = getPeriodInfo(targetDate);

  const handleSubmit = async () => {
    if (!template) return;

    // Validate
    if (template.category === 'CELL_REPORT' && !targetDate) {
      toast.error('보고서 기준일(주일)을 선택해주세요.');
      return;
    }
    
    try {
      // Transform answers to API format
      let apiAnswers: { questionId: number; value: string; targetMemberId?: number }[] = [];

      const allQuestions = template.sections 
        ? template.sections.flatMap(s => s.questions) 
        : template.questions || [];

      if (template?.type === 'PERSONAL') {
        allQuestions.forEach(q => {
          let val = answers[q.id];
          const isBooleanType = q.inputType === 'BOOLEAN' || q.inputType === 'WORSHIP_ATTENDANCE' || q.inputType === 'SCHEDULE_ATTENDANCE' || q.inputType === 'SCHEDULE_SURVEY';
          
          // For boolean types, treat empty/undefined as false
          if (isBooleanType && (val === undefined || val === null || val === '')) {
             val = 'false';
          }

          // For non-boolean types, skip if empty
          if (!isBooleanType && (val === undefined || val === null || val === '')) {
             return;
          }
          if (!isBooleanType && Array.isArray(val) && val.length === 0) {
             return;
          }
          
          const stringVal = val !== undefined && val !== null ? (Array.isArray(val) ? val.join(',') : String(val)) : '';
          apiAnswers.push({
            questionId: q.id,
            value: stringVal
          });
        });
      } else {
        // GROUP form handling
        const commonQuestions = allQuestions.filter(q => !q.memberSpecific);
        const memberQuestions = allQuestions.filter(q => q.memberSpecific);

        // 1. Common Questions
        commonQuestions.forEach(q => {
            let val = answers['COMMON']?.[q.id];
            const isBooleanType = q.inputType === 'BOOLEAN' || q.inputType === 'WORSHIP_ATTENDANCE' || q.inputType === 'SCHEDULE_ATTENDANCE' || q.inputType === 'SCHEDULE_SURVEY';
            
            // For boolean types, treat empty/undefined as false
            if (isBooleanType && (val === undefined || val === null || val === '')) {
                val = 'false';
            }

            // For non-boolean types, skip if empty
            if (!isBooleanType && (val === undefined || val === null || val === '')) {
                return;
            }
            if (!isBooleanType && Array.isArray(val) && val.length === 0) {
                return;
            }
            
            const stringVal = val !== undefined && val !== null ? (Array.isArray(val) ? val.join(',') : String(val)) : '';
            
            apiAnswers.push({
                questionId: q.id,
                value: stringVal,
                targetMemberId: undefined
            });
        });

        // 2. Member Questions
        // Ensure we iterate over ALL display members to save empty responses if needed
        displayMembers.forEach(memberName => {
            const memberId = memberMap[memberName];
            
            memberQuestions.forEach(q => {
                let val = answers[memberName]?.[q.id];
                const isBooleanType = q.inputType === 'BOOLEAN' || q.inputType === 'WORSHIP_ATTENDANCE' || q.inputType === 'SCHEDULE_ATTENDANCE' || q.inputType === 'SCHEDULE_SURVEY';
                
                // For boolean types, treat empty/undefined as false
                if (isBooleanType && (val === undefined || val === null || val === '')) {
                    val = 'false';
                }

                // For non-boolean types, skip if empty
                if (!isBooleanType && (val === undefined || val === null || val === '')) {
                    return;
                }
                if (!isBooleanType && Array.isArray(val) && val.length === 0) {
                    return;
                }

                const stringVal = val !== undefined && val !== null ? (Array.isArray(val) ? val.join(',') : String(val)) : '';

                apiAnswers.push({
                    questionId: q.id,
                    value: stringVal,
                    targetMemberId: memberId
                });
            });
        });
      }

      if (selectedSubmissionId) {
        await updateSubmission(selectedSubmissionId, {
          templateId: template!.id,
          date: targetDate,
          cellId: currentCellId || undefined,
          answers: apiAnswers
        });
        toast.success('보고서가 성공적으로 수정되었습니다.');
      } else {
        await submitForm({
          templateId: template!.id,
          date: targetDate,
          cellId: currentCellId || undefined,
          answers: apiAnswers
        });
        toast.success('보고서가 성공적으로 제출되었습니다.');
      }
      
      // Navigate based on login status
      if (isLoggedIn()) {
        navigate('/my-reports');
      } else {
        // For guest users, redirect to home
        navigate('/');
      }
    } catch (error: unknown) {
      console.error('Submission failed:', error);
      const message = error instanceof Error ? error.message : '제출 중 오류가 발생했습니다.';
      toast.error(message);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-slate-500">로딩 중...</p>
      </div>
    );
  }

  const isReadOnly = selectedSubmissionId ? (submissionStatus !== 'PENDING' || isEditExpired) : false;

  if (!template) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p>양식을 찾을 수 없습니다.</p>
      </div>
    );
  }

  if (!template.isActive) {
    return (
      <div className="min-h-screen bg-slate-50 px-4 py-6 text-slate-900 sm:px-6 sm:py-10">
        <div className="mx-auto max-w-6xl space-y-6">
           <UserHeader />
           <div className="flex flex-col items-center justify-center rounded-xl border border-slate-200 bg-white p-12 text-center shadow-sm min-h-[400px]">
             <div className="mb-4 rounded-full bg-slate-100 p-4">
               <AlertCircle className="h-10 w-10 text-slate-400" />
             </div>
             <h2 className="mb-2 text-xl font-bold text-slate-900">제출이 중단된 양식입니다</h2>
             <p className="text-slate-500 mb-8">현재 이 양식에 대한 응답을 받지 않고 있습니다.<br/>담당자에게 문의해주세요.</p>
           </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 px-4 py-6 text-slate-900 sm:px-6 sm:py-10">
      <div className="mx-auto max-w-4xl space-y-8">
        <UserHeader />
        
        {/* Header */}
        <div className="flex items-center gap-4 px-2">
          <div>
            <h1 className="text-2xl font-bold text-slate-800">
              {template.title} {selectedSubmissionId ? ((submissionStatus === 'PENDING' && !isEditExpired) ? '수정' : '조회') : '작성'}
            </h1>
            <p className="text-sm text-slate-500 mt-1">{template.description || '내용을 입력해주세요.'}</p>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-100 bg-white p-8 shadow-xl shadow-slate-200/50">
          {/* Read-only notice */}
          {isReadOnly && (
            <div className="mb-6 rounded-xl bg-amber-50 p-4 border border-amber-200 flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-bold text-amber-900">조회 전용 모드</p>
                <p className="text-xs text-amber-700 mt-1">
                  {isEditExpired 
                    ? '작성 후 1주일이 경과한 보고서는 수정할 수 없습니다.' 
                    : '이 보고서는 이미 승인되었거나 제출이 완료되어 수정할 수 없습니다.'}
                </p>
              </div>
            </div>
          )}

          {/* Target Date Selector for Cell Report */}
          {template.category === 'CELL_REPORT' && (
            <div className="mb-10 space-y-4 rounded-xl bg-slate-50 p-6 border border-slate-100">
              <div className="flex flex-col sm:flex-row sm:items-end gap-4 justify-between">
                <div className="space-y-2">
                   <label className="flex items-center gap-2 text-sm font-bold text-slate-700">
                    <Calendar className="h-4 w-4 text-blue-600" />
                    보고서 기준일 (주일)
                  </label>
                  <input
                    type="date"
                    value={targetDate}
                    onChange={(e) => setTargetDate(e.target.value)}
                    disabled={true} // 순 보고서는 날짜 변경 불가
                    className="block w-full rounded-lg border-slate-200 bg-slate-100 text-slate-500 shadow-sm cursor-not-allowed sm:w-auto"
                  />
                </div>
                
                {periodInfo && (
                   <div className="text-sm text-slate-500 text-right">
                      <span className="font-semibold text-slate-700">{periodInfo.startStr} ~ {periodInfo.endStr}</span>
                   </div>
                )}
              </div>

              {periodInfo && (
                <div className={`mt-3 rounded-lg p-4 text-sm border ${
                  periodInfo.isPast 
                    ? 'bg-orange-50 border-orange-100 text-orange-900' 
                    : 'bg-blue-50 border-blue-100 text-blue-900'
                }`}>
                  <div className="flex items-start gap-3">
                    <Info className={`mt-0.5 h-5 w-5 shrink-0 ${
                      periodInfo.isPast ? 'text-orange-600' : 'text-blue-600'
                    }`} />
                    <div className="space-y-1">
                      {periodInfo.isPast ? (
                        <p className="text-orange-800">
                          제출 기한(<span className="font-semibold">{periodInfo.deadlineStr}</span>)이 지났지만, <span className="font-bold underline decoration-2 underline-offset-2">지금 작성하실 수 있습니다.</span>
                        </p>
                      ) : (
                        <p className="text-blue-800">
                          위 기간의 내용을 <span className="font-bold underline decoration-2 underline-offset-2">{periodInfo.deadlineStr}</span>까지 제출해주세요.
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Form Renderer */}
          <DynamicFormRenderer
            template={template}
            answers={answers}
            onChange={setAnswers}
            onSubmit={handleSubmit}
            members={displayMembers}
            readOnly={isReadOnly}
          />
        </div>
        
        <Footer />
      </div>
    </div>
  );
}

export default ReportWritePage;
