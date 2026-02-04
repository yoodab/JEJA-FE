import api from './api'

// 공지사항 생성 요청 DTO
export interface CreateNoticeRequest {
  title: string
  content: string
  notice?: boolean
  isPrivate?: boolean
  attachmentName?: string
  attachmentUrl?: string
}

// 공지사항 수정 요청 DTO
export interface UpdateNoticeRequest {
  title?: string
  content?: string
  notice?: boolean
  isPrivate?: boolean
  attachmentName?: string
  attachmentUrl?: string
}

// 공지사항 목록 아이템 (Simple)
export interface NoticeSimple {
  postId: number
  title: string
  authorName: string
  createdAt: string
  viewCount: number
  likeCount: number
  commentCount: number
  isPrivate: boolean
  notice: boolean
  liked: boolean
}

export interface CommentResponse {
  commentId: number
  content: string
  authorName: string
  createdAt: string
  likeCount: number
  deleted: boolean
  children: CommentResponse[]
  liked: boolean
  canEdit?: boolean
  canDelete?: boolean
}

export interface NoticeDetail extends NoticeSimple {
  content: string
  attachmentName?: string
  attachmentUrl?: string
  comments: CommentResponse[]
}

// API 응답 타입
interface ApiResponse<T> {
  status: string
  code: string
  message: string
  data: T
}

// 공지사항 목록 조회 - GET /api/boards/notice/posts
export async function getNotices(params?: {
  page?: number
  size?: number
  keyword?: string
}): Promise<{ totalCount: number; notices: NoticeSimple[] }> {
  const response = await api.get<ApiResponse<{ totalCount: number; content: NoticeSimple[] }>>(
    '/api/boards/notice/posts',
    {
      params: {
        page: params?.page || 0,
        size: params?.size || 20,
        keyword: params?.keyword,
      },
    }
  )
  return {
    totalCount: response.data.data.totalCount,
    notices: response.data.data.content,
  }
}

// 댓글 작성
export async function createComment(postId: number, content: string, parentId?: number): Promise<void> {
  await api.post(`/api/posts/${postId}/comments`, { content, parentId })
}

// 댓글 수정
export async function updateComment(commentId: number, content: string): Promise<void> {
  await api.patch(`/api/comments/${commentId}`, { content })
}

// 댓글 삭제
export async function deleteComment(commentId: number): Promise<void> {
  await api.delete(`/api/comments/${commentId}`)
}

// 게시글 좋아요 토글
export async function togglePostLike(postId: number): Promise<void> {
  await api.post(`/api/posts/${postId}/likes`)
}

// 댓글 좋아요 토글
export async function toggleCommentLike(commentId: number): Promise<void> {
  await api.post(`/api/comments/${commentId}/likes`)
}

// 공지사항 상세 조회 - GET /api/posts/{postId}
export async function getNoticeById(postId: number): Promise<NoticeDetail> {
  const response = await api.get<ApiResponse<NoticeDetail>>(`/api/posts/${postId}`)
  return response.data.data
}

// 공지사항 추가 (관리자) - POST /api/boards/notice/posts
export async function createNotice(payload: CreateNoticeRequest): Promise<number> {
  const response = await api.post<ApiResponse<number>>('/api/boards/notice/posts', payload)
  return response.data.data
}

// 공지사항 수정 (관리자) - PATCH /api/posts/{postId}
export async function updateNotice(
  postId: number,
  payload: UpdateNoticeRequest
): Promise<void> {
  await api.patch(`/api/posts/${postId}`, payload)
}

// 공지사항 삭제 (관리자) - DELETE /api/posts/{postId}
export async function deleteNotice(postId: number): Promise<void> {
  await api.delete(`/api/posts/${postId}`)
}

// 공지사항 고정 토글 (관리자) - PATCH /api/posts/{postId}/notice
export async function togglePostNotice(postId: number): Promise<void> {
  await api.patch(`/api/posts/${postId}/notice`)
}
