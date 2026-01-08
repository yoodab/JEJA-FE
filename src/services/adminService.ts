import api from './api'

// 승인 대기 사용자 DTO
export interface PendingUserDto {
  userId: number
  loginId: string
  name: string
  phone: string
  createdAt: string
}

// API 공통 응답 타입
interface ApiResponse<T> {
  status: string
  code: string
  message: string
  data: T
}

// 승인 대기 목록 조회 - GET /api/admin/users/pending
export async function getPendingUsers(): Promise<PendingUserDto[]> {
  const response = await api.get<ApiResponse<PendingUserDto[]>>('/api/admin/users/pending')
  return response.data.data
}

// 사용자 계정 승인 - PATCH /api/admin/users/{userId}/approve
export async function approveUser(userId: number): Promise<void> {
  await api.patch(`/api/admin/users/${userId}/approve`)
}

// 사용자 계정 거절 - PATCH /api/admin/users/{userId}/reject
export async function rejectUser(userId: number): Promise<void> {
  await api.patch(`/api/admin/users/${userId}/reject`)
}

// 승인된 사용자 목록 조회 - GET /api/admin/users/approved
export interface ApprovedUserDto {
  userId: number
  loginId: string
  name: string
  phone: string
  createdAt: string
  approvedAt: string
}

export async function getApprovedUsers(): Promise<ApprovedUserDto[]> {
  const response = await api.get<ApiResponse<ApprovedUserDto[]>>('/api/admin/users/approved')
  return response.data.data
}

// 엑셀로 멤버 일괄 등록 - POST /api/admin/members/upload-excel
// form-data: key=file, value=[파일]
export async function uploadMembersFromExcel(file: File): Promise<number> {
  const formData = new FormData()
  formData.append('file', file)

  const response = await api.post<number>('/api/admin/members/upload-excel', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  })

  return response.data
}












