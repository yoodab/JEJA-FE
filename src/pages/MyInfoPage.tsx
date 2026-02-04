import { useState, useEffect, useCallback } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import UserHeader from '../components/UserHeader'
import Footer from '../components/Footer'
import { 
  getMyInfo, 
  getMyAttendanceHistory,
  updateMyInfo, 
  withdraw,
  uploadFile,
  type MyInfoResponse, 
  type MyAttendanceHistoryResponse 
} from '../services/userService'

function MyInfoPage() {
  const navigate = useNavigate();
  const [myInfo, setMyInfo] = useState<MyInfoResponse | null>(null);
  const [attendanceHistory, setAttendanceHistory] = useState<MyAttendanceHistoryResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Date Range State
  const [startDate, setStartDate] = useState(() => {
    const now = new Date()
    return new Date(now.getFullYear(), 0, 1).toISOString().split('T')[0]
  });
  const [endDate, setEndDate] = useState(() => new Date().toISOString().split('T')[0]);

  // Modals State
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [isWithdrawModalOpen, setIsWithdrawModalOpen] = useState(false);

  // Form States
  const [profileImageFile, setProfileImageFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState('');
  const [isUploading, setIsUploading] = useState(false);

  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [withdrawPassword, setWithdrawPassword] = useState('');

  const fetchMyInfo = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getMyInfo();
      setMyInfo(data);
    } catch (err) {
      setError('내 정보를 불러오는데 실패했습니다.');
      console.error('Failed to fetch my info:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchAttendance = useCallback(async () => {
    try {
      const data = await getMyAttendanceHistory(startDate, endDate);
      setAttendanceHistory(data);
    } catch (err) {
      console.error('Failed to fetch attendance history:', err);
    }
  }, [startDate, endDate]);

  useEffect(() => {
    fetchMyInfo();
  }, []);

  useEffect(() => {
    if (myInfo) {
      fetchAttendance();
    }
  }, [startDate, endDate, myInfo, fetchAttendance]);

  // --- Profile Image Handlers ---
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setProfileImageFile(file);
      setPreviewUrl(URL.createObjectURL(file));
    }
  };

  const handleProfileUpdate = async () => {
    if (!profileImageFile) return;

    try {
      setIsUploading(true);
      const uploadedUrl = await uploadFile(profileImageFile, 'profiles');
      await updateMyInfo({ profileImageUrl: uploadedUrl });
      
      alert('프로필 사진이 변경되었습니다.');
      setIsProfileModalOpen(false);
      setProfileImageFile(null);
      fetchMyInfo(); // Refresh info
    } catch {
      alert('프로필 사진 변경 실패');
    } finally {
      setIsUploading(false);
    }
  };

  // --- Password Handlers ---
  const handlePasswordUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      alert('새 비밀번호가 일치하지 않습니다.');
      return;
    }

    try {
      await updateMyInfo({
        currentPassword: passwordForm.currentPassword,
        newPassword: passwordForm.newPassword
      });
      alert('비밀번호가 변경되었습니다.');
      setIsPasswordModalOpen(false);
      setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (error) {
      const message = (error as { response?: { data?: { message?: string } } }).response?.data?.message 
        || (error instanceof Error ? error.message : '');
      alert('비밀번호 변경 실패: ' + message);
    }
  };

  // --- Withdraw Handlers ---
  const handleWithdraw = async () => {
    if (!window.confirm('정말로 탈퇴하시겠습니까? 이 작업은 되돌릴 수 없습니다.')) return;
    
    try {
      await withdraw(withdrawPassword);
      alert('탈퇴가 완료되었습니다.');
      navigate('/login');
    } catch (error) {
      const message = (error as { response?: { data?: { message?: string } } }).response?.data?.message 
        || (error instanceof Error ? error.message : '');
      alert('탈퇴 실패: ' + message);
    }
  };

  if (loading && !myInfo) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-slate-200 border-t-blue-600"></div>
      </div>
    );
  }

  if (error || !myInfo) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-slate-50 gap-4">
        <p className="text-slate-600">{error || '정보를 찾을 수 없습니다.'}</p>
        <button 
          onClick={() => navigate(0)}
          className="rounded-lg bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
        >
          다시 시도
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 px-4 py-6 text-slate-900 sm:px-6 sm:py-10">
      <div className="mx-auto max-w-6xl space-y-6">
        <UserHeader />
        
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">내 정보 보기</h1>
            <p className="mt-1 text-sm text-slate-600">
              나의 기본 정보와 출석 현황을 확인합니다.
            </p>
          </div>
          <Link
            to="/user-dashboard"
            className="text-sm font-semibold text-blue-600 hover:text-blue-700"
          >
            ← 메인으로
          </Link>
        </div>

        <div className="space-y-6">
          {/* 1. 기본 정보 섹션 */}
          <div className="rounded-xl border border-slate-200 bg-white p-4 sm:p-6 shadow-sm">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold text-slate-900">기본 정보</h2>
            </div>
            
            <div className="flex flex-col md:flex-row gap-6 md:gap-8">
              {/* 프로필 이미지 & 변경 버튼 */}
              <div className="flex flex-col items-center space-y-3">
                <div className="relative h-32 w-32 overflow-hidden rounded-full border border-slate-200 bg-slate-100">
                  {myInfo.profileImageUrl ? (
                    <img
                      src={myInfo.profileImageUrl}
                      alt="Profile"
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-slate-400">
                      <svg className="h-16 w-16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                    </div>
                  )}
                </div>
                <button
                  onClick={() => {
                    setPreviewUrl(myInfo.profileImageUrl || '');
                    setProfileImageFile(null);
                    setIsProfileModalOpen(true);
                  }}
                  className="rounded-md bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 shadow-sm ring-1 ring-inset ring-slate-300 hover:bg-slate-50"
                >
                  프로필 사진 변경
                </button>
              </div>

              {/* 정보 필드 Grid */}
              <div className="flex-1 grid grid-cols-2 gap-4 sm:gap-x-8">
                <div>
                  <span className="text-xs font-medium text-slate-500">이름</span>
                  <p className="mt-1 text-base font-medium text-slate-900">{myInfo.name}</p>
                </div>
                <div>
                  <span className="text-xs font-medium text-slate-500">아이디</span>
                  <p className="mt-1 text-base font-medium text-slate-900">{myInfo.loginId}</p>
                </div>
                <div className="col-span-2 sm:col-span-1">
                  <span className="text-xs font-medium text-slate-500">이메일</span>
                  <p className="mt-1 text-base text-slate-900 truncate">{myInfo.email || '-'}</p>
                </div>
                <div>
                  <span className="text-xs font-medium text-slate-500">생년월일</span>
                  <p className="mt-1 text-base text-slate-900">{myInfo.birthDate}</p>
                </div>
                <div>
                  <span className="text-xs font-medium text-slate-500">연락처</span>
                  <p className="mt-1 text-base text-slate-900">{myInfo.userPhone || '-'}</p>
                </div>
                <div className="col-span-2 pt-2">
                  <button
                    onClick={() => setIsPasswordModalOpen(true)}
                    className="text-sm font-semibold text-blue-600 hover:text-blue-700 hover:underline"
                  >
                    비밀번호 변경하기
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* 2. 출석 현황 섹션 (기간 선택 & 통계) */}
          <div className="rounded-xl border border-slate-200 bg-white p-4 sm:p-6 shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
              <h2 className="text-lg font-semibold text-slate-900">출석 현황</h2>
              
              {/* 기간 선택기 */}
              <div className="flex flex-wrap items-center justify-end gap-2 bg-slate-50 p-2 rounded-lg">
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="bg-white border border-slate-300 rounded px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
                <span className="text-slate-400">~</span>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="bg-white border border-slate-300 rounded px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
                <button
                  onClick={fetchAttendance}
                  className="ml-2 rounded bg-blue-600 px-3 py-1 text-sm font-semibold text-white hover:bg-blue-700 whitespace-nowrap shrink-0"
                >
                  조회
                </button>
              </div>
            </div>

            {attendanceHistory && (
              <div className="space-y-6">
                {/* 통계 요약 (카드) */}
                {Object.keys(attendanceHistory.stats).length > 0 ? (
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                    {Object.entries(attendanceHistory.stats).map(([category, count]) => (
                      <div key={category} className="rounded-lg bg-slate-50 p-4 border border-slate-100">
                        <p className="text-xs font-medium text-slate-500 mb-1">{category}</p>
                        <p className="text-2xl font-bold text-slate-900">{count}회</p>
                      </div>
                    ))}
                    {/* 총 합계 */}
                    <div className="rounded-lg bg-blue-50 p-4 border border-blue-100">
                      <p className="text-xs font-medium text-blue-600 mb-1">총 출석</p>
                      <p className="text-2xl font-bold text-blue-700">
                        {Object.values(attendanceHistory.stats).reduce((a, b) => a + b, 0)}회
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8 text-slate-500 bg-slate-50 rounded-lg">
                    선택한 기간에 출석 기록이 없습니다.
                  </div>
                )}

                {/* 상세 목록 (테이블) */}
                {attendanceHistory.records.length > 0 && (
                  <div className="overflow-x-auto rounded-lg border border-slate-200">
                    <table className="min-w-full divide-y divide-slate-200">
                      <thead className="bg-slate-50">
                        <tr>
                          <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">날짜</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">예배 구분</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">스케줄명</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-slate-200">
                        {attendanceHistory.records.map((record, idx) => (
                          <tr key={idx} className="hover:bg-slate-50">
                            <td className="px-4 py-3 text-sm text-slate-900 whitespace-nowrap">
                              {record.date}
                            </td>
                            <td className="px-4 py-3 text-sm text-slate-600 whitespace-nowrap">
                              <span className="inline-flex items-center rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-800">
                                {record.categoryName}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-sm text-slate-900">
                              {record.scheduleName}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* 회원 탈퇴 (하단 배치) */}
          <div className="flex justify-end pt-4 border-t border-slate-200">
            <button
              onClick={() => setIsWithdrawModalOpen(true)}
              className="text-sm font-medium text-slate-400 hover:text-red-600 hover:underline"
            >
              회원 탈퇴
            </button>
          </div>
        </div>
        <Footer />
      </div>

      {/* --- Modals --- */}

      {/* 1. 프로필 사진 변경 모달 */}
      {isProfileModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
          <div className="w-full max-w-sm rounded-xl bg-white p-6 shadow-xl">
            <h3 className="text-lg font-bold text-slate-900">프로필 사진 변경</h3>
            <div className="mt-4 flex flex-col items-center">
              <div className="relative h-32 w-32 overflow-hidden rounded-full border border-slate-200 bg-slate-100 mb-4">
                {previewUrl ? (
                  <img src={previewUrl} alt="Preview" className="h-full w-full object-cover" />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-slate-400">No Image</div>
                )}
              </div>
              <label className="w-full cursor-pointer rounded-lg border border-slate-300 bg-white px-4 py-2 text-center text-sm font-medium text-slate-700 hover:bg-slate-50">
                <span>이미지 선택</span>
                <input
                  type="file"
                  className="sr-only"
                  accept="image/*"
                  onChange={handleFileChange}
                />
              </label>
            </div>
            <div className="mt-6 flex justify-end gap-2">
              <button
                onClick={() => setIsProfileModalOpen(false)}
                className="rounded-lg px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100"
              >
                취소
              </button>
              <button
                onClick={handleProfileUpdate}
                disabled={!profileImageFile || isUploading}
                className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
              >
                {isUploading ? '업로드 중...' : '저장하기'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 2. 비밀번호 변경 모달 */}
      {isPasswordModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
          <div className="w-full max-w-sm rounded-xl bg-white p-6 shadow-xl">
            <h3 className="text-lg font-bold text-slate-900">비밀번호 변경</h3>
            <form onSubmit={handlePasswordUpdate} className="mt-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700">현재 비밀번호</label>
                <input
                  type="password"
                  required
                  value={passwordForm.currentPassword}
                  onChange={(e) => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })}
                  className="mt-1 block w-full rounded-md border border-slate-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700">새 비밀번호</label>
                <input
                  type="password"
                  required
                  value={passwordForm.newPassword}
                  onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                  className="mt-1 block w-full rounded-md border border-slate-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700">새 비밀번호 확인</label>
                <input
                  type="password"
                  required
                  value={passwordForm.confirmPassword}
                  onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
                  className="mt-1 block w-full rounded-md border border-slate-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsPasswordModalOpen(false)}
                  className="rounded-lg px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100"
                >
                  취소
                </button>
                <button
                  type="submit"
                  className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
                >
                  변경하기
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 3. 회원 탈퇴 모달 */}
      {isWithdrawModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
          <div className="w-full max-w-sm rounded-xl bg-white p-6 shadow-xl">
            <h3 className="text-lg font-bold text-red-600">회원 탈퇴</h3>
            <p className="mt-2 text-sm text-slate-600">
              탈퇴 시 계정 정보가 영구적으로 삭제됩니다.<br/>
              계속하시려면 비밀번호를 입력해주세요.
            </p>
            <div className="mt-4 space-y-4">
              <div>
                <input
                  type="password"
                  placeholder="비밀번호"
                  value={withdrawPassword}
                  onChange={(e) => setWithdrawPassword(e.target.value)}
                  className="block w-full rounded-md border border-slate-300 px-3 py-2 shadow-sm focus:border-red-500 focus:outline-none focus:ring-1 focus:ring-red-500"
                />
              </div>
              <div className="flex justify-end space-x-2 pt-2">
                <button
                  onClick={() => setIsWithdrawModalOpen(false)}
                  className="rounded-lg bg-slate-100 px-4 py-2 text-slate-700 hover:bg-slate-200"
                >
                  취소
                </button>
                <button
                  onClick={handleWithdraw}
                  className="rounded-lg bg-red-600 px-4 py-2 text-white hover:bg-red-700"
                >
                  탈퇴하기
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default MyInfoPage
