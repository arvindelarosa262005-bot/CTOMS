import { useState } from 'react'
import { useLocation, useNavigate, Link } from 'react-router-dom'
import { createTransaction } from '../../lib/usher'
import { formatPeso } from '../../lib/format'
import { toast } from '../../components/Toast'

function newUuid(): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) return crypto.randomUUID()
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0
    const v = c === 'x' ? r : (r & 0x3) | 0x8
    return v.toString(16)
  })
}

interface RecordState {
  envelopeId: string
  envelopeCode: string
  previousMemberName: string | null
  hasHistory: boolean
}

export default function UsherRecordPage() {
  const location = useLocation()
  const navigate = useNavigate()
  const state = (location.state || {}) as Partial<RecordState>

  const envelopeId = (state.envelopeId || '') as string
  const envelopeCode = (state.envelopeCode || '') as string

  const [donorName, setDonorName] = useState('')
  const [tithes, setTithes] = useState('')
  const [offering, setOffering] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [saved, setSaved] = useState(false)

  const showUsePrevious =
    !!state.previousMemberName && (state.hasHistory || !!state.previousMemberName)

  const total = (parseFloat(tithes) || 0) + (parseFloat(offering) || 0)

  const sanitizeAmount = (value: string) => {
    let v = value.replace(/[^0-9.]/g, '')
    const firstDot = v.indexOf('.')
    if (firstDot !== -1) {
      const intPart = v.slice(0, firstDot)
      const decPart = v.slice(firstDot + 1).replace(/\./g, '')
      v = intPart + '.' + decPart
      if (decPart.length > 2) v = intPart + '.' + decPart.slice(0, 2)
    }
    return v
  }

  if (!envelopeId) {
    return (
      <div className="card p-6 text-center">
        <p className="text-slate-600 mb-3">No envelope selected. Please scan a QR code first.</p>
        <Link to="/usher/scan" className="btn-primary w-full">
          Scan Envelope
        </Link>
      </div>
    )
  }

  const submit = async () => {
    if (!donorName.trim()) {
      toast('Please enter the donor name.', 'error')
      return
    }
    const t = parseFloat(tithes) || 0
    const o = parseFloat(offering) || 0
    if (t < 0 || o < 0) {
      toast('Amounts cannot be negative.', 'error')
      return
    }
    if (t <= 0 && o <= 0) {
      toast('Enter at least one amount (tithes or offering).', 'error')
      return
    }
    setSubmitting(true)
    const res = await createTransaction({
      envelopeId,
      sessionId: null,
      donorName: donorName.trim(),
      tithes: t,
      offering: o,
      transactionUuid: newUuid()
    })
    setSubmitting(false)
    if (res.ok) {
      setSaved(true)
    } else {
      toast(res.message || 'Failed to record transaction.', 'error')
    }
  }

  if (saved) {
    return (
      <div className="card p-6 text-center">
        <div className="text-5xl mb-3">✅</div>
        <div className="text-lg font-bold text-emerald-600">Saved Successfully</div>
        <div className="mt-2 bg-slate-50 rounded-lg p-3">
          <div className="text-xs text-slate-500 uppercase">Envelope</div>
          <div className="font-mono font-bold text-slate-800">{envelopeCode}</div>
          <div className="text-xs text-slate-500 uppercase mt-2">Donor</div>
          <div className="font-medium text-slate-800">{donorName}</div>
          <div className="mt-2 space-y-1 text-sm">
            <div className="flex justify-between">
              <span className="text-slate-500">Tithes</span>
              <span className="font-semibold text-emerald-600">{formatPeso(parseFloat(tithes) || 0)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Offering</span>
              <span className="font-semibold text-brand-600">{formatPeso(parseFloat(offering) || 0)}</span>
            </div>
            <div className="flex justify-between border-t border-slate-200 pt-1">
              <span className="font-semibold text-slate-700">Total</span>
              <span className="font-bold text-slate-800">{formatPeso(total)}</span>
            </div>
          </div>
        </div>
        <div className="flex gap-2 mt-4">
          <Link to="/usher/scan" className="btn-primary flex-1 !py-4">
            Scan Next
          </Link>
          <Link to="/usher/history" className="btn-secondary flex-1">
            View History
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      <div className="card p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1 text-emerald-600 font-semibold text-sm">
            ✓ ENVELOPE VERIFIED
          </div>
          <Link to="/usher/scan" className="text-xs text-brand-700 underline">
            Rescan
          </Link>
        </div>
        <div className="text-center mt-1">
          <div className="font-mono font-bold text-lg text-slate-800">{envelopeCode}</div>
        </div>
      </div>

      {showUsePrevious && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
          <div className="text-xs text-amber-700 font-semibold">PREVIOUS RECORD FOUND</div>
          <div className="text-sm text-amber-800">
            Previous name: <span className="font-semibold">{state.previousMemberName}</span>
          </div>
          <div className="flex gap-2 mt-2">
            <button
              onClick={() => setDonorName(state.previousMemberName || '')}
              className="btn-primary flex-1 text-xs sm:text-sm !py-2.5"
            >
              Use Previous Name
            </button>
          </div>
        </div>
      )}

      <div className="card p-4">
        <label className="label">Donor Name</label>
        <input
          className="input !py-3 !text-base"
          value={donorName}
          onChange={(e) => setDonorName(e.target.value)}
          placeholder="Enter donor name"
          autoComplete="off"
        />

        <div className="mt-4">
          <label className="label">Tithes (₱)</label>
          <input
            className="input !py-3 !text-lg font-semibold"
            inputMode="decimal"
            value={tithes}
            onChange={(e) => setTithes(sanitizeAmount(e.target.value))}
            placeholder="0.00"
          />
        </div>

        <div className="mt-4">
          <label className="label">Offering (₱)</label>
          <input
            className="input !py-3 !text-lg font-semibold"
            inputMode="decimal"
            value={offering}
            onChange={(e) => setOffering(sanitizeAmount(e.target.value))}
            placeholder="0.00"
          />
        </div>

        <div className="mt-4 flex items-center justify-between bg-slate-50 rounded-lg p-3">
          <span className="text-sm font-semibold text-slate-600 uppercase">Total</span>
          <span className="text-2xl font-bold text-slate-800">{formatPeso(total)}</span>
        </div>

        <button
          onClick={submit}
          disabled={submitting}
          className="btn-primary w-full !py-5 !text-lg mt-4 gap-2"
        >
          {submitting ? 'Saving...' : 'Save Collection'}
        </button>
      </div>
    </div>
  )
}
