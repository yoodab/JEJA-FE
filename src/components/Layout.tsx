import { NavLink, Outlet } from 'react-router-dom'

const navLinkClass = ({ isActive }: { isActive: boolean }) =>
  [
    'block rounded-lg px-3 py-2 text-sm font-medium transition',
    isActive
      ? 'bg-blue-600 text-white shadow-sm'
      : 'text-slate-700 hover:bg-slate-100',
  ].join(' ')

function Layout() {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <div className="mx-auto flex max-w-6xl gap-6 px-6 py-10">
        <aside className="w-64 shrink-0">
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="mb-6">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                JEJA
              </p>
              <h1 className="mt-1 text-xl font-bold">관리 패널</h1>
            </div>
            <nav className="space-y-1">
              <NavLink to="/dashboard" className={navLinkClass}>
                대시보드
              </NavLink>
              <NavLink to="/members" className={navLinkClass}>
                멤버 목록
              </NavLink>
              <NavLink to="/login" className={navLinkClass}>
                로그아웃
              </NavLink>
            </nav>
          </div>
        </aside>

        <main className="flex-1">
          <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  )
}

export default Layout

