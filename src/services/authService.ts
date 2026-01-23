import api from './api'
import { setAuth } from '../utils/auth'

// 로그인 요청 DTO
export interface LoginRequestDto {
  loginId: string
  password: string
}


// 로그인 응답 DTO
interface LoginResponseDto {
  status?: string
  code?: string
  message?: string
  token?: string
  data?: {
    name?: string
    role?: string
    token?: string
  }
}

// 회원가입 요청 DTO
export interface SignupRequestDto {
  loginId: string
  password: string
  name: string
  birthDate: string
  phone: string
}

/**
 * 로그인 API
 * POST /api/auth/login
 * 
 * 응답에서 토큰과 userRole을 추출하여 localStorage에 저장합니다.
 * CORS 문제로 인해 XMLHttpRequest를 사용하여 헤더에서 토큰을 읽습니다.
 */
export async function login(data: LoginRequestDto): Promise<void> {
  return new Promise<void>((resolve, reject) => {
    const API_BASE_URL = 'https://api.jeja.shop'
    const xhr = new XMLHttpRequest()
    xhr.open('POST', `${API_BASE_URL}/api/auth/login`, true)
    xhr.setRequestHeader('Content-Type', 'application/json')
    
    xhr.onload = function() {
      if (xhr.status === 200) {
        try {
          // 응답 헤더에서 Authorization 헤더 읽기
          let authHeader = xhr.getResponseHeader('Authorization') || xhr.getResponseHeader('authorization')
          
          let token: string | null = null
          
          // 헤더에서 토큰 추출
          if (authHeader) {
            token = authHeader.startsWith('Bearer ')
              ? authHeader.slice(7).trim()
              : authHeader.trim()
          }
          
          // 응답 body 파싱
          const responseData = JSON.parse(xhr.responseText) as LoginResponseDto
          
          // 헤더에 토큰이 없으면 body에서 찾기 (백업)
          if (!token) {
            token = responseData?.token || responseData?.data?.token || null
          }
          
          // 토큰 저장
          if (token) {
            let userRole = responseData?.data?.role
            // 백엔드에서 'ADMIN', 'PASTOR' 형식으로 올 경우 'ROLE_' 접두사 추가
            if (userRole && !userRole.startsWith('ROLE_')) {
              userRole = `ROLE_${userRole}`
            }
            
            // 디버깅을 위한 로그
            if (import.meta.env.DEV) {
              console.log('로그인 성공:', {
                hasToken: !!token,
                originalRole: responseData?.data?.role,
                normalizedRole: userRole,
              })
            }
            
            setAuth(token, userRole)
            resolve()
          } else {
            reject(new Error('토큰을 받아오지 못했습니다.'))
            return
          }
        } catch (error) {
          console.error('로그인 응답 처리 중 오류:', error)
          reject(error)
        }
      } else {
        try {
          const errorData = JSON.parse(xhr.responseText)
          reject(new Error(errorData.message || `로그인 실패 (${xhr.status})`))
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
 * 회원가입 API
 * POST /api/auth/signup
 */
export async function signup(data: SignupRequestDto): Promise<void> {
  await api.post('/api/auth/signup', data)
}
