import api from './api'

// 승인 대기 사용자 DTO
export interface PendingUserDto {
  userId: number
  loginId: string
  name: string
  phone: string
  createdAt: string
}

// 승인 대기 목록 조회 - GET /api/admin/users/pending
export async function getPendingUsers(): Promise<PendingUserDto[]> {
  const response = await api.get<PendingUserDto[]>('/api/admin/users/pending')
  return response.data
}

// 사용자 계정 승인 - PATCH /api/admin/users/{userId}/approve
export async function approveUser(userId: number): Promise<void> {
  await api.patch(`/api/admin/users/${userId}/approve`)
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










