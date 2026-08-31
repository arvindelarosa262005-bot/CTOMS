import { useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import api, { ApiResponse } from '../lib/api'
import { useAuth } from '../lib/auth'
import { Badge, PageHeader, Modal } from '../components/ui'
import { toast, confirmAction } from '../components/Toast'

interface UserDto {
  id: string
  username: string
  fullName: string
  email: string
  role: string
  status: number
  online: boolean
  isArchived: boolean
}

const roleOptions = ['Treasurer', 'Usher', 'Admin', 'SuperAdmin']

export default function UsersPage() {
  const { user: me } = useAuth()
  const queryClient = useQueryClient()
  const [showModal, setShowModal] = useState(false)
  const [form, setForm] = useState({
    username: '',
    fullName: '',
    email: '',
    password: '',
    role: 'Usher'
  })
  const [saving, setSaving] = useState(false)
  const [showArchived, setShowArchived] = useState(false)

  const { data, isLoading } = useQuery({
    queryKey: ['users', showArchived],
    queryFn: async () => {
      const res = await api.get<ApiResponse<{ items: UserDto[]; totalCount: number }>>(
        `/users?page=1&pageSize=100${showArchived ? '&includeArchived=true' : ''}`
      )
      return res.data.data.items
    }
  })

  const archiveUser = async (id: string, archived: boolean) => {
    if (!confirmAction(archived ? 'Archive this user?' : 'Restore this user?')) return
    const { data } = await api.patch<ApiResponse<unknown>>(`/users/${id}/archive?archived=${archived}`)
    if (data.success) {
      toast(data.message)
      queryClient.invalidateQueries({ queryKey: ['users'] })
    } else {
      toast(data.message || 'Failed', 'error')
    }
  }

  const save = async () => {
    if (!form.username || !form.fullName || !form.password) {
      toast('Username, full name and password are required.', 'error')
      return
    }
    setSaving(true)
    try {
      const { data } = await api.post<ApiResponse<unknown>>('/users', {
        username: form.username.trim(),
        fullName: form.fullName.trim(),
        email: form.email.trim() || null,
        password: form.password,
        role: form.role
      })
      if (data.success) {
        toast(data.message)
        setShowModal(false)
        setForm({ username: '', fullName: '', email: '', password: '', role: 'Usher' })
        queryClient.invalidateQueries({ queryKey: ['users'] })
      } else {
        toast((data.errors?.[0] as string) || data.message || 'Failed', 'error')
      }
    } catch {
      toast('Failed to create user', 'error')
    } finally {
      setSaving(false)
    }
  }

  const toggleStatus = async (u: UserDto) => {
    const next = u.status === 1 ? 2 : 1
    const { data } = await api.put<ApiResponse<unknown>>(`/users/${u.id}`, {
      fullName: u.fullName,
      status: next
    })
    if (data.success) toast(data.message)
    else toast(data.message || 'Failed', 'error')
    queryClient.invalidateQueries({ queryKey: ['users'] })
  }

  const roleColor = (r: string) =>
    r === 'SuperAdmin' ? 'red' : r === 'Admin' ? 'blue' : r === 'Treasurer' ? 'yellow' : 'gray'

  return (
    <div>
      <PageHeader title="Users & Ushers" subtitle="Manage system users and their roles" />

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
        <button onClick={() => setShowModal(true)} className="btn-primary order-1 sm:order-2">
          + Add User
        </button>
      </div>

      <div className="card bg-white">
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th className="th">Name</th>
                <th className="th">Username</th>
                <th className="th">Email</th>
                <th className="th">Role</th>
                <th className="th">Status</th>
                <th className="th"></th>
              </tr>
            </thead>
            <tbody>
              {(data || []).map((u) => (
                <tr key={u.id} className="hover:bg-slate-50">
                  <td className="td">
                    <div className="flex items-center gap-2 font-medium text-slate-800">
                      <span className="truncate">{u.fullName}</span>
                      {u.online && <span className="h-2 w-2 rounded-full bg-emerald-500 flex-shrink-0" title="Online" />}
                    </div>
                  </td>
                  <td className="td">{u.username}</td>
                  <td className="td">{u.email || '—'}</td>
                  <td className="td">
                    <Badge color={roleColor(u.role)}>{u.role}</Badge>
                  </td>
                  <td className="td">
                    <Badge color={u.status === 1 ? 'green' : 'gray'}>{u.status === 1 ? 'Active' : 'Disabled'}</Badge>
                  </td>
                  <td className="td text-right">
                    <div className="flex items-center justify-end gap-2 whitespace-nowrap">
                      {me?.id !== u.id && (
                        <>
                          <button onClick={() => toggleStatus(u)} className="text-sm text-brand-600 hover:underline">
                            {u.status === 1 ? 'Disable' : 'Enable'}
                          </button>
                          <button
                            onClick={() => archiveUser(u.id, !u.isArchived)}
                            className={`text-sm hover:underline ${u.isArchived ? 'text-amber-600' : 'text-slate-400 hover:text-red-600'}`}
                          >
                            {u.isArchived ? 'Restore' : 'Archive'}
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
              {!isLoading && data?.length === 0 && (
                <tr>
                  <td colSpan={6} className="td text-center text-slate-500 py-8">
                    No users
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <Modal open={showModal} onClose={() => setShowModal(false)} title="Add User">
        <div className="space-y-3">
          <div>
            <label className="label">Full Name</label>
            <input
              className="input"
              value={form.fullName}
              onChange={(e) => setForm({ ...form, fullName: e.target.value })}
              autoFocus
            />
          </div>
          <div>
            <label className="label">Username</label>
            <input
              className="input"
              value={form.username}
              onChange={(e) => setForm({ ...form, username: e.target.value })}
            />
          </div>
          <div>
            <label className="label">Email</label>
            <input
              className="input"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
            />
          </div>
          <div>
            <label className="label">Password</label>
            <input
              type="password"
              className="input"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
            />
          </div>
          <div>
            <label className="label">Role</label>
            <select
              className="input"
              value={form.role}
              onChange={(e) => setForm({ ...form, role: e.target.value })}
            >
              {roleOptions.map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </select>
          </div>
        </div>
        <div className="flex justify-end gap-2 mt-5">
          <button onClick={() => setShowModal(false)} className="btn-secondary">
            Cancel
          </button>
          <button onClick={save} className="btn-primary" disabled={saving}>
            {saving ? 'Saving...' : 'Save'}
          </button>
        </div>
      </Modal>
    </div>
  )
}
