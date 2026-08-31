import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { getActiveSession, ActiveSession } from '../../lib/usher'
import { formatDate } from '../../lib/format'
import { HeroIcon } from '../../components/ui'
import { toast } from '../../components/Toast'

export default function UsherHomePage() {
  const [session, setSession] = useState<ActiveSession | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getActiveSession()
      .then(setSession)
      .catch(() => toast('Unable to load session. Please check your connection.', 'error'))
      .finally(() => setLoading(false))
  }, [])

  return (
    <div className="space-y-3">
      <div className="card p-4">
        <div className="flex items-center justify-between">
          <div className="text-sm font-semibold text-slate-600">Collection Session</div>
          {session && (
            <span className="text-xs font-bold text-brand-600 flex items-center gap-1">
              <span className="h-2 w-2 rounded-full bg-brand-500 animate-pulse" /> ACTIVE
            </span>
          )}
        </div>
        {loading ? (
          <div className="flex items-center justify-center gap-2 py-4">
            <div className="h-5 w-5 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
            <div className="text-sm text-slate-500">Loading session...</div>
          </div>
        ) : session ? (
          <div className="mt-2">
            <div className="text-xl font-bold text-slate-800 truncate">{session.name}</div>
            <div className="text-xs text-slate-500 mt-1">
              {session.serviceType || 'Service'} · {formatDate(session.date)}
            </div>
            <Link to="/usher/scan" className="btn-primary w-full !py-4 !text-base gap-2 mt-3">
              <HeroIcon d="M6.827 6.175A2.31 2.31 0 015.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 00-1.134-.175 2.31 2.31 0 01-1.64-1.055l-.822-1.316a2.192 2.192 0 00-1.736-1.039 48.774 48.774 0 00-5.232 0 2.192 2.192 0 00-1.736 1.039l-.821 1.316z M16.5 12.75a4.5 4.5 0 11-9 0 4.5 4.5 0 019 0zM18.75 10.5h.008v.008h-.008V10.5z" />
              Scan Envelope
            </Link>
          </div>
        ) : (
          <div className="mt-2">
            <div className="text-base font-medium text-slate-700">
              No active collection session right now.
            </div>
            <p className="text-sm text-slate-500 mt-1">
              Transactions can still be recorded and saved. Please contact the administrator if you
              expect an active session.
            </p>
            <Link to="/usher/scan" className="btn-primary w-full !py-4 !text-base mt-3 gap-2">
              Scan Envelope
            </Link>
          </div>
        )}
      </div>

      <div className="card p-4 text-sm text-slate-600">
        <div className="font-semibold text-slate-800 mb-2">How to record</div>
        <ol className="list-decimal pl-5 space-y-1.5 text-slate-600 list-outside">
          <li>Scan the envelope QR code</li>
          <li>Enter the donor name</li>
          <li>Enter tithes and/or offering</li>
          <li>Save the collection</li>
        </ol>
      </div>
    </div>
  )
}
