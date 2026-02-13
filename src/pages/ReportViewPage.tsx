import { useState, useEffect } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import UserHeader from '../components/UserHeader';
import Footer from '../components/Footer';
import { getFormSubmission, getLastSubmission, getTemplateDetail } from '../services/formService';
import { getCellDetail, getMyCell } from '../services/cellService';
import type { FormSubmission, FormTemplate } from '../types/form';
import { DynamicFormRenderer } from '../components/forms/DynamicFormRenderer';
import { ChevronLeft, Calendar, Edit3, User, Users } from 'lucide-react';

function ReportViewPage() {
  const { submissionId } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  
  const [submission, setSubmission] = useState<FormSubmission | null>(null);
  const [template, setTemplate] = useState<FormTemplate | null>(null);
  const [answers, setAnswers] = useState<any>({});
  const [displayMembers, setDisplayMembers] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  const templateIdParam = searchParams.get('templateId');
  const date = searchParams.get('date');
  
  const handleEdit = () => {
    if (!submission) return;
    navigate(`/reports/write/${submission.templateId}?submissionId=${submission.id}`);
  };
  
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        let currentTemplateId = templateIdParam ? parseInt(templateIdParam) : undefined;
        let subData: FormSubmission | null = null;

        // 1. Fetch submission first if we have submissionId or templateIdParam + date
        if (submissionId) {
          subData = await getFormSubmission(Number(submissionId));
          setSubmission(subData);
          if (!currentTemplateId) {
            currentTemplateId = subData.templateId;
          }
        } else if (templateIdParam && date) {
          subData = await getLastSubmission(Number(templateIdParam), date);
          setSubmission(subData);
        }

        // 2. Fetch template
        if (currentTemplateId) {
          const tmplData = await getTemplateDetail(currentTemplateId);
          setTemplate(tmplData);

          if (subData) {
            // Transform answers for DynamicFormRenderer
            const newAnswers: Record<string, any> = {};
            if (tmplData.type === 'PERSONAL') {
              subData.answers.forEach(item => {
                newAnswers[item.questionId] = item.value;
              });
            } else {
              // GROUP
              subData.answers.forEach(ans => {
                const memberName = ans.targetMemberName || 'COMMON';
                if (!newAnswers[memberName]) {
                  newAnswers[memberName] = {};
                }
                newAnswers[memberName][ans.questionId] = ans.value;
              });
            }
            setAnswers(newAnswers);

            // 3. Fetch cell members if it's a GROUP form
            if (tmplData.type === 'GROUP') {
              try {
                let cellDetail = null;
                if (subData.targetCellId) {
                  cellDetail = await getCellDetail(subData.targetCellId);
                } else if (tmplData.category === 'CELL_REPORT') {
                  // Fallback for missing targetCellId: try to get current user's cell
                  try {
                    const myCell = await getMyCell();
                    cellDetail = await getCellDetail(myCell.cellId);
                  } catch (e) {
                    console.warn('Failed to fetch fallback cell members:', e);
                  }
                }

                if (cellDetail) {
                  const allMembers = [];
                  if (cellDetail.leaderName) allMembers.push(cellDetail.leaderName);
                  if (cellDetail.members) {
                    allMembers.push(...cellDetail.members.map(m => m.name));
                  }
                  
                  const membersFromAnswers = Object.keys(newAnswers).filter(m => m !== 'COMMON');
                  const combinedMembers = Array.from(new Set([...allMembers, ...membersFromAnswers]));
                  setDisplayMembers(combinedMembers);
                } else {
                  const membersFromAnswers = Object.keys(newAnswers).filter(m => m !== 'COMMON');
                  setDisplayMembers(membersFromAnswers);
                }
              } catch (error) {
                console.error('Failed to fetch cell members for view:', error);
                const membersFromAnswers = Object.keys(newAnswers).filter(m => m !== 'COMMON');
                setDisplayMembers(membersFromAnswers);
              }
            }
          }
        }
      } catch (error) {
        console.error('Failed to fetch data:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, [submissionId, templateIdParam, date]);

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
        <div className="text-center">
          <p className="mb-4 text-slate-500">양식을 찾을 수 없습니다.</p>
          <button
            onClick={() => navigate('/my-reports')}
            className="rounded-lg bg-blue-600 px-4 py-2 text-white"
          >
            목록으로 돌아가기
          </button>
        </div>
      </div>
    );
  }

  const isExpired = submission?.submitTime ? (new Date().getTime() - new Date(submission.submitTime).getTime()) > (7 * 24 * 60 * 60 * 1000) : false;
  const canEdit = submission && submission.status === 'PENDING' && !isExpired;

  // Use displayMembers if available, otherwise fallback to keys in answers
  const submittedMembers = template?.type === 'GROUP' 
    ? (displayMembers.length > 0 ? displayMembers : Object.keys(answers).filter(m => m !== 'COMMON'))
    : [];

  return (
    <div className="min-h-screen bg-slate-50 px-4 py-6 text-slate-900 sm:px-6 sm:py-10">
      <div className="mx-auto max-w-4xl space-y-6">
        <UserHeader />
        
        {/* Header */}
        <div className="flex items-center gap-4">
          <button 
            onClick={() => navigate(-1)}
            className="flex h-10 w-10 items-center justify-center rounded-full bg-white shadow-sm hover:bg-slate-50 transition-colors"
          >
            <ChevronLeft className="h-6 w-6 text-slate-600" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-slate-800">{template.title} 조회</h1>
            {submission && <p className="text-sm text-slate-500 mt-1">{submission.submitDate} 제출됨</p>}
          </div>
        </div>

        <div className="rounded-2xl border border-slate-100 bg-white p-6 sm:p-8 shadow-xl shadow-slate-200/50">
          {/* Metadata Grid */}
          <div className="mb-10 grid grid-cols-1 gap-4 rounded-xl bg-slate-50 p-6 border border-slate-100 sm:grid-cols-3">
            <div className="space-y-1">
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">제출자</p>
              <div className="flex items-center gap-2 font-bold text-slate-900">
                <User className="h-4 w-4 text-slate-400" />
                {submission?.submitterName || '미제출'}
              </div>
            </div>

            {submission?.targetCellName && (
              <div className="space-y-1">
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">소속 순</p>
                <div className="flex items-center gap-2 font-bold text-slate-900">
                  <Users className="h-4 w-4 text-purple-500" />
                  {submission.targetCellName}
                </div>
              </div>
            )}

            {submission?.targetSundayDate && (
              <div className="space-y-1">
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">보고서 기준일</p>
                <div className="flex items-center gap-2 font-bold text-slate-900">
                  <Calendar className="h-4 w-4 text-blue-500" />
                  {submission.targetSundayDate}
                </div>
              </div>
            )}
          </div>

          {/* Form Content - Use DynamicFormRenderer in readOnly mode */}
          <div className="space-y-8">
            <DynamicFormRenderer
              template={template}
              answers={answers}
              onChange={() => {}} // No-op for readOnly
              members={submittedMembers}
              readOnly={true}
            />
          </div>

          <div className="mt-12 flex flex-col sm:flex-row justify-center items-center gap-4 border-t border-slate-100 pt-8">
            <button
              onClick={() => navigate('/my-reports')}
              className="w-full sm:w-auto rounded-xl bg-slate-100 px-8 py-3 text-sm font-bold text-slate-600 hover:bg-slate-200 transition-colors"
            >
              목록으로 돌아가기
            </button>
            {canEdit && (
              <button
                onClick={handleEdit}
                className="w-full sm:w-auto flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-8 py-3 text-sm font-bold text-white hover:bg-blue-700 transition-colors shadow-lg shadow-blue-200"
              >
                <Edit3 className="h-4 w-4" />
                수정하기
              </button>
            )}
          </div>
        </div>
        
        <Footer />
      </div>
    </div>
  );
}

export default ReportViewPage;
