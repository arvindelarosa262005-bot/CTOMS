import { createContext, useContext, useEffect, useMemo, useState, ReactNode } from 'react'
import api, { clearTokens, setTokens, TokenResponse, getAccessToken } from './api'

export interface CurrentUser {
  id: string
  fullName: string
  username: string
  email: string
  role: string
  status: number
}

interface AuthContextValue {
  user: CurrentUser | null
  loading: boolean
  login: (username: string, password: string) => Promise<{ ok: boolean; message: string; role?: string }>
  logout: () => Promise<void>
  isReady: boolean
}

const AuthContext = createContext<AuthContextValue>(null as unknown as AuthContextValue)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<CurrentUser | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const token = getAccessToken()
    if (!token) {
      setLoading(false)
      return
    }
    api
      .get('/auth/me')
      .then((res) => {
        if (res.data.success) setUser(res.data.data)
      })
      .catch(() => clearTokens())
      .finally(() => setLoading(false))
  }, [])

  const login = async (username: string, password: string) => {
    try {
      const { data } = await api.post<{ success: boolean; message: string; data: TokenResponse }>(
        '/auth/login',
        { username, password, deviceInfo: navigator.userAgent }
      )
      if (!data.success) return { ok: false, message: data.message }
      setTokens(data.data)
      try {
        const me = await api.get<{ success: boolean; data: CurrentUser }>('/auth/me')
        if (me.data.success) {
          setUser(me.data.data)
          return { ok: true, message: data.message, role: me.data.data.role }
        }
      } catch {
        /* token stored; Protected re-fetch will recover */
      }
      return { ok: true, message: data.message, role: data.data.role }
    } catch {
      return { ok: false, message: 'Unable to connect to server.' }
    }
  }

  const logout = async () => {
    const rt = localStorage.getItem('ctoms_refresh_token')
    if (rt) {
      try {
        await api.post('/auth/logout', { refreshToken: rt, deviceInfo: navigator.userAgent })
      } catch {
        /* ignore */
      }
    }
    clearTokens()
    setUser(null)
  }

  const value = useMemo(
    () => ({ user, loading, login, logout, isReady: !loading }),
    [user, loading]
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  return useContext(AuthContext)
}
