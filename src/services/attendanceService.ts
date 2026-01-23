import api from './api'
import axios from 'axios'

interface ApiResponse<T> {
  success: boolean
  message: string
  data: T
}

export interface AttendanceRequest {
  date: string // YYYY-MM-DD 형식
  latitude: number
  longitude: number
}

export interface AttendanceResponse {
  success: boolean
  message: string
  data: {
    attendanceId: number
    date: string
    status: 'PRESENT' | 'ABSENT' | 'LATE'
  }
}

export interface TodayAttendanceStatus {
  hasAttended: boolean
  attendanceTime?: string
  date?: string
}

// 비로그인 사용자용 출석 요청
export interface GuestAttendanceRequest {
  name: string
  date: string // YYYY-MM-DD 형식
}

export interface GuestAttendanceResponse {
  success: boolean
  message: string
  data?: {
    attendanceId: number
    name: string
    date: string
  }
}

// 오늘 출석 여부 확인
export async function getTodayAttendance(): Promise<TodayAttendanceStatus> {
  try {
    const response = await api.get<ApiResponse<TodayAttendanceStatus>>(
      `/api/attendance/today`
    )
    return response.data.data
  } catch (error) {
    // 출석 기록이 없으면 false 반환
    return { hasAttended: false }
  }
}

// 위치 기반 출석 체크
export async function checkAttendance(
  attendanceData: AttendanceRequest
): Promise<AttendanceResponse> {
  const response = await api.post<ApiResponse<AttendanceResponse['data']>>(
    '/api/attendance/check',
    attendanceData
  )
  return {
    success: response.data.success,
    message: response.data.message,
    data: response.data.data,
  }
}

// 비로그인 사용자용 출석 체크 (이름만 입력)
export async function checkGuestAttendance(
  attendanceData: GuestAttendanceRequest
): Promise<GuestAttendanceResponse> {
  // 비로그인 사용자용이므로 인증 토큰 없이 직접 axios 사용
  const API_BASE_URL = 'https://api.jeja.shop'
  const response = await axios.post<GuestAttendanceResponse>(
    `${API_BASE_URL}/api/attendance/guest`,
    attendanceData,
    {
      headers: {
        'Content-Type': 'application/json',
      },
    }
  )
  return response.data
}

