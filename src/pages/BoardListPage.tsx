import { useEffect, useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import UserHeader from '../components/UserHeader'
import Footer from '../components/Footer'
import { getBoards, getBoardPosts, type Board, type BoardPost } from '../services/boardService'

// 게시판 타입 정의 (다른 파일에서 참조함)
export type BoardType = string

function BoardListPage() {
  const { boardType } = useParams<{ boardType: string }>()
  const navigate = useNavigate()

  const [board, setBoard] = useState<Board | null>(null)
  const [posts, setPosts] = useState<BoardPost[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // 게시판 색상 결정 함수
  const getBoardColor = (id?: string) => {
    if (!id) return 'bg-blue-100 text-blue-700'
    const colors = [
      'bg-blue-100 text-blue-700',
      'bg-purple-100 text-purple-700',
      'bg-emerald-100 text-emerald-700',
      'bg-amber-100 text-amber-700',
      'bg-rose-100 text-rose-700',
      'bg-indigo-100 text-indigo-700',
    ];
    let hash = 0;
    for (let i = 0; i < id.length; i++) {
      hash = id.charCodeAt(i) + ((hash << 5) - hash);
    }
    return colors[Math.abs(hash) % colors.length];
  }

  useEffect(() => {
    const fetchData = async () => {
      if (!boardType) return

      setLoading(true)
      setError(null)
      try {
        // 1. 게시판 정보 조회 (목록에서 찾기)
        const boards = await getBoards()
        console.log('URL boardType:', boardType)
        console.log('API boards:', boards)

        // id 또는 boardId가 일치하는지 확인 (문자열/숫자 형변환 고려)
        const currentBoard = boards.find(b => 
          String(b.id) === String(boardType) || 
          (b.boardId && String(b.boardId) === String(boardType))
        )

        if (!currentBoard) {
          setError('게시판을 찾을 수 없습니다.')
          setLoading(false)
          return
        }

        setBoard(currentBoard)

        // 2. 게시글 목록 조회
        // API 호출 시 boardId가 있으면 사용 (없으면 boardType 사용)
        const apiBoardId = currentBoard.boardId || boardType
        const { posts: postsData } = await getBoardPosts(apiBoardId)
        setPosts(postsData || [])

      } catch (err) {
        console.error('게시판 데이터 로드 실패:', err)
        setError('게시판 정보를 불러오는데 실패했습니다.')
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [boardType])

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

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 px-4 py-6 text-slate-900 sm:px-6 sm:py-10">
        <div className="mx-auto max-w-6xl space-y-6">
          <UserHeader />
          <div className="flex h-64 items-center justify-center rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="text-slate-500">로딩 중...</div>
          </div>
          <Footer />
        </div>
      </div>
    )
  }

  if (error || !board) {
    return (
      <div className="min-h-screen bg-slate-50 px-4 py-6 text-slate-900 sm:px-6 sm:py-10">
        <div className="mx-auto max-w-6xl space-y-6">
          <UserHeader />
          <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm">
            <p className="text-lg font-semibold text-slate-600">{error || '게시판을 찾을 수 없습니다.'}</p>
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

  return (
    <div className="min-h-screen bg-slate-50 px-4 py-6 text-slate-900 sm:px-6 sm:py-10">
      <div className="mx-auto max-w-6xl space-y-6">
        <UserHeader />

        {/* 헤더 */}
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-3">
              <span className={`rounded-full px-3 py-1 text-sm font-semibold ${getBoardColor(board.id || board.boardId || '')}`}>
                {board.name}
              </span>
            </div>
            <h1 className="mt-2 text-2xl font-bold text-slate-900">{board.name}</h1>
            <p className="mt-1 text-sm text-slate-600">{board.description}</p>
          </div>
          {board.canWrite && (
            <button
              onClick={() => navigate(`/boards/${boardType}/write`)}
              className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
            >
              글쓰기
            </button>
          )}
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
        {board.canWrite && (
          <div className="flex justify-end">
            <button
              onClick={() => navigate(`/boards/${boardType}/write`)}
              className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
            >
              글쓰기
            </button>
          </div>
        )}

        <Footer />
      </div>
    </div>
  )
}

export default BoardListPage
