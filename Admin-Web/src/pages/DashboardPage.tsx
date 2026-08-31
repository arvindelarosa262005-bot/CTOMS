import { useQuery } from '@tanstack/react-query'
import api, { ApiResponse } from '../lib/api'
import { formatPeso } from '../lib/format'
import { useRealtimeRefresh } from '../lib/useRealtimeRefresh'
import { HeroIcon, PageHeader, StatCard } from '../components/ui'

interface DashboardSummary {
  todayTithes: number
  todayOffering: number
  todayGrandTotal: number
  todayTransactions: number
  activeUshers: number
  activeSessionId: string | null
  activeSessionName: string | null
}

export default function DashboardPage() {
  useRealtimeRefresh(['dashboard'])
  const { data, isLoading } = useQuery({
    queryKey: ['dashboard'],
    queryFn: async () => {
      const res = await api.get<ApiResponse<DashboardSummary>>('/dashboard/summary')
      return res.data.data
    }
  })

  if (isLoading) return (
    <div className="flex items-center justify-center h-64">
      <div className="flex flex-col items-center gap-3">
        <div className="h-8 w-8 border-[3px] border-brand-500 border-t-transparent rounded-full animate-spin" />
        <div className="text-sm text-slate-500 font-medium">Loading dashboard...</div>
      </div>
    </div>
  )

  return (
    <div>
      <PageHeader title="Dashboard" subtitle="Financial overview and real-time collection status" />

      {data?.activeSessionName && (
        <div className="card p-4 mb-5 flex items-center gap-3 bg-gradient-to-r from-emerald-50 to-emerald-50/50 border-emerald-200">
          <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center shadow-lg shadow-emerald-200 flex-shrink-0">
            <span className="h-2.5 w-2.5 rounded-full bg-white animate-pulse" />
          </div>
          <div className="min-w-0">
            <div className="font-bold text-slate-800 truncate">{data.activeSessionName}</div>
            <div className="text-xs text-emerald-600 font-semibold uppercase tracking-wider">Collection Active</div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <StatCard
          title="Today's Tithes"
          value={formatPeso(data?.todayTithes)}
          gradient="stat-gradient-1"
          icon={<HeroIcon d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z" />}
        />
        <StatCard
          title="Today's Offering"
          value={formatPeso(data?.todayOffering)}
          gradient="stat-gradient-2"
          icon={<HeroIcon d="M21 11.25v8.25a1.5 1.5 0 01-1.5 1.5H5.25a1.5 1.5 0 01-1.5-1.5v-8.25M12 4.875A2.625 2.625 0 109.375 7.5H12m0-2.625V7.5m0-2.625A2.625 2.625 0 1114.625 7.5H12m0 0V21m-8.625-9.75h18c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125h-18c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z" />}
        />
        <StatCard
          title="Grand Total"
          value={formatPeso(data?.todayGrandTotal)}
          gradient="stat-gradient-3"
          icon={<HeroIcon d="M12 6v12m-3-2.818l.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />}
        />
        <StatCard
          title="Transactions"
          value={data?.todayTransactions ?? 0}
          gradient="stat-gradient-4"
          icon={<HeroIcon d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m3.75 9v6m3-3H9m1.5-12H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />}
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 mt-4">
        <StatCard
          title="Active Ushers"
          value={data?.activeUshers ?? 0}
          gradient="stat-gradient-5"
          icon={<HeroIcon d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128H5.228A2 2 0 013 17.208V5.792a2 2 0 012.228-1.986h13.544A2 2 0 0121 5.792v11.416a2 2 0 01-2.228 1.986" />}
        />
      </div>
    </div>
  )
}
