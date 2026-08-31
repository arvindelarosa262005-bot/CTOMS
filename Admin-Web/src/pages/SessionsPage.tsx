import { useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import api, { ApiResponse } from '../lib/api'
import { formatPeso } from '../lib/format'
import { useRealtimeRefresh } from '../lib/useRealtimeRefresh'
import { Badge, PageHeader, Modal } from '../components/ui'
import { toast, confirmAction } from '../components/Toast'

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
  isArchived: boolean
}

export default function SessionsPage() {
  useRealtimeRefresh(['sessions'])
  const queryClient = useQueryClient()
  const [showArchived, setShowArchived] = useState(false)
  const [showCreate, setShowCreate] = useState(false)
  const [name, setName] = useState('')
  const [date, setDate] = useState('')
  const [startTime, setStartTime] = useState('08:00')
  const [endTime, setEndTime] = useState('12:00')
  const [saving, setSaving] = useState(false)

  const { data, isLoading } = useQuery({
    queryKey: ['sessions', showArchived],
    queryFn: async () => {
      const res = await api.get<ApiResponse<SessionDto[]>>(
        `/sessions?page=1&pageSize=100${showArchived ? '&includeArchived=true' : ''}`
      )
      return res.data.data
    }
  })

  const archiveSession = async (id: string, archived: boolean) => {
    if (!confirmAction(archived ? 'Archive this session?' : 'Restore this session?')) return
    const { data } = await api.patch<ApiResponse<unknown>>(`/sessions/${id}/archive?archived=${archived}`)
    if (data.success) {
      toast(data.message)
      queryClient.invalidateQueries({ queryKey: ['sessions'] })
    } else {
      toast(data.message || 'Failed', 'error')
    }
  }

  const openCreate = () => {
    setName(`Collection ${new Date().toLocaleDateString('en-PH')}`)
    setDate(new Date().toISOString().slice(0, 10))
    setStartTime('08:00')
    setEndTime('12:00')
    setShowCreate(true)
  }

  const submitCreate = async () => {
    if (!name.trim()) {
      toast('Session name is required.', 'error')
      return
    }
    setSaving(true)
    try {
      const { data } = await api.post<ApiResponse<unknown>>('/sessions', {
        name: name.trim(),
        serviceType: 'Regular',
        date: date ? new Date(date).toISOString() : new Date().toISOString(),
        startTime: startTime + ':00',
        endTime: endTime + ':00'
      })
      if (data.success) {
        toast(data.message)
        queryClient.invalidateQueries({ queryKey: ['sessions'] })
        setShowCreate(false)
      } else {
        toast((data.errors?.[0] as string) || data.message || 'Failed to create session', 'error')
      }
    } finally {
      setSaving(false)
    }
  }

  const startSession = async (id: string) => {
    if (!confirmAction('Start this session?')) return
    const { data } = await api.post<ApiResponse<unknown>>(`/sessions/${id}/start`)
    if (data.success) toast(data.message)
    else toast(data.message || 'Failed', 'error')
    queryClient.invalidateQueries({ queryKey: ['sessions'] })
  }

  const closeSession = async (id: string) => {
    if (!confirmAction('Close this session?')) return
    const { data } = await api.post<ApiResponse<unknown>>(`/sessions/${id}/close`)
    if (data.success) toast(data.message)
    else toast(data.message || 'Failed', 'error')
    queryClient.invalidateQueries({ queryKey: ['sessions'] })
  }

  const statusColor = (s: number) => (s === 1 ? 'blue' : s === 2 ? 'green' : 'gray')
  const statusLabel = (s: number) => (s === 1 ? 'Active' : s === 2 ? 'Closed' : 'Scheduled')

  return (
    <div>
      <PageHeader title="Collection Sessions" />
      <div className="flex flex-wrap justify-between items-center gap-3 mb-4">
        <label className="flex items-center gap-1.5 text-xs sm:text-sm text-slate-600 cursor-pointer select-none order-2 sm:order-1">
          <input
            type="checkbox"
            checked={showArchived}
            onChange={(e) => setShowArchived(e.target.checked)}
            className="rounded border-slate-300"
          />
          Show Archived
        </label>
        <button onClick={openCreate} className="btn-primary order-1 sm:order-2">
          + New Session
        </button>
      </div>

      <div className="card bg-white">
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th className="th">Session</th>
                <th className="th">Status</th>
                <th className="th">Txns</th>
                <th className="th">Tithes</th>
                <th className="th">Offering</th>
                <th className="th">Total</th>
                <th className="th"></th>
              </tr>
            </thead>
            <tbody>
              {(data || []).map((s) => (
                <tr key={s.id} className="hover:bg-slate-50">
                  <td className="td">
                    <div className="font-medium text-slate-800">{s.name}</div>
                    <div className="text-xs text-slate-500">{s.date?.slice(0, 10)}</div>
                  </td>
                  <td className="td">
                    <Badge color={statusColor(s.status)}>{statusLabel(s.status)}</Badge>
                  </td>
                  <td className="td">{s.transactionCount}</td>
                  <td className="td text-emerald-600">{formatPeso(s.tithesTotal)}</td>
                  <td className="td text-brand-600">{formatPeso(s.offeringTotal)}</td>
                  <td className="td font-semibold">{formatPeso(s.grandTotal)}</td>
                  <td className="td text-right">
                    <div className="flex items-center justify-end gap-2 whitespace-nowrap">
                      {s.status === 0 && (
                        <button onClick={() => startSession(s.id)} className="text-brand-600 hover:underline text-sm">
                          Start
                        </button>
                      )}
                      {s.status === 1 && (
                        <button onClick={() => closeSession(s.id)} className="text-red-600 hover:underline text-sm">
                          Close
                        </button>
                      )}
                      <button
                        onClick={() => archiveSession(s.id, !s.isArchived)}
                        className={`text-sm hover:underline ${s.isArchived ? 'text-amber-600' : 'text-slate-400 hover:text-red-600'}`}
                      >
                        {s.isArchived ? 'Restore' : 'Archive'}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {!isLoading && data?.length === 0 && (
                <tr>
                  <td colSpan={7} className="td text-center text-slate-500 py-8">
                    No sessions
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <Modal open={showCreate} onClose={() => setShowCreate(false)} title="New Collection Session">
        <div className="space-y-4">
          <div>
            <label className="label">Session Name</label>
            <input
              className="input"
              value={name}
              onChange={(e) => setName(e.target.value)}
              autoFocus
            />
          </div>
          <div>
            <label className="label">Date</label>
            <input
              type="date"
              className="input"
              value={date}
              onChange={(e) => setDate(e.target.value)}
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Start Time</label>
              <input
                type="time"
                className="input"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
              />
            </div>
            <div>
              <label className="label">End Time</label>
              <input
                type="time"
                className="input"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
              />
            </div>
          </div>
        </div>
        <div className="flex justify-end gap-2 mt-5">
          <button onClick={() => setShowCreate(false)} className="btn-secondary">
            Cancel
          </button>
          <button onClick={submitCreate} className="btn-primary" disabled={saving}>
            {saving ? 'Creating...' : 'Create Session'}
          </button>
        </div>
      </Modal>
    </div>
  )
}
