import { useQuery, useQueryClient } from '@tanstack/react-query'
import api, { ApiResponse } from '../lib/api'
import { formatPeso, formatTime } from '../lib/format'
import { useRealtimeRefresh } from '../lib/useRealtimeRefresh'
import { Badge, PageHeader } from '../components/ui'
import { toast, confirmAction } from '../components/Toast'
import { useEffect, useState } from 'react'

interface SessionDto {
  id: string
  name: string
  serviceType: string
  date: string
  startTime: string | null
  endTime: string | null
  status: number
  transactionCount: number
  tithesTotal: number
  offeringTotal: number
  grandTotal: number
}

export default function LiveCollectionPage() {
  useRealtimeRefresh(['sessions', 'transactions'])
  const queryClient = useQueryClient()

  const { data: sessions, isLoading } = useQuery({
    queryKey: ['sessions'],
    queryFn: async () => {
      const res = await api.get<ApiResponse<SessionDto[]>>('/sessions?page=1&pageSize=50')
      return res.data.data
    }
  })

  const active = sessions?.find((s) => s.status === 1) || null

  const startSession = async () => {
    if (!confirmAction('Start a new collection session now?')) return
    const name = window.prompt('Session name:', `Collection ${new Date().toLocaleDateString('en-PH')}`)
    if (!name) return
    const { data } = await api.post<ApiResponse<unknown>>('/sessions', {
      name,
      sessionDate: new Date().toISOString()
    })
    if (data.success) {
      toast(data.message)
      queryClient.invalidateQueries({ queryKey: ['sessions'] })
    } else {
      toast(data.message || 'Failed to start session', 'error')
    }
  }

  const closeSession = async (id: string) => {
    if (!confirmAction('Close this collection session?')) return
    const { data } = await api.post<ApiResponse<unknown>>(`/sessions/${id}/close`)
    if (data.success) {
      toast(data.message)
      queryClient.invalidateQueries({ queryKey: ['sessions'] })
    } else {
      toast(data.message || 'Failed to close session', 'error')
    }
  }

  const statusColor = (s: number) => (s === 1 ? 'blue' : s === 2 ? 'green' : 'gray')
  const statusLabel = (s: number) => (s === 1 ? 'Active' : s === 2 ? 'Closed' : 'Scheduled')

  return (
    <div>
      <PageHeader title="Live Collection" subtitle="Monitor active collection in real time" />

      {active ? (
        <div className="card p-6 mb-5 bg-white">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-3">
                <span className="h-3 w-3 rounded-full bg-red-500 animate-ping" />
                <h2 className="text-lg font-bold text-slate-800">LIVE</h2>
              </div>
              <div className="text-sm text-slate-500 mt-1">Session started at {formatTime(active.startTime)}</div>            </div>
            <div className="grid grid-cols-3 gap-6 text-center">
              <div>
                <div className="text-xs text-slate-500 uppercase">Tithes</div>
                <div className="text-lg font-bold text-emerald-600">{formatPeso(active.tithesTotal)}</div>
              </div>
              <div>
                <div className="text-xs text-slate-500 uppercase">Offering</div>
                <div className="text-lg font-bold text-brand-600">{formatPeso(active.offeringTotal)}</div>
              </div>
              <div>
                <div className="text-xs text-slate-500 uppercase">Total</div>
                <div className="text-lg font-bold text-slate-800">{formatPeso(active.grandTotal)}</div>
              </div>
            </div>
            <button onClick={() => closeSession(active.id)} className="btn-danger">
              End Session
            </button>
          </div>
          <div className="mt-4 text-xs text-slate-500">
            {active.transactionCount} transactions
          </div>
        </div>
      ) : (
        <div className="card p-6 mb-5 text-center bg-white">
          <div className="text-slate-500 mb-3">No active collection session</div>
          <button onClick={startSession} className="btn-primary">
            ▶ Start Collection
          </button>
        </div>
      )}

      <div className="card overflow-hidden bg-white">
        <table className="w-full">
          <thead>
            <tr>
              <th className="th">Session</th>
              <th className="th">Date</th>
              <th className="th">Status</th>
              <th className="th">Tithes</th>
              <th className="th">Offering</th>
              <th className="th">Total</th>
            </tr>
          </thead>
          <tbody>
            {(sessions || []).map((s) => (
              <tr key={s.id} className="hover:bg-slate-50">
                <td className="td font-medium text-slate-800">{s.name}</td>
                <td className="td">{s.date?.slice(0, 10)}</td>
                <td className="td">
                  <Badge color={statusColor(s.status)}>{statusLabel(s.status)}</Badge>
                </td>
                <td className="td text-emerald-600">{formatPeso(s.tithesTotal)}</td>
                <td className="td text-brand-600">{formatPeso(s.offeringTotal)}</td>
                <td className="td font-semibold">{formatPeso(s.grandTotal)}</td>
              </tr>
            ))}
            {!isLoading && sessions?.length === 0 && (
              <tr>
                <td colSpan={6} className="td text-center text-slate-500 py-8">
                  No sessions yet
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
