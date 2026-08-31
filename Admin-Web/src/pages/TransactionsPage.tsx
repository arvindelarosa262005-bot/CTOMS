import { useMemo, useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import api, { ApiResponse } from '../lib/api'
import { formatPeso, formatDateTime } from '../lib/format'
import { useRealtimeRefresh } from '../lib/useRealtimeRefresh'
import { Badge, PageHeader, Modal } from '../components/ui'
import { toast, confirmAction } from '../components/Toast'

interface TransactionDto {
  id: string
  envelopeCode: string
  donorName: string
  collectionSessionName: string
  usherName: string
  tithesAmount: number
  offeringAmount: number
  totalAmount: number
  status: number
  createdAt: string
  voidReason: string | null
  isArchived: boolean
}

export default function TransactionsPage() {
  useRealtimeRefresh(['transactions'])
  const queryClient = useQueryClient()
  const [statusFilter, setStatusFilter] = useState('all')
  const [showArchived, setShowArchived] = useState(false)
  const [voidTarget, setVoidTarget] = useState<string | null>(null)
  const [voidReason, setVoidReason] = useState('')
  const [voiding, setVoiding] = useState(false)

  const { data, isLoading } = useQuery({
    queryKey: ['transactions', showArchived],
    queryFn: async () => {
      const res = await api.get<ApiResponse<{ items: TransactionDto[]; totalCount: number }>>(
        `/transactions?page=1&pageSize=200${showArchived ? '&includeArchived=true' : ''}`
      )
      return res.data.data.items
    }
  })

  const archiveTransaction = async (id: string, archived: boolean) => {
    if (!confirmAction(archived ? 'Archive this transaction?' : 'Restore this transaction?')) return
    const { data } = await api.patch<ApiResponse<unknown>>(`/transactions/${id}/archive?archived=${archived}`)
    if (data.success) {
      toast(data.message)
      queryClient.invalidateQueries({ queryKey: ['transactions'] })
    } else {
      toast(data.message || 'Failed', 'error')
    }
  }

  const filtered = useMemo(() => {
    if (!data) return []
    if (statusFilter === 'all') return data
    return data.filter((t) => (statusFilter === 'voided' ? t.status === 3 : t.status === 1))
  }, [data, statusFilter])

  const submitVoid = async () => {
    if (!voidTarget || !voidReason.trim()) return
    setVoiding(true)
    try {
      const { data } = await api.post<ApiResponse<unknown>>(`/transactions/${voidTarget}/void`, { reason: voidReason.trim() })
      if (data.success) {
        toast(data.message)
        queryClient.invalidateQueries({ queryKey: ['transactions'] })
        setVoidTarget(null)
        setVoidReason('')
      } else {
        toast(data.message || 'Failed to void', 'error')
      }
    } finally {
      setVoiding(false)
    }
  }

  return (
    <div>
      <PageHeader title="Transactions" subtitle="All recorded tithes and offerings" />

      <div className="flex flex-wrap gap-2 mb-4 items-center">
        {['all', 'active', 'voided'].map((f) => (
          <button
            key={f}
            onClick={() => setStatusFilter(f)}
            className={`btn !px-3 !py-1.5 text-xs sm:!px-4 sm:!py-2 sm:text-sm ${statusFilter === f ? 'btn-primary' : 'btn-secondary'}`}
          >
            {f === 'all' ? 'All' : f === 'active' ? 'Active' : 'Voided'}
          </button>
        ))}
        <label className="ml-auto sm:ml-4 flex items-center gap-1.5 text-xs sm:text-sm text-slate-600 cursor-pointer select-none">
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
                <th className="th">Envelope</th>
                <th className="th">Family</th>
                <th className="th">Session</th>
                <th className="th">Usher</th>
                <th className="th">Tithes</th>
                <th className="th">Offering</th>
                <th className="th">Total</th>
                <th className="th">Date</th>
                <th className="th">Status</th>
                <th className="th"></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((t) => (
                <tr key={t.id} className="hover:bg-slate-50">
                  <td className="td font-mono font-semibold">{t.envelopeCode}</td>
                  <td className="td">{t.donorName}</td>
                  <td className="td">{t.collectionSessionName}</td>
                  <td className="td">{t.usherName}</td>
                  <td className="td text-emerald-600">{formatPeso(t.tithesAmount)}</td>
                  <td className="td text-brand-600">{formatPeso(t.offeringAmount)}</td>
                  <td className="td font-semibold">{formatPeso(t.totalAmount)}</td>
                  <td className="td">{formatDateTime(t.createdAt)}</td>
                  <td className="td">
                    <Badge color={t.status === 3 ? 'red' : 'green'}>
                      {t.status === 3 ? 'Voided' : 'Recorded'}
                    </Badge>
                  </td>
                  <td className="td text-right">
                    <div className="flex items-center justify-end gap-2">
                      {t.status === 1 && (
                        <button
                          onClick={() => { setVoidTarget(t.id); setVoidReason('') }}
                          className="text-sm text-red-600 hover:underline whitespace-nowrap"
                        >
                          Void
                        </button>
                      )}
                      {t.status === 3 && t.voidReason && (
                        <span className="text-xs text-slate-400 truncate max-w-[80px]" title={t.voidReason}>
                          {t.voidReason.length > 10 ? t.voidReason.slice(0, 10) + '…' : t.voidReason}
                        </span>
                      )}
                      <button
                        onClick={() => archiveTransaction(t.id, !t.isArchived)}
                        className={`text-sm hover:underline whitespace-nowrap ${t.isArchived ? 'text-amber-600' : 'text-slate-400 hover:text-red-600'}`}
                      >
                        {t.isArchived ? 'Restore' : 'Archive'}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {!isLoading && filtered.length === 0 && (
                <tr>
                  <td colSpan={10} className="td text-center text-slate-500 py-8">
                    No transactions
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <Modal open={!!voidTarget} onClose={() => setVoidTarget(null)} title="Void Transaction">
        <p className="text-sm text-slate-500 mb-4">
          Enter a reason for voiding this transaction. This cannot be undone.
        </p>
        <textarea
          className="input min-h-[100px]"
          placeholder="Reason for voiding..."
          value={voidReason}
          onChange={(e) => setVoidReason(e.target.value)}
          autoFocus
        />
        <div className="flex justify-end gap-2 mt-5">
          <button onClick={() => setVoidTarget(null)} className="btn-secondary">
            Cancel
          </button>
          <button onClick={submitVoid} className="btn-danger" disabled={!voidReason.trim() || voiding}>
            {voiding ? 'Voiding...' : 'Confirm Void'}
          </button>
        </div>
      </Modal>
    </div>
  )
}
