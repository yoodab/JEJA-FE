import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import UserHeader from '../components/UserHeader';
import Footer from '../components/Footer';
import type { FormTemplate } from '../types/form';
import { getAvailableForms, getMySubmissions, type MySubmissionResponse } from '../services/formService';
import { Users, FileText, ChevronRight, ListChecks, CheckCircle, Clock, AlertCircle } from 'lucide-react';

function UserReportListPage() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'available' | 'submitted'>('available');
  const [availableForms, setAvailableForms] = useState<(FormTemplate & { lastSubmitDate?: string; submitted?: boolean })[]>([]);
  const [mySubmissions, setMySubmissions] = useState<MySubmissionResponse[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [forms, submissions] = await Promise.all([
          getAvailableForms(),
          getMySubmissions()
        ]);
        setAvailableForms(forms);
        setMySubmissions(submissions);
      } catch (error) {
        console.error('Failed to fetch reports:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'APPROVED':
        return <span className="flex items-center gap-1 rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-bold text-blue-700"><CheckCircle className="h-3 w-3" /> 승인됨</span>;
      case 'PENDING':
        return <span className="flex items-center gap-1 rounded-full bg-yellow-100 px-2.5 py-0.5 text-xs font-bold text-yellow-700"><Clock className="h-3 w-3" /> 대기중</span>;
      case 'REJECTED':
        return <span className="flex items-center gap-1 rounded-full bg-red-100 px-2.5 py-0.5 text-xs font-bold text-red-700"><AlertCircle className="h-3 w-3" /> 반려됨</span>;
      default:
        return <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-bold text-slate-600">{status}</span>;
    }
  };

  const handleTemplateClick = (template: FormTemplate) => {
    navigate(`/reports/write/${template.id}`, { state: { template } });
  };

  const getDeadlineInfo = () => {
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

    // 마감일: 수요일 (3일 후)
    const deadline = new Date(target);
    deadline.setDate(target.getDate() + 3);
    
    const mm = deadline.getMonth() + 1;
    const dd = deadline.getDate();
    
    return `${mm}.${dd}(수)`;
  };

  const deadlineStr = getDeadlineInfo();

  return (
    <div className="min-h-screen bg-slate-50 px-4 py-6 text-slate-900 sm:px-6 sm:py-10">
      <div className="mx-auto max-w-6xl space-y-6">
        <UserHeader />
        
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">보고서 센터</h1>
            <p className="mt-1 text-sm text-slate-600">
              작성해야 할 보고서와 제출 내역을 관리합니다.
            </p>
          </div>
          <button
            onClick={() => navigate('/user-dashboard')}
            className="text-sm font-semibold text-blue-600 hover:text-blue-700"
          >
            ← 메인으로
          </button>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
          {/* 탭 헤더 */}
          <div className="flex border-b border-slate-200">
            <button
              onClick={() => setActiveTab('available')}
              className={`flex-1 border-b-2 px-4 py-4 text-sm font-semibold transition ${
                activeTab === 'available'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              작성 가능한 보고서
            </button>
            <button
              onClick={() => setActiveTab('submitted')}
              className={`flex-1 border-b-2 px-4 py-4 text-sm font-semibold transition ${
                activeTab === 'submitted'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              내가 작성한 보고서
            </button>
          </div>

          {/* 탭 내용 */}
          <div className="p-6">
            {loading ? (
              <div className="py-12 text-center text-slate-500">로딩 중...</div>
            ) : activeTab === 'available' ? (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {availableForms.map((template) => {
                  const isCellReport = template.category === 'CELL_REPORT';
                  const Icon = isCellReport ? Users : FileText;
                  const badgeColor = isCellReport ? 'bg-blue-50 text-blue-600' : 'bg-emerald-50 text-emerald-600';
                  const iconBg = isCellReport ? 'bg-blue-100 text-blue-600' : 'bg-emerald-100 text-emerald-600';

                  return (
                    <div
                      key={template.id}
                      onClick={() => handleTemplateClick(template)}
                      className="group relative flex cursor-pointer flex-col justify-between overflow-hidden rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition-all hover:-translate-y-1 hover:border-blue-300 hover:shadow-md"
                    >
                      <div className="mb-4 flex items-start justify-between">
                        <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${iconBg}`}>
                          <Icon className="h-5 w-5" />
                        </div>
                        <div className={`rounded-full px-2.5 py-0.5 text-xs font-bold ${badgeColor}`}>
                          {isCellReport ? '순 보고서' : '신청서'}
                        </div>
                      </div>

                      <div className="mb-4 flex-1">
                        <h3 className="mb-1 text-lg font-bold text-slate-900 group-hover:text-blue-600">
                          {template.title}
                        </h3>
                        <p className="line-clamp-2 text-sm text-slate-500">
                          {template.description || '설명이 없습니다.'}
                        </p>
                        
                        {isCellReport && (
                          <div className="mt-3 inline-flex items-center gap-1.5 rounded-md bg-orange-50 px-2.5 py-1.5 text-xs font-bold text-orange-700">
                            <Clock className="h-3.5 w-3.5" />
                            <span>작성 기한: {deadlineStr}까지</span>
                          </div>
                        )}
                        
                        {template.submitted && (
                          <div className="mt-3 inline-flex items-center gap-1.5 rounded-md bg-blue-50 px-2.5 py-1.5 text-xs font-bold text-blue-700">
                            <CheckCircle className="h-3.5 w-3.5" />
                            <span>제출 완료 ({template.lastSubmitDate})</span>
                          </div>
                        )}
                      </div>

                      <div className="flex items-center justify-between border-t border-slate-100 pt-4 text-xs text-slate-400">
                        <div className="flex gap-3">
                          <span className="flex items-center gap-1">
                            <ListChecks className="h-3.5 w-3.5" />
                            작성하기
                          </span>
                        </div>
                        <ChevronRight className="h-4 w-4 text-slate-300 transition-transform group-hover:translate-x-1 group-hover:text-blue-500" />
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="space-y-4">
                {mySubmissions.length === 0 ? (
                  <div className="py-12 text-center text-slate-500">
                    <p>제출한 보고서가 없습니다.</p>
                  </div>
                ) : (
                  <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {mySubmissions.map((submission) => {
                      return (
                        <div 
                          key={submission.submissionId} 
                          onClick={() => navigate(`/reports/view/${submission.submissionId}`)}
                          className="group relative flex cursor-pointer flex-col justify-between rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition-all hover:border-blue-300 hover:shadow-md"
                        >
                          <div>
                            <div className="mb-3 flex items-center justify-between">
                              {getStatusBadge(submission.status)}
                              <span className="text-xs text-slate-400">{submission.submitDate} 제출</span>
                            </div>
                            <h3 className="mb-1 text-lg font-bold text-slate-900 group-hover:text-blue-600">
                              {submission.templateTitle}
                            </h3>
                          </div>
                          
                          <div className="mt-4 border-t border-slate-100 pt-4">
                            <button className="flex w-full items-center justify-center gap-1 rounded-lg bg-slate-50 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-100 group-hover:bg-blue-50 group-hover:text-blue-600">
                              <FileText className="h-4 w-4" />
                              내용 보기
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        <Footer />
      </div>
    </div>
  );
}

export default UserReportListPage;
