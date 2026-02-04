import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import UserHeader from '../components/UserHeader';
import Footer from '../components/Footer';
import { DynamicFormRenderer } from '../components/forms/DynamicFormRenderer';
import { getTemplateDetail, submitForm } from '../services/formService';
import { getMyCell } from '../services/cellService';
import type { FormTemplate } from '../types/form';
import { ChevronLeft, Calendar, Info } from 'lucide-react';

function ReportWritePage() {
  const { templateId } = useParams();
  const navigate = useNavigate();
  
  const [template, setTemplate] = useState<FormTemplate | null>(null);
  const [answers, setAnswers] = useState<Record<string, any>>({});
  const [targetDate, setTargetDate] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [displayMembers, setDisplayMembers] = useState<string[]>([]);
  const [memberMap, setMemberMap] = useState<Record<string, number>>({});
  
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
            const allMembers = [];
            if (cellInfo.leader) allMembers.push(cellInfo.leader);
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
        alert('양식을 불러오는데 실패했습니다.');
        navigate(-1);
      } finally {
        setLoading(false);
      }
    };
    
    init();
  }, [templateId, navigate]);

  useEffect(() => {
    // Set default target date based on current day
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
  }, []);

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
    // Validate
    if (template?.category === 'CELL_REPORT' && !targetDate) {
      alert('보고서 기준일(주일)을 선택해주세요.');
      return;
    }
    
    try {
      // Transform answers to API format
      let apiAnswers: { questionId: number; value: string; targetMemberId?: number }[] = [];

      if (template?.type === 'PERSONAL') {
        apiAnswers = Object.entries(answers).map(([qId, val]) => ({
          questionId: Number(qId),
          value: String(val)
        }));
      } else {
        // GROUP form handling
        Object.entries(answers).forEach(([memberName, memberAnswers]) => {
            const memberId = memberMap[memberName];
            // If memberName is 'COMMON', targetMemberId is undefined.
            // If memberName is not in map and not COMMON, it might be an issue, but we skip validation for now.
            
            Object.entries(memberAnswers as Record<string, unknown>).forEach(([qId, val]) => {
                // If value is array (from multiselect/checkbox), join it or handle it?
                // Backend expects string value.
                // DynamicFormRenderer might produce array for checkboxes.
                // Assuming value is string or boolean or array.
                // For checkboxes/multiselect, usually joined by comma or JSON?
                // Current backend might expect string.
                // Check DynamicFormRenderer: it handles boolean to array of IDs for SCHEDULE_ATTENDANCE.
                // The value in answers is array of strings (IDs).
                // We should probably join them or send multiple entries?
                // Backend QuestionAnswerDto usually expects single value string.
                // If it's multi-select, maybe comma separated?
                
                const v = val as unknown;
                const stringVal = Array.isArray(v) ? (v as unknown[]).map(String).join(',') : String(v);

                apiAnswers.push({
                    questionId: Number(qId),
                    value: stringVal,
                    targetMemberId: memberName === 'COMMON' ? undefined : memberId
                });
            });
        });
      }

      await submitForm({
        templateId: template!.id,
        date: targetDate,
        answers: apiAnswers
      });
      
      alert('보고서가 성공적으로 제출되었습니다.');
      navigate('/my-reports'); // Redirect to my-reports list
    } catch (error: unknown) {
      console.error('Submission failed:', error);
      const message = error instanceof Error ? error.message : '제출 중 오류가 발생했습니다.';
      alert(message);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-slate-500">로딩 중...</p>
      </div>
    );
  }

  if (!template) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p>양식을 찾을 수 없습니다.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 px-4 py-6 text-slate-900 sm:px-6 sm:py-10">
      <div className="mx-auto max-w-6xl space-y-6">
        <UserHeader />
        
        {/* Header */}
        <div className="flex items-center gap-4">
          <button 
            onClick={() => navigate(-1)}
            className="flex h-10 w-10 items-center justify-center rounded-full bg-white shadow-sm hover:bg-slate-50"
          >
            <ChevronLeft className="h-6 w-6 text-slate-600" />
          </button>
          <div>
            <h1 className="text-2xl font-bold">{template.title} 작성</h1>
            <p className="text-sm text-slate-500">{template.description || '내용을 입력해주세요.'}</p>
          </div>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          {/* Target Date Selector for Cell Report */}
          {template.category === 'CELL_REPORT' && (
            <div className="mb-8 space-y-3 rounded-lg bg-slate-50 p-5">
              <div>
                <label className="mb-2 block text-sm font-bold text-slate-700">
                  보고서 기준일 (주일)
                </label>
                <div className="flex items-center gap-2">
                  <Calendar className="h-5 w-5 text-slate-500" />
                  <input
                    type="date"
                    value={targetDate}
                    onChange={(e) => setTargetDate(e.target.value)}
                    className="rounded-md border-slate-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  />
                </div>
              </div>

              {periodInfo && (
                <div className={`rounded-md p-4 text-sm ${
                  periodInfo.isPast ? 'bg-orange-50 text-orange-900' : 'bg-blue-50 text-blue-900'
                }`}>
                  <div className="flex items-start gap-2">
                    <Info className={`mt-0.5 h-4 w-4 shrink-0 ${
                      periodInfo.isPast ? 'text-orange-600' : 'text-blue-600'
                    }`} />
                    <div className="space-y-1">
                      <p className="font-semibold">
                        대상 기간: {periodInfo.startStr} ~ {periodInfo.endStr}
                      </p>
                      {periodInfo.isPast ? (
                        <p className="text-orange-700">
                          * 제출 기한({periodInfo.deadlineStr})이 지났지만, <span className="font-bold underline">지금 작성하실 수 있습니다.</span>
                        </p>
                      ) : (
                        <p className="text-blue-700">
                          * 위 기간의 내용을 <span className="font-bold underline">{periodInfo.deadlineStr}</span>까지 제출해주세요.
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
            readOnly={false}
          />

          <div className="mt-8 flex justify-end gap-3 border-t border-slate-100 pt-6">
            <button
              onClick={() => navigate(-1)}
              className="rounded-lg bg-slate-100 px-6 py-2.5 text-sm font-bold text-slate-600 hover:bg-slate-200"
            >
              취소
            </button>
            
            {/* Show external submit only if NOT Personal (Personal has internal submit) */}
            {template.type !== 'PERSONAL' && (
              <button
                onClick={handleSubmit}
                className="rounded-lg bg-blue-600 px-8 py-2.5 text-sm font-bold text-white shadow-md hover:bg-blue-700 hover:shadow-lg"
              >
                제출하기
              </button>
            )}
          </div>
        </div>
        
        <Footer />
      </div>
    </div>
  );
}

export default ReportWritePage;
