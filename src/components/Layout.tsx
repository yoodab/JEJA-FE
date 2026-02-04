import { Navigate, Outlet } from 'react-router-dom'
import { useState } from 'react'
import { isLoggedIn, isManager, getUserRole, getToken } from '../utils/auth'
import Footer from './Footer'

function Layout() {
  const [authInfo] = useState(() => {
    const loggedIn = isLoggedIn()
    const manager = isManager()
    const role = getUserRole()
    const token = getToken()
    const info = {
      loggedIn,
      manager,
      role,
      hasToken: !!token,
    }
    console.log('Layout 권한 체크:', info)
    return info
  })

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
    // 개발 모드에서는 에러 정보를 화면에 표시
    if (import.meta.env.DEV && authInfo) {
      return (
        <div className="flex min-h-screen items-center justify-center bg-slate-50 p-6">
          <div className="max-w-md rounded-2xl border-2 border-red-200 bg-white p-6 shadow-lg">
            <h2 className="mb-4 text-lg font-bold text-red-600">권한 없음</h2>
            <div className="mb-4 space-y-2 text-sm">
              <div>
                <span className="font-semibold">로그인 상태:</span>{' '}
                <span className={authInfo.loggedIn ? 'text-green-600' : 'text-red-600'}>
                  {authInfo.loggedIn ? '✓ 로그인됨' : '✗ 로그인 안됨'}
                </span>
              </div>
              <div>
                <span className="font-semibold">관리자 권한:</span>{' '}
                <span className={authInfo.manager ? 'text-green-600' : 'text-red-600'}>
                  {authInfo.manager ? '✓ 있음' : '✗ 없음'}
                </span>
              </div>
              <div>
                <span className="font-semibold">Role:</span>{' '}
                <span className="font-mono text-slate-700">{authInfo.role || '(없음)'}</span>
              </div>
              <div>
                <span className="font-semibold">토큰:</span>{' '}
                <span className={authInfo.hasToken ? 'text-green-600' : 'text-red-600'}>
                  {authInfo.hasToken ? '✓ 있음' : '✗ 없음'}
                </span>
              </div>
            </div>
            <div className="mb-4 rounded-lg bg-slate-100 p-3">
              <p className="text-xs text-slate-600">
                개발 모드에서는 로그인만 되어 있으면 접근 가능합니다.
                <br />
                프로덕션 모드에서는 관리자 권한이 필요합니다.
              </p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => window.location.href = '/login'}
                className="flex-1 rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700"
              >
                로그인 페이지로 이동
              </button>
              <button
                onClick={() => {
                  console.log('현재 인증 정보:', authInfo)
                  console.log('localStorage:', {
                    accessToken: localStorage.getItem('accessToken'),
                    userRole: localStorage.getItem('userRole'),
                    isLoggedIn: localStorage.getItem('isLoggedIn'),
                  })
                }}
                className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
              >
                콘솔에 출력
              </button>
            </div>
          </div>
        </div>
      )
    }
    
    // 프로덕션 모드에서는 바로 리다이렉트
    return <Navigate to="/login" replace />
  }

  // 권한이 있으면 페이지 렌더링
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col">
      <main className="flex-grow">
        <Outlet />
      </main>
      <Footer />
    </div>
  )
}

export default Layout

