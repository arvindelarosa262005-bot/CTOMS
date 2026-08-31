import { Navigate, Route, Routes } from 'react-router-dom'
import { useAuth } from './lib/auth'
import LoginPage from './pages/LoginPage'
import LandingPage from './pages/LandingPage'
import Layout from './components/Layout'
import UsherLayout from './components/usher/UsherLayout'
import DashboardPage from './pages/DashboardPage'
import LiveCollectionPage from './pages/LiveCollectionPage'
import SessionsPage from './pages/SessionsPage'
import EnvelopesPage from './pages/EnvelopesPage'
import UsersPage from './pages/UsersPage'
import TransactionsPage from './pages/TransactionsPage'
import ReportsPage from './pages/ReportsPage'
import GisMapPage from './pages/GisMapPage'
import AuditPage from './pages/AuditPage'
import SettingsPage from './pages/SettingsPage'
import UsherHomePage from './pages/usher/UsherHomePage'
import UsherScanPage from './pages/usher/UsherScanPage'
import UsherRecordPage from './pages/usher/UsherRecordPage'
import UsherHistoryPage from './pages/usher/UsherHistoryPage'

const ADMIN_ROLES = ['SuperAdmin', 'Admin', 'Treasurer']
const isAdmin = (role?: string) => !!role && ADMIN_ROLES.includes(role)
const isUsher = (role?: string) => role === 'Usher'

function Protected({ children }: { children: JSX.Element }) {
  const { isReady, user } = useAuth()
  if (!isReady) return <div className="flex h-screen items-center justify-center">Loading...</div>
  if (!user) return <Navigate to="/login" replace />
  return children
}

// Admin dashboard guards: only SuperAdmin/Admin/Treasurer; Usher not allowed
function RequireAdmin({ children }: { children: JSX.Element }) {
  const { user } = useAuth()
  if (user && isUsher(user.role)) return <Navigate to="/usher" replace />
  return children
}

// Usher interface guards: only Usher; admin roles not allowed
function RequireUsher({ children }: { children: JSX.Element }) {
  const { user } = useAuth()
  if (user && !isUsher(user.role)) return <Navigate to="/app" replace />
  return children
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/login" element={<LoginPage />} />

      <Route
        path="/app"
        element={
          <Protected>
            <RequireAdmin>
              <Layout />
            </RequireAdmin>
          </Protected>
        }
      >
        <Route index element={<DashboardPage />} />
        <Route path="live" element={<LiveCollectionPage />} />
        <Route path="sessions" element={<SessionsPage />} />
        <Route path="envelopes" element={<EnvelopesPage />} />
        <Route path="users" element={<UsersPage />} />
        <Route path="transactions" element={<TransactionsPage />} />
        <Route path="reports" element={<ReportsPage />} />
        <Route path="gis" element={<GisMapPage />} />
        <Route path="audit" element={<AuditPage />} />
        <Route path="settings" element={<SettingsPage />} />
      </Route>

      <Route
        path="/usher"
        element={
          <Protected>
            <RequireUsher>
              <UsherLayout />
            </RequireUsher>
          </Protected>
        }
      >
        <Route index element={<UsherHomePage />} />
        <Route path="scan" element={<UsherScanPage />} />
        <Route path="record" element={<UsherRecordPage />} />
        <Route path="history" element={<UsherHistoryPage />} />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />    </Routes>
  )
}
