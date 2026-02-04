import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import UserHeader from '../components/UserHeader'
import Footer from '../components/Footer'
import { getNotices, deleteNotice, togglePostNotice, type NoticeSimple } from '../services/noticeService'

function YouthNoticePage() {
  const navigate = useNavigate()
  const [notices, setNotices] = useState<NoticeSimple[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [keyword, setKeyword] = useState('')
  const [openMenuId, setOpenMenuId] = useState<number | null>(null)

  useEffect(() => {
    fetchNotices()
  }, [])

  const fetchNotices = async (searchKeyword?: string) => {
    try {
      setIsLoading(true)
      const data = await getNotices({ page: 0, size: 20, keyword: searchKeyword })
      setNotices(data.notices)
    } catch (err) {
      console.error('Failed to fetch notices:', err)
      setError('공지사항을 불러오는데 실패했습니다.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    fetchNotices(keyword)
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

  const handlePin = async (e: React.MouseEvent, postId: number) => {
    e.preventDefault()
    e.stopPropagation()
    try {
      await togglePostNotice(postId)
      await fetchNotices(keyword)
      setOpenMenuId(null)
    } catch (err) {
      console.error('Failed to toggle notice pin:', err)
      alert('공지 설정 변경에 실패했습니다.')
    }
  }

  const handleDelete = async (e: React.MouseEvent, postId: number) => {
    e.preventDefault()
    e.stopPropagation()
    if (!window.confirm('정말 삭제하시겠습니까?')) return
    
    try {
      await deleteNotice(postId)
      await fetchNotices(keyword)
      setOpenMenuId(null)
    } catch (err) {
      console.error('Failed to delete notice:', err)
      alert('공지 삭제에 실패했습니다.')
    }
  }

  const handleEdit = (e: React.MouseEvent, postId: number) => {
    e.preventDefault()
    e.stopPropagation()
    navigate(`/youth-notices/${postId}/edit`)
  }

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent"></div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <div className="text-center">
          <p className="text-lg font-semibold text-slate-600">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="mt-4 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
          >
            다시 시도
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-50 px-4 py-6 text-slate-900 sm:px-6 sm:py-10" onClick={() => setOpenMenuId(null)}>
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
          
          {/* 검색 바 */}
          <form onSubmit={handleSearch} className="mt-4 flex gap-2">
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
        </div>

        {/* 게시글 목록 */}
        <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
          {/* 게시글 헤더 - 모바일에서는 숨김 */}
          <div className="hidden md:block border-b border-slate-200 bg-slate-50 px-4 py-3">
            <div className="grid grid-cols-12 gap-4 text-xs font-semibold text-slate-600">
              <div className="col-span-1 text-center">번호</div>
              <div className="col-span-5">제목</div>
              <div className="col-span-2 text-center">작성자</div>
              <div className="col-span-2 text-center">작성일</div>
              <div className="col-span-1 text-center">조회</div>
              <div className="col-span-1 text-center"></div>
            </div>
          </div>

          {/* 게시글 목록 */}
          <div className="divide-y divide-slate-200">
            {notices.length === 0 ? (
              <div className="px-4 py-12 text-center text-sm text-slate-500">
                게시글이 없습니다.
              </div>
            ) : (
              notices.map((notice) => (
                <Link
                  key={notice.postId}
                  to={`/youth-notices/${notice.postId}`}
                  className={`block px-4 py-3 transition ${
                    notice.notice ? 'bg-slate-50 hover:bg-slate-100' : 'hover:bg-slate-50'
                  }`}
                >
                  {/* 모바일 뷰 (md 미만) */}
                  <div className="flex flex-col gap-2 md:hidden">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2 overflow-hidden">
                        {notice.notice && (
                          <span className="flex-shrink-0 rounded-full bg-red-500 px-2 py-0.5 text-[10px] font-semibold text-white">
                            공지
                          </span>
                        )}
                        <span className="text-sm font-medium text-slate-900 truncate">
                          {notice.title}
                        </span>
                        {notice.commentCount > 0 && (
                          <span className="flex-shrink-0 text-xs text-blue-600">[{notice.commentCount}]</span>
                        )}
                        {notice.isPrivate && (
                           <span className="flex-shrink-0 text-xs text-slate-400">🔒</span>
                        )}
                      </div>
                      
                      {/* 모바일 메뉴 버튼 */}
                      <button
                        onClick={(e) => {
                          e.preventDefault()
                          e.stopPropagation()
                          setOpenMenuId(openMenuId === notice.postId ? null : notice.postId)
                        }}
                        className="flex-shrink-0 p-1 -mr-2 text-slate-400"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <circle cx="12" cy="12" r="1" />
                          <circle cx="12" cy="5" r="1" />
                          <circle cx="12" cy="19" r="1" />
                        </svg>
                      </button>
                    </div>
                    
                    <div className="flex items-center gap-2 text-xs text-slate-500">
                      <span>{notice.authorName}</span>
                      <span>•</span>
                      <span>{formatDate(notice.createdAt)}</span>
                      <span>•</span>
                      <span>조회 {notice.viewCount}</span>
                    </div>

                    {/* 모바일 메뉴 드롭다운 (위치 조정 필요할 수 있음) */}
                    {openMenuId === notice.postId && (
                        <div className="relative">
                          <div className="absolute right-0 top-0 w-28 bg-white rounded-lg shadow-xl border border-slate-200 z-50 overflow-hidden">
                            <button
                              onClick={(e) => handleEdit(e, notice.postId)}
                              className="w-full text-left px-4 py-2 text-xs text-slate-700 hover:bg-slate-50 transition"
                            >
                              수정
                            </button>
                            <button
                              onClick={(e) => handlePin(e, notice.postId)}
                              className="w-full text-left px-4 py-2 text-xs text-slate-700 hover:bg-slate-50 transition"
                            >
                              {notice.notice ? '고정 해제' : '상단 고정'}
                            </button>
                            <button
                              onClick={(e) => handleDelete(e, notice.postId)}
                              className="w-full text-left px-4 py-2 text-xs text-red-600 hover:bg-red-50 transition"
                            >
                              삭제
                            </button>
                          </div>
                        </div>
                      )}
                  </div>

                  {/* 데스크탑 뷰 (md 이상) */}
                  <div className="hidden md:grid md:grid-cols-12 md:gap-4 md:items-center">
                    <div className="col-span-1 text-center text-xs text-slate-500">
                      {notice.notice ? (
                        <span className="rounded-full bg-red-500 px-2 py-0.5 text-[10px] font-semibold text-white">
                          공지
                        </span>
                      ) : (
                        notice.postId
                      )}
                    </div>
                    <div className="col-span-5">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-slate-900 truncate">{notice.title}</span>
                        {notice.commentCount > 0 && (
                          <span className="text-xs text-blue-600">[{notice.commentCount}]</span>
                        )}
                        {notice.isPrivate && (
                           <span className="text-xs text-slate-400">🔒</span>
                        )}
                      </div>
                    </div>
                    <div className="col-span-2 text-center text-xs text-slate-600 truncate">{notice.authorName}</div>
                    <div className="col-span-2 text-center text-xs text-slate-500">
                      {formatDate(notice.createdAt)}
                    </div>
                    <div className="col-span-1 text-center text-xs text-slate-500">{notice.viewCount}</div>
                    
                    {/* 더보기 메뉴 */}
                    <div className="col-span-1 text-center relative flex justify-center">
                      <button
                        onClick={(e) => {
                          e.preventDefault()
                          e.stopPropagation()
                          setOpenMenuId(openMenuId === notice.postId ? null : notice.postId)
                        }}
                        className="p-1 rounded hover:bg-slate-200 transition text-slate-400 hover:text-slate-600"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <circle cx="12" cy="12" r="1" />
                          <circle cx="12" cy="5" r="1" />
                          <circle cx="12" cy="19" r="1" />
                        </svg>
                      </button>
                      
                      {openMenuId === notice.postId && (
                        <div className="absolute right-0 top-8 w-28 bg-white rounded-lg shadow-xl border border-slate-200 z-50 overflow-hidden">
                          <button
                            onClick={(e) => handleEdit(e, notice.postId)}
                            className="w-full text-left px-4 py-2 text-xs text-slate-700 hover:bg-slate-50 transition"
                          >
                            수정
                          </button>
                          <button
                            onClick={(e) => handlePin(e, notice.postId)}
                            className="w-full text-left px-4 py-2 text-xs text-slate-700 hover:bg-slate-50 transition"
                          >
                            {notice.notice ? '고정 해제' : '상단 고정'}
                          </button>
                          <button
                            onClick={(e) => handleDelete(e, notice.postId)}
                            className="w-full text-left px-4 py-2 text-xs text-red-600 hover:bg-red-50 transition"
                          >
                            삭제
                          </button>
                        </div>
                      )}
                    </div>
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
