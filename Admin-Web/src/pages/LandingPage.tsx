import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../lib/auth'
import { CHURCH_LOGO_URL } from './LoginPage'

const NAV_LINKS = [
  { label: 'Home', href: '#home' },
  { label: 'Church', href: '#church' },
  { label: 'Features', href: '#features' },
  { label: 'About', href: '#about' },
  { label: 'Security', href: '#security' },
]

const FEATURES = [
  {
    title: 'Tithes Management',
    desc: 'Record and organize church tithes accurately and efficiently.',
    icon: 'M12 6v12m-3-2.818l.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 11-18 0 9 9 0 0118 0z',
  },
  {
    title: 'Offering Management',
    desc: 'Track and manage different types of church offerings.',
    icon: 'M21 11.25v8.25a1.5 1.5 0 01-1.5 1.5H5.25a1.5 1.5 0 01-1.5-1.5v-8.25M12 4.875A2.625 2.625 0 109.375 7.5H12m0-2.625V7.5m0-2.625A2.625 2.625 0 1114.625 7.5H12m0 0V21m-8.625-9.75h18c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125h-18c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z',
  },
  {
    title: 'Transaction Records',
    desc: 'Maintain organized and searchable financial transaction records.',
    icon: 'M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z',
  },
  {
    title: 'Secure User Management',
    desc: 'Control access through authorized user accounts and role-based permissions.',
    icon: 'M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z',
  },
  {
    title: 'Reports & Analytics',
    desc: 'Generate useful reports to help church administrators monitor financial activities.',
    icon: 'M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z',
  },
  {
    title: 'Data Backup',
    desc: 'Protect important church information through secure backup options.',
    icon: 'M12 21a9.004 9.004 0 008.716-6.747M12 21a9.004 9.004 0 01-8.716-6.747M12 21c2.485 0 4.5-4.03 4.5-9S14.485 3 12 3m0 18c-2.485 0-4.5-4.03-4.5-9S9.515 3 12 3m0 0a8.997 8.997 0 017.843 4.582M12 3a8.997 8.997 0 00-7.843 4.582m15.686 0A11.953 11.953 0 0112 10.5c-2.998 0-5.74-1.1-7.843-2.918m15.686 0A8.959 8.959 0 0121 12c0 .778-.099 1.533-.284 2.253m0 0A17.919 17.919 0 0112 16.5c-3.162 0-6.133-.815-8.716-2.247m0 0A9.015 9.015 0 013 12c0-1.605.42-3.113 1.157-4.418',
  },
]

const STEPS = [
  {
    title: 'Sign In Securely',
    desc: 'Authorized personnel securely access the system.',
    icon: 'M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15m3 0l3-3m0 0l-3-3m3 3H9',
  },
  {
    title: 'Manage Church Records',
    desc: 'Record tithes, offerings, and financial transactions.',
    icon: 'M11.35 3.836c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m8.9-4.414c.376.023.75.05 1.124.08 1.131.094 1.976 1.057 1.976 2.192V16.5A2.25 2.25 0 0118 18.75h-2.25m-7.5-10.5H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V18.75m-7.5-10.5h6.375c.621 0 1.125.504 1.125 1.125v9.375m-8.25-3l1.5 1.5 3-3.75',
  },
  {
    title: 'Monitor and Generate Reports',
    desc: 'Review records and generate reports for better financial management.',
    icon: 'M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z',
  },
]

