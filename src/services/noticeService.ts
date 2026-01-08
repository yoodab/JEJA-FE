import api from './api'

// 공지사항 생성 요청 DTO
export interface CreateNoticeRequest {
  title: string
  content: string
  isImportant?: boolean
}

// 공지사항 수정 요청 DTO
export interface UpdateNoticeRequest {
  title?: string
  content?: string
  isImportant?: boolean
}

// 공지사항 응답 타입
export interface Notice {
  id: number
  title: string
  content: string
  date: string
  isImportant: boolean
  createdBy: string
  createdAt: string
}

// API 응답 타입
interface ApiResponse<T> {
  status: string
  code: string
  message: string
  data: T
}

// 공지사항 목록 조회 - GET /api/notices
export async function getNotices(params?: {
  page?: number
  size?: number
  isImportant?: boolean
}): Promise<{ totalCount: number; notices: Notice[] }> {
  const response = await api.get<ApiResponse<{ totalCount: number; notices: Notice[] }>>(
    '/api/notices',
    { params }
  )
  return response.data.data
}

// 공지사항 상세 조회 - GET /api/notices/{noticeId}
export async function getNoticeById(noticeId: number): Promise<Notice> {
  const response = await api.get<ApiResponse<Notice>>(`/api/notices/${noticeId}`)
  return response.data.data
}

// 공지사항 추가 (관리자) - POST /api/admin/notices
// 성공 시 Body: 생성된 noticeId (number)
export async function createNotice(payload: CreateNoticeRequest): Promise<number> {
  const response = await api.post<number>('/api/admin/notices', payload)
  return response.data
}

// 공지사항 수정 (관리자) - PATCH /api/admin/notices/{noticeId}
export async function updateNotice(
  noticeId: number,
  payload: UpdateNoticeRequest
): Promise<void> {
  await api.patch(`/api/admin/notices/${noticeId}`, payload)
}

// 공지사항 삭제 (관리자) - DELETE /api/admin/notices/{noticeId}
export async function deleteNotice(noticeId: number): Promise<void> {
  await api.delete(`/api/admin/notices/${noticeId}`)
}

