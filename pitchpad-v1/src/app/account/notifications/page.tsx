// src/app/account/notifications/page.tsx
'use client'
import { useState } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function NotificationsPage() {
  const router = useRouter()
  const { status } = useSession()
  const [settings, setSettings] = useState({
    emailIdeas: true,
    emailFeedback: true,
    emailDigest: false,
    pushIdeas: true,
    pushFeedback: true,
    pushReminders: false,
  })
  const [saving, setSaving] = useState(false)

  if (status === 'unauthenticated') {
    router.push('/auth/login')
    return null
  }

  function toggle(key: keyof typeof settings) {
    setSettings(s => ({ ...s, [key]: !s[key] }))
  }

  async function handleSave() {
    setSaving(true)
    localStorage.setItem('pitchpad_notifications', JSON.stringify(settings))
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
              color: tab.href === '/account/notifications' ? '#E2001A' : '#666',
              textDecoration: 'none',
              paddingBottom: 12,
              borderBottom: tab.href === '/account/notifications' ? '2px solid #E2001A' : '2px solid transparent',
              marginBottom: -1,
            }}
          >
            {tab.label}
          </Link>
        ))}
      </div>

      {/* Email Notifications */}
      <div className="lv-card" style={{ padding: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#E2001A" strokeWidth="1.5">
            <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
            <polyline points="22,6 12,13 2,6"/>
          </svg>
          <h2 style={{ fontSize: 14, fontWeight: 500, color: '#111', margin: 0 }}>Email Notifications</h2>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <ToggleRow
            label="New idea submissions"
            desc="Get notified when ideas are submitted for review"
            checked={settings.emailIdeas}
            onChange={() => toggle('emailIdeas')}
          />
          <ToggleRow
            label="Feedback received"
            desc="Get notified when you receive feedback on your ideas"
            checked={settings.emailFeedback}
            onChange={() => toggle('emailFeedback')}
          />
          <ToggleRow
            label="Weekly digest"
            desc="Receive a weekly summary of activity"
            checked={settings.emailDigest}
            onChange={() => toggle('emailDigest')}
          />
        </div>
      </div>

      {/* Push Notifications */}
      <div className="lv-card" style={{ padding: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#E2001A" strokeWidth="1.5">
            <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
            <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
          </svg>
          <h2 style={{ fontSize: 14, fontWeight: 500, color: '#111', margin: 0 }}>Push Notifications</h2>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <ToggleRow
            label="Idea updates"
            desc="Get push notifications for idea status changes"
            checked={settings.pushIdeas}
            onChange={() => toggle('pushIdeas')}
          />
          <ToggleRow
            label="New feedback"
            desc="Get push notifications when feedback is added"
            checked={settings.pushFeedback}
            onChange={() => toggle('pushFeedback')}
          />
          <ToggleRow
            label="Reminders"
            desc="Get reminded about pending tasks and deadlines"
            checked={settings.pushReminders}
            onChange={() => toggle('pushReminders')}
          />
        </div>
      </div>

      <div style={{ display: 'flex', gap: 12 }}>
        <button onClick={handleSave} disabled={saving} className="lv-btn lv-btn-primary">
          {saving ? 'Saving...' : 'Save Notification Settings'}
        </button>
      </div>
    </div>
  )
}

function ToggleRow({ label, desc, checked, onChange }: {
  label: string
  desc: string
  checked: boolean
  onChange: () => void
}) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 0', borderBottom: '1px solid #F2F2F2' }}>
      <div>
        <p style={{ fontSize: 13, fontWeight: 500, color: '#111', margin: 0 }}>{label}</p>
        <p style={{ fontSize: 12, color: '#999', margin: '2px 0 0' }}>{desc}</p>
      </div>
      <button
        onClick={onChange}
        style={{
          width: 44,
          height: 24,
          borderRadius: 12,
          background: checked ? '#E2001A' : '#E6E6E6',
          border: 'none',
          cursor: 'pointer',
          position: 'relative',
          transition: 'background 0.2s',
        }}
      >
        <div style={{
          width: 20,
          height: 20,
          borderRadius: '50%',
          background: '#fff',
          position: 'absolute',
          top: 2,
          left: checked ? 22 : 2,
          transition: 'left 0.2s',
          boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
        }} />
      </button>
    </div>
  )
}
