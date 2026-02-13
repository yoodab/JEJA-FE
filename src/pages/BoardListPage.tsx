import { useEffect, useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import UserHeader from '../components/UserHeader'
import Footer from '../components/Footer'
import Pagination from '../components/common/Pagination'
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
  const [keyword, setKeyword] = useState('')
  const [currentPage, setCurrentPage] = useState(0)
  const [totalPages, setTotalPages] = useState(0)
  const [totalElements, setTotalElements] = useState(0)
  const pageSize = 10

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

  const fetchPosts = async (searchKeyword?: string, page: number = 0) => {
    if (!boardType) return

    try {
      setLoading(true)
      setError(null)

      // 1. 게시판 정보 조회 (목록에서 찾기)
      const boards = await getBoards()
      
      const currentBoard = boards.find(b => 
        String(b.id) === String(boardType) || 
        (b.boardId && String(b.boardId) === String(boardType)) ||
        (b.boardKey && String(b.boardKey) === String(boardType))
      )

      if (!currentBoard) {
        setError('게시판을 찾을 수 없습니다.')
        return
      }

      setBoard(currentBoard)

      // 2. 게시글 목록 조회
      let apiBoardId = boardType
      if (currentBoard.boardKey) {
        apiBoardId = currentBoard.boardKey
      } else if (currentBoard.boardId) {
        apiBoardId = String(currentBoard.boardId)
      } else if (currentBoard.id) {
        apiBoardId = String(currentBoard.id)
      }
      
      const { posts: postsData, totalCount, totalPages: pages } = await getBoardPosts(apiBoardId, {
        page: page,
        size: pageSize,
        keyword: searchKeyword
      })
      setPosts(postsData || [])
      setTotalElements(totalCount)
      setTotalPages(pages)

    } catch (err) {
      console.error('게시판 데이터 로드 실패:', err)
      setError('게시판 정보를 불러오는데 실패했습니다.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    setCurrentPage(0)
    fetchPosts(keyword, 0)
  }, [boardType])

  const handlePageChange = (page: number) => {
    setCurrentPage(page)
    fetchPosts(keyword, page)
  }

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    setCurrentPage(0)
    fetchPosts(keyword, 0)
  }

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
      <div className="flex flex-col min-h-screen bg-slate-50 px-4 py-6 text-slate-900 sm:px-6 sm:py-10">
        <div className="flex-grow mx-auto w-full max-w-6xl space-y-6">
          <UserHeader />
          <div className="flex h-64 items-center justify-center rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="text-slate-500">로딩 중...</div>
          </div>
        </div>
        <div className="mx-auto w-full max-w-6xl mt-10">
          <Footer />
        </div>
      </div>
    )
  }

  if (error || !board) {
    return (
      <div className="flex flex-col min-h-screen bg-slate-50 px-4 py-6 text-slate-900 sm:px-6 sm:py-10">
        <div className="flex-grow mx-auto w-full max-w-6xl space-y-6">
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
        </div>
        <div className="mx-auto w-full max-w-6xl mt-10">
          <Footer />
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col min-h-screen bg-slate-50 px-4 py-6 text-slate-900 sm:px-6 sm:py-10">
      <div className="flex-grow mx-auto w-full max-w-6xl space-y-6">
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
        </div>

        {/* 검색창 */}
        <form onSubmit={handleSearch} className="flex gap-2">
          <input
            type="text"
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            placeholder="검색어를 입력하세요"
            className="w-full rounded-lg border border-slate-300 px-4 py-2 text-sm focus:border-blue-500 focus:outline-none"
          />
          <button
            type="submit"
            className="whitespace-nowrap flex-shrink-0 rounded-lg bg-slate-800 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-700"
          >
            검색
          </button>
        </form>

        {/* 게시글 목록 */}
        <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
          {/* 게시글 헤더 - 모바일에서는 숨김 */}
          <div className="hidden md:block border-b border-slate-200 bg-slate-50 px-4 py-3">
            <div className="grid grid-cols-12 gap-4 text-xs font-semibold text-slate-600">
              <div className="col-span-7">제목</div>
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
                  {/* 모바일 뷰 (md 미만) */}
                  <div className="flex flex-col gap-1 md:hidden">
                    <div className="flex items-center gap-2 overflow-hidden min-w-0 flex-1">
                      {post.isNotice && (
                        <span className="flex-shrink-0 rounded-full bg-red-500 px-2 py-0.5 text-[10px] font-semibold text-white">
                          공지
                        </span>
                      )}
                      {post.isPrivate && (
                        <svg className="w-3 h-3 text-slate-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                        </svg>
                      )}
                      <span className="text-sm font-medium text-slate-900 truncate min-w-0">
                        {post.title}
                      </span>
                      {post.comments > 0 && (
                        <span className="flex-shrink-0 text-xs text-blue-600">[{post.comments}]</span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 text-[10px] text-slate-500">
                      <span className="truncate max-w-[80px] font-medium text-slate-700">{post.author}</span>
                      <span>•</span>
                      <span>{formatDate(post.createdAt)}</span>
                      <span>•</span>
                      <span>조회 {post.views}</span>
                    </div>
                  </div>

                  {/* 데스크탑 뷰 (md 이상) */}
                  <div className="hidden md:grid md:grid-cols-12 md:gap-4 md:items-center">
                    <div className="col-span-7">
                      <div className="flex items-center gap-2 overflow-hidden">
                        {post.isNotice && (
                          <span className="flex-shrink-0 rounded-full bg-red-500 px-2 py-0.5 text-[10px] font-semibold text-white">
                            공지
                          </span>
                        )}
                        {post.isPrivate && (
                          <svg className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                          </svg>
                        )}
                        <span className="text-sm font-medium text-slate-900 truncate">{post.title}</span>
                        {post.comments > 0 && (
                          <span className="flex-shrink-0 text-xs text-blue-600">[{post.comments}]</span>
                        )}
                      </div>
                    </div>
                    <div className="col-span-2 text-center text-xs text-slate-600 truncate">{post.author}</div>
                    <div className="col-span-2 text-center text-xs text-slate-500 whitespace-nowrap">
                      {formatDate(post.createdAt)}
                    </div>
                    <div className="col-span-1 text-center text-xs text-slate-500">{post.views}</div>
                  </div>
                </Link>
              ))
            )}
          </div>
        </div>

        {/* 페이지네이션 */}
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={handlePageChange}
          totalElements={totalElements}
          pageSize={pageSize}
        />

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
      </div>

      <div className="mx-auto w-full max-w-6xl mt-10">
        <Footer />
      </div>
    </div>
  )
}

export default BoardListPage
