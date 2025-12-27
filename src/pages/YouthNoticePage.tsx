import { Link } from 'react-router-dom'
import UserHeader from '../components/UserHeader'
import Footer from '../components/Footer'

interface Notice {
  id: number
  date: string
  title: string
  content: string
  isImportant: boolean
}

const mockNotices: Notice[] = [
  {
    id: 1,
    date: '2025-12-16',
    title: '[공지] 12월 청년부 모임 일정 안내',
    content: '12월 청년부 모임은 매주 토요일 오후 7시에 진행됩니다. 많은 참여 부탁드립니다.',
    isImportant: true,
  },
  {
    id: 2,
    date: '2025-12-14',
    title: '[안내] 연말 특별 예배 안내',
    content: '12월 31일 밤 11시에 연말 특별 예배가 있습니다. 함께 모여 감사하며 새해를 맞이합시다.',
    isImportant: true,
  },
  {
    id: 3,
    date: '2025-12-10',
    title: '[소식] 청년부 사진 앨범 업데이트',
    content: '최근 예배 및 행사 사진이 앨범에 업로드되었습니다. 확인해보세요!',
    isImportant: false,
  },
  {
    id: 4,
    date: '2025-12-05',
    title: '[공지] 순모임 장소 변경 안내',
    content: '이번 주 순모임은 교회 2층 소강당에서 진행됩니다.',
    isImportant: false,
  },
  {
    id: 5,
    date: '2025-12-01',
    title: '[안내] 12월 봉사활동 참여 신청',
    content: '12월 봉사활동 참여를 원하시는 분은 12월 10일까지 신청해주세요.',
    isImportant: false,
  },
]

function YouthNoticePage() {
  return (
    <div className="min-h-screen bg-slate-50 px-6 py-10 text-slate-900">
      <div className="mx-auto max-w-4xl space-y-6">
        <UserHeader />
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">청년부 공지사항</h1>
            <p className="mt-1 text-sm text-slate-600">새로운 일정과 중요한 소식을 안내합니다.</p>
          </div>
          <Link
            to="/user-dashboard"
            className="text-sm font-semibold text-blue-600 hover:text-blue-700"
          >
            ← 메인으로
          </Link>
        </div>

        <div className="space-y-3">
          {mockNotices.map((notice) => (
            <div
              key={notice.id}
              className={`rounded-xl border bg-white p-5 shadow-sm transition hover:shadow-md ${
                notice.isImportant ? 'border-red-200 bg-red-50/30' : 'border-slate-200'
              }`}
            >
              <div className="flex items-start gap-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    {notice.isImportant && (
                      <span className="rounded-full bg-red-500 px-2 py-0.5 text-xs font-semibold text-white">
                        중요
                      </span>
                    )}
                    <span className="text-xs text-slate-500">{notice.date}</span>
                  </div>
                  <h2 className="mt-2 text-lg font-semibold text-slate-900">{notice.title}</h2>
                  <p className="mt-2 text-sm text-slate-600">{notice.content}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
        <Footer />
      </div>
    </div>
  )
}

export default YouthNoticePage


