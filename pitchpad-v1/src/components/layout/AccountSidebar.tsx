// src/components/layout/AccountSidebar.tsx
'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useSession } from 'next-auth/react'

const accountNav = [
  { href: '/account', label: 'Profile', icon: '○' },
  { href: '/account/preferences', label: 'Preferences', icon: '◇' },
  { href: '/account/notifications', label: 'Notifications', icon: '◈' },
  { href: '/account/security', label: 'Security', icon: '◎' },
]

export default function AccountSidebar() {
  const pathname = usePathname()
  const { data: session } = useSession()
  const user = session?.user

  return (
    <aside style={{
      width: 220,
      borderRight: '1px solid #E6E6E6',
      background: '#fff',
      minHeight: 'calc(100vh - 60px)',
    }}>
      <div style={{ padding: '24px 16px' }}>
        <p style={{
          fontSize: 11,
          fontWeight: 500,
          color: '#999',
          textTransform: 'uppercase',
          letterSpacing: '0.05em',
          marginBottom: 12,
          paddingLeft: 12,
        }}>
          Account Settings
        </p>

        <nav style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          {accountNav.map((item) => {
            const active = pathname === item.href
            return (
              <Link
                key={item.href}
                href={item.href}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                  padding: '10px 12px',
                  borderRadius: 6,
                  fontSize: 13,
                  fontWeight: active ? 500 : 400,
                  color: active ? '#111' : '#666',
                  background: active ? '#F8F8F8' : 'transparent',
                  textDecoration: 'none',
                  transition: 'all 0.15s',
                }}
              >
                <span style={{ fontSize: 14, opacity: 0.6 }}>{item.icon}</span>
                {item.label}
                {active && (
                  <span style={{
                    marginLeft: 'auto',
                    width: 6,
                    height: 6,
                    borderRadius: '50%',
                    background: '#E2001A',
                  }} />
                )}
              </Link>
            )
          })}
        </nav>

        {/* User Info */}
        {user && (
          <div style={{
            marginTop: 24,
            padding: '16px 12px',
            background: '#F8F8F8',
            borderRadius: 6,
          }}>
            <p style={{ fontSize: 12, fontWeight: 500, color: '#111', marginBottom: 4 }}>
              {user.name || 'User'}
            </p>
            <p style={{ fontSize: 11, color: '#999', marginBottom: 8, wordBreak: 'break-all' }}>
              {user.email}
            </p>
            <span style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 4,
              padding: '3px 8px',
              background: user.role === 'REVIEWER' ? '#E8F4FE' : '#FFF0F2',
              color: user.role === 'REVIEWER' ? '#0066CC' : '#E2001A',
              borderRadius: 4,
              fontSize: 10,
              fontWeight: 500,
              textTransform: 'uppercase',
            }}>
              <span style={{
                width: 5,
                height: 5,
                borderRadius: '50%',
                background: 'currentColor',
              }} />
              {user.role || 'CREATOR'}
            </span>
          </div>
        )}

        {/* Back to App */}
        <Link
          href="/dashboard"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            marginTop: 24,
            padding: '10px 12px',
            fontSize: 12,
            color: '#E2001A',
            textDecoration: 'none',
          }}
        >
          ← Back to Dashboard
        </Link>
      </div>
    </aside>
  )
}
