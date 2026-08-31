import { useEffect, useMemo, useRef, useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import api, { ApiResponse } from '../lib/api'
import { formatPeso, formatDate } from '../lib/format'
import { PageHeader } from '../components/ui'
import { toast } from '../components/Toast'

interface SessionDto {
  id: string
  name: string
  status: number
}

interface DonorMapDto {
  id: string
  name: string
  latitude: number | null
  longitude: number | null
  totalAmount: number
  transactionCount: number
  lastContributionAt: string | null
}

// Default map center (Philippines). Could read from church address later.
const DEFAULT_CENTER: [number, number] = [14.5995, 120.9842]
const DEFAULT_ZOOM = 11

function markerColor(amount: number): string {
  if (amount >= 50000) return '#dc2626' // red - largest
  if (amount >= 20000) return '#ea580c' // orange
  if (amount >= 10000) return '#d97706' // amber
  if (amount >= 5000) return '#2563eb' // blue
  if (amount >= 1000) return '#0891b2' // cyan
  return '#64748b' // slate - small
}

function markerSize(amount: number): number {
  if (amount >= 50000) return 26
  if (amount >= 20000) return 22
  if (amount >= 10000) return 19
  if (amount >= 5000) return 16
  if (amount >= 1000) return 13
  return 10
}

export default function GisMapPage() {
  const queryClient = useQueryClient()
  const [sessionId, setSessionId] = useState('')
  const [from, setFrom] = useState('')
  const [to, setTo] = useState('')
  const [selectedDonorName, setSelectedDonorName] = useState<string | null>(null)
  const [draft, setDraft] = useState<{ lat: number; lng: number } | null>(null)
  const [popupMsg, setPopupMsg] = useState('')
  const [saving, setSaving] = useState(false)
  const [newName, setNewName] = useState('')

  const mapRef = useRef<L.Map | null>(null)
  const markersRef = useRef<L.LayerGroup | null>(null)
  const draftRef = useRef<L.Marker | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  const { data: sessions } = useQuery({
    queryKey: ['gis-sessions'],
    queryFn: async () => {
      const res = await api.get<ApiResponse<SessionDto[]>>('/sessions?page=1&pageSize=100')
      return res.data.data
    }
  })

  const queryParams = useMemo(() => {
    const p = new URLSearchParams()
    if (sessionId) p.set('sessionId', sessionId)
    if (from) p.set('from', new Date(from).toISOString())
    if (to) p.set('to', new Date(to).toISOString())
    return p.toString()
  }, [sessionId, from, to])

  const { data: donors, isLoading } = useQuery({
    queryKey: ['gis-donors', queryParams],
    queryFn: async () => {
      const res = await api.get<ApiResponse<DonorMapDto[]>>(`/gis/donors?${queryParams}`)
      return res.data.data || []
    }
  })

  // Initialize map once
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return
    const map = L.map(containerRef.current, { center: DEFAULT_CENTER, zoom: DEFAULT_ZOOM })
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap contributors',
      maxZoom: 19
    }).addTo(map)
    mapRef.current = map
    markersRef.current = L.layerGroup().addTo(map)
    return () => {
      map.remove()
      mapRef.current = null
      markersRef.current = null
    }
  }, [])

  // Render markers when donors change
  useEffect(() => {
    const layer = markersRef.current
    const map = mapRef.current
    if (!layer || !map || !donors) return
    layer.clearLayers()

    donors.forEach((d) => {
      if (d.latitude == null || d.longitude == null) return
      const latlng: [number, number] = [d.latitude, d.longitude]
      const color = markerColor(d.totalAmount)
      const size = markerSize(d.totalAmount)
      const icon = L.divIcon({
        className: '',
        html: `<div style="width:${size}px;height:${size}px;border-radius:9999px;background:${color};border:2px solid #fff;box-shadow:0 2px 6px rgba(0,0,0,0.35);display:flex;align-items:center;justify-content:center;color:#fff;font-weight:700;font-size:${Math.max(9, Math.round(size * 0.42))}px;">${d.transactionCount}</div>`,
        iconSize: [size, size],
        iconAnchor: [size / 2, size / 2]
      })
      L.marker(latlng, { icon }).addTo(layer).bindPopup(
        `<div style="font-family:Inter,system-ui,sans-serif;min-width:160px">
          <div style="font-weight:700;color:#0f172a;margin-bottom:4px;">${escapeHtml(d.name)}</div>
          <div style="font-size:12px;color:#475569;">Total: <b style="color:#dc2626;">${formatPeso(d.totalAmount)}</b></div>
          <div style="font-size:12px;color:#475569;">Transactions: ${d.transactionCount}</div>
          ${d.lastContributionAt ? `<div style="font-size:12px;color:#64748b;">Last: ${formatDate(d.lastContributionAt)}</div>` : ''}
        </div>`
      )
    })
  }, [donors])

  const handleMapClick = (e: L.LeafletMouseEvent) => {
    if (!selectedDonorName) {
      setPopupMsg('Select a donor from the list first, then click the map to place their marker.')
      return
    }
    const { lat, lng } = e.latlng
    setDraft({ lat, lng })
    setPopupMsg('')

    if (draftRef.current) {
      draftRef.current.setLatLng(e.latlng)
      return
    }
    const icon = L.divIcon({
      className: '',
      html: `<div style="width:22px;height:22px;border-radius:9999px;background:#16a34a;border:3px solid #fff;box-shadow:0 2px 6px rgba(0,0,0,0.4);"></div>`,
      iconSize: [22, 22],
      iconAnchor: [11, 11]
    })
    draftRef.current = L.marker(e.latlng, { icon, draggable: true }).addTo(mapRef.current!)
    draftRef.current.on('dragend', () => {
      const p = draftRef.current!.getLatLng()
      setDraft({ lat: p.lat, lng: p.lng })
    })
  }

  useEffect(() => {
    const map = mapRef.current
    if (!map) return
    map.on('click', handleMapClick)
    return () => {
      map.off('click', handleMapClick)
    }
  }, [selectedDonorName])

  const selectedDonor = donors?.find((d) => d.name === selectedDonorName)

  const saveLocation = async () => {
    if (!selectedDonorName || !draft) return
    setSaving(true)
    try {
      const res = await api.put<ApiResponse<boolean>>(
        `/gis/donors/location`,
        { name: selectedDonorName, latitude: draft.lat, longitude: draft.lng }
      )
      if (res.data.success) {
        toast('Location saved')
        queryClient.invalidateQueries({ queryKey: ['gis-donors'] })
        setDraft(null)
        if (draftRef.current) {
          draftRef.current.remove()
          draftRef.current = null
        }
        setSelectedDonorName(null)
      } else {
        toast(res.data.message || 'Failed to save', 'error')
      }
    } catch {
      toast('Failed to save location', 'error')
    } finally {
      setSaving(false)
    }
  }

  const focusDonor = (d: DonorMapDto) => {
    setSelectedDonorName(d.name)
    setDraft(null)
    setPopupMsg('')
    if (d.latitude != null && d.longitude != null && mapRef.current) {
      mapRef.current.flyTo([d.latitude, d.longitude], 15)
      setPopupMsg('Click a new spot on the map to move this donor, or press Save to keep it.')
    } else {
      setPopupMsg(`Click on the map to place ${d.name}'s marker.`)
    }
  }

  const addDonor = async () => {
    if (!newName.trim()) {
      toast('Enter a donor name.', 'error')
      return
    }
    try {
      const res = await api.post<ApiResponse<boolean>>(`/gis/donors`, { name: newName.trim() })
      if (res.data.success) {
        toast('Donor created')
        setNewName('')
        queryClient.invalidateQueries({ queryKey: ['gis-donors'] })
      } else {
        toast(res.data.message || 'Failed', 'error')
      }
    } catch {
      toast('Failed to create donor', 'error')
    }
  }

  // Donors compromise: those with coordinates, then without
  const located = (donors || []).filter((d) => d.latitude != null && d.longitude != null)
  const unlocated = (donors || []).filter((d) => d.latitude == null || d.longitude == null)

  return (
    <div>
      <PageHeader title="Donor Map" subtitle="Map donor contributions and manage their locations" />

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left panel: filters + donor list */}
        <div className="lg:col-span-4 space-y-4">
          <div className="card p-5 bg-white space-y-4">
            <h2 className="font-semibold text-slate-800 flex items-center gap-2">
              <svg className="w-5 h-5 text-brand-600" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 3c2.755 0 5.455.232 8.083.678.533.09.917.556.917 1.096v1.044a2.25 2.25 0 01-.659 1.591l-5.432 5.432a2.25 2.25 0 00-.659 1.591v2.927a2.25 2.25 0 01-1.244 2.013L9.75 21v-6.568a2.25 2.25 0 00-.659-1.591L3.659 7.409A2.25 2.25 0 013 5.818V4.774c0-.54.384-1.006.917-1.096A48.32 48.32 0 0112 3z" />
              </svg>
              Filters
            </h2>
            <div>
              <label className="label">Collection Session</label>
              <select className="input" value={sessionId} onChange={(e) => setSessionId(e.target.value)}>
                <option value="">All sessions</option>
                {(sessions || []).map((s) => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="label">From</label>
                <input type="date" className="input" value={from} onChange={(e) => setFrom(e.target.value)} />
              </div>
              <div>
                <label className="label">To</label>
                <input type="date" className="input" value={to} onChange={(e) => setTo(e.target.value)} />
              </div>
            </div>
          </div>

          <div className="card p-5 bg-white space-y-3">
            <h2 className="font-semibold text-slate-800">Add Donor</h2>
            <div className="flex gap-2">
              <input
                className="input"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="Donor name"
              />
              <button onClick={addDonor} className="btn-secondary flex-shrink-0 !px-3">Add</button>
            </div>
          </div>

          <div className="card p-5 bg-white space-y-3">
            <h2 className="font-semibold text-slate-800">Donors by Contribution</h2>
            {isLoading ? (
              <div className="flex items-center justify-center gap-2 py-4">
                <div className="h-5 w-5 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
                <div className="text-sm text-slate-500">Loading donors...</div>
              </div>
            ) : donors && donors.length === 0 ? (
              <div className="text-sm text-slate-500 py-2">No contributions found for the selected filter.</div>
            ) : (
              <div className="max-h-[340px] overflow-y-auto space-y-1.5 pr-1">
                {[...located, ...unlocated].map((d) => (
                  <button
                    key={d.name}
                    onClick={() => focusDonor(d)}
                    className={`w-full text-left rounded-lg border px-3 py-2.5 transition-colors ${
                      selectedDonorName === d.name
                        ? 'border-brand-500 bg-brand-50'
                        : 'border-slate-200 bg-white hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-sm font-semibold text-slate-800 truncate">{d.name}</span>
                      <span className={`text-xs font-bold flex-shrink-0 ${d.latitude != null ? 'text-emerald-600' : 'text-slate-400'}`}>
                        {d.latitude != null ? '● mapped' : '○ unmapped'}
                      </span>
                    </div>
                    <div className="flex items-center justify-between mt-0.5">
                      <span className="text-xs text-slate-500">{d.transactionCount} txns</span>
                      <span className="text-xs font-bold" style={{ color: markerColor(d.totalAmount) }}>
                        {formatPeso(d.totalAmount)}
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            )}
            <div className="text-[11px] text-slate-400 leading-relaxed pt-1 border-t border-slate-100">
              Marker size & color reflect total contribution amount. Number inside marker = transactions.
            </div>
          </div>
        </div>

        {/* Right: map */}
        <div className="lg:col-span-8">
          <div className="card overflow-hidden bg-white">
            <div className="px-4 py-3 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <svg className="w-5 h-5 text-brand-600" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 21a9 9 0 100-18 9 9 0 000 18zm0 0c3.866 0 7-4.03 7-9s-3.134-9-7-9-7 4.03-7 9 3.134 9 7 9zm-3-9a3 3 0 116 0 3 3 0 01-6 0z" />
                </svg>
                <span className="text-sm font-semibold text-slate-800">
                  {selectedDonor ? `Placing: ${selectedDonor.name}` : 'Contribution Map'}
                </span>
              </div>
              <div className="flex items-center gap-2 text-xs">
                <span className="flex items-center gap-1"><span className="inline-block h-2.5 w-2.5 rounded-full" style={{ background: '#dc2626' }} />50k+</span>
                <span className="flex items-center gap-1"><span className="inline-block h-2.5 w-2.5 rounded-full" style={{ background: '#d97706' }} />10k+</span>
                <span className="flex items-center gap-1"><span className="inline-block h-2.5 w-2.5 rounded-full" style={{ background: '#0891b2' }} />1k+</span>
                <span className="flex items-center gap-1"><span className="inline-block h-2.5 w-2.5 rounded-full" style={{ background: '#64748b' }} />&lt;1k</span>
              </div>
            </div>

            <div className="relative">
              <div ref={containerRef} className="h-[520px] sm:h-[560px] w-full z-0" />
              {selectedDonorName && (
                <div className="absolute top-3 left-1/2 -translate-x-1/2 z-[500] bg-white border border-slate-200 rounded-xl shadow-lg px-4 py-3 max-w-xs w-full sm:w-auto">
                  {draft ? (
                    <div className="flex items-center justify-between gap-3">
                      <button onClick={saveLocation} disabled={saving} className="btn-primary !px-4 !py-2 flex-shrink-0">
                        {saving ? 'Saving...' : 'Save location'}
                      </button>
                      <span className="text-xs text-slate-500">Selected spot set</span>
                    </div>
                  ) : (
                    <div className="text-xs text-slate-600">Click <b>on the map</b> to place the marker for <b>{selectedDonor?.name}</b>.</div>
                  )}
                </div>
              )}
            </div>

            {popupMsg && (
              <div className="bg-amber-50 border-t border-amber-200 px-4 py-2.5 text-sm text-amber-800">
                {popupMsg}
              </div>
            )}
          </div>

          <div className="mt-3 grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="card p-4 bg-white">
              <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Donors</div>
              <div className="text-xl font-bold text-slate-800 mt-1">{donors?.length ?? 0}</div>
            </div>
            <div className="card p-4 bg-white">
              <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Mapped</div>
              <div className="text-xl font-bold text-emerald-600 mt-1">{located.length}</div>
            </div>
            <div className="card p-4 bg-white">
              <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Unmapped</div>
              <div className="text-xl font-bold text-amber-600 mt-1">{unlocated.length}</div>
            </div>
            <div className="card p-4 bg-white">
              <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Total volume</div>
              <div className="text-xl font-bold text-brand-700 mt-1 truncate">{formatPeso((donors || []).reduce((s, d) => s + d.totalAmount, 0))}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function escapeHtml(str: string): string {
  return str.replace(/[&<>"']/g, (c) => {
    switch (c) {
      case '&': return '&amp;'
      case '<': return '&lt;'
      case '>': return '&gt;'
      case '"': return '&quot;'
      case "'": return '&#39;'
      default: return c
    }
  })
}
