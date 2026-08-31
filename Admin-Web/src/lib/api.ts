import axios from 'axios'

export interface ApiResponse<T> {
  success: boolean
  message: string
  data: T
  errors: string[]
}

export interface TokenResponse {
  accessToken: string
  refreshToken: string
  expiresAt: string
  userId: string
  fullName: string
  username: string
  role: string
}

const API_BASE = import.meta.env.VITE_API_URL || '/api'

const api = axios.create({
  baseURL: API_BASE
})

let accessToken: string | null = localStorage.getItem('ctoms_access_token')
let refreshToken: string | null = localStorage.getItem('ctoms_refresh_token')
let refreshPromise: Promise<string | null> | null = null

export function setTokens(tokens: TokenResponse) {
  accessToken = tokens.accessToken
  refreshToken = tokens.refreshToken
  localStorage.setItem('ctoms_access_token', tokens.accessToken)
  localStorage.setItem('ctoms_refresh_token', tokens.refreshToken)
}

export function clearTokens() {
  accessToken = null
  refreshToken = null
  localStorage.removeItem('ctoms_access_token')
  localStorage.removeItem('ctoms_refresh_token')
}

export function getAccessToken() {
  return accessToken
}

api.interceptors.request.use((config) => {
  if (accessToken) {
    config.headers.Authorization = `Bearer ${accessToken}`
  }
  return config
})

api.interceptors.response.use(
  (res) => res,
  async (error) => {
    const original = error.config
    if (error.response?.status === 401 && !original._retry && refreshToken) {
      original._retry = true
      const newToken = await refreshAccessToken()
      if (newToken) {
        original.headers.Authorization = `Bearer ${newToken}`
        return api(original)
      }
      clearTokens()
      window.location.href = '/login'
    }
    return Promise.reject(error)
  }
)

async function refreshAccessToken(): Promise<string | null> {
  if (refreshPromise) return refreshPromise
  refreshPromise = (async () => {
    try {
      const { data } = await axios.post<ApiResponse<TokenResponse>>(`${API_BASE}/auth/refresh`, {
        refreshToken,
        deviceInfo: navigator.userAgent
      })
      if (data.success && data.data) {
        setTokens(data.data)
        return data.data.accessToken
      }
      clearTokens()
      return null
    } catch {
      clearTokens()
      return null
    } finally {
      refreshPromise = null
    }
  })()
  return refreshPromise
}

export default api
