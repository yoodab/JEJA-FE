import api from './api'
import { setAuth } from '../utils/auth'
import type { ApiResponseForm } from '../types/api'

// 로그인 요청 DTO
export interface LoginRequestDto {
  loginId: string
  password: string
}

// 로그인 응답 Data DTO (ApiResponseForm의 data 필드)
export interface LoginResponseData {
  name: string
  role: string  // ROLE_ADMIN, ROLE_USER, ROLE_PASTOR 등
  memberRoles: string[] // 교인 직분 목록 (e.g., "TEAM_LEADER", "CELL_LEADER")
  accessToken: string
  refreshToken: string
}

// 로그인 응답 타입 (공통 응답 포맷으로 감싸짐)
type LoginResponseDto = ApiResponseForm<LoginResponseData>

// 토큰 재발급 응답 DTO
export interface TokenResponseData {
  accessToken: string
  refreshToken: string
}

// 회원가입 요청 DTO
export interface SignupRequestDto {
  loginId: string
  password: string
  email: string
  name: string
  phone: string
  birthDate: string
  address: string
}

// 비밀번호 재설정 요청 DTO
export interface ResetPasswordRequestDto {
  email: string
  authCode: string
  newPassword: string
}

/**
 * 로그인 API
 * POST /api/auth/login
 * 
 * 응답 헤더의 Authorization에서 JWT 토큰을 추출하고,
 * 응답 body의 data에서 name과 role을 받아서 localStorage에 저장합니다.
 * 
 * 주의: CORS 설정에 따라 헤더 접근이 제한될 수 있어 XMLHttpRequest를 사용합니다.
 */
export async function login(data: LoginRequestDto): Promise<LoginResponseData> {
  return new Promise<LoginResponseData>((resolve, reject) => {
    // api.ts와 동일한 baseURL 사용 (환경 변수 우선, 없으면 기본값)
    const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080'
    const xhr = new XMLHttpRequest()
    xhr.open('POST', `${API_BASE_URL}/api/auth/login`, true)
    xhr.setRequestHeader('Content-Type', 'application/json')
    
    xhr.onload = function() {
      if (xhr.status === 200) {
        try {
          // 응답 헤더에서 Authorization 헤더 읽기 (Bearer 토큰)
          const authHeader = xhr.getResponseHeader('Authorization') || xhr.getResponseHeader('authorization')
          
          let token: string | null = null
          
          // 헤더에서 토큰 추출 (Bearer 접두사 제거) - 하위 호환성 유지
          if (authHeader) {
            token = authHeader.replace(/^Bearer\s+/i, '').trim()
          }
          
          // 응답 body 파싱 (ApiResponseForm 형태)
          const responseData = JSON.parse(xhr.responseText) as LoginResponseDto

          // Body에 accessToken이 있으면 우선 사용
          if (responseData.data?.accessToken) {
            token = responseData.data.accessToken
          }

          // 토큰이 없으면 에러
          if (!token) {
            reject(new Error('토큰을 받아오지 못했습니다. 응답 헤더에 Authorization이 없습니다.'))
            return
          }
          
          // 응답 데이터 검증 (ApiResponseForm 구조 확인)
          if (responseData.status !== 'success' || !responseData?.data) {
            const errorMessage = responseData?.message || '로그인 응답 데이터가 올바르지 않습니다.'
            reject(new Error(errorMessage))
            return
          }
          
          const { name, role, memberRoles, refreshToken } = responseData.data
          
          // role 정규화 (ROLE_ 접두사가 없으면 추가)
          let normalizedRole = role
          if (normalizedRole && !normalizedRole.startsWith('ROLE_')) {
            normalizedRole = `ROLE_${normalizedRole}`
          }

          // memberRoles 정규화 (각 역할에 ROLE_ 접두사 추가)
          const normalizedMemberRoles = (memberRoles || []).map(r => 
            r.startsWith('ROLE_') ? r : `ROLE_${r}`
          )
          
          // 디버깅을 위한 로그
          if (import.meta.env.DEV) {
            console.log('✅ 로그인 성공:', {
              name,
              originalRole: role,
              normalizedRole,
              memberRoles: normalizedMemberRoles,
              hasToken: !!token,
              hasRefreshToken: !!refreshToken
            })
          }
          
          // 토큰과 역할 저장
          setAuth(token, normalizedRole, refreshToken, normalizedMemberRoles)
          
          // 응답 데이터 반환
          resolve({ 
            name, 
            role: normalizedRole, 
            memberRoles: normalizedMemberRoles,
            accessToken: token, 
            refreshToken 
          })
        } catch (error) {
          console.error('❌ 로그인 응답 처리 중 오류:', error)
          reject(error instanceof Error ? error : new Error('로그인 처리 중 오류가 발생했습니다.'))
        }
      } else {
        // 에러 응답 처리 (ApiResponseForm 구조 고려)
        try {
          const errorData = JSON.parse(xhr.responseText)
          // ApiResponseForm 구조: { status, code, message, data }
          const errorMessage = errorData?.message || errorData?.data?.message || `로그인 실패 (${xhr.status})`
          reject(new Error(errorMessage))
        } catch {
          reject(new Error(`로그인 실패 (${xhr.status})`))
        }
      }
    }
    
    xhr.onerror = function() {
      reject(new Error('네트워크 오류가 발생했습니다.'))
    }
    
    xhr.send(JSON.stringify(data))
  })
}

