import { useMemo, useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import api, { ApiResponse } from '../lib/api'
import { Badge, PageHeader, Modal } from '../components/ui'
import { toast, confirmAction } from '../components/Toast'
import { formatDate } from '../lib/format'

interface EnvelopeDto {
  id: string
  code: string
  qrToken: string
  memberName: string | null
  status: number
  createdAt: string
  isArchived: boolean
}

export default function EnvelopesPage() {
  const queryClient = useQueryClient()
  const [search, setSearch] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [count, setCount] = useState('10')
  const [memberName, setMemberName] = useState('')
  const [saving, setSaving] = useState(false)
  const [qrView, setQrView] = useState<EnvelopeDto | null>(null)
  const [qrBase64, setQrBase64] = useState('')
  const [qrLoading, setQrLoading] = useState(false)
  const [showArchived, setShowArchived] = useState(false)

  const { data, isLoading } = useQuery({
    queryKey: ['envelopes', showArchived],
    queryFn: async () => {
      const res = await api.get<ApiResponse<{ items: EnvelopeDto[] }>>(
        `/envelopes?page=1&pageSize=200${showArchived ? '&includeArchived=true' : ''}`
      )
      return res.data.data.items
    }
  })

  const filtered = useMemo(() => {
    if (!data) return []
    const q = search.toLowerCase()
    return data.filter(
      (e) =>
        (e.code || '').toLowerCase().includes(q) ||
        (e.memberName || '').toLowerCase().includes(q)
    )
  }, [data, search])

  const generate = async () => {
    const n = parseInt(count, 10)
    if (isNaN(n) || n < 1 || n > 500) {
      toast('Count must be between 1 and 500.', 'error')
      return
    }
    setSaving(true)
    try {
      const { data } = await api.post<ApiResponse<EnvelopeDto[]>>('/envelopes/generate', {
        count: n,
        memberName: memberName.trim() || null
      })
      if (data.success) {
        toast(data.message)
        setShowModal(false)
        setCount('10')
        setMemberName('')
        queryClient.invalidateQueries({ queryKey: ['envelopes'] })
      } else {
        toast((data.errors?.[0] as string) || data.message || 'Failed', 'error')
      }
    } catch (e: unknown) {
      const msg =
        (e as { response?: { data?: { message?: string } } })?.response?.data?.message ||
        (e as Error)?.message ||
        'Failed to generate envelopes'
      toast(msg, 'error')
    } finally {
      setSaving(false)
    }
  }

  const toggleActive = async (env: EnvelopeDto) => {
    const activate = env.status !== 1
    const { data } = await api.patch<ApiResponse<unknown>>(`/envelopes/${env.id}/status/${activate}`)
    if (data.success) {
      toast(data.message)
      queryClient.invalidateQueries({ queryKey: ['envelopes'] })
    } else {
      toast(data.message || 'Failed', 'error')
    }
  }

  const archiveEnvelope = async (id: string, archived: boolean) => {
    if (!confirmAction(archived ? 'Archive this envelope?' : 'Restore this envelope?')) return
    const { data } = await api.patch<ApiResponse<unknown>>(`/envelopes/${id}/archive?archived=${archived}`)
    if (data.success) {
      toast(data.message)
      queryClient.invalidateQueries({ queryKey: ['envelopes'] })
    } else {
      toast(data.message || 'Failed', 'error')
    }
  }

  const viewQr = async (env: EnvelopeDto) => {
    setQrView(env)
    setQrBase64('')
    setQrLoading(true)
    try {
      const { data } = await api.get<{ qrPngBase64: string; envelope: EnvelopeDto }>(
        `/envelopes/${env.id}/qr`
      )
      if (data?.qrPngBase64) setQrBase64(data.qrPngBase64)
      else toast('Failed to load QR code', 'error')
    } catch {
      toast('Failed to load QR code', 'error')
    } finally {
      setQrLoading(false)
    }
  }

  const printQr = () => {
    window.print()
  }

  return (
    <div>
      <PageHeader title="Envelopes" subtitle="Envelope codes are auto-generated for ushers to scan" />

      <div className="flex flex-wrap gap-2 sm:gap-3 mb-4 items-center">
        <input
          className="input max-w-xs flex-1 min-w-[140px]"
          placeholder="Search code / member..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <button onClick={() => setShowModal(true)} className="btn-primary">
          + Generate
        </button>
        <label className="flex items-center gap-1.5 text-xs sm:text-sm text-slate-600 cursor-pointer select-none">
          <input
            type="checkbox"
            checked={showArchived}
            onChange={(e) => setShowArchived(e.target.checked)}
            className="rounded border-slate-300"
          />
          Show Archived
        </label>
      </div>

      <div className="card bg-white">
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th className="th">Envelope Code</th>
                <th className="th">Member</th>
                <th className="th">Created</th>
                <th className="th">Status</th>
                <th className="th"></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((e) => (
                <tr key={e.id} className="hover:bg-slate-50">
                  <td className="td font-mono font-semibold">{e.code}</td>
                  <td className="td">{e.memberName || '—'}</td>
                  <td className="td text-slate-500">{formatDate(e.createdAt)}</td>
                  <td className="td">
                    <Badge color={e.status === 1 ? 'green' : 'gray'}>
                      {e.status === 1 ? 'Active' : 'Disabled'}
                    </Badge>
                  </td>
                  <td className="td text-right">
                    <div className="flex items-center justify-end gap-2 whitespace-nowrap">
                      <button
                        onClick={() => viewQr(e)}
                        className="text-sm text-brand-600 hover:underline"
                      >
                        View QR
                      </button>
                      <button
                        onClick={() => toggleActive(e)}
                        className="text-sm text-slate-500 hover:underline"
                      >
                        {e.status === 1 ? 'Disable' : 'Activate'}
                      </button>
                      <button
                        onClick={() => archiveEnvelope(e.id, !e.isArchived)}
                        className={`text-sm hover:underline ${e.isArchived ? 'text-amber-600' : 'text-slate-400 hover:text-red-600'}`}
                      >
                        {e.isArchived ? 'Restore' : 'Archive'}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {!isLoading && filtered.length === 0 && (
                <tr>
                  <td colSpan={5} className="td text-center text-slate-500 py-8">
                    No envelopes
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <Modal open={showModal} onClose={() => setShowModal(false)} title="Generate Envelopes">
        <p className="text-sm text-slate-500 mb-4 -mt-2">
          The envelope code is generated automatically for each new envelope.
        </p>
        <div className="space-y-3">
          <div>
            <label className="label">How many to generate</label>
            <input
              className="input"
              type="number"
              min={1}
              max={500}
              value={count}
              onChange={(e) => setCount(e.target.value)}
            />
          </div>
          <div>
            <label className="label">Member Name (optional)</label>
            <input
              className="input"
              value={memberName}
              onChange={(e) => setMemberName(e.target.value)}
              placeholder="e.g. Juan Dela Cruz"
            />
          </div>
        </div>
        <div className="flex justify-end gap-2 mt-5">
          <button onClick={() => setShowModal(false)} className="btn-secondary">
            Cancel
          </button>
          <button onClick={generate} className="btn-primary" disabled={saving}>
            {saving ? 'Generating...' : 'Generate'}
          </button>
        </div>
      </Modal>

      {qrView && (
        <div id="print-area" className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setQrView(null)} />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 text-center">
            <h2 className="text-lg font-bold text-slate-800 mb-1">{qrView.code}</h2>
            <p className="text-sm text-slate-500 mb-4">
              {qrView.memberName || 'No member'} ·{' '}
              {qrView.status === 1 ? 'Active' : 'Disabled'}
            </p>
            <div className="bg-white border border-slate-200 rounded-lg p-4 mx-auto w-52 h-52 sm:w-56 sm:h-56 flex items-center justify-center">
              {qrLoading ? (
                <div className="flex flex-col items-center gap-2">
                  <div className="h-6 w-6 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
                  <span className="text-sm text-slate-500">Loading QR...</span>
                </div>
              ) : qrBase64 ? (
                <img src={`data:image/png;base64,${qrBase64}`} alt={qrView.code} className="w-full h-full object-contain print-img" />
              ) : (
                <span className="text-sm text-slate-400">No QR</span>
              )}
            </div>
            <p className="text-xs text-slate-500 mt-3 print-hide">
              Scan this QR code with the usher app to record a collection.
            </p>
            <div className="flex justify-center gap-2 mt-4 print-hide">
              <button onClick={() => setQrView(null)} className="btn-secondary">
                Close
              </button>
              {qrBase64 && (
                <button onClick={printQr} className="btn-primary">
                  Print
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
