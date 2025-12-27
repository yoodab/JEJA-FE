import axios from 'axios'

const api = axios.create({
  baseURL: 'http://localhost:8080',
  headers: {
    'Content-Type': 'application/json',
  },
})

// 요청 인터셉터: JWT 토큰을 로컬스토리지에서 읽어서 Authorization 헤더에 붙임
api.interceptors.request.use(
  (config) => {
    try {
      // 'token' 또는 'accessToken' 키로 저장된 토큰 찾기
      const token = localStorage.getItem('token') || localStorage.getItem('accessToken')
      
      if (token && token.trim() !== '') {
        // 헤더를 명시적으로 설정
        config.headers = config.headers || {}
        // Authorization 헤더를 직접 설정
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
            localStorageKeys: Object.keys(localStorage),
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

// 응답 인터셉터
api.interceptors.response.use(
  (response) => {
    return response
  },
  (error) => {
    return Promise.reject(error)
  },
)

export default api




