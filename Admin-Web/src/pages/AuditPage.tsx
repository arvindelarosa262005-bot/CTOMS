import { useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import api, { ApiResponse } from '../lib/api'
import { formatDateTime } from '../lib/format'
import { PageHeader, Badge } from '../components/ui'

interface AuditLogDto {
  id: string
  userName: string
  entityType: string
  action: string
  description: string
  ipAddress: string | null
  createdAt: string
  changes: string | null
}

const actionColor = (a: string) =>
  a.toLowerCase().includes('create')
    ? 'green'
    : a.toLowerCase().includes('delete')
      ? 'red'
      : a.toLowerCase().includes('void')
        ? 'red'
        : a.toLowerCase().includes('login')
          ? 'blue'
          : 'gray'

export default function AuditPage() {
  const [entityFilter, setEntityFilter] = useState('all')

  const { data, isLoading } = useQuery({
    queryKey: ['audit'],
    queryFn: async () => {
      const res = await api.get<ApiResponse<{ items: AuditLogDto[]; totalCount: number }>>(
        '/audit?page=1&pageSize=200'
      )
      return res.data.data.items
    }
  })

  const entities = useMemo(() => {
    const set = new Set((data || []).map((a) => a.entityType))
    return Array.from(set)
  }, [data])

  const filtered = entityFilter === 'all' ? data || [] : (data || []).filter((a) => a.entityType === entityFilter)

  return (
    <div>
      <PageHeader title="Audit Logs" subtitle="Security and activity trail" />

      <div className="flex gap-2 mb-4 flex-wrap">
        <button
          onClick={() => setEntityFilter('all')}
          className={`btn ${entityFilter === 'all' ? 'btn-primary' : 'btn-secondary'}`}
        >
          All
        </button>
        {entities.map((e) => (
          <button
            key={e}
            onClick={() => setEntityFilter(e)}
            className={`btn ${entityFilter === e ? 'btn-primary' : 'btn-secondary'}`}
          >
            {e}
          </button>
        ))}
      </div>

      <div className="card overflow-hidden bg-white">
        <table className="w-full">
          <thead>
            <tr>
              <th className="th">Time</th>
              <th className="th">User</th>
              <th className="th">Entity</th>
              <th className="th">Action</th>
              <th className="th">Description</th>
              <th className="th">IP</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((a) => (
              <tr key={a.id} className="hover:bg-slate-50">
                <td className="td whitespace-nowrap">{formatDateTime(a.createdAt)}</td>
                <td className="td font-medium">{a.userName}</td>
                <td className="td">{a.entityType}</td>
                <td className="td">
                  <Badge color={actionColor(a.action)}>{a.action}</Badge>
                </td>
                <td className="td">{a.description}</td>
                <td className="td text-slate-400">{a.ipAddress || '—'}</td>
              </tr>
            ))}
            {!isLoading && filtered.length === 0 && (
              <tr>
                <td colSpan={6} className="td text-center text-slate-500 py-8">
                  No audit logs
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
