// src/components/layout/TopNav.tsx
'use client'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useState, useEffect, useRef } from 'react'
import { useSession, signOut } from 'next-auth/react'

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
  const router = useRouter()
  const { data: session } = useSession()
  const [open, setOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  const user = session?.user
  const links = user?.role === 'REVIEWER' ? reviewerLinks : creatorLinks

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Close dropdown on route change
  useEffect(() => {
    setOpen(false)
  }, [pathname])

  async function handleSignOut() {
    await signOut({ callbackUrl: '/auth/login' })
  }

  // Generate initials from name or email
  const getInitials = () => {
    if (user?.name) {
      const parts = user.name.split(' ')
      if (parts.length >= 2) {
        return (parts[0][0] + parts[1][0]).toUpperCase()
      }
      return user.name.slice(0, 2).toUpperCase()
    }
    if (user?.email) {
      return user.email.slice(0, 2).toUpperCase()
    }
    return 'U'
  }

  const initials = getInitials()
  const hasImage = !!user?.image

  return (
    <header style={{ background: '#fff', borderBottom: '1px solid #E6E6E6', position: 'sticky', top: 0, zIndex: 50 }}>
      <div style={{ height: 3, background: '#E2001A' }} />
      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 24px' }}>
        <div style={{ height: 52, display: 'flex', alignItems: 'center', gap: 32 }}>
          {/* Logo */}
          <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: 8, textDecoration: 'none', flexShrink: 0 }}>
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
              <span className="lv-badge" style={{
                background: user.role === 'REVIEWER' ? '#EBF3FF' : '#FFF0F2',
                color: user.role === 'REVIEWER' ? '#0066CC' : '#E2001A',
                border: `1px solid ${user.role === 'REVIEWER' ? '#C2D8F5' : '#F5B8C0'}`,
                fontSize: 9
              }}>
                {user.role}
              </span>
            )}

            <Link href="/alerts" style={{ position: 'relative', display: 'flex', padding: 6, borderRadius: 4, color: '#666', textDecoration: 'none' }}>
              <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
                <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
              </svg>
            </Link>

            {/* Profile Dropdown */}
            <div style={{ position: 'relative' }} ref={dropdownRef}>
              <button
                onClick={() => setOpen(o => !o)}
                aria-expanded={open}
                aria-haspopup="true"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  background: open ? '#F8F8F8' : 'none',
                  border: 'none',
                  cursor: 'pointer',
                  padding: '4px 8px',
                  borderRadius: 4,
                  transition: 'background 0.15s'
                }}
              >
                {hasImage ? (
                  <img
                    src={user.image!}
                    alt={user.name || 'Profile'}
                    style={{
                      width: 28,
                      height: 28,
                      borderRadius: '50%',
                      objectFit: 'cover',
                      border: '2px solid #E2001A'
                    }}
                  />
                ) : (
                  <div style={{
                    width: 28,
                    height: 28,
                    borderRadius: '50%',
                    background: '#E2001A',
                    color: '#fff',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: 11,
                    fontWeight: 600
                  }}>
                    {initials}
                  </div>
                )}
                <svg
                  width="11"
                  height="11"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="#999"
                  strokeWidth="2"
                  style={{ transform: open ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.15s' }}
                >
                  <polyline points="6 9 12 15 18 9"/>
                </svg>
              </button>

              {open && (
                <div
                  className="lv-card"
                  style={{
                    position: 'absolute',
                    right: 0,
                    top: '100%',
                    marginTop: 6,
                    width: 240,
                    zIndex: 100,
                    boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
                    padding: 0,
                    animation: 'fadeIn 0.15s ease-out'
                  }}
                >
                  {/* User Info Header */}
                  <div style={{ padding: '14px 16px', borderBottom: '1px solid #F2F2F2', background: '#FAFAFA' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      {hasImage ? (
                        <img
                          src={user.image!}
                          alt={user.name || 'Profile'}
                          style={{ width: 36, height: 36, borderRadius: '50%', objectFit: 'cover' }}
                        />
                      ) : (
                        <div style={{
                          width: 36,
                          height: 36,
                          borderRadius: '50%',
                          background: '#E2001A',
                          color: '#fff',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: 13,
                          fontWeight: 600
                        }}>
                          {initials}
                        </div>
                      )}
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <p style={{ fontSize: 13, fontWeight: 500, color: '#111', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {user?.name || 'User'}
                        </p>
                        <p style={{ fontSize: 11, color: '#999', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {user?.email}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Menu Items */}
                  <div style={{ padding: '6px 0' }}>
                    <Link
                      href="/account"
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 10,
                        padding: '10px 16px',
                        fontSize: 13,
                        color: '#333',
                        textDecoration: 'none',
                        transition: 'background 0.1s'
                      }}
                      className="dropdown-item"
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                        <circle cx="12" cy="7" r="4"/>
                      </svg>
                      Account Settings
                    </Link>

                    <Link
                      href="/account/preferences"
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 10,
                        padding: '10px 16px',
                        fontSize: 13,
                        color: '#333',
                        textDecoration: 'none'
                      }}
                      className="dropdown-item"
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                        <circle cx="12" cy="12" r="3"/>
                        <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/>
                      </svg>
                      Preferences
                    </Link>

                    <Link
                      href="/account/notifications"
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 10,
                        padding: '10px 16px',
                        fontSize: 13,
                        color: '#333',
                        textDecoration: 'none'
                      }}
                      className="dropdown-item"
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                        <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
                        <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
                      </svg>
                      Notifications
                    </Link>
                  </div>

                  <div style={{ borderTop: '1px solid #F2F2F2', padding: '6px 0' }}>
                    <Link
                      href="/help"
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 10,
                        padding: '10px 16px',
                        fontSize: 13,
                        color: '#333',
                        textDecoration: 'none'
                      }}
                      className="dropdown-item"
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                        <circle cx="12" cy="12" r="10"/>
                        <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/>
                        <line x1="12" y1="17" x2="12.01" y2="17"/>
                      </svg>
                      Help & Support
                    </Link>

                    <a
                      href="mailto:support@pitchpad.io"
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 10,
                        padding: '10px 16px',
                        fontSize: 13,
                        color: '#333',
                        textDecoration: 'none'
                      }}
                      className="dropdown-item"
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                        <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
                        <polyline points="22,6 12,13 2,6"/>
                      </svg>
                      Contact Us
                    </a>
                  </div>

                  <div style={{ borderTop: '1px solid #F2F2F2', padding: '6px 0' }}>
                    <button
                      onClick={handleSignOut}
                      style={{
                        width: '100%',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 10,
                        padding: '10px 16px',
                        fontSize: 13,
                        color: '#E2001A',
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer',
                        fontFamily: 'IBM Plex Sans',
                        textAlign: 'left'
                      }}
                      className="dropdown-item"
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                        <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
                        <polyline points="16 17 21 12 16 7"/>
                        <line x1="21" y1="12" x2="9" y2="12"/>
                      </svg>
                      Sign Out
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        .dropdown-item:hover {
          background: #F8F8F8;
        }
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(-4px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </header>
  )
}
