// src/app/account/page.tsx
'use client'
import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function AccountPage() {
  const router = useRouter()
  const { data: session, status, update } = useSession()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/login')
    }
    if (session?.user) {
      setName(session.user.name || '')
      setEmail(session.user.email || '')
    }
  }, [session, status, router])

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    setMessage(null)

    try {
      const res = await fetch('/api/account', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name }),
      })

      if (res.ok) {
        await update({ name })
        setMessage({ type: 'success', text: 'Profile updated successfully' })
      } else {
        const data = await res.json()
        setMessage({ type: 'error', text: data.error || 'Failed to update profile' })
      }
    } catch {
      setMessage({ type: 'error', text: 'Failed to update profile' })
    } finally {
      setSaving(false)
    }
  }

  const initials = session?.user?.name
    ? session.user.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
    : session?.user?.email?.slice(0, 2).toUpperCase() || 'U'

  if (status === 'loading') {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 300 }}>
        <p style={{ color: '#999', fontSize: 13 }}>Loading...</p>
      </div>
    )
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
              color: tab.href === '/account' ? '#E2001A' : '#666',
              textDecoration: 'none',
              paddingBottom: 12,
              borderBottom: tab.href === '/account' ? '2px solid #E2001A' : '2px solid transparent',
              marginBottom: -1,
            }}
          >
            {tab.label}
          </Link>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Profile Photo Section */}
        <div className="lv-card" style={{ padding: 24 }}>
          <h2 style={{ fontSize: 14, fontWeight: 500, color: '#111', marginBottom: 16 }}>Profile Photo</h2>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16 }}>
            {session?.user?.image ? (
              <img
                src={session.user.image}
                alt="Profile"
                style={{ width: 80, height: 80, borderRadius: '50%', objectFit: 'cover', border: '3px solid #E2001A' }}
              />
            ) : (
              <div style={{
                width: 80,
                height: 80,
                borderRadius: '50%',
                background: '#E2001A',
                color: '#fff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 24,
                fontWeight: 600,
              }}>
                {initials}
              </div>
            )}
            <div style={{ textAlign: 'center' }}>
              <p style={{ fontSize: 13, color: '#666', marginBottom: 8 }}>
                {session?.user?.image ? 'Photo from your account provider' : 'Using initials as avatar'}
              </p>
              <p style={{ fontSize: 11, color: '#999' }}>
                Sign in with Microsoft to use your profile photo
              </p>
            </div>
          </div>
        </div>

        {/* Profile Form */}
        <div className="lg:col-span-2 lv-card" style={{ padding: 24 }}>
          <h2 style={{ fontSize: 14, fontWeight: 500, color: '#111', marginBottom: 16 }}>Profile Information</h2>

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

          <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div>
              <label className="lv-label">Full Name</label>
              <input
                type="text"
                className="lv-input"
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="Your name"
              />
            </div>

            <div>
              <label className="lv-label">Email Address</label>
              <input
                type="email"
                className="lv-input"
                value={email}
                disabled
                style={{ background: '#F8F8F8', color: '#999' }}
              />
              <p style={{ fontSize: 11, color: '#999', marginTop: 4 }}>
                Email cannot be changed. Contact support if needed.
              </p>
            </div>

            <div>
              <label className="lv-label">Role</label>
              <div style={{
                padding: '10px 14px',
                background: '#F8F8F8',
                borderRadius: 4,
                fontSize: 13,
                color: '#666',
                display: 'flex',
                alignItems: 'center',
                gap: 8,
              }}>
                <span className="lv-badge" style={{
                  background: session?.user?.role === 'REVIEWER' ? '#EBF3FF' : '#FFF0F2',
                  color: session?.user?.role === 'REVIEWER' ? '#0066CC' : '#E2001A',
                }}>
                  {session?.user?.role || 'CREATOR'}
                </span>
                <span>{session?.user?.role === 'REVIEWER' ? 'Reviewer' : 'Creator'}</span>
              </div>
            </div>

            <div style={{ display: 'flex', gap: 12, marginTop: 8 }}>
              <button
                type="submit"
                disabled={saving}
                className="lv-btn lv-btn-primary"
              >
                {saving ? 'Saving...' : 'Save Changes'}
              </button>
              <button
                type="button"
                onClick={() => {
                  setName(session?.user?.name || '')
                  setMessage(null)
                }}
                className="lv-btn"
                style={{ background: '#F8F8F8', color: '#666' }}
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Danger Zone */}
      <div className="lv-card" style={{ padding: 24, borderColor: '#FFC2C2' }}>
        <h2 style={{ fontSize: 14, fontWeight: 500, color: '#E2001A', marginBottom: 8 }}>Danger Zone</h2>
        <p style={{ fontSize: 13, color: '#666', marginBottom: 16 }}>
          Once you delete your account, there is no going back. Please be certain.
        </p>
        <button
          className="lv-btn"
          style={{ background: '#FFF0F2', color: '#E2001A', border: '1px solid #E2001A' }}
        >
          Delete Account
        </button>
      </div>
    </div>
  )
}
