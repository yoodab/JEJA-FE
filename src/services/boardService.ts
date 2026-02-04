import api from './api'

// 게시판 글 생성 요청 DTO
export interface CreateBoardPostRequest {
  title: string
  content: string
  boardType: string
  attachmentUrl?: string
  attachmentName?: string
}

// 게시판 글 수정 요청 DTO
export interface UpdateBoardPostRequest {
  title?: string
  content?: string
  attachmentUrl?: string
  attachmentName?: string
}

// 게시판 글 응답 타입
export interface BoardPost {
  id: number
  title: string
  content: string
  author: string
  createdAt: string
  views: number
  comments: number
  isNotice?: boolean
  attachmentUrl?: string
  attachmentName?: string
  canEdit?: boolean
  canDelete?: boolean
}

// 게시판 정보 타입
export interface Board {
  id: string
  name: string
  description?: string
  boardId?: string // API 호환성을 위해 추가
  accessType?: 'PUBLIC' | 'MEMBER' | 'CLUB' | 'ADMIN'
  writeAccessType?: 'PUBLIC' | 'MEMBER' | 'CLUB' | 'ADMIN'
  canWrite?: boolean
}

// API 응답 타입
interface ApiResponse<T> {
  status: string
  code: string
  message: string
  data: T
}

// 게시판 목록 조회 - GET /api/boards/general
export async function getBoards(): Promise<Board[]> {
  const response = await api.get<ApiResponse<Board[]>>('/api/boards/general')
  return response.data.data
}

// 게시판 글 목록 조회 - GET /api/boards/{boardType}
export async function getBoardPosts(
  boardType: string,
  params?: {
    page?: number
    size?: number
  }
): Promise<{ totalCount: number; posts: BoardPost[] }> {
  const response = await api.get<ApiResponse<{ totalCount: number; posts: BoardPost[] }>>(
    `/api/boards/${boardType}`,
    { params }
  )
  return response.data.data
}

// 게시판 글 상세 조회 - GET /api/boards/{boardType}/{postId}
export async function getBoardPostById(boardType: string, postId: number): Promise<BoardPost> {
  const response = await api.get<ApiResponse<BoardPost>>(`/api/boards/${boardType}/${postId}`)
  return response.data.data
}

// 게시판 글 추가 - POST /api/boards/{boardType}
// 성공 시 Body: 생성된 postId (number)
export async function createBoardPost(
  boardType: string,
  payload: Omit<CreateBoardPostRequest, 'boardType'>
): Promise<number> {
  const response = await api.post<number>(`/api/boards/${boardType}`, payload)
  return response.data
}

// 게시판 글 수정 - PATCH /api/boards/{boardType}/{postId}
export async function updateBoardPost(
  boardType: string,
  postId: number,
  payload: UpdateBoardPostRequest
): Promise<void> {
  await api.patch(`/api/boards/${boardType}/${postId}`, payload)
}

// 게시판 글 삭제 - DELETE /api/boards/{boardType}/{postId}
export async function deleteBoardPost(boardType: string, postId: number): Promise<void> {
  await api.delete(`/api/boards/${boardType}/${postId}`)
}

