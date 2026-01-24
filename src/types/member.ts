/**
 * 백엔드 MemberDto에 맞춘 타입
 * GET /api/members 응답의 content 배열 요소
 */
export interface Member {
  memberId: number
  name: string
  phone: string
  birthDate: string
  memberStatus: MemberStatus | string
  memberImageUrl: string | null
  // roles: string[]  // Removed from DTO as per instructions, keeping optional if backend still sends it but ignored
  roles?: string[]
  hasAccount: boolean
  gender: string
  age: number
}

export type MemberStatus = 'NEWCOMER' | 'ACTIVE' | 'LONG_TERM_ABSENT' | 'MOVED' | 'GRADUATED'

export interface MemberStats {
  totalCount: number
  activeCount: number
  inactiveCount: number // This might be LONG_TERM_ABSENT + MOVED + GRADUATED or specific field? 
  // User spec: "inactiveCount: 0" in example. 
  // Actually the spec says: totalCount, activeCount, inactiveCount, newcomerCount.
  // I should just match the JSON spec.
  newcomerCount: number
}

/**
 * 백엔드 Gender Enum을 한글 문자열로 변환
 * @param gender 백엔드에서 받은 gender (예: "MALE", "FEMALE")
 * @returns 한글 성별 문자열 (예: "남성")
 */
export function formatGender(gender: string): string {
  const genderMap: Record<string, string> = {
    MALE: '남성',
    FEMALE: '여성',
    NONE: '미입력',
  }
  return genderMap[gender] || gender
}

/**
 * 백엔드 Role Enum을 한글 문자열로 변환
 * @param roles 백엔드에서 받은 roles 배열 (예: ["MEMBER", "CELL_LEADER"])
 * @returns 한글 역할 문자열 (예: "순장")
 */
export function formatRoles(roles: string[] | undefined): string {
  if (!roles || roles.length === 0) {
    return '일반'
  }

  // 우선순위에 따라 가장 높은 역할을 반환
  // CELL_LEADER > TEAM_LEADER > MEMBER
  if (roles.includes('CELL_LEADER')) {
    return '순장'
  }
  if (roles.includes('TEAM_LEADER')) {
    return '리더'
  }
  if (roles.includes('MEMBER')) {
    return '일반'
  }

  // 알 수 없는 역할이면 첫 번째 역할을 그대로 반환
  return roles[0] || '일반'
}

/**
 * 백엔드 MemberStatus Enum을 한글 문자열로 변환
 */
export function formatMemberStatus(status: string): string {
  const statusMap: Record<string, string> = {
    NEWCOMER: '새신자',
    ACTIVE: '재적',
    LONG_TERM_ABSENT: '장결자',
    MOVED: '교회 이동',
    GRADUATED: '졸업',
  }
  return statusMap[status] || status
}

export function getMemberStatusColor(status: string): string {
  switch (status) {
    case 'NEWCOMER': return 'bg-blue-100 text-blue-700'
    case 'ACTIVE': return 'bg-green-100 text-green-700'
    case 'LONG_TERM_ABSENT': return 'bg-orange-100 text-orange-700'
    case 'MOVED': return 'bg-gray-100 text-gray-700'
    case 'GRADUATED': return 'bg-purple-100 text-purple-700'
    default: return 'bg-slate-100 text-slate-500'
  }
}

/**
 * 한글 역할 문자열을 백엔드 Role Enum으로 변환
 * @param role 한글 역할 (예: "순장", "리더", "일반")
 * @returns 백엔드 Role Enum 값 (예: "CELL_LEADER")
 */
export function roleToBackendEnum(role: string): string {
  const roleMap: Record<string, string> = {
    순장: 'CELL_LEADER',
    리더: 'TEAM_LEADER',
    일반: 'MEMBER',
  }
  return roleMap[role] || 'MEMBER'
}

/**
 * 한글 상태 문자열을 백엔드 MemberStatus Enum으로 변환
 * @param status 한글 상태 (예: "재적", "휴먼", "새신자")
 * @returns 백엔드 MemberStatus Enum 값 (예: "ACTIVE")
 */
export function statusToBackendEnum(status: string): string {
  const statusMap: Record<string, string> = {
    재적: 'ACTIVE',
    휴먼: 'INACTIVE',
    새신자: 'NEWCOMER',
    퇴회: 'INACTIVE', // 퇴회도 INACTIVE로 매핑
  }
  return statusMap[status] || 'ACTIVE'
}

