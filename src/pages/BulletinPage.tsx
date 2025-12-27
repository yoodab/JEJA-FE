import { Link } from 'react-router-dom'
import UserHeader from '../components/UserHeader'
import Footer from '../components/Footer'

interface Bulletin {
  id: number
  date: string
  title: string
  week: string
}

const mockBulletins: Bulletin[] = [
  { id: 1, date: '2025-12-14', title: '12월 둘째주 주보', week: '2025년 12월 둘째주' },
  { id: 2, date: '2025-12-07', title: '12월 첫째주 주보', week: '2025년 12월 첫째주' },
  { id: 3, date: '2025-11-30', title: '11월 다섯째주 주보', week: '2025년 11월 다섯째주' },
  { id: 4, date: '2025-11-23', title: '11월 넷째주 주보', week: '2025년 11월 넷째주' },
  { id: 5, date: '2025-11-16', title: '11월 셋째주 주보', week: '2025년 11월 셋째주' },
]

function BulletinPage() {
  return (
    <div className="min-h-screen bg-slate-50 px-6 py-10 text-slate-900">
      <div className="mx-auto max-w-4xl space-y-6">
        <UserHeader />
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">주보</h1>
            <p className="mt-1 text-sm text-slate-600">이번 주 예배 주보를 확인하세요.</p>
          </div>
          <Link
            to="/user-dashboard"
            className="text-sm font-semibold text-blue-600 hover:text-blue-700"
          >
            ← 메인으로
          </Link>
        </div>

        <div className="space-y-3">
          {mockBulletins.map((bulletin) => (
            <div
              key={bulletin.id}
              className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition hover:shadow-md"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <p className="text-xs font-semibold text-slate-500">{bulletin.week}</p>
                  <h2 className="mt-1 text-lg font-semibold text-slate-900">{bulletin.title}</h2>
                  <p className="mt-2 text-sm text-slate-600">날짜: {bulletin.date}</p>
                </div>
                <button className="ml-4 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700">
                  보기
                </button>
              </div>
            </div>
          ))}
        </div>
        <Footer />
      </div>
    </div>
  )
}

export default BulletinPage


