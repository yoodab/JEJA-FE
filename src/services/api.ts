import axios, { AxiosError } from 'axios'
import { clearAuth, getToken } from '../utils/auth'

// 환경 변수에서 API base URL 가져오기
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080'

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

// 응답 인터셉터: 401/403 에러 시 자동 로그아웃 처리
api.interceptors.response.use(
  (response) => {
    return response
  },
  (error: AxiosError) => {
    // 401 (Unauthorized) 또는 403 (Forbidden) 에러 시 자동 로그아웃
    if (error.response?.status === 401 || error.response?.status === 403) {
      const requestUrl = error.config?.url || ''
      
      // 출석 관련 API는 리다이렉트하지 않음 (선택적 기능이므로)
      const isAttendanceApi = requestUrl.includes('/api/attendance/')
      
      // 로그인/회원가입 API는 리다이렉트하지 않음
      const isAuthApi = requestUrl.includes('/api/auth/')
      
      // 개발 모드에서는 자동 로그아웃을 하지 않고 경고만 표시
      if (import.meta.env.DEV) {
        console.warn('⚠️ 401/403 에러 발생 (개발 모드에서는 자동 로그아웃하지 않음):', {
          url: requestUrl,
          status: error.response?.status,
          message: error.response?.data,
        })
        // 개발 모드에서는 에러만 반환하고 로그아웃하지 않음
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




