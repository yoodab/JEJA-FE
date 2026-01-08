import { useParams, useNavigate, Link } from 'react-router-dom'
import UserHeader from '../components/UserHeader'
import Footer from '../components/Footer'

export type BoardType = 'free' | 'prayer' | 'question' | 'meal' | string

interface BoardPost {
  id: number
  title: string
  author: string
  createdAt: string
  views: number
  comments: number
  isNotice?: boolean
}

interface BoardInfo {
  id: BoardType
  name: string
  description: string
  color: string
}

const boardInfo: Record<BoardType, BoardInfo> = {
  free: {
    id: 'free',
    name: '자유게시판',
    description: '자유롭게 소통하고 나누는 공간입니다.',
    color: 'bg-blue-100 text-blue-700',
  },
  prayer: {
    id: 'prayer',
    name: '기도제목게시판',
    description: '함께 기도할 제목을 나누는 공간입니다.',
    color: 'bg-purple-100 text-purple-700',
  },
  question: {
    id: 'question',
    name: '목사님께질문',
    description: '목사님께 궁금한 것을 질문하는 공간입니다.',
    color: 'bg-emerald-100 text-emerald-700',
  },
  meal: {
    id: 'meal',
    name: '밥친구 신청',
    description: '함께 식사할 친구를 찾는 공간입니다.',
    color: 'bg-amber-100 text-amber-700',
  },
}

// 임시 게시글 데이터
const mockPosts: Record<BoardType, BoardPost[]> = {
  free: [
    {
      id: 1,
      title: '[공지] 게시판 이용 안내',
      author: '관리자',
      createdAt: '2024-12-20',
      views: 150,
      comments: 5,
      isNotice: true,
    },
    {
      id: 2,
      title: '오늘 예배 너무 좋았어요!',
      author: '김청년',
      createdAt: '2024-12-19',
      views: 45,
      comments: 8,
    },
    {
      id: 3,
      title: '이번 주 순모임 어디서 하나요?',
      author: '이청년',
      createdAt: '2024-12-18',
      views: 32,
      comments: 3,
    },
  ],
  prayer: [
    {
      id: 1,
      title: '[공지] 기도제목 올리는 방법',
      author: '관리자',
      createdAt: '2024-12-20',
      views: 120,
      comments: 2,
      isNotice: true,
    },
    {
      id: 2,
      title: '가족의 건강을 위해 기도 부탁드려요',
      author: '박청년',
      createdAt: '2024-12-19',
      views: 67,
      comments: 12,
    },
    {
      id: 3,
      title: '시험 잘 보게 해주세요',
      author: '최청년',
      createdAt: '2024-12-18',
      views: 54,
      comments: 9,
    },
  ],
  question: [
    {
      id: 1,
      title: '[공지] 질문 작성 시 주의사항',
      author: '관리자',
      createdAt: '2024-12-20',
      views: 200,
      comments: 1,
      isNotice: true,
    },
    {
      id: 2,
      title: '성경 읽는 순서에 대해 질문드려요',
      author: '정청년',
      createdAt: '2024-12-19',
      views: 89,
      comments: 4,
    },
    {
      id: 3,
      title: '기도 생활에 대해 궁금합니다',
      author: '강청년',
      createdAt: '2024-12-17',
      views: 76,
      comments: 6,
    },
  ],
  meal: [
    {
      id: 1,
      title: '[공지] 밥친구 신청 안내',
      author: '관리자',
      createdAt: '2024-12-20',
      views: 100,
      comments: 0,
      isNotice: true,
    },
    {
      id: 2,
      title: '이번 주 일요일 점심 같이 드실 분?',
      author: '윤청년',
      createdAt: '2024-12-19',
      views: 43,
      comments: 7,
    },
    {
      id: 3,
      title: '저녁 식사 같이 하실 분 구해요',
      author: '임청년',
      createdAt: '2024-12-18',
      views: 38,
      comments: 5,
    },
  ],
}

function BoardListPage() {
  const { boardType } = useParams<{ boardType: BoardType }>()
  const navigate = useNavigate()

  if (!boardType || !boardInfo[boardType]) {
    return (
      <div className="min-h-screen bg-slate-50 px-4 py-6 text-slate-900 sm:px-6 sm:py-10">
        <div className="mx-auto max-w-6xl space-y-6">
          <UserHeader />
          <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm">
            <p className="text-lg font-semibold text-slate-600">게시판을 찾을 수 없습니다.</p>
            <button
              onClick={() => navigate('/user-dashboard')}
              className="mt-4 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
            >
              메인으로 돌아가기
            </button>
          </div>
          <Footer />
        </div>
      </div>
    )
  }

  const board = boardInfo[boardType]
  const posts = mockPosts[boardType] || []

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
            <span className={`rounded-full px-3 py-1 text-sm font-semibold ${board.color}`}>
              {board.name}
            </span>
          </div>
          <h1 className="mt-2 text-2xl font-bold text-slate-900">{board.name}</h1>
          <p className="mt-1 text-sm text-slate-600">{board.description}</p>
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
            {posts.length === 0 ? (
              <div className="px-4 py-12 text-center text-sm text-slate-500">
                게시글이 없습니다.
              </div>
            ) : (
              posts.map((post) => (
                <Link
                  key={post.id}
                  to={`/boards/${boardType}/${post.id}`}
                  className="block px-4 py-3 transition hover:bg-slate-50"
                >
                  <div className="grid grid-cols-12 gap-4 items-center">
                    <div className="col-span-1 text-center text-xs text-slate-500">
                      {post.isNotice ? (
                        <span className="rounded-full bg-red-500 px-2 py-0.5 text-[10px] font-semibold text-white">
                          공지
                        </span>
                      ) : (
                        post.id
                      )}
                    </div>
                    <div className="col-span-6">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-slate-900">{post.title}</span>
                        {post.comments > 0 && (
                          <span className="text-xs text-blue-600">[{post.comments}]</span>
                        )}
                      </div>
                    </div>
                    <div className="col-span-2 text-center text-xs text-slate-600">{post.author}</div>
                    <div className="col-span-2 text-center text-xs text-slate-500">
                      {formatDate(post.createdAt)}
                    </div>
                    <div className="col-span-1 text-center text-xs text-slate-500">{post.views}</div>
                  </div>
                </Link>
              ))
            )}
          </div>
        </div>

        {/* 글쓰기 버튼 */}
        <div className="flex justify-end">
          <button
            onClick={() => navigate(`/boards/${boardType}/write`)}
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

export default BoardListPage

