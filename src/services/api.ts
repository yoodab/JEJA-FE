import axios, { AxiosError, type InternalAxiosRequestConfig } from 'axios'
import { clearAuth, getToken, setAuth, getRefreshToken } from '../utils/auth'

// 환경 변수에서 API base URL 가져오기 (환경 변수 우선, 없으면 기본값)
export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080'

/**
 * 이미지 경로를 전체 URL로 변환합니다.
 * @param path 이미지 경로 (예: /files/profiles/...)
 * @returns 전체 URL
 */
export const getImageUrl = (path: string | null | undefined): string | undefined => {
  if (!path) return undefined;
  if (path.startsWith('http')) return path;
  
  // path가 /로 시작하지 않으면 /를 붙여줌
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  return `${API_BASE_URL}${normalizedPath}`;
};

interface RetryConfig extends InternalAxiosRequestConfig {
  _retry?: boolean
}
if (import.meta.env.DEV) {
  console.log("현재 API 주소:", API_BASE_URL, "환경변수:", import.meta.env.VITE_API_BASE_URL);
}

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
})

// 요청 인터셉터: JWT 토큰을 로컬스토리지에서 읽어서 Authorization 헤더에 붙임
api.interceptors.request.use(
  (config) => {
    try {
      const token = getToken()
      
      if (token && token.trim() !== '') {
        config.headers = config.headers || {}
        ;(config.headers as Record<string, string>)['Authorization'] = `Bearer ${token}`
        
        if (import.meta.env.DEV) {
          console.log('✅ Token attached:', {
            url: config.url,
            method: config.method,
            hasAuthHeader: !!config.headers['Authorization'],
          })
        }
      } else {
        if (import.meta.env.DEV) {
          console.warn('⚠️ No token found:', {
            url: config.url,
          })
        }
      }
    } catch (error) {
      console.error('❌ Error in request interceptor:', error)
    }
    
    return config
  },
  (error) => {
    return Promise.reject(error)
  },
)

// 응답 인터셉터: 로그인 응답에서 토큰 추출, 401/403 에러 시 자동 로그아웃 처리
api.interceptors.response.use(
  (response) => {
    // 로그인 API 응답인 경우 헤더에서 토큰 추출
    // 주의: CORS 설정에 따라 헤더 접근이 제한될 수 있음
    const requestUrl = response.config?.url || ''
    if (requestUrl.includes('/api/auth/login')) {
      try {
        const authHeader = response.headers['authorization'] || response.headers['Authorization']
        if (authHeader) {
          const token = typeof authHeader === 'string' 
            ? authHeader.replace(/^Bearer\s+/i, '').trim()
            : null
          
          if (token) {
            // 응답 데이터에서 role 추출
            const responseData = response.data
            const role = responseData?.data?.role || null
            
            if (import.meta.env.DEV) {
              console.log('✅ Login token extracted from response header:', {
                hasToken: !!token,
                role,
              })
            }
            
            // 토큰과 역할 저장
            if (role) {
              setAuth(token, role)
            } else {
              setAuth(token)
            }
          }
        }
      } catch (error) {
        if (import.meta.env.DEV) {
          console.warn('⚠️ Failed to extract token from login response header:', error)
        }
      }
    }
    
    return response
  },
  (error: AxiosError) => {
    // 401 (Unauthorized) 또는 403 (Forbidden) 에러 시 자동 로그아웃
    if (error.response?.status === 401) {
      const originalRequest = error.config as RetryConfig
      
      // 이미 재시도한 요청이면 중단 (무한 루프 방지)
      if (originalRequest._retry) {
        clearAuth()
        window.location.href = '/login'
        return Promise.reject(error)
      }

      // Refresh Token이 있으면 토큰 재발급 시도
      const refreshToken = getRefreshToken()
      if (refreshToken) {
        originalRequest._retry = true
        
        return fetch(`${API_BASE_URL}/api/auth/reissue`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ refreshToken }),
        })
          .then(res => res.json())
          .then(data => {
            // 응답 구조가 { status: 'success', data: { accessToken: '...', refreshToken: '...' } } 인지 확인
            // 또는 { result: 'SUCCESS', ... }
            const isSuccess = (data.status === 'success' || data.result === 'SUCCESS') && data.data
            
            if (isSuccess) {
              const { accessToken, refreshToken: newRefreshToken } = data.data
              // 새 토큰 저장 (기존 role 유지)
              // role은 로컬스토리지에서 가져와야 함 (api.ts에서는 직접 접근 불가하므로 auth.ts 사용 권장하지만 여기선 setAuth가 덮어쓰므로 주의)
              // setAuth는 role을 옵셔널로 받으므로, 기존 role을 유지하려면 읽어와야 함.
              // 하지만 setAuth 구현을 보면 role이 없으면 setUserRole을 호출하지 않음 -> 기존 role 유지됨!
              setAuth(accessToken, undefined, newRefreshToken)
              
              // 실패했던 요청에 새 토큰 적용하여 재시도
              originalRequest.headers['Authorization'] = `Bearer ${accessToken}`
              return api(originalRequest)
            } else {
              // 재발급 실패
              throw new Error('Refresh failed')
            }
          })
          .catch(refreshError => {
            // 재발급 실패 시 로그아웃
            clearAuth()
            if (window.location.pathname !== '/login') {
              window.location.href = '/login'
            }
            return Promise.reject(refreshError)
          })
      }
    }

    if (error.response?.status === 403) {
      const requestUrl = error.config?.url || ''
      
      // 출석 관련 API는 리다이렉트하지 않음 (선택적 기능이므로)
      const isAttendanceApi = requestUrl.includes('/api/attendance/')
      
      // 로그인/회원가입 API는 리다이렉트하지 않음
      const isAuthApi = requestUrl.includes('/api/auth/')
      
      // 개발 모드에서는 자동 로그아웃을 하지 않고 경고만 표시
      if (import.meta.env.DEV) {
        console.warn('⚠️ 403 에러 발생:', {
          url: requestUrl,
          status: error.response?.status,
          message: error.response?.data,
        })
        return Promise.reject(error)
      }
      
      if (!isAttendanceApi && !isAuthApi) {
        clearAuth()
        
        // 현재 페이지가 로그인 페이지가 아닌 경우에만 리다이렉트
        if (window.location.pathname !== '/login') {
          window.location.href = '/login'
        }
      }
    }
    
    // 404 에러는 개발 모드에서 경고만 표시
    if (error.response?.status === 404 && import.meta.env.DEV) {
      console.warn('⚠️ 404 에러 (API가 아직 구현되지 않았을 수 있음):', {
        url: error.config?.url,
      })
    }
    
    return Promise.reject(error)
  },
)

export default api




