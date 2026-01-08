import api from './api'
import type { BoardType } from '../pages/BoardListPage'

// 게시판 글 생성 요청 DTO
export interface CreateBoardPostRequest {
  title: string
  content: string
  boardType: BoardType
}

// 게시판 글 수정 요청 DTO
export interface UpdateBoardPostRequest {
  title?: string
  content?: string
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
}

// API 응답 타입
interface ApiResponse<T> {
  status: string
  code: string
  message: string
  data: T
}

// 게시판 글 목록 조회 - GET /api/boards/{boardType}
export async function getBoardPosts(
  boardType: BoardType,
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
export async function getBoardPostById(boardType: BoardType, postId: number): Promise<BoardPost> {
  const response = await api.get<ApiResponse<BoardPost>>(`/api/boards/${boardType}/${postId}`)
  return response.data.data
}

// 게시판 글 추가 - POST /api/boards/{boardType}
// 성공 시 Body: 생성된 postId (number)
export async function createBoardPost(
  boardType: BoardType,
  payload: Omit<CreateBoardPostRequest, 'boardType'>
): Promise<number> {
  const response = await api.post<number>(`/api/boards/${boardType}`, payload)
  return response.data
}

// 게시판 글 수정 - PATCH /api/boards/{boardType}/{postId}
export async function updateBoardPost(
  boardType: BoardType,
  postId: number,
  payload: UpdateBoardPostRequest
): Promise<void> {
  await api.patch(`/api/boards/${boardType}/${postId}`, payload)
}

// 게시판 글 삭제 - DELETE /api/boards/{boardType}/{postId}
export async function deleteBoardPost(boardType: BoardType, postId: number): Promise<void> {
  await api.delete(`/api/boards/${boardType}/${postId}`)
}

