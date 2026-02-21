import { useState, useEffect } from 'react'
import { useParams, useNavigate, useLocation } from 'react-router-dom'
import { toast } from 'react-hot-toast'
import UserHeader from '../components/UserHeader'
import Footer from '../components/Footer'
import RichTextEditor from '../components/RichTextEditor'
import { getBoardPostById, updateBoardPost, getBoards } from '../services/boardService'
import { getNoticeById, updateNotice } from '../services/noticeService'
import { useConfirm } from '../contexts/ConfirmContext'

function BoardEditPage() {
  const { boardType, postId, noticeId } = useParams()
  const navigate = useNavigate()
  const location = useLocation()
  const { confirm } = useConfirm()
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [attachmentUrl, setAttachmentUrl] = useState('')
  const [attachmentName, setAttachmentName] = useState('')
  const [apiBoardId, setApiBoardId] = useState<string | null>(null)

  const isYouthNotice = !!noticeId || location.pathname.includes('/youth-notices')
  const id = postId || noticeId

  useEffect(() => {
    const fetchPost = async () => {
      if (!id) {
        console.error('No ID provided')
        toast.error('잘못된 접근입니다.')
        navigate(isYouthNotice ? '/youth-notices' : `/boards/${boardType}`)
        return
      }

      try {
        if (isYouthNotice) {
          // setBoardName('청년부 공지사항')
          const notice = await getNoticeById(Number(id))
          setTitle(notice.title)
          setContent(notice.content)
          setAttachmentUrl(notice.attachmentUrl || '')
          setAttachmentName(notice.attachmentName || '')
        } else if (boardType) {
          // 게시판 정보 조회
          let currentApiBoardId = boardType;
          try {
            const boards = await getBoards()
            // id 또는 boardId가 일치하는지 확인
            const board = boards.find(b => 
              String(b.id) === String(boardType) || 
              (b.boardId && String(b.boardId) === String(boardType)) ||
              (b.boardKey && String(b.boardKey) === String(boardType))
            )
            if (board) {
              // setBoardName(board.name)
              if (board.boardKey) {
                currentApiBoardId = board.boardKey
                setApiBoardId(board.boardKey)
              } else if (board.boardId) {
                currentApiBoardId = String(board.boardId)
                setApiBoardId(String(board.boardId))
              } else if (board.id) {
                currentApiBoardId = String(board.id)
                setApiBoardId(String(board.id))
              }
            }
          } catch (e) {
            console.error('Failed to load board info', e)
          }

          const post = await getBoardPostById(currentApiBoardId, Number(id))
          setTitle(post.title)
          setContent(post.content)
          setAttachmentUrl(post.attachmentUrl || '')
          setAttachmentName(post.attachmentName || '')
        }
      } catch (error) {
        console.error('Failed to fetch post:', error)
        toast.error('게시글을 불러오는데 실패했습니다.')
        navigate(isYouthNotice ? '/youth-notices' : `/boards/${boardType}`)
      }
    }

    fetchPost()
  }, [boardType, id, isYouthNotice, navigate])

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
      if (isYouthNotice && id) {
        await updateNotice(Number(id), {
          title: title.trim(),
          content: content.trim(),
          attachmentUrl,
          attachmentName,
        })
        toast.success('글이 수정되었습니다.')
        navigate(`/youth-notices/${id}`)
      } else if (boardType && id) {
        const targetId = apiBoardId || boardType
        await updateBoardPost(targetId, Number(id), {
          title: title.trim(),
          content: content.trim(),
          attachmentUrl,
          attachmentName,
        })
        toast.success('글이 수정되었습니다.')
        navigate(`/boards/${boardType}/${id}`)
      }
    } catch (error) {
      console.error('Failed to update post:', error)
      toast.error('글 수정에 실패했습니다.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleCancel = async () => {
    const isConfirmed = await confirm({
      title: '수정 취소',
      message: '수정 중인 내용이 사라집니다. 정말 취소하시겠습니까?',
      type: 'warning',
      confirmText: '확인',
      cancelText: '취소',
    })

    if (isConfirmed) {
      if (isYouthNotice) {
        navigate(`/youth-notices/${id}`)
      } else {
        navigate(`/boards/${boardType}/${id}`)
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
            {isYouthNotice ? '청년부 공지사항 수정' : 
             boardType === 'notice' ? '공지사항 수정' : '자유게시판 수정'}
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
            className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
          >
            {isSubmitting ? '수정 중...' : '수정하기'}
          </button>
        </div>

        <Footer />
      </div>
    </div>
  )
}

export default BoardEditPage

