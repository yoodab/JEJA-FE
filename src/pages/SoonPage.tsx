import { Link } from 'react-router-dom'
import UserHeader from '../components/UserHeader'
import Footer from '../components/Footer'

interface SoonMember {
  id: number
  name: string
  role?: string
}

const mockSoonData = {
  soonId: 10,
  soonName: '믿음셀',
  leader: '김리더',
  meetingTime: '매주 토요일 오후 7시',
  meetingPlace: '교회 2층 소강당',
  members: [
    { id: 1, name: '김리더', role: '순장' },
    { id: 2, name: '이성도', role: '부순장' },
    { id: 3, name: '박청년' },
    { id: 4, name: '최신자' },
    { id: 5, name: '정모임' },
    { id: 6, name: '한함께' },
  ] as SoonMember[],
}

function SoonPage() {
  return (
    <div className="min-h-screen bg-slate-50 px-6 py-10 text-slate-900">
      <div className="mx-auto max-w-4xl space-y-6">
        <UserHeader />
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">순 정보</h1>
            <p className="mt-1 text-sm text-slate-600">내가 속한 순과 순모임 정보를 확인하세요.</p>
          </div>
          <Link
            to="/user-dashboard"
            className="text-sm font-semibold text-blue-600 hover:text-blue-700"
          >
            ← 메인으로
          </Link>
        </div>

        <div className="space-y-6">
          {/* 순 기본 정보 */}
          <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-slate-900">{mockSoonData.soonName}</h2>
            <div className="mt-4 space-y-2 text-sm">
              <div className="flex items-center gap-2">
                <span className="font-medium text-slate-600">순장:</span>
                <span className="text-slate-900">{mockSoonData.leader}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="font-medium text-slate-600">모임 시간:</span>
                <span className="text-slate-900">{mockSoonData.meetingTime}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="font-medium text-slate-600">모임 장소:</span>
                <span className="text-slate-900">{mockSoonData.meetingPlace}</span>
              </div>
            </div>
          </div>

          {/* 순원 목록 */}
          <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-slate-900">순원 목록</h2>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              {mockSoonData.members.map((member) => (
                <div
                  key={member.id}
                  className="flex items-center justify-between rounded-lg border border-slate-100 bg-slate-50 px-4 py-3"
                >
                  <span className="text-sm font-medium text-slate-900">{member.name}</span>
                  {member.role && (
                    <span className="rounded-full bg-blue-100 px-2 py-0.5 text-xs font-semibold text-blue-700">
                      {member.role}
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
        <Footer />
      </div>
    </div>
  )
}

export default SoonPage


