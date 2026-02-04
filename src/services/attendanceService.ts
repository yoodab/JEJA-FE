import api from './api'
import type { ApiResponseForm } from '../types/api'
import type { ScheduleType, SharingScope, RecurrenceRule } from '../types/schedule'

export interface ScheduleResponseDto {
  scheduleId: number
  title: string
  startDate: string
  endDate: string
  type: ScheduleType
  location: string
  sharingScope: SharingScope
  recurrenceRule: RecurrenceRule
  worshipCategory: string
  worshipCategoryName: string
}

export interface AttendanceRecordDto {
  memberId: number
  name: string
  phone?: string
  attended: boolean
  attendanceTime: string
}

export type AttendanceMode = 'GENERAL' | 'PARTICIPANT'

export interface AttendanceSheetResponseDto {
  attendanceMode: AttendanceMode
  records: AttendanceRecordDto[]
}

export interface AdminAttendanceRequestDto {
  targetDate: string
  attendedMemberIds: number[]
}

export interface NewcomerCreateRequestDto {
  name: string
  gender: 'MALE' | 'FEMALE' | 'NONE'
  birthDate: string
  phone: string
  address?: string
}

export interface MemberCreateRequestDto {
  name: string
  phone: string
  birthDate: string
  gender: 'MALE' | 'FEMALE' | 'NONE'
  memberStatus:
    | 'NEWCOMER'
    | 'ACTIVE'
    | 'LONG_TERM_ABSENT'
    | 'MOVED'
    | 'GRADUATED'
    | 'INACTIVE'
    | 'SYSTEM'
  memberImageUrl?: string
  roles?: string[]
}

export interface DailyStatDto {
  date: string
  count: number
  offering: number
  scheduleId?: number
  scheduleName?: string
  time?: string
  category?: string | null
}

export interface SummaryDto {
  averageAttendance: number
  maxAttendanceDate: string
  maxAttendanceScheduleName?: string
  totalOffering: number
}

export interface AttendanceStatisticsResponseDto {
  summary: SummaryDto
  scheduleStats: DailyStatDto[]
}

export interface MemberAttendanceStatResponseDto {
  memberId: number
  name: string
  cellName: string
  attendanceRate: number
  attendanceCount: number
  consecutiveAbsenceCount: number
  attendanceHistory: boolean[]
}

export interface GetPeriodStatisticsParams {
  startDate: string
  endDate: string
  cellId?: number
  scheduleTypes?: string // Comma separated 'WORSHIP' | 'EVENT' | 'MEETING'
  worshipCategories?: string // Comma separated codes
}

export interface GetMemberStatsParams {
  year: number
  cellId?: number
}

export interface GuestAttendanceRequest {
  name: string
  date: string
  scheduleId?: number
}

export interface GuestAttendanceData {
  attendanceId: number
  name: string
  date: string
}

export interface GuestAttendanceResult {
  success: boolean
  message: string
  data?: GuestAttendanceData
}

export interface CheckInRequestDto {
  name?: string
  birthDate?: string
  latitude?: number
  longitude?: number
  verificationCode?: string
}

export async function getSchedules(): Promise<ScheduleResponseDto[]> {
  const response = await api.get<ApiResponseForm<ScheduleResponseDto[]>>('/api/schedule/checkable')
  return response.data.data
}

export async function getAttendanceSheet(
  scheduleId: number,
  date: string,
): Promise<AttendanceSheetResponseDto> {
  const response = await api.get<ApiResponseForm<AttendanceSheetResponseDto>>(
    `/api/admin/schedules/${scheduleId}/attendance-sheet`,
    { params: { date } },
  )
  return response.data.data
}

export async function checkInByAdmin(
  scheduleId: number,
  request: AdminAttendanceRequestDto,
): Promise<void> {
  await api.post<ApiResponseForm<void>>(
    `/api/admin/schedules/${scheduleId}/attendance`,
    request,
  )
}

export async function registerNewcomer(
  request: NewcomerCreateRequestDto,
): Promise<number> {
  const response = await api.post<ApiResponseForm<number>>('/api/newcomers', request)
  return response.data.data
}

export async function createMember(request: MemberCreateRequestDto): Promise<number> {
  const response = await api.post<ApiResponseForm<number>>('/api/members', request)
  return response.data.data
}

export async function getPeriodStatistics(
  params: GetPeriodStatisticsParams,
): Promise<AttendanceStatisticsResponseDto> {
  const response = await api.get<ApiResponseForm<AttendanceStatisticsResponseDto>>(
    '/api/admin/attendance/statistics',
    { params },
  )
  const { status, code, result, data, message } = response.data

  if (result === 'SUCCESS' || status === 'success' || code === '200') {
    return data
  }
  throw new Error(message || '통계 조회에 실패했습니다.')
}

export async function getMemberStats(
  params: GetMemberStatsParams,
): Promise<MemberAttendanceStatResponseDto[]> {
  const response = await api.get<ApiResponseForm<MemberAttendanceStatResponseDto[]>>(
    '/api/admin/attendance/member-stats',
    { params },
  )
  return response.data.data
}

export async function checkGuestAttendance(
  attendanceData: GuestAttendanceRequest,
): Promise<GuestAttendanceResult> {
  const response = await api.post<ApiResponseForm<GuestAttendanceData>>(
    '/api/attendance/guest',
    attendanceData,
  )
  const { status, code, message, data } = response.data
  const success =
    status === 'success' ||
    status === 'SUCCESS' ||
    status === 'OK' ||
    code === '200'
  return {
    success,
    message: message || '',
    data,
  }
}

export interface PublicNewcomerCreateRequestDto {
  name: string
  birthDate: string
  gender: 'MALE' | 'FEMALE' | 'NONE'
  phone: string
  address?: string
}

export async function checkIn(
  scheduleId: number,
  request: CheckInRequestDto = {},
): Promise<void> {
  await api.post<ApiResponseForm<void>>(
    `/api/schedule/${scheduleId}/check-in`,
    request,
  )
}

export async function registerPublicNewcomer(
  request: PublicNewcomerCreateRequestDto,
): Promise<number> {
  const response = await api.post<ApiResponseForm<number>>(
    '/api/newcomers/public',
    request,
  )
  return response.data.data
}

export async function applyForSchedule(
  scheduleId: number,
  targetDate: string,
): Promise<void> {
  await api.post<ApiResponseForm<void>>(
    `/api/schedules/${scheduleId}/participation`,
    { targetDate },
  )
}

export async function cancelParticipation(
  scheduleId: number,
  targetDate: string,
): Promise<void> {
  // DELETE request with body is supported in axios but requires 'data' field
  await api.delete<ApiResponseForm<void>>(
    `/api/schedules/${scheduleId}/participation`,
    { data: { targetDate } },
  )
}

