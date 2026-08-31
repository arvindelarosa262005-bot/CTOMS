import { useState, useEffect, useCallback } from 'react'
import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { useAuth } from '../lib/auth'
import { HeroIcon } from './ui'

const nav = [
  { to: '/app', label: 'Dashboard', icon: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6', end: true },
  { to: '/app/live', label: 'Live Collection', icon: 'M5.636 18.364a9 9 0 010-12.728m12.728 0a9 9 0 010 12.728m-9.9-2.829a5 5 0 010-7.07m7.072 0a5 5 0 010 7.07M13 12a1 1 0 11-2 0 1 1 0 012 0z' },
  { to: '/app/sessions', label: 'Sessions', icon: 'M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z' },
  { to: '/app/envelopes', label: 'Envelopes', icon: 'M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4' },
  { to: '/app/users', label: 'Users & Ushers', icon: 'M12 4.354a4 4 0 110 7.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0zM12.75 12a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z' },
  { to: '/app/transactions', label: 'Transactions', icon: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01' },
  { to: '/app/reports', label: 'Reports', icon: 'M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z' },
  { to: '/app/gis', label: 'Donor Map', icon: 'M12 21a9 9 0 100-18 9 9 0 000 18zm0 0c3.866 0 7-4.03 7-9s-3.134-9-7-9-7 4.03-7 9 3.134 9 7 9zm-3-9a3 3 0 116 0 3 3 0 01-6 0z' },
  { to: '/app/audit', label: 'Audit Logs', icon: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z' },
  { to: '/app/settings', label: 'Settings', icon: 'M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z M15 12a3 3 0 11-6 0 3 3 0 016 0z' }
]

export default function Layout() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [mobileOpen, setMobileOpen] = useState(false)
  const [collapsed, setCollapsed] = useState(false)

  const closeMobile = useCallback(() => setMobileOpen(false), [])

  useEffect(() => {
    if (!mobileOpen) return
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') closeMobile() }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [mobileOpen, closeMobile])

  const handleLogout = async () => {
    await logout()
    navigate('/login')
  }

  const renderSidebar = (collapsed: boolean) => (
    <div className="flex h-full flex-col bg-white border-r border-slate-200 transition-all duration-200">
      <div className={`flex items-center ${collapsed ? 'justify-center' : 'gap-3 px-5'} h-16 border-b border-slate-200`}>
        <img
          src="https://scontent.fmnl34-1.fna.fbcdn.net/v/t39.30808-1/538264880_810797361377430_5249056959724717023_n.jpg?stp=dst-jpg_tt6&cstp=mx500x500&ctp=s200x200&_nc_cat=107&ccb=1-7&_nc_sid=1d2534&_nc_eui2=AeHeAFiYmByu479r2d3WrpELUgglzeMTKRZSCCXN4xMpFoI6LyAZVYYXycTYePAa0yqiFPh27IEK3KS9kYKLad2B&_nc_ohc=Avl6cTvQkj4Q7kNvwF9gLRZ&_nc_oc=Ado6QuURayVvqG75lYAwzC9EnZglWmcsxRIcnUdJNfDIHoMtIgFG6phZHhXUu2BN3241LBWPbs8fb2ORb_jHOlFw&_nc_zt=24&_nc_ht=scontent.fmnl34-1.fna&_nc_gid=bv1ag5gyO6qcXcXC6f33Nw&_nc_ss=7b2a8&oh=00_AQLtf7d7P5JVrE23TtVol7iZDBlB2KzXEjKx4u8tJ6_lbQ&oe=6A9B81DA"
          alt="Church logo"
          className="h-10 w-10 rounded-xl object-cover shadow-md ring-1 ring-slate-200 flex-shrink-0"
        />
        {!collapsed && (
          <div className="min-w-0">
            <div className="font-bold text-slate-900 leading-tight text-[15px]">CTOMS</div>
            <div className="text-[10px] text-slate-500 leading-tight font-medium">Church Finance</div>
          </div>
        )}
      </div>

      {!collapsed && (
        <div className="px-3 pt-4 pb-2">
          <div className="px-3 text-[11px] font-semibold uppercase tracking-wider text-slate-400">Main Menu</div>
        </div>
      )}

      <nav className={`flex-1 overflow-y-auto ${collapsed ? 'px-2' : 'px-3'} pb-3 pt-2 space-y-1`}>
        {nav.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            onClick={closeMobile}
            title={collapsed ? item.label : undefined}
            className={({ isActive }) =>
              `sidebar-link ${collapsed ? '!justify-center !px-0' : ''} ${isActive ? 'sidebar-link-active' : 'sidebar-link-inactive'}`
            }
          >
            <HeroIcon d={item.icon} className="w-5 h-5 flex-shrink-0" />
            {!collapsed && <span className="truncate">{item.label}</span>}
          </NavLink>
        ))}
      </nav>

      <div className="p-3 border-t border-slate-200 space-y-2">
        <div className={`flex items-center ${collapsed ? 'justify-center' : 'gap-3'} ${collapsed ? 'px-0 py-1' : 'px-3 py-3'} rounded-xl ${collapsed ? 'bg-transparent border-0' : 'bg-slate-50 border border-slate-200'}`}>
          <div className="h-9 w-9 rounded-full bg-gradient-to-br from-brand-500 to-brand-700 flex items-center justify-center text-white font-semibold text-sm shadow flex-shrink-0">
            {user?.fullName?.charAt(0) || 'A'}
          </div>
          {!collapsed && (
            <div className="min-w-0 flex-1">
              <div className="text-sm font-semibold text-slate-800 truncate">{user?.fullName}</div>
              <div className="text-[11px] text-slate-500 truncate">{user?.role}</div>
            </div>
          )}
        </div>
        <button
          onClick={handleLogout}
          className={`btn-secondary ${collapsed ? '!w-10 !mx-auto !px-0 !justify-center' : 'w-full justify-start'} !py-2.5 text-sm`}
          title={collapsed ? 'Sign out' : undefined}
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15m3 0l3-3m0 0l-3-3m3 3H9" />
          </svg>
          {!collapsed && 'Sign out'}
        </button>
      </div>
    </div>
  )

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Desktop sidebar */}
      <div className={`hidden md:block fixed inset-y-0 left-0 ${collapsed ? 'w-16' : 'w-64'} z-30 transition-all duration-200`}>
        {renderSidebar(collapsed)}
        <button
          onClick={() => setCollapsed((c) => !c)}
          aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          className={`absolute -right-3 top-16 z-10 h-6 w-6 rounded-full bg-white border border-slate-200 shadow-md flex items-center justify-center text-slate-500 hover:text-brand-600 hover:border-brand-400 transition-colors`}
        >
          <svg className={`w-3.5 h-3.5 transition-transform duration-200 ${collapsed ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
          </svg>
        </button>
      </div>

      <div className={`${collapsed ? 'md:pl-16' : 'md:pl-64'} transition-all duration-200`}>
        <header className="sticky top-0 z-20 h-14 sm:h-16 bg-white border-b border-slate-200 flex items-center px-4 sm:px-6 lg:px-8">
          <button
            onClick={() => setMobileOpen(true)}
            className="md:hidden btn-secondary !px-3 !py-2"
            aria-label="Open menu"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
            </svg>
          </button>
          <div className="ml-3 sm:ml-4 md:ml-8 min-w-0">
            <div className="font-extrabold text-slate-900 text-sm sm:text-base truncate">Church Tithes & Offering Management</div>
            <div className="text-[11px] sm:text-xs text-slate-500 truncate mt-0.5">Welcome, {user?.fullName?.split(' ')[0]}</div>
          </div>
        </header>

        <main className="mx-auto w-full max-w-7xl p-3 sm:p-4 lg:p-6 lg:px-8">
          <Outlet />
        </main>
      </div>

      {/* Mobile sidebar overlay */}
      <div className={`fixed inset-0 z-40 md:hidden transition-opacity duration-200 ${mobileOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}>
        <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={closeMobile} />
        <div className={`absolute inset-y-0 left-0 w-64 bg-white shadow-2xl transition-transform duration-200 ease-out ${mobileOpen ? 'translate-x-0' : '-translate-x-full'}`}>
          <button onClick={closeMobile} className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 transition-colors p-1 rounded-lg hover:bg-slate-100">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
          {renderSidebar(false)}
        </div>
      </div>
    </div>
  )
}
