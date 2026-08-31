import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { useAuth } from '../../lib/auth'
import { HeroIcon } from '../ui'

const tabs = [
  { to: '/usher', label: 'Collect', icon: 'M6.827 6.175A2.31 2.31 0 015.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 00-1.134-.175 2.31 2.31 0 01-1.64-1.055l-.822-1.316a2.192 2.192 0 00-1.736-1.039 48.774 48.774 0 00-5.232 0 2.192 2.192 0 00-1.736 1.039l-.821 1.316z M16.5 12.75a4.5 4.5 0 11-9 0 4.5 4.5 0 019 0zM18.75 10.5h.008v.008h-.008V10.5z', end: true },
  { to: '/usher/history', label: 'History', icon: 'M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z', end: false }
]

export default function UsherLayout() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  const handleLogout = async () => {
    await logout()
    navigate('/login')
  }

  return (
    <div className="min-h-screen bg-slate-50 pb-16">
      <header className="sticky top-0 z-20 bg-gradient-to-r from-brand-600 to-brand-700 text-white shadow-lg shadow-brand-200/50" style={{ paddingTop: 'env(safe-area-inset-top)' }}>
        <div className="flex items-center justify-between px-4 h-14">
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 rounded-lg bg-white/15 backdrop-blur flex items-center justify-center">
              <svg className="h-4 w-4 text-white" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" />
              </svg>
            </div>
            <div>
              <div className="font-bold leading-tight text-[15px]">CTOMS Usher</div>
              <div className="text-[11px] text-white/70 leading-tight">{user?.fullName}</div>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="text-xs bg-white/10 hover:bg-white/20 backdrop-blur rounded-lg px-3 py-1.5 transition-colors font-medium"
          >
            Logout
          </button>
        </div>
      </header>

      <main className="max-w-xl mx-auto p-3 pb-4">
        <Outlet />
      </main>

      <nav className="fixed bottom-0 left-0 right-0 z-20 bg-white border-t border-slate-200/60 shadow-[0_-4px_20px_rgba(0,0,0,0.05)]" style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}>
        <div className="max-w-xl mx-auto grid grid-cols-2">
          {tabs.map((t) => (
            <NavLink
              key={t.to}
              to={t.to}
              end={t.end}
              className={({ isActive }) =>
                `flex flex-col items-center justify-center py-2.5 text-[11px] font-semibold transition-all ${
                  isActive ? 'text-brand-600' : 'text-slate-400'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <div className={`p-1.5 rounded-xl mb-0.5 transition-all ${isActive ? 'bg-brand-50' : ''}`}>
                    <HeroIcon d={t.icon} className="w-5 h-5" />
                  </div>
                  {t.label}
                </>
              )}
            </NavLink>
          ))}
        </div>
      </nav>
    </div>
  )
}
