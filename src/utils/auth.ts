/**
 * 인증 관련 유틸리티 함수
 * localStorage 접근을 중앙화하여 일관성 유지
 */

const TOKEN_KEY = 'accessToken'
const REFRESH_TOKEN_KEY = 'refreshToken'
const USER_ROLE_KEY = 'userRole'
const MEMBER_ROLES_KEY = 'memberRoles'
const IS_LOGGED_IN_KEY = 'isLoggedIn'

// 관리자 역할 목록 (시스템 권한 및 특정 직분)
export const MANAGER_ROLES = [
  'ROLE_ADMIN', 
  'ROLE_PASTOR', 
  'ROLE_MANAGER', 
  'ROLE_EXECUTIVE', 
  'EXECUTIVE',
  'MANAGER'
] as const

export type ManagerRole = (typeof MANAGER_ROLES)[number]

/**
 * 토큰 저장
 */
export function setToken(token: string): void {
  localStorage.setItem(TOKEN_KEY, token)
  localStorage.setItem('token', token) // 하위 호환성
}

/**
 * 토큰 조회
 */
export function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY) || localStorage.getItem('token')
}

/**
 * 토큰 삭제
 */
export function removeToken(): void {
  localStorage.removeItem(TOKEN_KEY)
  localStorage.removeItem('token')
}

/**
 * 리프레시 토큰 저장
 */
export function setRefreshToken(token: string): void {
  localStorage.setItem(REFRESH_TOKEN_KEY, token)
}

/**
 * 리프레시 토큰 조회
 */
export function getRefreshToken(): string | null {
  return localStorage.getItem(REFRESH_TOKEN_KEY)
}

/**
 * 리프레시 토큰 삭제
 */
export function removeRefreshToken(): void {
  localStorage.removeItem(REFRESH_TOKEN_KEY)
}

/**
 * 사용자 역할 저장
 */
export function setUserRole(role: string): void {
  localStorage.setItem(USER_ROLE_KEY, role)
}

/**
 * 사용자 역할 조회
 */
export function getUserRole(): string | null {
  return localStorage.getItem(USER_ROLE_KEY)
}

/**
 * 교인 직분 목록 저장
 */
export function setMemberRoles(roles: string[]): void {
  localStorage.setItem(MEMBER_ROLES_KEY, JSON.stringify(roles))
}

/**
 * 교인 직분 목록 조회
 */
export function getMemberRoles(): string[] {
  const roles = localStorage.getItem(MEMBER_ROLES_KEY)
  if (!roles) return []
  try {
    return JSON.parse(roles)
  } catch {
    return []
  }
}

/**
 * 로그인 상태 저장
 */
export function setLoggedIn(isLoggedIn: boolean): void {
  localStorage.setItem(IS_LOGGED_IN_KEY, String(isLoggedIn))
}

/**
 * 로그인 상태 조회
 */
export function isLoggedIn(): boolean {
  const token = getToken()
  const storedFlag = localStorage.getItem(IS_LOGGED_IN_KEY) === 'true'
  return !!token || storedFlag
}

/**
 * 관리자 권한 여부 확인
 */
export function isManager(): boolean {
  const role = getUserRole()
  const memberRoles = getMemberRoles()
  
  // 시스템 역할 정규화
  const normalizedRole = role ? (role.startsWith('ROLE_') ? role : `ROLE_${role}`) : null
  
  // 직분 목록 정규화
  const normalizedMemberRoles = memberRoles.map(r => r.startsWith('ROLE_') ? r : `ROLE_${r}`)
  
  // 모든 권한 합치기
  const allRoles = [
    ...(role ? [role] : []),
    ...(normalizedRole ? [normalizedRole] : []),
    ...memberRoles,
    ...normalizedMemberRoles
  ]
  
  // 대소문자 구분 없이 비교하기 위해 모두 대문자로 변환하여 비교
  const isManagerRole = allRoles.some(r => 
    MANAGER_ROLES.some(m => m.toUpperCase() === r.toUpperCase())
  )
  
  if (import.meta.env.DEV) {
    console.log('isManager 체크:', {
      originalRole: role,
      memberRoles,
      allRoles,
      isManagerRole,
      availableRoles: MANAGER_ROLES,
    })
  }
  
  return isManagerRole
}

/**
 * 모든 인증 정보 삭제 (로그아웃)
 */
export function clearAuth(): void {
  removeToken()
  removeRefreshToken()
  localStorage.removeItem(USER_ROLE_KEY)
  localStorage.removeItem(MEMBER_ROLES_KEY)
  localStorage.removeItem(IS_LOGGED_IN_KEY)
}

/**
 * 인증 정보 일괄 설정
 */
export function setAuth(token: string, role?: string, refreshToken?: string, memberRoles?: string[]): void {
  setToken(token)
  setLoggedIn(true)
  if (role) {
    setUserRole(role)
  }
  if (memberRoles) {
    setMemberRoles(memberRoles)
  }
  if (refreshToken) {
    setRefreshToken(refreshToken)
  }
}





