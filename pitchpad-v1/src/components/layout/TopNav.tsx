// src/components/layout/TopNav.tsx
'use client'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useState } from 'react'
import { api, getUserFromStorage } from '@/lib/api'

const creatorLinks = [
  { href: '/dashboard',    label: 'Dashboard'    },
  { href: '/ideas',        label: 'My Ideas'     },
  { href: '/ideas/new',    label: 'Submit Idea'  },
  { href: '/viz',          label: 'Analytics'    },
  { href: '/ai-assistant', label: 'AI Assistant' },
  { href: '/export',       label: 'Export'       },
]
const reviewerLinks = [
  { href: '/dashboard',    label: 'Dashboard'    },
  { href: '/review',       label: 'Review Queue' },
  { href: '/viz',          label: 'Analytics'    },
  { href: '/ai-assistant', label: 'AI Assistant' },
]

export default function TopNav() {
  const pathname = usePathname()
  const router   = useRouter()
  const [open, setOpen] = useState(false)
  const user = getUserFromStorage()
  const links = user?.role === 'reviewer' ? reviewerLinks : creatorLinks

  function logout() {
    api.auth.logout()
    router.push('/auth/login')
  }

  const initials = user?.email?.slice(0, 2).toUpperCase() ?? 'TP'

  return (
    <header style={{ background: '#fff', borderBottom: '1px solid #E6E6E6', position: 'sticky', top: 0, zIndex: 50 }}>
      <div style={{ height: 3, background: '#E2001A' }} />
      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 24px' }}>
        <div style={{ height: 52, display: 'flex', alignItems: 'center', gap: 32 }}>
          {/* Logo */}
          <Link href="/dashboard" style={{ display: 'flex', alignItems: 'center', gap: 8, textDecoration: 'none', flexShrink: 0 }}>
            <div style={{ width: 16, height: 16, background: '#E2001A', borderRadius: 1 }} />
            <span style={{ fontFamily: 'IBM Plex Sans', fontWeight: 600, fontSize: 14, color: '#111', letterSpacing: '-0.02em' }}>PitchPad</span>
          </Link>

          {/* Nav */}
          <nav style={{ display: 'flex', gap: 24, flex: 1, alignItems: 'flex-end', height: '100%' }}>
            {links.map(link => {
              const active = pathname === link.href || (link.href !== '/dashboard' && pathname.startsWith(link.href))
              return (
                <Link key={link.href} href={link.href}
                  className={`lv-nav-item ${active ? 'active' : ''}`}
                  style={{ display: 'flex', alignItems: 'flex-end', height: '100%', paddingBottom: 14 }}>
                  {link.label}
                </Link>
              )
            })}
          </nav>

          {/* Right */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginLeft: 'auto' }}>
            {user?.role && (
              <span className="lv-badge" style={{ background: user.role === 'reviewer' ? '#EBF3FF' : '#FFF0F2', color: user.role === 'reviewer' ? '#0066CC' : '#E2001A', border: `1px solid ${user.role === 'reviewer' ? '#C2D8F5' : '#F5B8C0'}`, fontSize: 9 }}>
                {user.role.toUpperCase()}
              </span>
            )}

            <Link href="/alerts" style={{ position: 'relative', display: 'flex', padding: 6, borderRadius: 4, color: '#666', textDecoration: 'none' }}>
              <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
                <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
              </svg>
            </Link>

            <div style={{ position: 'relative' }}>
              <button onClick={() => setOpen(o => !o)}
                style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'none', border: 'none', cursor: 'pointer', padding: '4px 8px', borderRadius: 4 }}>
                <div style={{ width: 28, height: 28, borderRadius: '50%', background: '#E2001A', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 600 }}>
                  {initials}
                </div>
                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#999" strokeWidth="2">
                  <polyline points="6 9 12 15 18 9"/>
                </svg>
              </button>
              {open && (
                <div className="lv-card" style={{ position: 'absolute', right: 0, top: '100%', marginTop: 4, width: 192, zIndex: 100, boxShadow: '0 8px 24px rgba(0,0,0,0.12)', padding: 0 }}>
                  <div style={{ padding: '12px 14px', borderBottom: '1px solid #F2F2F2' }}>
                    <p style={{ fontSize: 12, color: '#999', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user?.email}</p>
                  </div>
                  <button onClick={logout}
                    style={{ width: '100%', textAlign: 'left', padding: '10px 14px', fontSize: 12, color: '#666', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'IBM Plex Sans' }}>
                    Sign out
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </header>
  )
}
