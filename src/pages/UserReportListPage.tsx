import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import UserHeader from '../components/UserHeader';
import Footer from '../components/Footer';
import type { FormTemplate, MySubmissionResponse } from '../types/form';
import { getAvailableForms, getMySubmissions } from '../services/formService';
import { Users, FileText, ChevronRight, ListChecks, CheckCircle, Clock, Calendar } from 'lucide-react';

function UserReportListPage() {
  const navigate = useNavigate();
  const [filterStatus, setFilterStatus] = useState<'unsubmitted' | 'submitted' | 'all'>('unsubmitted');
  const [availableForms, setAvailableForms] = useState<(FormTemplate & { 
    lastSubmitDate?: string; 
    submitted?: boolean;
    selectableDates?: string[];
    statusMessage?: string;
  })[]>([]);
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

  const handleTemplateClick = (template: any) => {
    let url = `/reports/write/${template.id}`;
    if (template.targetDate) {
      url += `?date=${template.targetDate}`;
    }
    navigate(url, { state: { template } });
  };

 const handleSubmissionClick = (submission: MySubmissionResponse) => {
    navigate(`/reports/view/${submission.submissionId}`);
  };

  const displayAvailableForms = availableForms
    .filter((template) => {
      if (filterStatus === 'all') return true;
      if (filterStatus === 'unsubmitted') return !template.submitted;
      // 제출 완료 탭에서는 availableForms에 있는 항목을 보여주지 않음 (mySubmissions에서 보여줌)
      return false;
    })
    .flatMap((template) => {
      // 이미 제출된 템플릿은 표시하지 않음
      if (template.submitted) return [];

      if (template.category === 'CELL_REPORT' && template.selectableDates && template.selectableDates.length > 0) {
        return template.selectableDates.map((date) => ({
          ...template,
          targetDate: date,
          uniqueKey: `${template.id}-${date}`,
          displayStatusMessage: `미제출`
        }));
      }
      return [{ 
        ...template, 
        uniqueKey: template.id.toString(),
        displayStatusMessage: template.statusMessage 
      }];
    });

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

        {/* 필터 탭 */}
        <div className="flex space-x-1 rounded-xl bg-slate-100 p-1 mb-6 w-fit">
          <button
            onClick={() => setFilterStatus('unsubmitted')}
            className={`rounded-lg px-4 py-2 text-sm font-medium transition ${
              filterStatus === 'unsubmitted'
                ? 'bg-white text-blue-600 shadow-sm'
                : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            미제출
          </button>
          <button
            onClick={() => setFilterStatus('submitted')}
            className={`rounded-lg px-4 py-2 text-sm font-medium transition ${
              filterStatus === 'submitted'
                ? 'bg-white text-blue-600 shadow-sm'
                : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            제출완료
          </button>
          <button
            onClick={() => setFilterStatus('all')}
            className={`rounded-lg px-4 py-2 text-sm font-medium transition ${
              filterStatus === 'all'
                ? 'bg-white text-blue-600 shadow-sm'
                : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            전체보기
          </button>
        </div>

        {loading ? (
          <div className="py-12 text-center text-slate-500">로딩 중...</div>
        ) : (
          <div className="space-y-8">
            {/* 미제출/양식 섹션 (미제출 또는 전체보기 탭) */}
            {(filterStatus === 'unsubmitted' || filterStatus === 'all') && (
              <section>
                <div className="mb-4 flex items-center gap-2">
                  <div className="h-5 w-1 bg-blue-600 rounded-full"></div>
                  <h2 className="text-lg font-bold text-slate-800">작성 가능한 보고서</h2>
                </div>
                {displayAvailableForms.length === 0 ? (
                  <div className="rounded-xl border border-dashed border-slate-200 bg-white py-10 text-center text-slate-400">
                    작성 가능한 보고서가 없습니다.
                  </div>
                ) : (
                  <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {displayAvailableForms.map((template: any) => {
                      const isCellReport = template.category === 'CELL_REPORT';
                      const Icon = isCellReport ? Users : FileText;
                      const badgeColor = isCellReport ? 'bg-blue-50 text-blue-600' : 'bg-emerald-50 text-emerald-600';
                      const iconBg = isCellReport ? 'bg-blue-100 text-blue-600' : 'bg-emerald-100 text-emerald-600';

                      return (
                        <div
                          key={template.uniqueKey}
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
                              {template.description || ''}
                            </p>
                            
                            <div className="mt-3 flex flex-wrap gap-2">
                              {template.targetDate && (
                                <div className="inline-flex items-center gap-1.5 rounded-md bg-blue-50 px-2.5 py-1.5 text-xs font-bold text-blue-700 border border-blue-100">
                                  <Calendar className="h-3.5 w-3.5" />
                                  <span>{template.targetDate}</span>
                                </div>
                              )}
                              <div className="inline-flex items-center gap-1.5 rounded-md bg-orange-50 px-2.5 py-1.5 text-xs font-bold text-orange-700">
                                <Clock className="h-3.5 w-3.5" />
                                <span>{template.displayStatusMessage || `작성 기한: ${deadlineStr}까지`}</span>
                              </div>
                            </div>
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
                )}
              </section>
            )}

            {/* 제출 완료 섹션 (제출완료 또는 전체보기 탭) */}
            {(filterStatus === 'submitted' || filterStatus === 'all') && (
              <section>
                <div className="mb-4 flex items-center gap-2">
                  <div className="h-5 w-1 bg-emerald-600 rounded-full"></div>
                  <h2 className="text-lg font-bold text-slate-800">나의 제출 내역</h2>
                </div>
                {mySubmissions.length === 0 ? (
                  <div className="rounded-xl border border-dashed border-slate-200 bg-white py-10 text-center text-slate-400">
                    제출한 보고서가 없습니다.
                  </div>
                ) : (
                  <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {mySubmissions.map((submission) => {
                      const isCellReport = submission.category === 'CELL_REPORT';
                      
                      return (
                        <div
                          key={submission.submissionId}
                          onClick={() => handleSubmissionClick(submission)}
                          className="group relative flex cursor-pointer flex-col justify-between overflow-hidden rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition-all hover:-translate-y-1 hover:border-emerald-300 hover:shadow-md"
                        >
                          <div className="mb-4 flex items-start justify-between">
                            <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${isCellReport ? 'bg-purple-50 text-purple-600' : 'bg-emerald-50 text-emerald-600'}`}>
                              {isCellReport ? <Users className="h-5 w-5" /> : <FileText className="h-5 w-5" />}
                            </div>
                            <div className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${isCellReport ? 'bg-purple-100 text-purple-700' : 'bg-emerald-100 text-emerald-700'}`}>
                              {isCellReport ? '순 보고서' : '일반 양식'}
                            </div>
                          </div>

                          <div className="mb-4 flex-1">
                            <h3 className="mb-3 text-lg font-bold text-slate-900 group-hover:text-emerald-600 line-clamp-1">
                              {submission.templateTitle}
                            </h3>
                            
                            <div className="grid grid-cols-1 gap-2 bg-slate-50/50 rounded-lg p-3 border border-slate-100">
                              {isCellReport && (
                                <div className="flex items-center justify-between text-xs">
                                  <div className="flex items-center gap-1.5 text-slate-500">
                                    <Users className="h-3.5 w-3.5" />
                                    <span>순</span>
                                  </div>
                                  <span className="font-semibold text-purple-600 bg-purple-50 px-2 py-0.5 rounded">
                                    {submission.targetCellName || '-'}
                                  </span>
                                </div>
                              )}

                              <div className="flex items-center justify-between text-xs">
                                <div className="flex items-center gap-1.5 text-slate-500">
                                  <FileText className="h-3.5 w-3.5" />
                                  <span>작성자</span>
                                </div>
                                <span className="font-medium text-slate-700">
                                  {submission.submitterName}
                                </span>
                              </div>

                              {isCellReport && (
                                <div className="flex items-center justify-between text-xs">
                                  <div className="flex items-center gap-1.5 text-slate-500">
                                    <Calendar className="h-3.5 w-3.5" />
                                    <span>보고 주차</span>
                                  </div>
                                  <span className="font-bold text-blue-600">
                                    {submission.targetSundayDate || '-'}
                                  </span>
                                </div>
                              )}

                              <div className={`flex items-center justify-between text-xs pt-1 border-t border-slate-200/50 ${isCellReport ? 'mt-1' : ''}`}>
                                <div className="flex items-center gap-1.5 text-slate-400">
                                  <Clock className="h-3.5 w-3.5" />
                                  <span>제출 일시</span>
                                </div>
                                <span className="text-slate-500">
                                  {submission.submitTime 
                                    ? new Date(submission.submitTime).toLocaleString('ko-KR', {
                                        month: '2-digit',
                                        day: '2-digit',
                                        hour: '2-digit',
                                        minute: '2-digit',
                                        hour12: false
                                      }) 
                                    : '-'}
                                </span>
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center justify-between border-t border-slate-100 pt-4 text-xs text-slate-400">
                            <span className="flex items-center gap-1">
                              <CheckCircle className="h-3.5 w-3.5" />
                              상세 보기
                            </span>
                            <ChevronRight className="h-4 w-4 text-slate-300 transition-transform group-hover:translate-x-1 group-hover:text-emerald-500" />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </section>
            )}
          </div>
        )}

        <Footer />
      </div>
    </div>
  );
}

export default UserReportListPage;
