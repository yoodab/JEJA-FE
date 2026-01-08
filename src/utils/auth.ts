/**
 * 인증 관련 유틸리티 함수
 * localStorage 접근을 중앙화하여 일관성 유지
 */

const TOKEN_KEY = 'accessToken'
const USER_ROLE_KEY = 'userRole'
const IS_LOGGED_IN_KEY = 'isLoggedIn'

// 관리자 역할 목록
export const MANAGER_ROLES = ['ROLE_ADMIN', 'ROLE_PASTOR', 'ROLE_EXECUTIVE'] as const

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
  if (!role) {
    if (import.meta.env.DEV) {
      console.warn('isManager: role이 없습니다')
    }
    return false
  }
  
  // 백엔드에서 'ADMIN', 'PASTOR', 'EXECUTIVE' 형식으로 올 수도 있으므로
  // 'ROLE_' 접두사가 없으면 추가하여 비교
  const normalizedRole = role.startsWith('ROLE_') ? role : `ROLE_${role}`
  const isManagerRole = MANAGER_ROLES.includes(normalizedRole as ManagerRole)
  
  if (import.meta.env.DEV) {
    console.log('isManager 체크:', {
      originalRole: role,
      normalizedRole,
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
  localStorage.removeItem(USER_ROLE_KEY)
  localStorage.removeItem(IS_LOGGED_IN_KEY)
}

/**
 * 인증 정보 일괄 설정
 */
export function setAuth(token: string, role?: string): void {
  setToken(token)
  setLoggedIn(true)
  if (role) {
    setUserRole(role)
  }
}