const SECURITY_ITEMS = [
  {
    title: 'Secure Access Control',
    desc: 'Role-based permissions ensure only authorized personnel reach sensitive records.',
    icon: 'M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z',
  },
  {
    title: 'Protected Login',
    desc: 'Authenticated sessions protect the church financial dashboard from unauthorized use.',
    icon: 'M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z',
  },
  {
    title: 'Organized Records',
    desc: 'Financial records are structured and managed within a centralized system.',
    icon: 'M20.25 6.375c0 2.278-3.694 4.125-8.25 4.125S3.75 8.653 3.75 6.375m16.5 0c0-2.278-3.694-4.125-8.25-4.125S3.75 4.097 3.75 6.375m16.5 0v11.25c0 2.278-3.694 4.125-8.25 4.125s-8.25-1.847-8.25-4.125V6.375m16.5 5.625c0 2.278-3.694 4.125-8.25 4.125s-8.25-1.847-8.25-4.125',
  },
  {
    title: 'Controlled Access',
    desc: 'Authorized user accounts help maintain the confidentiality of church data.',
    icon: 'M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z',
  },
]

function SectionHeading({ eyebrow, title, desc }: { eyebrow?: string; title: string; desc?: string }) {
  return (
    <div className="mx-auto max-w-2xl text-center mb-14">
      {eyebrow && (
        <span className="inline-flex items-center gap-1.5 rounded-full bg-brand-50 text-brand-700 ring-1 ring-brand-100 px-3.5 py-1 text-xs font-semibold uppercase tracking-wide mb-4">
          {eyebrow}
        </span>
      )}
      <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">{title}</h2>
      {desc && <p className="text-slate-500 mt-4 text-base sm:text-lg leading-relaxed">{desc}</p>}
    </div>
  )
}

