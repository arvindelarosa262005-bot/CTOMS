import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { getMyTransactions, TransactionItem } from '../../lib/usher'
import { formatPeso, formatDateTime } from '../../lib/format'
import { toast } from '../../components/Toast'

export default function UsherHistoryPage() {
  const [items, setItems] = useState<TransactionItem[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getMyTransactions()
      .then(setItems)
      .catch(() => toast('Unable to load your history.', 'error'))
      .finally(() => setLoading(false))
  }, [])

  return (
    <div className="space-y-3">
      <div className="card p-4">
        <h2 className="text-lg font-bold text-slate-800">My Collections</h2>
        <p className="text-sm text-slate-500">Your submitted transactions</p>
      </div>

      {loading ? (
        <div className="card p-8 flex flex-col items-center justify-center gap-3">
          <div className="h-6 w-6 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
          <div className="text-sm text-slate-500">Loading your collections...</div>
        </div>
      ) : items.length === 0 ? (
        <div className="card p-6 text-center">
          <div className="text-4xl mb-2">📋</div>
          <p className="text-slate-600">No transactions recorded yet.</p>
          <Link to="/usher/scan" className="btn-primary mt-3">
            Scan First Envelope
          </Link>
        </div>
      ) : (
        items.map((t) => (
          <div key={t.id} className="card p-4">
            <div className="flex items-center justify-between">
              <div className="font-mono font-semibold text-slate-800">{t.envelopeCode}</div>
              <div className="text-xs text-slate-500">{formatDateTime(t.createdAt)}</div>
            </div>
            <div className="text-sm text-slate-600 mt-1">{t.donorName}</div>
            <div className="flex items-center justify-between border-t border-slate-100 mt-2 pt-2">
              <div className="text-sm space-y-0.5">
                <div className="text-slate-500">
                  Tithes: <span className="text-emerald-600 font-medium">{formatPeso(t.tithesAmount)}</span>
                </div>
                <div className="text-slate-500">
                  Offering: <span className="text-brand-600 font-medium">{formatPeso(t.offeringAmount)}</span>
                </div>
              </div>
              <div className="text-right">
                <div className="text-xs text-slate-500 uppercase">Total</div>
                <div className="font-bold text-slate-800">{formatPeso(t.totalAmount)}</div>
              </div>
            </div>
          </div>
        ))
      )}
    </div>
  )
}
