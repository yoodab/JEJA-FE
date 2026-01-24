/**
 * 백엔드 MemberDto에 맞춘 타입
 * GET /api/members 응답의 content 배열 요소
 */
export interface Member {
  memberId: number
  name: string
  phone: string
  birthDate: string
  memberStatus: string  // NEWCOMER, ACTIVE, INACTIVE 등
  memberImageUrl: string | null
  roles: string[]  // ["MEMBER", "CELL_LEADER", "TEAM_LEADER"] 등
  hasAccount: boolean
  gender: string
  age: number
}

/**
 * 백엔드 Role Enum을 한글 문자열로 변환
 * @param roles 백엔드에서 받은 roles 배열 (예: ["MEMBER", "CELL_LEADER"])
 * @returns 한글 역할 문자열 (예: "순장")
 */
export function formatRoles(roles: string[]): string {
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
 * @param status 백엔드에서 받은 memberStatus (예: "ACTIVE", "INACTIVE", "NEWCOMER")
 * @returns 한글 상태 문자열 (예: "재적")
 */
export function formatMemberStatus(status: string): string {
  const statusMap: Record<string, string> = {
    ACTIVE: '재적',
    INACTIVE: '휴먼',
    NEWCOMER: '새신자',
    // 추가 상태가 있을 수 있음
  }
  return statusMap[status] || status
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

