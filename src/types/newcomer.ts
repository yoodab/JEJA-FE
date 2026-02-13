export type NewcomerStatus = 'MAIN_WORSHIP' | 'YOUTH_WORSHIP' | 'HOLD' | 'SETTLED' | 'STOPPED'

// 백엔드 Enum -> 프론트엔드 한글 매핑
export const NewcomerStatusMap: Record<NewcomerStatus, string> = {
  MAIN_WORSHIP: '관리중',
  YOUTH_WORSHIP: '관리중',
  HOLD: '보류',
  SETTLED: '정착완료',
  STOPPED: '중단',
}

// 프론트엔드 탭용 매핑 (관리중 통합)
export const NewcomerTabMap: Record<string, string> = {
  '전체': '전체',
  '관리중': '관리중',
  '보류': '보류',
  '정착완료': '정착완료',
  '중단': '중단',
}

export interface Newcomer {
  newcomerId: number
  name: string
  gender: 'MALE' | 'FEMALE'
  birthDate: string
  phone: string
  address: string
  managerName: string | null
  assignmentNote: string
  status: NewcomerStatus
  statusDescription?: string // 목록 조회 시 옴
  firstStatus: string
  middleStatus: string
  recentStatus: string
  registrationDate: string // 목록 조회 시 옴 (writeDate equivalent)
  profileImageUrl: string | null
  isMemberRegistered: boolean // 청년부 등록 여부
  isChurchRegistered: boolean // 교회 등록 여부
  assignedSoon?: string // 등반예정순
  cellName?: string // 등반예정순 (API 응답)
}

export interface CreateNewcomerRequest {
  name: string
  gender: 'MALE' | 'FEMALE'
  birthDate: string
  phone: string
  address: string
  managerMemberId?: number
  isChurchRegistered?: boolean
  profileImageUrl?: string
  // 엑셀 일괄 등록용 추가 필드
  mdName?: string
  registrationDate?: string
  firstStatus?: string
  middleStatus?: string
  recentStatus?: string
  assignmentNote?: string
  isMemberRegistered?: boolean
}

export interface UpdateNewcomerRequest {
  phone?: string
  address?: string
  assignmentNote?: string
  birthDate?: string
  firstStatus?: string
  middleStatus?: string
  recentStatus?: string
  profileImageUrl?: string
  cellName?: string
}

export interface MdAssignment {
  id: number
  memberId: number
  name: string
  gender: string
  phone: string
  charge: string
  ageGroup: string
}

export interface CreateMdAssignmentRequest {
  memberId: number
  charge: string
  ageGroup: string
}
