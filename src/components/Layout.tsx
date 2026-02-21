import { Navigate, Outlet, useNavigate, useLocation } from 'react-router-dom'
import { useState, useEffect } from 'react'
import { isLoggedIn, isManager, getUserRole, getToken, clearAuth } from '../utils/auth'
import Footer from './Footer'
import UserHeader from './UserHeader'

function Layout() {
  const navigate = useNavigate()
  const location = useLocation()
  const [authInfo, setAuthInfo] = useState(() => {
    const loggedIn = isLoggedIn()
    const manager = isManager()
    const role = getUserRole()
    const token = getToken()
    return {
      loggedIn,
      manager,
      role,
      hasToken: !!token,
    }
  })

  useEffect(() => {
    const handleStorageChange = () => {
      setAuthInfo({
        loggedIn: isLoggedIn(),
        manager: isManager(),
        role: getUserRole(),
        hasToken: !!getToken(),
      })
    }
    window.addEventListener('storage', handleStorageChange)
    // 커스텀 이벤트도 수신 (로그인/로그아웃 시 발생시킬 수 있음)
    window.addEventListener('auth-change', handleStorageChange)
    
    return () => {
      window.removeEventListener('storage', handleStorageChange)
      window.removeEventListener('auth-change', handleStorageChange)
    }
  }, [])

  const [isAuthorized] = useState<boolean | null>(() => {
    const loggedIn = isLoggedIn()
    const manager = isManager()
    
    // 개발 모드에서는 로그인만 되어 있으면 접근 허용 (권한 체크 완화)
    if (import.meta.env.DEV) {
      return loggedIn
    } else {
      // 프로덕션 모드에서는 로그인되어 있고 관리자 권한이 있으면 접근 허용
      return loggedIn && manager
    }
  })

  const handleLoginLogout = () => {
    if (authInfo.loggedIn) {
      clearAuth()
      setAuthInfo(prev => ({ ...prev, loggedIn: false, role: null, manager: false }))
      navigate('/login')
    } else {
      navigate('/login')
    }
  }

  // 권한 확인 중일 때는 아무것도 렌더링하지 않음
  if (isAuthorized === null) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-sm text-slate-500">로딩 중...</div>
      </div>
    )
  }

  // 권한이 없으면 에러 정보를 표시하고 리다이렉트
  if (!isAuthorized) {
    // 개발 모드에서도 바로 리다이렉트 (디버그 화면 제거)
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  // 권한이 있으면 페이지 렌더링
  const isFormManagerPage = location.pathname.startsWith('/manage/forms/');

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col">
      {/* 헤더 추가 - 모든 관리자 페이지에 공통 적용 */}
      {!isFormManagerPage && (
        <div className="px-4 py-6 sm:px-6 sm:pb-0 sm:pt-10">
          <div className="mx-auto max-w-6xl">
            <UserHeader 
              isLoggedIn={authInfo.loggedIn} 
              userRole={authInfo.role} 
              onLogout={handleLoginLogout}
            />
          </div>
        </div>
      )}
      
      <main className="flex-grow">
        <Outlet />
      </main>
      <Footer />
    </div>
  )
}

export default Layout

