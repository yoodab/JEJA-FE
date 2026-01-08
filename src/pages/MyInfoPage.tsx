import { Link } from 'react-router-dom'
import UserHeader from '../components/UserHeader'
import Footer from '../components/Footer'

const mockMyInfo = {
  name: '김청년',
  loginId: 'youth123',
  phone: '010-1234-5678',
  birthDate: '1998-05-15',
  role: '일반청년',
  status: '재적',
  soonName: '믿음셀',
  soonId: 10,
  hasAccount: true,
}

const mockAttendance = {
  thisMonth: 8,
  lastMonth: 12,
  thisYear: 45,
  recentDates: ['2025-12-14', '2025-12-07', '2025-11-30', '2025-11-23', '2025-11-16'],
}

function MyInfoPage() {
  return (
    <div className="min-h-screen bg-slate-50 px-4 py-6 text-slate-900 sm:px-6 sm:py-10">
      <div className="mx-auto max-w-6xl space-y-6">
        <UserHeader />
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">내 정보 보기</h1>
            <p className="mt-1 text-sm text-slate-600">
              나의 기본 정보와 출석 현황 등을 한 눈에 확인할 수 있습니다.
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
          {/* 기본 정보 */}
          <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-slate-900">기본 정보</h2>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <div>
                <span className="text-sm font-medium text-slate-600">이름</span>
                <p className="mt-1 text-base text-slate-900">{mockMyInfo.name}</p>
              </div>
              <div>
                <span className="text-sm font-medium text-slate-600">아이디</span>
                <p className="mt-1 text-base text-slate-900">{mockMyInfo.loginId}</p>
              </div>
              <div>
                <span className="text-sm font-medium text-slate-600">연락처</span>
                <p className="mt-1 text-base text-slate-900">{mockMyInfo.phone}</p>
              </div>
              <div>
                <span className="text-sm font-medium text-slate-600">생년월일</span>
                <p className="mt-1 text-base text-slate-900">{mockMyInfo.birthDate}</p>
              </div>
              <div>
                <span className="text-sm font-medium text-slate-600">역할</span>
                <p className="mt-1 text-base text-slate-900">{mockMyInfo.role}</p>
              </div>
              <div>
                <span className="text-sm font-medium text-slate-600">상태</span>
                <span className="ml-2 inline-flex rounded-full bg-green-100 px-3 py-1 text-xs font-semibold text-green-700">
                  {mockMyInfo.status}
                </span>
              </div>
            </div>
          </div>

          {/* 순 정보 */}
          <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-slate-900">소속 순</h2>
            <div className="mt-4">
              <p className="text-base text-slate-900">
                {mockMyInfo.soonName} (순 ID: {mockMyInfo.soonId})
              </p>
            </div>
          </div>

          {/* 출석 현황 */}
          <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-slate-900">출석 현황</h2>
            <div className="mt-4 grid gap-4 sm:grid-cols-3">
              <div className="rounded-lg bg-blue-50 p-4">
                <p className="text-sm font-medium text-slate-600">이번 달</p>
                <p className="mt-1 text-2xl font-bold text-blue-600">{mockAttendance.thisMonth}회</p>
              </div>
              <div className="rounded-lg bg-slate-50 p-4">
                <p className="text-sm font-medium text-slate-600">지난 달</p>
                <p className="mt-1 text-2xl font-bold text-slate-900">{mockAttendance.lastMonth}회</p>
              </div>
              <div className="rounded-lg bg-green-50 p-4">
                <p className="text-sm font-medium text-slate-600">올해 총</p>
                <p className="mt-1 text-2xl font-bold text-green-600">{mockAttendance.thisYear}회</p>
              </div>
            </div>
            <div className="mt-6">
              <p className="mb-2 text-sm font-medium text-slate-600">최근 출석 일자</p>
              <div className="flex flex-wrap gap-2">
                {mockAttendance.recentDates.map((date, index) => (
                  <span
                    key={index}
                    className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-700"
                  >
                    {date}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
        <Footer />
      </div>
    </div>
  )
}

export default MyInfoPage


