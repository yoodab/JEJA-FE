import { Link, useNavigate } from 'react-router-dom'
import UserHeader from '../components/UserHeader'
import Footer from '../components/Footer'

interface Notice {
  id: number
  date: string
  title: string
  author: string
  views: number
  comments: number
  isImportant: boolean
}

const mockNotices: Notice[] = [
  {
    id: 1,
    date: '2025-12-16',
    title: '[공지] 12월 청년부 모임 일정 안내',
    author: '관리자',
    views: 150,
    comments: 5,
    isImportant: true,
  },
  {
    id: 2,
    date: '2025-12-14',
    title: '[안내] 연말 특별 예배 안내',
    author: '관리자',
    views: 120,
    comments: 8,
    isImportant: true,
  },
  {
    id: 3,
    date: '2025-12-10',
    title: '[소식] 청년부 사진 앨범 업데이트',
    author: '관리자',
    views: 89,
    comments: 3,
    isImportant: false,
  },
  {
    id: 4,
    date: '2025-12-05',
    title: '[공지] 순모임 장소 변경 안내',
    author: '관리자',
    views: 67,
    comments: 2,
    isImportant: false,
  },
  {
    id: 5,
    date: '2025-12-01',
    title: '[안내] 12월 봉사활동 참여 신청',
    author: '관리자',
    views: 54,
    comments: 1,
    isImportant: false,
  },
]

function YouthNoticePage() {
  const navigate = useNavigate()

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr)
    const today = new Date()
    const diffTime = today.getTime() - date.getTime()
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24))

    if (diffDays === 0) return '오늘'
    if (diffDays === 1) return '어제'
    if (diffDays < 7) return `${diffDays}일 전`
    return date.toLocaleDateString('ko-KR', { month: 'long', day: 'numeric' })
  }

  return (
    <div className="min-h-screen bg-slate-50 px-4 py-6 text-slate-900 sm:px-6 sm:py-10">
      <div className="mx-auto max-w-6xl space-y-6">
        <UserHeader />

        {/* 헤더 */}
        <div>
          <div className="flex items-center gap-3">
            <span className="rounded-full bg-blue-100 px-3 py-1 text-sm font-semibold text-blue-700">
              청년부 공지사항
            </span>
          </div>
          <h1 className="mt-2 text-2xl font-bold text-slate-900">청년부 공지사항</h1>
          <p className="mt-1 text-sm text-slate-600">새로운 일정과 중요한 소식을 안내합니다.</p>
        </div>

        {/* 게시글 목록 */}
        <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
          {/* 게시글 헤더 */}
          <div className="border-b border-slate-200 bg-slate-50 px-4 py-3">
            <div className="grid grid-cols-12 gap-4 text-xs font-semibold text-slate-600">
              <div className="col-span-1 text-center">번호</div>
              <div className="col-span-6">제목</div>
              <div className="col-span-2 text-center">작성자</div>
              <div className="col-span-2 text-center">작성일</div>
              <div className="col-span-1 text-center">조회</div>
            </div>
          </div>

          {/* 게시글 목록 */}
          <div className="divide-y divide-slate-200">
            {mockNotices.length === 0 ? (
              <div className="px-4 py-12 text-center text-sm text-slate-500">
                게시글이 없습니다.
              </div>
            ) : (
              mockNotices.map((notice) => (
                <Link
                  key={notice.id}
                  to={`/youth-notices/${notice.id}`}
                  className="block px-4 py-3 transition hover:bg-slate-50"
                >
                  <div className="grid grid-cols-12 gap-4 items-center">
                    <div className="col-span-1 text-center text-xs text-slate-500">
                      {notice.isImportant ? (
                        <span className="rounded-full bg-red-500 px-2 py-0.5 text-[10px] font-semibold text-white">
                          공지
                        </span>
                      ) : (
                        notice.id
                      )}
                    </div>
                    <div className="col-span-6">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-slate-900">{notice.title}</span>
                        {notice.comments > 0 && (
                          <span className="text-xs text-blue-600">[{notice.comments}]</span>
                        )}
                      </div>
                    </div>
                    <div className="col-span-2 text-center text-xs text-slate-600">{notice.author}</div>
                    <div className="col-span-2 text-center text-xs text-slate-500">
                      {formatDate(notice.date)}
                    </div>
                    <div className="col-span-1 text-center text-xs text-slate-500">{notice.views}</div>
                  </div>
                </Link>
              ))
            )}
          </div>
        </div>

        {/* 글쓰기 버튼 */}
        <div className="flex justify-end">
          <button
            onClick={() => navigate('/youth-notices/write')}
            className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
          >
            글쓰기
          </button>
        </div>

        <Footer />
      </div>
    </div>
  )
}

export default YouthNoticePage


