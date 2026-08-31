import { FormEvent, useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../lib/auth'

export const CHURCH_LOGO_URL =
  'https://scontent.fmnl34-1.fna.fbcdn.net/v/t39.30808-1/538264880_810797361377430_5249056959724717023_n.jpg?stp=dst-jpg_tt6&cstp=mx500x500&ctp=s200x200&_nc_cat=107&ccb=1-7&_nc_sid=1d2534&_nc_eui2=AeHeAFiYmByu479r2d3WrpELUgglzeMTKRZSCCXN4xMpFoI6LyAZVYYXycTYePAa0yqiFPh27IEK3KS9kYKLad2B&_nc_ohc=Avl6cTvQkj4Q7kNvwF9gLRZ&_nc_oc=Ado6QuURayVvqG75lYAwzC9EnZglWmcsxRIcnUdJNfDIHoMtIgFG6phZHhXUu2BN3241LBWPbs8fb2ORb_jHOlFw&_nc_zt=24&_nc_ht=scontent.fmnl34-1.fna&_nc_gid=bv1ag5gyO6qcXcXC6f33Nw&_nc_ss=7b2a8&oh=00_AQLtf7d7P5JVrE23TtVol7iZDBlB2KzXEjKx4u8tJ6_lbQ&oe=6A9B81DA'

const REMEMBER_KEY = 'ctoms_remember_username'

export default function LoginPage() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const [username, setUsername] = useState(() => localStorage.getItem(REMEMBER_KEY) || '')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [remember, setRemember] = useState(() => !!localStorage.getItem(REMEMBER_KEY))
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    const result = await login(username.trim(), password)
    setLoading(false)
    if (result.ok) {
      if (remember) localStorage.setItem(REMEMBER_KEY, username.trim())
      else localStorage.removeItem(REMEMBER_KEY)
      navigate(result.role === 'Usher' ? '/usher' : '/app', { replace: true })
    } else {
      setError(result.message)
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 flex">
      {/* Decorative background */}
      <div className="fixed inset-0 -z-10 overflow-hidden">
        <div className="absolute -top-24 -right-24 h-96 w-96 rounded-full bg-brand-100/60 blur-3xl" />
        <div className="absolute bottom-0 left-0 h-80 w-80 rounded-full bg-amber-100/40 blur-3xl" />
        <div className="absolute top-1/2 left-1/3 -translate-x-1/2 h-72 w-72 rounded-full bg-sky-100/50 blur-3xl" />
      </div>

      <div className="w-full flex">
        {/* LEFT: branding panel (hidden on mobile) */}
        <div className="hidden lg:flex w-1/2 max-w-2xl bg-gradient-to-br from-brand-700 via-brand-600 to-brand-800 text-white p-12 xl:p-16 flex-col justify-between relative overflow-hidden">
          <div className="absolute inset-0 opacity-10">
            <div className="absolute -top-10 -left-10 h-64 w-64 rounded-full border border-white/40" />
            <div className="absolute top-1/3 right-10 h-40 w-40 rounded-full border border-white/30" />
            <div className="absolute bottom-20 left-1/4 h-24 w-24 rounded-full bg-white/20" />
          </div>

          <div className="relative">
            <div className="flex items-center gap-3">
              <img src={CHURCH_LOGO_URL} alt="Church logo" className="h-12 w-12 rounded-xl object-cover ring-2 ring-white/30" />
              <div>
                <div className="font-extrabold text-xl leading-none">CTOMS</div>
                <div className="text-xs text-brand-100 mt-0.5">Church Tithes & Offering Management</div>
              </div>
            </div>
          </div>

          <div className="relative max-w-md">
            <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs font-medium text-brand-50 mb-6 ring-1 ring-white/20">
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
              </svg>
              Secure · Organized · Centralized
            </div>
            <h1 className="text-3xl xl:text-4xl font-extrabold leading-tight">
              Manage Church Tithes and Offerings with Confidence.
            </h1>
            <p className="text-brand-100 mt-4 text-base leading-relaxed">
              A secure and organized system designed to help churches manage tithes, offerings,
              financial records, and church transactions efficiently.
            </p>
          </div>

          <div className="relative grid grid-cols-3 gap-4">
            {[
              { label: 'Tithes', icon: 'M12 6v12m-3-2.818l.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 11-18 0 9 9 0 0118 0z' },
              { label: 'Offerings', icon: 'M21 11.25v8.25a1.5 1.5 0 01-1.5 1.5H5.25a1.5 1.5 0 01-1.5-1.5v-8.25M12 4.875A2.625 2.625 0 109.375 7.5H12m0-2.625V7.5m0-2.625A2.625 2.625 0 1114.625 7.5H12m0 0V21m-8.625-9.75h18c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125h-18c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z' },
              { label: 'Reports', icon: 'M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z' }
            ].map((f) => (
              <div key={f.label} className="rounded-xl bg-white/10 ring-1 ring-white/15 p-3 backdrop-blur-sm">
                <svg className="w-6 h-6 text-white mb-2" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d={f.icon} />
                </svg>
                <div className="text-sm font-semibold">{f.label}</div>
                <div className="text-[11px] text-brand-100">Management</div>
              </div>
            ))}
          </div>
        </div>

        {/* RIGHT: login card */}
        <div className="w-full lg:w-1/2 flex items-center justify-center px-4 py-10">
          <div className="w-full max-w-md">
            <div className="animate-[fadeUp_0.5s_ease-out]">
              {/* Mobile logo header */}
              <div className="lg:hidden flex flex-col items-center mb-8">
                <img src={CHURCH_LOGO_URL} alt="Church logo" className="h-16 w-16 rounded-2xl object-cover shadow-lg ring-1 ring-slate-200 mb-3" />
                <h1 className="text-2xl font-extrabold text-slate-900">CTOMS</h1>
                <p className="text-sm text-slate-500 text-center mt-1">Church Tithes & Offering Management</p>
              </div>

              <div className="bg-white border border-slate-200 rounded-2xl shadow-xl shadow-slate-200/50 p-8">
                <div className="mb-6">
                  <h2 className="text-2xl font-extrabold text-slate-900">Welcome Back</h2>
                  <p className="text-sm text-slate-500 mt-1">Sign in to access your church management dashboard.</p>
                </div>

                {error && (
                  <div className="mb-5 rounded-xl bg-red-50 border border-red-200/60 text-red-700 text-sm px-4 py-3 flex items-center gap-2.5">
                    <svg className="w-5 h-5 text-red-500 flex-shrink-0" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
                    </svg>
                    {error}
                  </div>
                )}

                <form onSubmit={submit} className="space-y-4">
                  <div>
                    <label className="label">Username</label>
                    <div className="relative">
                      <svg className="w-5 h-5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
                      </svg>
                      <input
                        className="input !pl-10 !py-3"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        autoComplete="username"
                        placeholder="Enter your username"
                        required
                        autoFocus
                      />
                    </div>
                  </div>

                  <div>
                    <label className="label">Password</label>
                    <div className="relative">
                      <svg className="w-5 h-5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
                      </svg>
                      <input
                        type={showPassword ? 'text' : 'password'}
                        className="input !pl-10 !pr-11 !py-3"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        autoComplete="current-password"
                        placeholder="Enter your password"
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword((s) => !s)}
                        className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 rounded-lg text-slate-400 hover:text-brand-600 hover:bg-slate-100 transition-colors"
                        aria-label={showPassword ? 'Hide password' : 'Show password'}
                      >
                        {showPassword ? (
                          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88" />
                          </svg>
                        ) : (
                          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
                            <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          </svg>
                        )}
                      </button>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-1">
                    <label className="flex items-center gap-2 text-sm text-slate-600 select-none cursor-pointer">
                      <input
                        type="checkbox"
                        checked={remember}
                        onChange={(e) => setRemember(e.target.checked)}
                        className="h-4 w-4 rounded border-slate-300 text-brand-600 focus:ring-brand-500"
                      />
                      Remember me
                    </label>
                    <button type="button" className="text-sm font-medium text-brand-700 hover:text-brand-800 hover:underline">
                      Forgot password?
                    </button>
                  </div>

                  <button type="submit" className="btn-primary w-full !py-3 mt-1 text-[15px]" disabled={loading}>
                    {loading ? (
                      <span className="flex items-center gap-2">
                        <div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        Signing in...
                      </span>
                    ) : (
                      <>
                        Sign In
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                        </svg>
                      </>
                    )}
                  </button>
                </form>

                <div className="mt-6 flex items-center justify-center gap-2 text-xs text-slate-400">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
                  </svg>
                  Secure access for authorized church personnel.
                </div>
              </div>

              <p className="text-center text-sm text-slate-500 mt-6">
                Don't have an account?{' '}
                <Link to="/" className="font-semibold text-brand-700 hover:text-brand-800 hover:underline">
                  Learn more about CTOMS
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(16px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  )
}
