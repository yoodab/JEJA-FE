import api, { getImageUrl } from './api'
import { type CommentResponse } from './noticeService'

// 게시판 글 생성 요청 DTO
export interface CreateBoardPostRequest {
  title: string
  content: string
  boardType: string
  isPrivate?: boolean
  isNotice?: boolean
  attachmentUrl?: string
  attachmentName?: string
}

// 게시판 글 수정 요청 DTO
export interface UpdateBoardPostRequest {
  title?: string
  content?: string
  isPrivate?: boolean
  isNotice?: boolean
  attachmentUrl?: string
  attachmentName?: string
}

// 게시판 글 응답 타입
export interface BoardPost {
  id: number
  postId?: number // 백엔드에서 postId로 보내는 경우 대응
  title: string
  content: string
  author: string
  authorName?: string // 백엔드에서 authorName으로 보내는 경우 대응
  authorProfileImage?: string
  isLiked?: boolean
  likeCount?: number
  createdAt: string
  views: number
  viewCount?: number // 백엔드에서 viewCount로 보내는 경우 대응
  comments: number
  commentCount?: number // 백엔드에서 commentCount로 보내는 경우 대응
  commentList?: CommentResponse[] // 상세 조회 시 댓글 목록
  isNotice?: boolean
  attachmentUrl?: string
  attachmentName?: string
  canEdit?: boolean
  canDelete?: boolean
  isPrivate?: boolean
}

// 게시판 정보 타입
export interface Board {
  id: string
  name: string
  boardKey: string
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

// 게시판 글 목록 조회 - GET /api/boards/{boardType}/posts
export async function getBoardPosts(
  boardType: string,
  params?: {
    page?: number
    size?: number
    keyword?: string
  }
): Promise<{ totalCount: number; posts: BoardPost[]; totalPages: number }> {
  const response = await api.get<ApiResponse<{ totalElements: number; totalPages: number; content: BoardPost[] }>>(
    `/api/boards/${boardType}/posts`,
    { 
      params: {
        page: params?.page || 0,
        size: params?.size || 10,
        keyword: params?.keyword
      }
    }
  )
  
  // 백엔드 필드명(postId, authorName 등)을 프론트엔드 필드명(id, author 등)으로 변환
  const posts = response.data.data.content.map(post => ({
    ...post,
    id: post.postId || post.id,
    author: post.authorName || post.author,
    authorProfileImage: getImageUrl(post.authorProfileImage),
    isLiked: post.isLiked !== undefined ? post.isLiked : post.liked,
    likeCount: post.likeCount,
    views: post.viewCount !== undefined ? post.viewCount : post.views,
    comments: post.commentCount !== undefined ? post.commentCount : (typeof post.comments === 'number' ? post.comments : 0)
  }))

  return {
    totalCount: response.data.data.totalElements,
    totalPages: response.data.data.totalPages,
    posts
  }
}

// 게시판 글 상세 조회 - GET /api/posts/{postId}
export async function getBoardPostById(boardType: string, postId: number, incrementView: boolean = true): Promise<BoardPost> {
  const response = await api.get<ApiResponse<BoardPost>>(`/api/posts/${postId}`, {
    params: { incrementView }
  })
  const post = response.data.data
  
  return {
    ...post,
    id: post.postId || post.id,
    author: post.authorName || post.author,
    authorProfileImage: getImageUrl(post.authorProfileImage),
    isLiked: post.isLiked !== undefined ? post.isLiked : post.liked,
    likeCount: post.likeCount,
    views: post.viewCount !== undefined ? post.viewCount : post.views,
    comments: post.commentCount !== undefined ? post.commentCount : (typeof post.comments === 'number' ? post.comments : 0),
    commentList: Array.isArray(post.comments) 
      ? post.comments.map((comment: any) => ({
          ...comment,
          authorProfileImage: getImageUrl(comment.authorProfileImage),
          children: Array.isArray(comment.children)
            ? comment.children.map((child: any) => ({
                ...child,
                authorProfileImage: getImageUrl(child.authorProfileImage)
              }))
            : []
        }))
      : []
  }
}

// 게시판 글 추가 - POST /api/boards/{boardType}/posts
// 성공 시 Body: 생성된 postId (number)
export async function createBoardPost(
  boardType: string,
  payload: Omit<CreateBoardPostRequest, 'boardType'>
): Promise<number> {
  const response = await api.post<ApiResponse<number>>(`/api/boards/${boardType}/posts`, payload)
  return response.data.data
}

// 게시판 글 수정 - PATCH /api/posts/{postId}
export async function updateBoardPost(
  boardType: string,
  postId: number,
  payload: UpdateBoardPostRequest
): Promise<void> {
  await api.patch(`/api/posts/${postId}`, payload)
}

// 게시판 글 삭제 - DELETE /api/posts/{postId}
export async function deleteBoardPost(boardType: string, postId: number): Promise<void> {
  await api.delete(`/api/posts/${postId}`)
}

