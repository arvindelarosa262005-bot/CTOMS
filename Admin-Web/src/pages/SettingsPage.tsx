import { useEffect, useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import api, { ApiResponse } from '../lib/api'
import { toast } from '../components/Toast'

interface ChurchSettingsDto {
  churchName: string
  address: string
  contact: string
  email: string
  logoUrl: string
}

function SettingsIcon({ className = 'w-5 h-5' }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
  )
}

function SaveIcon({ className = 'w-4 h-4' }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  )
}

function DatabaseIcon({ className = 'w-5 h-5' }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 6.375c0 2.278-3.694 4.125-8.25 4.125S3.75 8.653 3.75 6.375m16.5 0c0-2.278-3.694-4.125-8.25-4.125S3.75 4.097 3.75 6.375m16.5 0v11.25c0 2.278-3.694 4.125-8.25 4.125s-8.25-1.847-8.25-4.125V6.375m16.5 5.625c0 2.278-3.694 4.125-8.25 4.125s-8.25-1.847-8.25-4.125" />
    </svg>
  )
}

const inputClass =
  'w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-900 shadow-sm focus:outline-none focus:ring-2 focus:ring-brand-500/30 focus:border-brand-500 transition-all placeholder:text-slate-400'

export default function SettingsPage() {
  const queryClient = useQueryClient()
  const [form, setForm] = useState<ChurchSettingsDto>({
    churchName: '',
    address: '',
    contact: '',
    email: '',
    logoUrl: ''
  })
  const [saving, setSaving] = useState(false)
  const [backingUp, setBackingUp] = useState(false)

  const { data, isLoading } = useQuery({
    queryKey: ['settings'],
    queryFn: async () => {
      const res = await api.get<ApiResponse<ChurchSettingsDto>>('/settings')
      return res.data.data
    }
  })

  useEffect(() => {
    if (data) setForm(data)
  }, [data])

  const save = async () => {
    if (!form.churchName.trim()) {
      toast('Church name is required.', 'error')
      return
    }
    setSaving(true)
    try {
      const { data } = await api.put<ApiResponse<unknown>>('/settings', form)
      if (data.success) {
        toast(data.message)
        queryClient.invalidateQueries({ queryKey: ['settings'] })
      } else {
        toast(data.message || 'Failed', 'error')
      }
    } catch {
      toast('Failed to save settings', 'error')
    } finally {
      setSaving(false)
    }
  }

  const backup = async () => {
    setBackingUp(true)
    try {
      const { data } = await api.post<ApiResponse<unknown>>('/settings/backup')
      if (data.success)
        toast((data.data as { fileName?: string })?.fileName ? `Backup created: ${(data.data as { fileName: string }).fileName}` : data.message)
      else toast(data.message || 'Backup failed', 'error')
    } catch {
      toast('Backup failed', 'error')
    } finally {
      setBackingUp(false)
    }
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-extrabold text-slate-900">Settings</h1>
        <p className="text-sm text-slate-500 mt-1">Church information and system configuration</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        <div className="lg:col-span-2 card overflow-hidden">
          <div className="px-6 py-5 border-b border-slate-200 flex items-start gap-3">
            <div className="h-10 w-10 rounded-lg bg-brand-50 text-brand-700 flex items-center justify-center flex-shrink-0">
              <SettingsIcon />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900">Church Information</h2>
              <p className="text-sm text-slate-500 mt-0.5">Update your church details and contact information</p>
            </div>
          </div>

          {isLoading ? (
            <div className="p-10 flex items-center justify-center gap-3">
              <div className="h-6 w-6 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
              <div className="text-sm text-slate-500">Loading settings...</div>
            </div>
          ) : (
            <div className="p-6 space-y-5">
              <div>
                <label className="label">Church Name</label>
                <input
                  className={inputClass}
                  value={form.churchName}
                  onChange={(e) => setForm({ ...form, churchName: e.target.value })}
                  placeholder="e.g. Our Lady of Grace Parish"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div>
                  <label className="label">Contact Number</label>
                  <input
                    className={inputClass}
                    value={form.contact}
                    onChange={(e) => setForm({ ...form, contact: e.target.value })}
                    placeholder="+63 912 345 6789"
                  />
                </div>
                <div>
                  <label className="label">Email</label>
                  <input
                    className={inputClass}
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    placeholder="info@church.org"
                  />
                </div>
              </div>

              <div>
                <label className="label">Address</label>
                <input
                  className={inputClass}
                  value={form.address}
                  onChange={(e) => setForm({ ...form, address: e.target.value })}
                  placeholder="Street, Barangay, City"
                />
              </div>

              <div>
                <label className="label">Logo URL</label>
                <input
                  className={inputClass}
                  value={form.logoUrl}
                  onChange={(e) => setForm({ ...form, logoUrl: e.target.value })}
                  placeholder="https://example.com/logo.png"
                />
              </div>

              <div className="pt-2 border-t border-slate-100 flex justify-end">
                <button
                  onClick={save}
                  disabled={saving}
                  className="btn-primary !px-6 !py-2.5"
                >
                  {saving ? (
                    <>
                      <div className="h-4 w-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <SaveIcon />
                      Save Settings
                    </>
                  )}
                </button>
              </div>
            </div>
          )}
        </div>

        <div className="card overflow-hidden lg:sticky lg:top-20">
          <div className="px-6 py-5 border-b border-slate-200 flex items-start gap-3">
            <div className="h-10 w-10 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center flex-shrink-0">
              <DatabaseIcon />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900">Data Backup</h2>
              <p className="text-sm text-slate-500 mt-0.5">Protect your data</p>
            </div>
          </div>

          <div className="p-6 space-y-4">
            <p className="text-sm text-slate-600 leading-relaxed">
              Create a JSON backup of all church data. Backups include transactions, envelopes, sessions,
              and user records.
            </p>

            <div className="rounded-lg bg-slate-50 border border-slate-200 px-3.5 py-2.5 text-xs text-slate-600 flex gap-2 items-start">
              <svg className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
              </svg>
              <span>Only authorized users (SuperAdmin and Admin) can perform backups.</span>
            </div>

            <button
              onClick={backup}
              disabled={backingUp}
              className="btn-primary w-full !py-3"
            >
              {backingUp ? (
                <>
                  <div className="h-4 w-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                  Creating backup...
                </>
              ) : (
                <>
                  <DatabaseIcon className="w-4 h-4" />
                  Create Backup
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
