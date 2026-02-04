import api from './api'
import type { ApiResponse } from '../types/api'

// 승인 대기 사용자 DTO
export interface PendingUserDto {
  userId: number
  loginId: string
  name: string
  phone: string
  createdAt: string
}

export interface ApprovedUserDto {
  userId: number
  loginId: string
  name: string
  phone: string
  createdAt: string
}

export type UserStatus = 'PENDING' | 'ACTIVE' | 'INACTIVE'

export interface UserDto {
  userId: number
  loginId: string
  name: string
  phone: string
  createdAt: string
  status: UserStatus
}

// 사용자 목록 조회 - GET /api/users?status={status}
export async function getUsers(status?: UserStatus): Promise<UserDto[]> {
  const url = status ? `/api/users?status=${status}` : '/api/users'
  const response = await api.get<ApiResponse<UserDto[]>>(url)
  return response.data.data
}

// 사용자 상태 변경 - PATCH /api/users/{userId}/status
export async function updateUserStatus(userId: number, status: UserStatus): Promise<void> {
  await api.patch(`/api/users/${userId}/status`, { status })
}

// 승인 대기 목록 조회 (Deprecated: use getUsers('PENDING'))
export async function getPendingUsers(): Promise<PendingUserDto[]> {
  const users = await getUsers('PENDING')
  return users
}

// 승인된 사용자 목록 조회 (Deprecated: use getUsers('ACTIVE'))
export async function getApprovedUsers(): Promise<ApprovedUserDto[]> {
  const users = await getUsers('ACTIVE')
  return users
}

// 사용자 계정 승인 (Deprecated: use updateUserStatus)
export async function approveUser(userId: number): Promise<void> {
  await updateUserStatus(userId, 'ACTIVE')
}

// 사용자 계정 거절 (Deprecated: use updateUserStatus)
export async function rejectUser(userId: number): Promise<void> {
  await updateUserStatus(userId, 'INACTIVE')
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












