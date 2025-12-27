import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'

type UserHeaderProps = {
  isLoggedIn?: boolean
  userRole?: string | null
  onLogout?: () => void
}

const managerRoles = ['ROLE_ADMIN', 'ROLE_PASTOR', 'ROLE_EXECUTIVE']

function UserHeader({ isLoggedIn: propLoggedIn, userRole: propUserRole, onLogout }: UserHeaderProps) {
  const navigate = useNavigate()
  const [localLoggedIn, setLocalLoggedIn] = useState(false)
  const [localRole, setLocalRole] = useState<string | null>(null)

  // 내부 상태 초기화 및 storage 변경 감지
  useEffect(() => {
    const sync = () => {
      const token = localStorage.getItem('accessToken')
      const storedFlag = localStorage.getItem('isLoggedIn') === 'true'
      const role = localStorage.getItem('userRole')
      setLocalLoggedIn(!!token || storedFlag)
      setLocalRole(role)
    }
    sync()
    window.addEventListener('storage', sync)
    return () => window.removeEventListener('storage', sync)
  }, [])

  // 상위에서 전달된 상태가 있으면 우선 사용
  const isLoggedIn = propLoggedIn ?? localLoggedIn
  const userRole = propUserRole ?? localRole
  const isManager = managerRoles.includes(userRole ?? '')

  const handleLoginLogout = () => {
    if (isLoggedIn) {
      if (onLogout) {
        onLogout()
      } else {
        localStorage.removeItem('accessToken')
        localStorage.removeItem('userRole')
        localStorage.removeItem('isLoggedIn')
        setLocalLoggedIn(false)
        setLocalRole(null)
        // 로그아웃 시 현재 페이지에 유지
      }
    } else {
      navigate('/login')
    }
  }

  return (
    <header className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
      <div className="flex items-center gap-3">
        <div className="rounded-full bg-blue-600 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-white">
          JEJA
        </div>
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.15em] text-slate-500">Youth</p>
          <p className="text-sm font-semibold text-slate-900">청년부 메인</p>
        </div>
      </div>

      <nav className="flex flex-wrap items-center gap-2 text-sm font-semibold text-slate-700">
        <button onClick={() => navigate('/user-dashboard')} className="rounded-full px-3 py-1 hover:bg-slate-100">
          메인
        </button>
        <button onClick={() => navigate('/bulletin')} className="rounded-full px-3 py-1 hover:bg-slate-100">
          주보
        </button>
        <button onClick={() => navigate('/youth-notices')} className="rounded-full px-3 py-1 hover:bg-slate-100">
          공지사항
        </button>
        <button onClick={() => navigate('/youth-album')} className="rounded-full px-3 py-1 hover:bg-slate-100">
          앨범
        </button>
        {isLoggedIn && (
          <>
            <button onClick={() => navigate('/soon')} className="rounded-full px-3 py-1 hover:bg-slate-100">
              순
            </button>
            <button onClick={() => navigate('/my-info')} className="rounded-full px-3 py-1 hover:bg-slate-100">
              내 정보
            </button>
          </>
        )}
        {isManager && (
          <>
            <button
              onClick={() => navigate('/dashboard')}
              className="rounded-full px-3 py-1 hover:bg-slate-100 text-blue-600"
            >
              청년부 관리
            </button>
            <button
              onClick={() => navigate('/homepage-manage')}
              className="rounded-full px-3 py-1 hover:bg-slate-100 text-fuchsia-700"
            >
              홈페이지 관리
            </button>
          </>
        )}
      </nav>

      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={handleLoginLogout}
          className="rounded-full bg-slate-900 px-4 py-1.5 text-xs font-semibold text-white shadow-sm transition hover:bg-slate-700"
        >
          {isLoggedIn ? '로그아웃' : '로그인'}
        </button>
      </div>
    </header>
  )
}

export default UserHeader

