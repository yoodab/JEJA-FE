import { Link } from 'react-router-dom'
import UserHeader from '../components/UserHeader'
import Footer from '../components/Footer'

interface ClubMember {
  id: number
  name: string
  role?: string
}

interface ClubActivity {
  id: number
  date: string
  title: string
  description: string
}

const mockClubData = {
  clubId: 1,
  clubName: '찬양동아리',
  leader: '박찬양',
  meetingTime: '매주 금요일 오후 8시',
  meetingPlace: '교회 3층 찬양실',
  description: '함께 찬양하며 예배하는 동아리입니다. 다양한 악기를 연주하고, 새로운 찬양을 배우며 함께 성장합니다.',
  members: [
    { id: 1, name: '박찬양', role: '동아리장' },
    { id: 2, name: '이음악', role: '부동아리장' },
    { id: 3, name: '김기타' },
    { id: 4, name: '최드럼' },
    { id: 5, name: '정베이스' },
    { id: 6, name: '한키보드' },
    { id: 7, name: '송보컬' },
    { id: 8, name: '강하모니' },
    { id: 9, name: '윤리듬' },
    { id: 10, name: '임멜로디' },
    { id: 11, name: '조화음' },
    { id: 12, name: '배찬양' },
  ] as ClubMember[],
  activities: [
    {
      id: 1,
      date: '2025-12-13',
      title: '12월 정기 모임',
      description: '새로운 찬양곡 연습 및 합주 연습',
    },
    {
      id: 2,
      date: '2025-12-06',
      title: '찬양 연습',
      description: '주일예배 찬양 준비 및 연습',
    },
    {
      id: 3,
      date: '2025-11-29',
      title: '11월 정기 모임',
      description: '악기 연습 및 찬양 나눔',
    },
    {
      id: 4,
      date: '2025-11-22',
      title: '찬양 워크샵',
      description: '전문 강사 초청 찬양 워크샵',
    },
  ] as ClubActivity[],
}

function ClubPage() {
  return (
    <div className="min-h-screen bg-slate-50 px-6 py-10 text-slate-900">
      <div className="mx-auto max-w-4xl space-y-6">
        <UserHeader />
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">동아리 정보</h1>
            <p className="mt-1 text-sm text-slate-600">내가 속한 동아리 정보를 확인하세요.</p>
          </div>
          <Link
            to="/user-dashboard"
            className="text-sm font-semibold text-blue-600 hover:text-blue-700"
          >
            ← 메인으로
          </Link>
        </div>

        <div className="space-y-6">
          {/* 동아리 기본 정보 */}
          <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-slate-900">{mockClubData.clubName}</h2>
            <p className="mt-2 text-sm text-slate-600">{mockClubData.description}</p>
            <div className="mt-4 space-y-2 text-sm">
              <div className="flex items-center gap-2">
                <span className="font-medium text-slate-600">동아리장:</span>
                <span className="text-slate-900">{mockClubData.leader}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="font-medium text-slate-600">모임 시간:</span>
                <span className="text-slate-900">{mockClubData.meetingTime}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="font-medium text-slate-600">모임 장소:</span>
                <span className="text-slate-900">{mockClubData.meetingPlace}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="font-medium text-slate-600">동아리원 수:</span>
                <span className="text-slate-900">{mockClubData.members.length}명</span>
              </div>
            </div>
          </div>

          {/* 동아리원 목록 */}
          <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-slate-900">동아리원 목록</h2>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              {mockClubData.members.map((member) => (
                <div
                  key={member.id}
                  className="flex items-center justify-between rounded-lg border border-slate-100 bg-slate-50 px-4 py-3"
                >
                  <span className="text-sm font-medium text-slate-900">{member.name}</span>
                  {member.role && (
                    <span className="rounded-full bg-purple-100 px-2 py-0.5 text-xs font-semibold text-purple-700">
                      {member.role}
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* 활동 내역 */}
          <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-slate-900">최근 활동 내역</h2>
            <div className="mt-4 space-y-3">
              {mockClubData.activities.map((activity) => (
                <div
                  key={activity.id}
                  className="rounded-lg border border-slate-200 bg-slate-50 p-4"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-medium text-slate-500">{activity.date}</span>
                        <h3 className="text-sm font-semibold text-slate-900">{activity.title}</h3>
                      </div>
                      <p className="mt-1 text-xs text-slate-600">{activity.description}</p>
                    </div>
                  </div>
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

export default ClubPage


