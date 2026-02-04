import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import UserHeader from '../components/UserHeader';
import Footer from '../components/Footer';
import { getFormSubmission } from '../services/formService';
import type { FormSubmission } from '../types/form';
import { ChevronLeft, Calendar, Clock, CheckCircle, AlertCircle } from 'lucide-react';

function ReportViewPage() {
  const { submissionId } = useParams();
  const navigate = useNavigate();
  
  const [submission, setSubmission] = useState<FormSubmission | null>(null);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    const fetchSubmission = async () => {
      if (!submissionId) return;
      try {
        setLoading(true);
        const data = await getFormSubmission(Number(submissionId));
        setSubmission(data);
      } catch (error) {
        console.error('Failed to fetch submission:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchSubmission();
  }, [submissionId]);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'APPROVED':
        return <span className="flex items-center gap-1 rounded-full bg-blue-100 px-3 py-1 text-sm font-bold text-blue-700"><CheckCircle className="h-4 w-4" /> 승인됨</span>;
      case 'PENDING':
        return <span className="flex items-center gap-1 rounded-full bg-yellow-100 px-3 py-1 text-sm font-bold text-yellow-700"><Clock className="h-4 w-4" /> 대기중</span>;
      case 'REJECTED':
        return <span className="flex items-center gap-1 rounded-full bg-red-100 px-3 py-1 text-sm font-bold text-red-700"><AlertCircle className="h-4 w-4" /> 반려됨</span>;
      default:
        return <span className="rounded-full bg-slate-100 px-3 py-1 text-sm font-bold text-slate-600">{status}</span>;
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-slate-500">로딩 중...</p>
      </div>
    );
  }

  if (!submission) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p>보고서를 찾을 수 없습니다.</p>
      </div>
    );
  }

  // Group answers by member (if any)
  const groupedAnswers: Record<string, typeof submission.answers> = {};
  const commonAnswers: typeof submission.answers = [];

  submission.answers.forEach(ans => {
    if (ans.targetMemberName) {
      if (!groupedAnswers[ans.targetMemberName]) {
        groupedAnswers[ans.targetMemberName] = [];
      }
      groupedAnswers[ans.targetMemberName].push(ans);
    } else {
      commonAnswers.push(ans);
    }
  });

  const hasGroupedAnswers = Object.keys(groupedAnswers).length > 0;

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
            <h1 className="text-2xl font-bold">보고서 결과</h1>
            <p className="text-sm text-slate-500">{submission.submitDate} 제출</p>
          </div>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          {/* Metadata */}
          <div className="mb-6 flex flex-wrap items-center justify-between gap-4 rounded-lg bg-slate-50 p-4">
            <div className="space-y-1">
              <p className="text-sm font-medium text-slate-500">제출자</p>
              <p className="font-bold text-slate-900">{submission.submitterName}</p>
            </div>
            {submission.targetSundayDate && (
              <div className="space-y-1">
                <p className="text-sm font-medium text-slate-500">보고서 기준일</p>
                <div className="flex items-center gap-1 font-bold text-slate-900">
                  <Calendar className="h-4 w-4 text-blue-500" />
                  {submission.targetSundayDate}
                </div>
              </div>
            )}
            <div className="space-y-1">
              <p className="text-sm font-medium text-slate-500">상태</p>
              <div>{getStatusBadge(submission.status)}</div>
            </div>
          </div>

          {/* Form Content */}
          <div className="space-y-8">
            {/* Common Answers (or Personal Report Answers) */}
            {commonAnswers.length > 0 && (
              <div className="space-y-6">
                {hasGroupedAnswers && <h3 className="text-lg font-bold text-slate-800">공통 질문</h3>}
                {commonAnswers.map((ans, idx) => (
                  <div key={idx} className="space-y-2">
                    <label className="block text-sm font-bold text-slate-700">
                      Q. {ans.questionLabel || `질문 ${ans.questionId}`}
                    </label>
                    <div className="rounded-lg border border-slate-200 bg-slate-50 p-4 text-slate-800">
                      {ans.value}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Grouped Answers (for Group Reports) */}
            {hasGroupedAnswers && (
              <div className="space-y-8">
                {Object.entries(groupedAnswers).map(([memberName, answers]) => (
                  <div key={memberName} className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
                    <h3 className="mb-4 border-b border-slate-100 pb-2 text-lg font-bold text-blue-600">
                      {memberName}
                    </h3>
                    <div className="space-y-6">
                      {answers.map((ans, idx) => (
                        <div key={idx} className="space-y-2">
                          <label className="block text-sm font-bold text-slate-700">
                            Q. {ans.questionLabel || `질문 ${ans.questionId}`}
                          </label>
                          <div className="rounded-lg border border-slate-200 bg-slate-50 p-4 text-slate-800">
                            {ans.value}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="mt-8 flex justify-end border-t border-slate-100 pt-6">
            <button
              onClick={() => navigate('/my-reports')}
              className="rounded-lg bg-slate-100 px-6 py-2.5 text-sm font-bold text-slate-600 hover:bg-slate-200"
            >
              목록으로 돌아가기
            </button>
          </div>
        </div>
        
        <Footer />
      </div>
    </div>
  );
}

export default ReportViewPage;