export default function LandingPage() {
  const [menuOpen, setMenuOpen] = useState(false)
  const { user } = useAuth()
  const navigate = useNavigate()

  useEffect(() => {
    if (user) navigate(user.role === 'Usher' ? '/usher' : '/app', { replace: true })
  }, [user, navigate])

  const scrollTo = (id: string) => {
    setMenuOpen(false)
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' })
  }

  return (
    <div className="bg-white text-slate-900">
      {/* NAV */}
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-slate-200">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            <button onClick={() => scrollTo('home')} className="flex items-center gap-2.5">
              <img src={CHURCH_LOGO_URL} alt="Church logo" className="h-9 w-9 rounded-lg object-cover ring-1 ring-slate-200" />
              <span className="text-lg font-extrabold tracking-tight text-slate-900">
                CTOMS
              </span>
            </button>

            <nav className="hidden md:flex items-center gap-8">
              {NAV_LINKS.map((l) => (
                <button
                  key={l.label}
                  onClick={() => scrollTo(l.href.slice(1))}
                  className="text-sm font-medium text-slate-600 hover:text-brand-700 transition-colors"
                >
                  {l.label}
                </button>
              ))}
            </nav>

            <div className="flex items-center gap-3">
              <Link
                to="/login"
                className="hidden sm:inline-flex items-center justify-center rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-700 shadow-sm transition-colors"
              >
                Sign In
              </Link>
              <button
                onClick={() => setMenuOpen((o) => !o)}
                className="md:hidden p-2 -mr-1 text-slate-600 hover:text-brand-700"
                aria-label="Toggle menu"
              >
                {menuOpen ? (
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                ) : (
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
                  </svg>
                )}
              </button>
            </div>
          </div>
        </div>

        {menuOpen && (
          <div className="md:hidden border-t border-slate-200 bg-white px-4 py-3 space-y-1">
            {NAV_LINKS.map((l) => (
              <button
                key={l.label}
                onClick={() => scrollTo(l.href.slice(1))}
                className="block w-full text-left rounded-lg px-3 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50 hover:text-brand-700 transition-colors"
              >
                {l.label}
              </button>
            ))}
            <Link
              to="/login"
              className="flex items-center justify-center rounded-lg bg-brand-600 px-4 py-2.5 mt-2 text-sm font-semibold text-white hover:bg-brand-700 transition-colors"
            >
              Sign In
            </Link>
          </div>
        )}
      </header>

      {/* HERO */}
      <section id="home" className="relative overflow-hidden bg-slate-50">
        <div className="absolute inset-0 -z-10">
          <div className="absolute -top-24 -right-24 h-96 w-96 rounded-full bg-brand-100/50 blur-3xl" />
          <div className="absolute bottom-0 left-1/4 h-72 w-72 rounded-full bg-amber-100/50 blur-3xl" />
        </div>
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-16 lg:py-24">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-brand-50 text-brand-700 ring-1 ring-brand-100 px-3.5 py-1 text-xs font-semibold mb-6">
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
                </svg>
                Church Finance Management
              </span>
              <h1 className="text-4xl sm:text-5xl xl:text-6xl font-extrabold tracking-tight text-slate-900 leading-tight">
                Modern and Secure <span className="text-brand-600">Church Tithes & Offering</span> Management
              </h1>
              <p className="text-slate-600 mt-6 text-lg leading-relaxed max-w-xl">
                Manage church tithes, offerings, financial transactions, and records in one secure and organized system.
              </p>
              <div className="mt-8 flex flex-col sm:flex-row gap-3">
                <Link
                  to="/login"
                  className="inline-flex items-center justify-center gap-2 rounded-lg bg-brand-600 px-6 py-3.5 text-sm font-semibold text-white hover:bg-brand-700 shadow-sm transition-colors"
                >
                  Get Started
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                  </svg>
                </Link>
                <button
                  onClick={() => scrollTo('features')}
                  className="inline-flex items-center justify-center gap-2 rounded-lg bg-white ring-1 ring-slate-200 px-6 py-3.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 hover:ring-slate-300 transition-colors"
                >
                  Explore Features
                </button>
              </div>
            </div>

            {/* Hero illustration — dashboard mockup */}
            <div className="relative">
              <div className="absolute -inset-4 -z-10 rounded-3xl bg-gradient-to-br from-brand-100 to-amber-50/50 blur-2xl" />
              <div className="rounded-2xl bg-white ring-1 ring-slate-200 shadow-xl shadow-slate-200/60 p-5 sm:p-6">
                <div className="flex items-center justify-between mb-5">
                  <div className="flex items-center gap-2">
                    <img src={CHURCH_LOGO_URL} alt="Church logo" className="h-8 w-8 rounded-lg object-cover ring-1 ring-slate-200" />
                    <span className="font-bold text-slate-800 text-sm">CTOMS Dashboard</span>
                  </div>
                  <span className="rounded-full bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200 px-2.5 py-0.5 text-[11px] font-semibold">
                    ● Live
                  </span>
                </div>

                <div className="grid grid-cols-3 gap-3 mb-4">
                  {[
                    { label: 'Tithes', value: '₱124,500' },
                    { label: 'Offerings', value: '₱68,200' },
                    { label: 'Transactions', value: '1,240' },
                  ].map((s) => (
                    <div key={s.label} className="rounded-xl bg-slate-50 ring-1 ring-slate-100 p-3">
                      <div className="text-[11px] font-medium text-slate-500">{s.label}</div>
                      <div className="text-sm font-bold text-slate-900 mt-1">{s.value}</div>
                    </div>
                  ))}
                </div>

                <div className="rounded-xl ring-1 ring-slate-200 p-4">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs font-semibold text-slate-600">Monthly Giving</span>
                    <span className="text-xs text-slate-400">Last 6 months</span>
                  </div>
                  <div className="flex items-end gap-2 h-28">
                    {[40, 62, 48, 78, 56, 90].map((h, i) => (
                      <div key={i} className="flex-1 rounded-t-md bg-brand-500/80" style={{ height: `${h}%` }} />
                    ))}
                  </div>
                </div>

                <div className="mt-4 grid grid-cols-2 gap-3">
                  <div className="rounded-xl ring-1 ring-slate-200 p-3">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600">
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </span>
                      <span className="text-xs font-semibold text-slate-700">Secure Access</span>
                    </div>
                    <div className="text-xs text-slate-500">Role-based control</div>
                  </div>
                  <div className="rounded-xl ring-1 ring-slate-200 p-3">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-amber-50 text-amber-600">
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M9 8.25H7.5a2.25 2.25 0 00-2.25 2.25v9a2.25 2.25 0 002.25 2.25h9a2.25 2.25 0 002.25-2.25v-9a2.25 2.25 0 00-2.25-2.25H15M9 12l3 3m0 0l3-3m-3 3V2.25" />
                        </svg>
                      </span>
                      <span className="text-xs font-semibold text-slate-700">Reports</span>
                    </div>
                    <div className="text-xs text-slate-500">Financial insights</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CHURCH */}
      <section id="church" className="py-20 lg:py-24 bg-white">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="relative order-2 lg:order-1">
              <div className="absolute -inset-4 -z-10 rounded-3xl bg-gradient-to-br from-brand-100 to-slate-100 blur-2xl" />
              <div className="overflow-hidden rounded-2xl ring-1 ring-slate-200 shadow-xl shadow-slate-200/60">
                <img
                  src="https://scontent.fmnl34-1.fna.fbcdn.net/v/t39.30808-6/679647951_1001112642345900_3796742968497353020_n.jpg?stp=dst-jpg_tt6&cstp=mx1016x762&ctp=s960x960&_nc_cat=101&ccb=1-7&_nc_sid=cc71e4&_nc_eui2=AeH19kPAWmvnq6kTjJMBlzTbwTylbRAD5hjBPKVtEAPmGGLOObnkeq1gTgg7HH-zuAADCbe-Gl7N2CXpKKQj3lSA&_nc_ohc=UiKABzen2FQQ7kNvwGW0hAe&_nc_oc=AdrIBNm8Do6FNED9svFLv_f0xhbct-L_BttPJ21CNz-w-_cDrDXEhceI9gIbgBb6bFe0qO1VNYsQGjZxjBure9jh&_nc_zt=23&_nc_ht=scontent.fmnl34-1.fna&_nc_gid=bv1ag5gyO6qcXcXC6f33Nw&_nc_ss=7b2a8&oh=00_AQJ-yp_1GZg9Y53pV25NxDjblo9rK1-RvIAGcsFoHB5eCQ&oe=6A9B75CD"
                  alt="CCCC-PGI Church"
                  className="w-full h-72 sm:h-96 object-cover"
                />
              </div>
            </div>
            <div className="order-1 lg:order-2">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-brand-50 text-brand-700 ring-1 ring-brand-100 px-3.5 py-1 text-xs font-semibold uppercase tracking-wide mb-4">
                Our Church
              </span>
              <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
                CCCC-PGI
              </h2>
              <p className="text-slate-500 mt-4 text-base sm:text-lg leading-relaxed">
                CTOMS is built to support the financial management of our church community.
                CCCC-PGI uses this system to keep tithes, offerings, and financial records
                organized, transparent, and secure — helping our congregation give with
                confidence.
              </p>
              <div className="mt-6 grid sm:grid-cols-3 gap-4">
                {[
                  { label: 'Tithes', icon: 'M12 6v12m-3-2.818l.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 11-18 0 9 9 0 0118 0z' },
                  { label: 'Offerings', icon: 'M21 11.25v8.25a1.5 1.5 0 01-1.5 1.5H5.25a1.5 1.5 0 01-1.5-1.5v-8.25M12 4.875A2.625 2.625 0 109.375 7.5H12m0-2.625V7.5m0-2.625A2.625 2.625 0 1114.625 7.5H12m0 0V21m-8.625-9.75h18c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125h-18c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z' },
                  { label: 'Records', icon: 'M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z' }
                ].map((s) => (
                  <div key={s.label} className="rounded-xl bg-slate-50 ring-1 ring-slate-100 p-4">
                    <svg className="w-6 h-6 text-brand-600 mb-2" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d={s.icon} />
                    </svg>
                    <div className="text-sm font-semibold text-slate-800">{s.label}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FEATURES */}
      <section id="features" className="py-20 lg:py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <SectionHeading
            eyebrow="Features"
            title="Everything Your Church Needs"
            desc="A complete set of tools to manage tithes, offerings, and financial records in one place."
          />
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {FEATURES.map((f) => (
              <div
                key={f.title}
                className="group rounded-2xl bg-white ring-1 ring-slate-200 p-6 hover:ring-brand-300 hover:shadow-lg hover:shadow-brand-100/40 transition-all"
              >
                <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-brand-50 text-brand-600 group-hover:bg-brand-600 group-hover:text-white transition-colors">
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d={f.icon} />
                  </svg>
                </span>
                <h3 className="text-lg font-bold text-slate-900 mt-5">{f.title}</h3>
                <p className="text-slate-500 mt-2 text-sm leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section className="py-20 lg:py-24 bg-slate-50">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <SectionHeading
            eyebrow="How It Works"
            title="Simple by Design"
            desc="A straightforward process that keeps church financial management organized and efficient."
          />
          <div className="grid md:grid-cols-3 gap-8 relative">
            {STEPS.map((s, i) => (
              <div key={s.title} className="relative text-center">
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-brand-600 text-white shadow-lg shadow-brand-600/20">
                  <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d={s.icon} />
                  </svg>
                </div>
                <span className="absolute -top-2 -right-8 md:-right-4 lg:right-6 flex h-7 w-7 items-center justify-center rounded-full bg-white ring-1 ring-slate-200 text-sm font-bold text-brand-600">
                  {i + 1}
                </span>
                <h3 className="text-lg font-bold text-slate-900 mt-6">{s.title}</h3>
                <p className="text-slate-500 mt-2 text-sm leading-relaxed max-w-xs mx-auto">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* SECURITY */}
      <section id="security" className="py-20 lg:py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <SectionHeading
                eyebrow="Security"
                title="Your Church Data, Protected"
                desc="CTOMS is designed to help protect sensitive church records through secure access control and proper data management."
              />
              <div className="space-y-5 -mt-6">
                {SECURITY_ITEMS.map((s) => (
                  <div key={s.title} className="flex gap-4">
                    <span className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl bg-brand-50 text-brand-600">
                      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" d={s.icon} />
                      </svg>
                    </span>
                    <div>
                      <h4 className="font-bold text-slate-900">{s.title}</h4>
                      <p className="text-slate-500 text-sm mt-1 leading-relaxed">{s.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* security illustration */}
            <div className="relative">
              <div className="absolute -inset-4 -z-10 rounded-3xl bg-gradient-to-br from-brand-100 to-slate-100 blur-2xl" />
              <div className="rounded-2xl bg-white ring-1 ring-slate-200 shadow-xl shadow-slate-200/60 p-6">
                <div className="flex items-center justify-between mb-5">
                  <span className="inline-flex items-center gap-2 rounded-full bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200 px-3 py-1 text-xs font-semibold">
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
                    </svg>
                    Access Protected
                  </span>
                  <span className="rounded-full bg-slate-100 text-slate-500 px-3 py-1 text-xs font-medium">Authenticated</span>
                </div>
                <div className="mx-auto flex h-28 w-28 items-center justify-center rounded-full bg-brand-50 ring-8 ring-brand-50/60 mb-6">
                  <svg className="w-14 h-14 text-brand-600" fill="none" viewBox="0 0 24 24" strokeWidth={1.2} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
                  </svg>
                </div>
                <div className="space-y-3">
                  {[
                    ['Role', 'Treasurer'],
                    ['Access', 'Authorized'],
                    ['Session', 'Active & Secure'],
                  ].map(([k, v]) => (
                    <div key={k} className="flex items-center justify-between rounded-xl bg-slate-50 ring-1 ring-slate-100 px-4 py-3">
                      <span className="text-sm text-slate-500">{k}</span>
                      <span className="text-sm font-semibold text-slate-800">{v}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ABOUT */}
      <section id="about" className="py-20 lg:py-24 bg-slate-50">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 text-center">
          <SectionHeading
            eyebrow="About"
            title="Built for Better Church Financial Management"
            desc="CTOMS helps simplify the management of church tithes, offerings, transactions, and financial records by providing an organized and centralized digital system."
          />
          <div className="grid sm:grid-cols-3 gap-6 max-w-3xl mx-auto">
            {[
              { icon: 'M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75z', value: 'Centralized', label: 'All records in one place' },
              { icon: 'M9 17.25v1.007a3 3 0 01-.879 2.122L7.5 21h9l-.621-.621A3 3 0 0115 18.257V17.25m6-12V15a2.25 2.25 0 01-2.25 2.25H5.25A2.25 2.25 0 013 15V5.25m18 0A2.25 2.25 0 0018.75 3H5.25A2.25 2.25 0 003 5.25m18 0V12a2.25 2.25 0 01-2.25 2.25H5.25A2.25 2.25 0 013 12V5.25', value: 'Organized', label: 'Structured and searchable' },
              { icon: 'M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z', value: 'Secure', label: 'Protected by access control' },
            ].map((s) => (
              <div key={s.value} className="rounded-2xl bg-white ring-1 ring-slate-200 p-6">
                <span className="flex h-12 w-12 mx-auto items-center justify-center rounded-xl bg-brand-50 text-brand-600">
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d={s.icon} />
                  </svg>
                </span>
                <div className="font-extrabold text-2xl text-slate-900 mt-4">{s.value}</div>
                <div className="text-sm text-slate-500 mt-1">{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 lg:py-24">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
          <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-brand-700 via-brand-600 to-brand-700 px-6 py-14 sm:px-12 text-center text-white">
            <div className="absolute inset-0 opacity-10">
              <div className="absolute -top-10 -left-10 h-56 w-56 rounded-full border border-white/40" />
              <div className="absolute bottom-0 right-0 h-64 w-64 rounded-full bg-white/10" />
            </div>
            <div className="relative">
              <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight">
                Access Your Church Management Dashboard
              </h2>
              <p className="text-brand-100 mt-4 text-base sm:text-lg mx-auto max-w-xl">
                Securely manage your church's tithes and offerings in one centralized system.
              </p>
              <Link
                to="/login"
                className="mt-8 inline-flex items-center justify-center gap-2 rounded-lg bg-white px-8 py-3.5 text-sm font-bold text-brand-700 shadow-lg hover:bg-slate-50 transition-colors"
              >
                Sign In to CTOMS
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                </svg>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="border-t border-slate-200 bg-slate-50">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12">
          <div className="flex flex-col md:flex-row items-center justify-between gap-8">
            <div className="text-center md:text-left">
              <div className="flex items-center justify-center md:justify-start gap-2.5">
                <img src={CHURCH_LOGO_URL} alt="Church logo" className="h-9 w-9 rounded-lg object-cover ring-1 ring-slate-200" />
                <span className="text-lg font-extrabold tracking-tight text-slate-900">CTOMS</span>
              </div>
              <p className="text-sm text-slate-500 mt-1.5">Church Tithes & Offering Management System</p>
            </div>

            <nav className="flex flex-wrap items-center justify-center gap-6">
              {NAV_LINKS.map((l) => (
                <button
                  key={l.label}
                  onClick={() => scrollTo(l.href.slice(1))}
                  className="text-sm font-medium text-slate-600 hover:text-brand-700 transition-colors"
                >
                  {l.label}
                </button>
              ))}
            </nav>
          </div>

          <div className="mt-10 border-t border-slate-200 pt-6 text-center text-sm text-slate-500">
            © 2026 CTOMS. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  )
}
