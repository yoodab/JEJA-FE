import { useState } from 'react'
import { useParams, useNavigate, useLocation } from 'react-router-dom'
import UserHeader from '../components/UserHeader'
import Footer from '../components/Footer'
import RichTextEditor from '../components/RichTextEditor'
import type { BoardType } from './BoardListPage'
import { createNotice } from '../services/noticeService'
import { createBoardPost } from '../services/boardService'

function BoardWritePage() {
  const { boardType } = useParams<{ boardType?: BoardType }>()
  const navigate = useNavigate()
  const location = useLocation()
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const isYouthNotice = location.pathname.includes('/youth-notices')

  const handleSubmit = async () => {
    // HTML 태그를 제거한 순수 텍스트로 검증
    const textContent = content.replace(/<[^>]*>/g, '').trim()
    if (!title.trim() || !textContent) {
      alert('제목과 내용을 모두 입력해주세요.')
      return
    }

    setIsSubmitting(true)

    try {
      if (isYouthNotice) {
        // 공지사항 작성
        const noticeId = await createNotice({
          title: title.trim(),
          content: content.trim(),
          isImportant: false,
        })
        alert('글이 작성되었습니다.')
        navigate(`/youth-notices/${noticeId}`)
      } else if (boardType) {
        // 게시판 작성
        const postId = await createBoardPost(boardType, {
          title: title.trim(),
          content: content.trim(),
        })
        alert('글이 작성되었습니다.')
        navigate(`/boards/${boardType}/${postId}`)
      } else {
        alert('게시판 정보를 찾을 수 없습니다.')
        setIsSubmitting(false)
      }
    } catch (error: any) {
      console.error('글 작성 실패:', error)
      const errorMessage =
        error?.response?.data?.message || error?.message || '글 작성 중 오류가 발생했습니다.'
      alert(errorMessage)
      setIsSubmitting(false)
    }
  }

  const handleCancel = () => {
    if (confirm('작성 중인 내용이 사라집니다. 정말 취소하시겠습니까?')) {
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
          <h1 className="text-2xl font-bold text-slate-900">글쓰기</h1>
          <button
            onClick={() => {
              if (isYouthNotice) {
                navigate('/youth-notices')
              } else {
                navigate(`/boards/${boardType}`)
              }
            }}
            className="rounded-lg px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-100"
          >
            ← 목록으로
          </button>
        </div>

        {/* 글쓰기 폼 */}
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
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

