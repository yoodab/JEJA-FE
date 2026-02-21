import { useState, useEffect } from 'react'
import { useParams, useNavigate, useLocation } from 'react-router-dom'
import { toast } from 'react-hot-toast'
import UserHeader from '../components/UserHeader'
import Footer from '../components/Footer'
import RichTextEditor from '../components/RichTextEditor'
import { createNotice } from '../services/noticeService'
import { createBoardPost, getBoards } from '../services/boardService'
import { useConfirm } from '../contexts/ConfirmContext'

function BoardWritePage() {
  const { boardType } = useParams()
  const navigate = useNavigate()
  const location = useLocation()
  const { confirm } = useConfirm()
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isPrivate, setIsPrivate] = useState(false)
  const [apiBoardId, setApiBoardId] = useState<string | null>(null)

  const isYouthNotice = location.pathname.includes('/youth-notices')

  useEffect(() => {
    const fetchBoardInfo = async () => {
      if (isYouthNotice) {
        // setBoardName('청년부 공지사항')
        return
      }
      
      if (boardType) {
        try {
          const boards = await getBoards()
          // id, boardId 또는 boardKey가 일치하는지 확인
          const board = boards.find(b => 
            String(b.id) === String(boardType) || 
            (b.boardId && String(b.boardId) === String(boardType)) ||
            (b.boardKey && String(b.boardKey) === String(boardType))
          )
          if (board) {
            // setBoardName(board.name)
            // API 호출 시 사용할 식별자로 boardKey를 우선 사용
            if (board.boardKey) {
              setApiBoardId(board.boardKey)
            } else if (board.boardId) {
              setApiBoardId(String(board.boardId))
            } else if (board.id) {
              setApiBoardId(String(board.id))
            }
          }
        } catch (error) {
          console.error('게시판 정보 로드 실패:', error)
        }
      }
    }
    fetchBoardInfo()
  }, [boardType, isYouthNotice])

  const handleSubmit = async () => {
    // HTML 태그를 제거한 순수 텍스트로 검증
    const textContent = content.replace(/<[^>]*>/g, '').trim()
    const hasImage = content.includes('<img')
    
    if (!title.trim() || (!textContent && !hasImage)) {
      toast.error('제목과 내용을 입력해주세요.')
      return
    }

    setIsSubmitting(true)

    try {
      if (isYouthNotice) {
        // 공지사항 작성
        const noticeId = await createNotice({
          title: title.trim(),
          content: content.trim(),
          notice: false,
        })
        toast.success('글이 작성되었습니다.')
        navigate(`/youth-notices/${noticeId}`)
      } else if (boardType) {
        // 게시판 작성
        const targetId = apiBoardId || boardType
        const postId = await createBoardPost(targetId, {
          title: title.trim(),
          content: content.trim(),
          isPrivate: isPrivate,
        })
        toast.success('글이 작성되었습니다.')
        navigate(`/boards/${boardType}/${postId}`)
      } else {
        toast.error('게시판 정보를 찾을 수 없습니다.')
        setIsSubmitting(false)
      }
    } catch (error: unknown) {
      console.error('글 작성 실패:', error)
      const err = error as { response?: { data?: { message?: string } }, message?: string }
      const errorMessage =
        err?.response?.data?.message || err?.message || '글 작성 중 오류가 발생했습니다.'
      toast.error(errorMessage)
      setIsSubmitting(false)
    }
  }

  const handleCancel = async () => {
    const isConfirmed = await confirm({
      title: '작성 취소',
      message: '작성 중인 내용이 사라집니다. 정말 취소하시겠습니까?',
      type: 'warning',
      confirmText: '확인',
      cancelText: '취소',
    })

    if (isConfirmed) {
      if (isYouthNotice) {
        navigate('/youth-notices')
      } else {
        navigate(`/boards/${boardType}`)
      }
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 px-4 py-6 text-slate-900 sm:px-6 sm:py-10">
      <div className="mx-auto max-w-6xl space-y-6">
        <UserHeader />

        {/* 헤더 */}
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-slate-900">
            {isYouthNotice ? '청년부 공지사항 작성' : 
             boardType === 'notice' ? '공지사항 작성' : '자유게시판 작성'}
          </h1>
        </div>

        {/* 글쓰기 폼 */}
        <div className="rounded-2xl bg-white p-6">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                제목
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="제목을 입력하세요"
                className="w-full rounded-lg border border-slate-300 px-4 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
              />
            </div>

            {!isYouthNotice && (
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="isPrivate"
                  checked={isPrivate}
                  onChange={(e) => setIsPrivate(e.target.checked)}
                  className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                />
                <label htmlFor="isPrivate" className="text-sm font-medium text-slate-700 cursor-pointer">
                  비밀글로 작성하기 (작성자와 목사님만 볼 수 있습니다)
                </label>
              </div>
            )}

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                내용
              </label>
              <RichTextEditor
                value={content}
                onChange={setContent}
                placeholder="내용을 입력하세요"
                height="800px"
              />
            </div>
          </div>
        </div>

        {/* 버튼 */}
        <div className="flex justify-end gap-2">
          <button
            onClick={handleCancel}
            className="rounded-lg px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-100"
          >
            취소
          </button>
          <button
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? '작성 중...' : '작성하기'}
          </button>
        </div>

        <Footer />
      </div>
    </div>
  )
}

export default BoardWritePage

