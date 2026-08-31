import { ReactNode, useEffect } from 'react'

export function HeroIcon({ d, className = 'w-5 h-5' }: { d: string; className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d={d} />
    </svg>
  )
}

export function StatCard({
  title,
  value,
  icon,
  gradient = 'stat-gradient-1'
}: {
  title: string
  value: string | number
  icon: ReactNode
  gradient?: string
}) {
  return (
    <div className="card overflow-hidden relative">
      <div className={`absolute top-0 right-0 w-24 h-24 ${gradient} opacity-10 rounded-bl-[3rem]`} />
      <div className="p-4 sm:p-5 relative">
        <div className="flex items-center justify-between gap-3">
          <div className="min-w-0">
            <div className="text-[11px] sm:text-xs font-semibold text-slate-500 uppercase tracking-wider truncate">{title}</div>
            <div className="text-xl sm:text-2xl font-bold mt-1.5 sm:mt-2 text-slate-800 truncate">{value}</div>
          </div>
          <div className={`h-10 w-10 sm:h-11 sm:w-11 rounded-xl ${gradient} flex items-center justify-center text-white shadow-lg flex-shrink-0`}>
            {icon}
          </div>
        </div>
      </div>
    </div>
  )
}

export function PageHeader({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <div className="mb-5 sm:mb-6">
      <h1 className="text-xl sm:text-2xl font-bold text-slate-800">{title}</h1>
      {subtitle && <p className="text-xs sm:text-sm text-slate-500 mt-1">{subtitle}</p>}
    </div>
  )
}

export function Badge({ children, color = 'green' }: { children: ReactNode; color?: 'green' | 'red' | 'yellow' | 'gray' | 'blue' }) {
  const colors = {
    green: 'bg-emerald-50 text-emerald-700 ring-emerald-600/20',
    red: 'bg-red-50 text-red-700 ring-red-600/20',
    yellow: 'bg-amber-50 text-amber-700 ring-amber-600/20',
    gray: 'bg-slate-100 text-slate-600 ring-slate-500/20',
    blue: 'bg-brand-50 text-brand-700 ring-brand-600/20'
  }
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ring-1 ring-inset truncate max-w-full ${colors[color]}`}>
      {children}
    </span>
  )
}

export function Modal({ open, onClose, title, children }: { open: boolean; onClose: () => void; title: string; children: ReactNode }) {
  useEffect(() => {
    if (!open) return
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [open, onClose])

  if (!open) return null
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-slate-800">{title}</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 transition-colors p-1 rounded-lg hover:bg-slate-100">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        {children}
      </div>
    </div>
  )
}
