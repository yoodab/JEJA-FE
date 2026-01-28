import api from './api'
import type { ApiResponseForm } from '../types/api'

export interface MyInfoResponse {
  userId: number
  loginId: string
  name: string
  phone: string
  birthDate: string
  role: string
  status: string
  soonName?: string
  soonId?: number
  hasAccount: boolean
}

export interface MyAttendanceStatsResponse {
  thisMonthCount: number
  thisYearCount: number
  recentDates: string[]
}

export const getMyInfo = async (): Promise<MyInfoResponse> => {
  const response = await api.get<ApiResponseForm<MyInfoResponse>>('/api/users/me')
  return response.data.data
}

export const getMyAttendanceStats = async (): Promise<MyAttendanceStatsResponse> => {
  const response = await api.get<ApiResponseForm<MyAttendanceStatsResponse>>('/api/users/me/attendance-stats')
  return response.data.data
}