/**
 * 회원가입용 인증번호 전송
 * POST /api/auth/signup/send-verification
 */
export async function sendSignupVerification(email: string): Promise<void> {
  const response = await api.post<ApiResponseForm<void>>('/api/auth/signup/send-verification', { email })
  if (response.data.result !== 'SUCCESS' && response.data.status !== 'success') {
    throw new Error(response.data.message || '인증번호 전송 실패')
  }
}

/**
 * 회원가입용 인증번호 검증
 * POST /api/auth/signup/verify
 */
export async function verifySignupCode(email: string, authCode: string): Promise<void> {
  const response = await api.post<ApiResponseForm<void>>('/api/auth/signup/verify', { email, authCode })
  if (response.data.result !== 'SUCCESS' && response.data.status !== 'success') {
    throw new Error(response.data.message || '인증번호 검증 실패')
  }
}

/**
 * 최종 회원가입 API
 * POST /api/auth/signup
 */
export async function signup(data: SignupRequestDto): Promise<void> {
  try {
    const response = await api.post<ApiResponseForm<void>>('/api/auth/signup', data)
    
    // ApiResponseForm 구조 확인 (result 또는 status 확인)
    if (response.data.result !== 'SUCCESS' && response.data.status !== 'success') {
      const errorMessage = response.data.message || '회원가입에 실패했습니다.'
      throw new Error(errorMessage)
    }
    
    if (import.meta.env.DEV) {
      console.log('✅ 회원가입 성공:', response.data)
    }
  } catch (error) {
    // Axios 에러 처리
    if (error && typeof error === 'object' && 'response' in error) {
      const axiosError = error as { response?: { data?: ApiResponseForm<void> } }
      const errorMessage = axiosError.response?.data?.message || '회원가입 중 오류가 발생했습니다.'
      throw new Error(errorMessage)
    }
    throw error
  }
}

/**
 * 비밀번호 찾기용 인증번호 전송
 * POST /api/auth/send-verification-code
 */
export async function sendPasswordResetVerification(loginId: string, email: string): Promise<void> {
  const response = await api.post<ApiResponseForm<void>>('/api/auth/send-verification-code', { loginId, email })
  if (response.data.result !== 'SUCCESS' && response.data.status !== 'success') {
    throw new Error(response.data.message || '인증번호 전송 실패')
  }
}

/**
 * 비밀번호 찾기용 인증번호 확인 (UI용)
 * POST /api/auth/verify-code
 */
export async function verifyPasswordResetCode(email: string, authCode: string): Promise<boolean> {
  const response = await api.post<ApiResponseForm<boolean>>('/api/auth/verify-code', { email, authCode })
  if (response.data.result !== 'SUCCESS' && response.data.status !== 'success') {
    throw new Error(response.data.message || '인증번호 확인 실패')
  }
  return response.data.data
}

/**
 * 토큰 재발급
 * POST /api/auth/reissue
 */
export async function reissueToken(refreshToken: string): Promise<TokenResponseData> {
  // api 인스턴스 대신 axios 직접 사용 (인터셉터 순환 참조 방지)
  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080'
  
  // axios import 필요하지만 여기선 fetch 사용
  const response = await fetch(`${API_BASE_URL}/api/auth/reissue`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ refreshToken }),
  })
  
  const data = await response.json()
  
  if (!response.ok || (data.result !== 'SUCCESS' && data.status !== 'success')) {
    throw new Error(data.message || '토큰 재발급 실패')
  }
  
  return data.data
}

/**
 * 비밀번호 재설정 (최종)
 * PATCH /api/auth/reset-password
 */
export async function resetPassword(data: ResetPasswordRequestDto): Promise<void> {
  const response = await api.patch<ApiResponseForm<void>>('/api/auth/reset-password', data)
  if (response.data.result !== 'SUCCESS' && response.data.status !== 'success') {
    throw new Error(response.data.message || '비밀번호 재설정 실패')
  }
}
