// src/app/account/preferences/page.tsx
'use client'
import { useState } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function PreferencesPage() {
  const router = useRouter()
  const { status } = useSession()
  const [avatarStyle, setAvatarStyle] = useState<'initials' | 'photo'>('initials')
  const [theme, setTheme] = useState<'light' | 'dark' | 'system'>('light')
  const [saving, setSaving] = useState(false)

  if (status === 'unauthenticated') {
    router.push('/auth/login')
    return null
  }

  async function handleSave() {
    setSaving(true)
    // Save preferences to localStorage or backend
    localStorage.setItem('pitchpad_preferences', JSON.stringify({ avatarStyle, theme }))
    await new Promise(r => setTimeout(r, 500))
    setSaving(false)
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
              color: tab.href === '/account/preferences' ? '#E2001A' : '#666',
              textDecoration: 'none',
              paddingBottom: 12,
              borderBottom: tab.href === '/account/preferences' ? '2px solid #E2001A' : '2px solid transparent',
              marginBottom: -1,
            }}
          >
            {tab.label}
          </Link>
        ))}
      </div>

      <div className="lv-card" style={{ padding: 24 }}>
        <h2 style={{ fontSize: 14, fontWeight: 500, color: '#111', marginBottom: 20 }}>Display Preferences</h2>

        {/* Avatar Style */}
        <div style={{ marginBottom: 24 }}>
          <label className="lv-label">Avatar Style</label>
          <p style={{ fontSize: 12, color: '#999', marginBottom: 12 }}>
            Choose how your profile picture appears throughout the app
          </p>
          <div style={{ display: 'flex', gap: 12 }}>
            {[
              { value: 'initials', label: 'Initials', desc: 'Show your initials' },
              { value: 'photo', label: 'Photo', desc: 'Use profile photo if available' },
            ].map(option => (
              <button
                key={option.value}
                onClick={() => setAvatarStyle(option.value as 'initials' | 'photo')}
                style={{
                  flex: 1,
                  padding: '16px',
                  border: avatarStyle === option.value ? '2px solid #E2001A' : '1px solid #E6E6E6',
                  borderRadius: 6,
                  background: avatarStyle === option.value ? '#FFF0F2' : '#fff',
                  cursor: 'pointer',
                  textAlign: 'left',
                }}
              >
                <p style={{ fontSize: 13, fontWeight: 500, color: '#111', margin: 0 }}>{option.label}</p>
                <p style={{ fontSize: 11, color: '#999', margin: '4px 0 0' }}>{option.desc}</p>
              </button>
            ))}
          </div>
        </div>

        {/* Theme */}
        <div style={{ marginBottom: 24 }}>
          <label className="lv-label">Theme</label>
          <p style={{ fontSize: 12, color: '#999', marginBottom: 12 }}>
            Select your preferred color theme
          </p>
          <div style={{ display: 'flex', gap: 12 }}>
            {[
              { value: 'light', label: 'Light', icon: '☀️' },
              { value: 'dark', label: 'Dark', icon: '🌙' },
              { value: 'system', label: 'System', icon: '💻' },
            ].map(option => (
              <button
                key={option.value}
                onClick={() => setTheme(option.value as 'light' | 'dark' | 'system')}
                style={{
                  flex: 1,
                  padding: '16px',
                  border: theme === option.value ? '2px solid #E2001A' : '1px solid #E6E6E6',
                  borderRadius: 6,
                  background: theme === option.value ? '#FFF0F2' : '#fff',
                  cursor: 'pointer',
                  textAlign: 'center',
                }}
              >
                <span style={{ fontSize: 20 }}>{option.icon}</span>
                <p style={{ fontSize: 13, fontWeight: 500, color: '#111', margin: '8px 0 0' }}>{option.label}</p>
              </button>
            ))}
          </div>
        </div>

        <div style={{ display: 'flex', gap: 12, marginTop: 24, paddingTop: 16, borderTop: '1px solid #F2F2F2' }}>
          <button onClick={handleSave} disabled={saving} className="lv-btn lv-btn-primary">
            {saving ? 'Saving...' : 'Save Preferences'}
          </button>
        </div>
      </div>

      {/* Language & Region */}
      <div className="lv-card" style={{ padding: 24 }}>
        <h2 style={{ fontSize: 14, fontWeight: 500, color: '#111', marginBottom: 20 }}>Language & Region</h2>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          <div>
            <label className="lv-label">Language</label>
            <select className="lv-input" defaultValue="en">
              <option value="en">English (US)</option>
              <option value="en-gb">English (UK)</option>
              <option value="es">Spanish</option>
              <option value="fr">French</option>
              <option value="de">German</option>
              <option value="zh">Chinese</option>
              <option value="ja">Japanese</option>
            </select>
          </div>
          <div>
            <label className="lv-label">Timezone</label>
            <select className="lv-input" defaultValue="America/New_York">
              <option value="America/New_York">Eastern Time (ET)</option>
              <option value="America/Chicago">Central Time (CT)</option>
              <option value="America/Denver">Mountain Time (MT)</option>
              <option value="America/Los_Angeles">Pacific Time (PT)</option>
              <option value="Europe/London">London (GMT)</option>
              <option value="Europe/Paris">Paris (CET)</option>
              <option value="Asia/Tokyo">Tokyo (JST)</option>
            </select>
          </div>
        </div>
      </div>
    </div>
  )
}
