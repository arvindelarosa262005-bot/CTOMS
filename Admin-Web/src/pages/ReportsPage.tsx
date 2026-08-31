import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import api, { ApiResponse } from '../lib/api'
import { formatPeso } from '../lib/format'
import { HeroIcon, PageHeader, StatCard } from '../components/ui'
import { toast } from '../components/Toast'

interface SessionDto {
  id: string
  name: string
  status: number
}

export default function ReportsPage() {
  const [sessionId, setSessionId] = useState('')
  const [from, setFrom] = useState('')
  const [to, setTo] = useState('')
  const [downloading, setDownloading] = useState<'pdf' | 'excel' | null>(null)

  const { data: sessions } = useQuery({
    queryKey: ['reports-sessions'],
    queryFn: async () => {
      const res = await api.get<ApiResponse<SessionDto[]>>('/sessions?page=1&pageSize=100')
      return res.data.data
    }
  })

  const { data: summary } = useQuery({
    queryKey: ['reports-summary'],
    queryFn: async () => {
      const res = await api.get<ApiResponse<{ todayTithes: number; todayOffering: number; todayGrandTotal: number }>>(
        '/dashboard/summary'
      )
      return res.data.data
    }
  })

  const download = async (type: 'pdf' | 'excel') => {
    setDownloading(type)
    try {
      const payload: {
        type: number
        from?: string
        to?: string
        sessionId?: string
      } = {
        type: sessionId ? 5 : 7
      }
      if (from) payload.from = new Date(from).toISOString()
      if (to) payload.to = new Date(to).toISOString()
      if (sessionId) payload.sessionId = sessionId

      const res = await api.post(`/reports/${type === 'pdf' ? 'pdf' : 'excel'}`, payload, {
        responseType: 'blob'
      })
      const url = window.URL.createObjectURL(new Blob([res.data]))
      const a = document.createElement('a')
      a.href = url
      a.download = `ctoms-report.${type === 'pdf' ? 'pdf' : 'xlsx'}`
      a.click()
      window.URL.revokeObjectURL(url)
      toast('Report downloaded')
    } catch {
      toast('Failed to download report', 'error')
    } finally {
      setDownloading(null)
    }
  }

  return (
    <div>
      <PageHeader title="Reports" subtitle="Generate and export collection reports" />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1 space-y-4">
          <div className="card p-5 bg-white space-y-4">
            <h2 className="font-semibold text-slate-800">Report Options</h2>
            <div>
              <label className="label">Collection Session</label>
              <select
                className="input"
                value={sessionId}
                onChange={(e) => setSessionId(e.target.value)}
              >
                <option value="">All sessions</option>
                {(sessions || []).map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="label">From date</label>
              <input type="date" className="input" value={from} onChange={(e) => setFrom(e.target.value)} />
            </div>
            <div>
              <label className="label">To date</label>
              <input type="date" className="input" value={to} onChange={(e) => setTo(e.target.value)} />
            </div>
            <div className="flex gap-2">
              <button onClick={() => download('pdf')} className="btn-primary flex-1" disabled={downloading !== null}>
                {downloading === 'pdf' ? (
                  <span className="flex items-center gap-2">
                    <div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ...
                  </span>
                ) : (
                  <>
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m.75 12l3 3m0 0l3-3m-3 3v-6m-1.5-9H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
                    </svg>
                    PDF
                  </>
                )}
              </button>
              <button onClick={() => download('excel')} className="btn-secondary flex-1" disabled={downloading !== null}>
                {downloading === 'excel' ? (
                  <span className="flex items-center gap-2">
                    <div className="h-4 w-4 border-2 border-brand-500/30 border-t-brand-500 rounded-full animate-spin" />
                    ...
                  </span>
                ) : (
                  <>
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" />
                    </svg>
                    Excel
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        <div className="lg:col-span-2">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <StatCard title="Tithes" value={formatPeso(summary?.todayTithes)} gradient="stat-gradient-1"
              icon={<HeroIcon d="M12 6v12m-3-2.818l.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />} />
            <StatCard title="Offering" value={formatPeso(summary?.todayOffering)} gradient="stat-gradient-2"
              icon={<HeroIcon d="M21 11.25v8.25a1.5 1.5 0 01-1.5 1.5H5.25a1.5 1.5 0 01-1.5-1.5v-8.25M12 4.875A2.625 2.625 0 109.375 7.5H12m0-2.625V7.5m0-2.625A2.625 2.625 0 1114.625 7.5H12m0 0V21m-8.625-9.75h18c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125h-18c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z" />} />
            <StatCard title="Grand Total" value={formatPeso(summary?.todayGrandTotal)} gradient="stat-gradient-3"
              icon={<HeroIcon d="M12 6v12m-3-2.818l.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />} />
          </div>

          <div className="card p-5 bg-white mt-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-brand-400 to-brand-600 flex items-center justify-center">
                <HeroIcon d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" className="w-5 h-5 text-white" />
              </div>
              <div>
                <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Today's Collection</div>
                <div className="text-lg font-bold text-slate-800">{formatPeso(summary?.todayGrandTotal)}</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
