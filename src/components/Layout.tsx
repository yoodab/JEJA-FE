import { NavLink, Outlet } from 'react-router-dom'
import Footer from './Footer'

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
      <Outlet />
      <Footer />
    </div>
  )
}

export default Layout

