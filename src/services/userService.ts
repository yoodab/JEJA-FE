import api from './api'
import type { ApiResponseForm } from '../types/api'

export interface MyInfoResponse {
  userId: number
  loginId: string
  name: string
  phone: string
  userPhone: string
  email: string
  profileImageUrl: string
  memberImageUrl: string
  birthDate: string
  role: string
  status: string
  soonId: number
  soonName: string
  hasAccount: boolean
  memberRoles: string[]
}

export interface MyAttendanceStatsResponse {
  thisMonthCount: number
  thisYearCount: number
  recentDates: string[]
}

export interface MyAttendanceRecord {
  date: string
  scheduleName: string
  categoryName: string
}

export interface MyAttendanceHistoryResponse {
  stats: Record<string, number>
  records: MyAttendanceRecord[]
}

export const getMyInfo = async (): Promise<MyInfoResponse> => {
  const response = await api.get<ApiResponseForm<MyInfoResponse>>('/api/users/me')
  return response.data.data
}

export const getMyAttendanceStats = async (): Promise<MyAttendanceStatsResponse> => {
  const response = await api.get<ApiResponseForm<MyAttendanceStatsResponse>>('/api/users/me/attendance-stats')
  return response.data.data
}

export const getMyAttendanceHistory = async (startDate: string, endDate: string): Promise<MyAttendanceHistoryResponse> => {
  const response = await api.get<ApiResponseForm<MyAttendanceHistoryResponse>>('/api/users/me/attendance-history', {
    params: { startDate, endDate }
  })
  return response.data.data
}

export interface UpdateMyInfoRequest {
  phone?: string
  email?: string
  profileImageUrl?: string
  currentPassword?: string
  newPassword?: string
}

export const updateMyInfo = async (data: UpdateMyInfoRequest): Promise<void> => {
  await api.patch('/api/users/me', data)
}

export const withdraw = async (password: string): Promise<void> => {
  await api.delete('/api/users/me', { data: { password } })
}

export const uploadFile = async (file: File, folder: string = 'common'): Promise<string> => {
  const formData = new FormData()
  formData.append('files', file)

  const response = await api.post<ApiResponseForm<{ url: string }[]>>('/api/files/upload', formData, {
    params: { folder },
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  })
  return response.data.data[0].url
}
