import api from './api'

// CareLevel 타입 정의
export type CareLevel = 'NEEDS_ATTENTION' | 'LONG_TERM_ABSENCE' | 'ATTENDED'

// CareMember 타입 정의
export interface CareMember {
  memberId: number
  name: string
  level: CareLevel
  managerName?: string
  absenceStartDate: string
  daysAbsent: number
  phone?: string
  email?: string
}

// 케어 활동 로그 타입
export interface CareLog {
  logId: number
  memberId: number
  createdAt: string
  content: string
  createdBy: string
}

// 멤버 상세 정보 (사이드 패널용)
export interface CareMemberDetail extends CareMember {
  phone?: string
  email?: string
  careLogs: CareLog[]
}

// API 응답 타입
interface ApiResponse<T> {
  status: string
  code: string
  message: string
  data: T
}

// 요약 정보 타입
export interface CareSummary {
  longTermAbsenceCount: number
  needsAttentionCount: number
  attendedCount?: number
}

// 장기결석자 목록 조회 - GET /api/admin/absentees?careLevel={careLevel}
export async function getCareMembers(careLevel: CareLevel): Promise<CareMember[]> {
  try {
    const response = await api.get<ApiResponse<CareMember[]>>('/api/admin/absentees', {
      params: { careLevel },
    })
    return response.data.data
  } catch (error: any) {
    // 개발 중: 백엔드가 없을 때를 대비한 에러 처리
    if (error.response?.status === 404 || error.code === 'ERR_NETWORK') {
      console.warn('API 엔드포인트가 아직 구현되지 않았습니다. 빈 배열을 반환합니다.')
      return []
    }
    throw error
  }
}

// 요약 정보 조회 - GET /api/admin/absentees/summary
export async function getCareSummary(): Promise<CareSummary> {
  try {
    const response = await api.get<ApiResponse<CareSummary>>('/api/admin/absentees/summary')
    return response.data.data
  } catch (error: any) {
    // 개발 중: 백엔드가 없을 때를 대비한 에러 처리
    if (error.response?.status === 404 || error.code === 'ERR_NETWORK') {
      console.warn('요약 정보 API 엔드포인트가 아직 구현되지 않았습니다. 기본값을 반환합니다.')
      return { longTermAbsenceCount: 0, needsAttentionCount: 0 }
    }
    throw error
  }
}

// 멤버 상세 정보 조회 - GET /api/admin/absentees/{memberId}
export async function getCareMemberDetail(memberId: number): Promise<CareMemberDetail> {
  try {
    const response = await api.get<ApiResponse<CareMemberDetail>>(`/api/admin/absentees/${memberId}`)
    return response.data.data
  } catch (error: any) {
    // 개발 중: 백엔드가 없을 때를 대비한 에러 처리
    if (error.response?.status === 404 || error.code === 'ERR_NETWORK') {
      console.warn('멤버 상세 정보 API 엔드포인트가 아직 구현되지 않았습니다.')
      throw new Error('멤버 상세 정보를 불러올 수 없습니다. 백엔드 API가 아직 구현되지 않았습니다.')
    }
    throw error
  }
}

// 담당자 변경 - PATCH /api/admin/absentees/{memberId}/manager
export async function updateManager(memberId: number, managerName: string): Promise<void> {
  try {
    await api.patch(`/api/admin/absentees/${memberId}/manager`, { managerName })
  } catch (error: any) {
    // 개발 중: 백엔드가 없을 때를 대비한 에러 처리
    if (error.response?.status === 404 || error.code === 'ERR_NETWORK') {
      console.warn('담당자 변경 API 엔드포인트가 아직 구현되지 않았습니다.')
      throw new Error('담당자 변경에 실패했습니다. 백엔드 API가 아직 구현되지 않았습니다.')
    }
    throw error
  }
}

// 케어 로그 추가 - POST /api/admin/absentees/{memberId}/logs
export async function addCareLog(memberId: number, content: string): Promise<CareLog> {
  try {
    const response = await api.post<ApiResponse<CareLog>>(`/api/admin/absentees/${memberId}/logs`, { content })
    return response.data.data
  } catch (error: any) {
    // 개발 중: 백엔드가 없을 때를 대비한 에러 처리
    if (error.response?.status === 404 || error.code === 'ERR_NETWORK') {
      console.warn('케어 로그 추가 API 엔드포인트가 아직 구현되지 않았습니다.')
      throw new Error('로그 추가에 실패했습니다. 백엔드 API가 아직 구현되지 않았습니다.')
    }
    throw error
  }
}

// 케어 완료 처리 - PATCH /api/admin/absentees/{memberId}/complete
export async function completeCare(memberId: number): Promise<void> {
  try {
    await api.patch(`/api/admin/absentees/${memberId}/complete`)
  } catch (error: any) {
    // 개발 중: 백엔드가 없을 때를 대비한 에러 처리
    if (error.response?.status === 404 || error.code === 'ERR_NETWORK') {
      console.warn('케어 완료 처리 API 엔드포인트가 아직 구현되지 않았습니다.')
      throw new Error('케어 완료 처리에 실패했습니다. 백엔드 API가 아직 구현되지 않았습니다.')
    }
    throw error
  }
}

// 케어 로그 수정 - PATCH /api/admin/absentees/{memberId}/logs/{logId}
export async function updateCareLog(memberId: number, logId: number, content: string): Promise<CareLog> {
  try {
    const response = await api.patch<ApiResponse<CareLog>>(`/api/admin/absentees/${memberId}/logs/${logId}`, { content })
    return response.data.data
  } catch (error: any) {
    // 개발 중: 백엔드가 없을 때를 대비한 에러 처리
    if (error.response?.status === 404 || error.code === 'ERR_NETWORK') {
      console.warn('케어 로그 수정 API 엔드포인트가 아직 구현되지 않았습니다.')
      throw new Error('로그 수정에 실패했습니다. 백엔드 API가 아직 구현되지 않았습니다.')
    }
    throw error
  }
}

// 케어 로그 삭제 - DELETE /api/admin/absentees/{memberId}/logs/{logId}
export async function deleteCareLog(memberId: number, logId: number): Promise<void> {
  try {
    await api.delete(`/api/admin/absentees/${memberId}/logs/${logId}`)
  } catch (error: any) {
    // 개발 중: 백엔드가 없을 때를 대비한 에러 처리
    if (error.response?.status === 404 || error.code === 'ERR_NETWORK') {
      console.warn('케어 로그 삭제 API 엔드포인트가 아직 구현되지 않았습니다.')
      throw new Error('로그 삭제에 실패했습니다. 백엔드 API가 아직 구현되지 않았습니다.')
    }
    throw error
  }
}

// 출석 확인된 멤버 목록 조회 - GET /api/admin/absentees/attended
export async function getAttendedMembers(): Promise<CareMember[]> {
  try {
    const response = await api.get<ApiResponse<CareMember[]>>('/api/admin/absentees/attended')
    return response.data.data
  } catch (error: any) {
    // 개발 중: 백엔드가 없을 때를 대비한 에러 처리
    if (error.response?.status === 404 || error.code === 'ERR_NETWORK') {
      console.warn('출석 확인 목록 API 엔드포인트가 아직 구현되지 않았습니다. 빈 배열을 반환합니다.')
      return []
    }
    throw error
  }
}

