// src/app/account/security/page.tsx
'use client'
import { useState } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function SecurityPage() {
  const router = useRouter()
  const { data: session, status } = useSession()
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  if (status === 'unauthenticated') {
    router.push('/auth/login')
    return null
  }

  async function handleChangePassword(e: React.FormEvent) {
    e.preventDefault()
    setMessage(null)

    if (newPassword !== confirmPassword) {
      setMessage({ type: 'error', text: 'New passwords do not match' })
      return
    }

    if (newPassword.length < 8) {
      setMessage({ type: 'error', text: 'Password must be at least 8 characters' })
      return
    }

    setSaving(true)
    try {
      const res = await fetch('/api/account/password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentPassword, newPassword }),
      })

      if (res.ok) {
        setMessage({ type: 'success', text: 'Password changed successfully' })
        setCurrentPassword('')
        setNewPassword('')
        setConfirmPassword('')
      } else {
        const data = await res.json()
        setMessage({ type: 'error', text: data.error || 'Failed to change password' })
      }
    } catch {
      setMessage({ type: 'error', text: 'Failed to change password' })
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <div style={{ width: 40, height: 3, background: '#E2001A', marginBottom: 12 }} />
        <h1 style={{ fontSize: 24, fontWeight: 300, color: '#111' }}>Account Settings</h1>
        <p style={{ color: '#999', fontSize: 13, marginTop: 4 }}>Manage your account preferences</p>
      </div>

      {/* Account Navigation */}
      <div style={{ display: 'flex', gap: 24, borderBottom: '1px solid #E6E6E6', paddingBottom: 0 }}>
        {[
          { href: '/account', label: 'Profile' },
          { href: '/account/preferences', label: 'Preferences' },
          { href: '/account/notifications', label: 'Notifications' },
          { href: '/account/security', label: 'Security' },
        ].map(tab => (
          <Link
            key={tab.href}
            href={tab.href}
            style={{
              fontSize: 13,
              color: tab.href === '/account/security' ? '#E2001A' : '#666',
              textDecoration: 'none',
              paddingBottom: 12,
              borderBottom: tab.href === '/account/security' ? '2px solid #E2001A' : '2px solid transparent',
              marginBottom: -1,
            }}
          >
            {tab.label}
          </Link>
        ))}
      </div>

      {/* Change Password */}
      <div className="lv-card" style={{ padding: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#E2001A" strokeWidth="1.5">
            <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
            <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
          </svg>
          <h2 style={{ fontSize: 14, fontWeight: 500, color: '#111', margin: 0 }}>Change Password</h2>
        </div>

        {message && (
          <div style={{
            padding: '10px 14px',
            borderRadius: 4,
            marginBottom: 16,
            background: message.type === 'success' ? '#E6F9F1' : '#FFF0F2',
            color: message.type === 'success' ? '#00875A' : '#E2001A',
            fontSize: 13,
          }}>
            {message.text}
          </div>
        )}

        <form onSubmit={handleChangePassword} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div>
            <label className="lv-label">Current Password</label>
            <input
              type="password"
              className="lv-input"
              value={currentPassword}
              onChange={e => setCurrentPassword(e.target.value)}
              placeholder="Enter current password"
              required
            />
          </div>
          <div>
            <label className="lv-label">New Password</label>
            <input
              type="password"
              className="lv-input"
              value={newPassword}
              onChange={e => setNewPassword(e.target.value)}
              placeholder="Enter new password"
              required
              minLength={8}
            />
          </div>
          <div>
            <label className="lv-label">Confirm New Password</label>
            <input
              type="password"
              className="lv-input"
              value={confirmPassword}
              onChange={e => setConfirmPassword(e.target.value)}
              placeholder="Confirm new password"
              required
            />
          </div>
          <button type="submit" disabled={saving} className="lv-btn lv-btn-primary" style={{ alignSelf: 'flex-start' }}>
            {saving ? 'Changing...' : 'Change Password'}
          </button>
        </form>
      </div>

      {/* Connected Accounts */}
      <div className="lv-card" style={{ padding: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#E2001A" strokeWidth="1.5">
            <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/>
            <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/>
          </svg>
          <h2 style={{ fontSize: 14, fontWeight: 500, color: '#111', margin: 0 }}>Connected Accounts</h2>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', background: '#F8F8F8', borderRadius: 6 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ width: 32, height: 32, background: '#00A4EF', borderRadius: 4, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="#fff">
                  <path d="M0 0h11.377v11.372H0zm12.623 0H24v11.372H12.623zM0 12.623h11.377V24H0zm12.623 0H24V24H12.623z"/>
                </svg>
              </div>
              <div>
                <p style={{ fontSize: 13, fontWeight: 500, color: '#111', margin: 0 }}>Microsoft</p>
                <p style={{ fontSize: 11, color: '#999', margin: 0 }}>
                  {session?.user?.email?.includes('@') ? 'Connected' : 'Not connected'}
                </p>
              </div>
            </div>
            <span className="lv-badge" style={{ background: '#E6F9F1', color: '#00875A' }}>
              Active
            </span>
          </div>
        </div>
      </div>

      {/* Sessions */}
      <div className="lv-card" style={{ padding: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#E2001A" strokeWidth="1.5">
            <rect x="2" y="3" width="20" height="14" rx="2" ry="2"/>
            <line x1="8" y1="21" x2="16" y2="21"/>
            <line x1="12" y1="17" x2="12" y2="21"/>
          </svg>
          <h2 style={{ fontSize: 14, fontWeight: 500, color: '#111', margin: 0 }}>Active Sessions</h2>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', border: '1px solid #E6E6E6', borderRadius: 6 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ width: 32, height: 32, background: '#E6E6E6', borderRadius: 4, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#666" strokeWidth="1.5">
                  <rect x="2" y="3" width="20" height="14" rx="2" ry="2"/>
                  <line x1="8" y1="21" x2="16" y2="21"/>
                  <line x1="12" y1="17" x2="12" y2="21"/>
                </svg>
              </div>
              <div>
                <p style={{ fontSize: 13, fontWeight: 500, color: '#111', margin: 0 }}>Current Session</p>
                <p style={{ fontSize: 11, color: '#999', margin: 0 }}>Windows - Chrome</p>
              </div>
            </div>
            <span className="lv-badge" style={{ background: '#E6F9F1', color: '#00875A' }}>
              This Device
            </span>
          </div>
        </div>

        <button className="lv-btn" style={{ marginTop: 16, background: '#FFF0F2', color: '#E2001A' }}>
          Sign Out All Other Sessions
        </button>
      </div>
    </div>
  )
}
