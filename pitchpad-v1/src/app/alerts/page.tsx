// src/app/alerts/page.tsx  — Screen 5: Alerts & Notifications
'use client'

import { useState, useEffect } from 'react'
import { getSupabaseBrowserClient } from '@/lib/supabase'
import { formatRelative } from '@/lib/utils'
import Link from 'next/link'

interface Alert {
  id: string
  type: string
  title: string
  message: string
  read: boolean
  idea_id: string | null
  created_at: string
}

const ALERT_ICONS: Record<string, { icon: string; bg: string; color: string }> = {
  FEEDBACK_RECEIVED: { icon: '💬', bg: '#FFF0F2', color: '#E2001A' },
  IDEA_REVIEWED:     { icon: '✓',  bg: '#E6F9F1', color: '#00875A' },
  DECK_READY:        { icon: '⚡', bg: '#EBF3FF', color: '#0066CC' },
  SYSTEM:            { icon: '●',  bg: '#F8F8F8', color: '#666'    },
}

export default function AlertsPage() {
  const [alerts, setAlerts]   = useState<Alert[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter]   = useState<'ALL' | 'UNREAD'>('ALL')

  const sb = getSupabaseBrowserClient()

  useEffect(() => {
    loadAlerts()

    // Realtime subscription
    const channel = sb.channel('alerts-rt')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'alerts' }, payload => {
        setAlerts(prev => [payload.new as Alert, ...prev])
      })
      .subscribe()

    return () => { sb.removeChannel(channel) }
  }, [])

  async function loadAlerts() {
    const { data } = await sb.from('alerts')
      .select('*').order('created_at', { ascending: false }).limit(50)
    setAlerts(data ?? [])
    setLoading(false)
  }

  async function markRead(id: string) {
   await (sb.from('alerts') as any).update({ read: true }).eq('id', id)
    setAlerts(prev => prev.map(a => a.id === id ? { ...a, read: true } : a))
  }

  async function markAllRead() {
    const unread = alerts.filter(a => !a.read).map(a => a.id)
    if (!unread.length) return
    await (sb.from('alerts') as any).update({ read: true }).in('id', unread)
    setAlerts(prev => prev.map(a => ({ ...a, read: true })))
  }

  const displayed = filter === 'UNREAD' ? alerts.filter(a => !a.read) : alerts
  const unreadCount = alerts.filter(a => !a.read).length

  if (loading) return <div style={{ padding: 40, color: '#999', fontSize: 13 }}>Loading…</div>

  return (
    <div className="space-y-6 max-w-3xl">
      {/* Header */}
      <div className="anim-fade-up">
        <div style={{ width: 40, height: 3, background: '#E2001A', marginBottom: 12 }} />
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <h1 style={{ fontSize: 28, fontWeight: 300, color: '#111', letterSpacing: '-0.02em' }}>
              Notifications
            </h1>
            <p style={{ color: '#999', fontSize: 13, marginTop: 4 }}>
              {unreadCount > 0 ? `${unreadCount} unread` : 'All caught up'}
            </p>
          </div>
          {unreadCount > 0 && (
            <button onClick={markAllRead} className="lv-btn lv-btn-ghost lv-btn-sm">
              Mark all read
            </button>
          )}
        </div>
      </div>

      {/* Filter tabs */}
      <div style={{ display: 'flex', gap: 0, borderBottom: '1px solid #E6E6E6' }}>
        {(['ALL', 'UNREAD'] as const).map(f => (
          <button key={f} onClick={() => setFilter(f)}
            style={{
              padding: '8px 20px 12px',
              fontSize: 13,
              fontWeight: filter === f ? 500 : 400,
              color: filter === f ? '#E2001A' : '#666',
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              position: 'relative',
              fontFamily: 'IBM Plex Sans, sans-serif',
            }}>
            {f}
            {f === 'UNREAD' && unreadCount > 0 && (
              <span className="lv-badge ml-2" style={{ background: '#FFF0F2', color: '#E2001A', fontSize: 9 }}>
                {unreadCount}
              </span>
            )}
            {filter === f && (
              <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 2, background: '#E2001A', borderRadius: '1px 1px 0 0' }} />
            )}
          </button>
        ))}
      </div>

      {/* Alert list */}
      <div className="anim-fade-up anim-stagger-1">
        {displayed.length === 0 ? (
          <div className="lv-card p-12 text-center">
            <p style={{ color: '#999', fontSize: 13 }}>No notifications</p>
          </div>
        ) : (
          <div className="lv-card overflow-hidden">
            {displayed.map((alert, i) => {
              const meta = ALERT_ICONS[alert.type] ?? ALERT_ICONS.SYSTEM
              return (
                <div key={alert.id}
                  onClick={() => !alert.read && markRead(alert.id)}
                  style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: 14,
                    padding: '14px 20px',
                    borderBottom: i < displayed.length - 1 ? '1px solid #F2F2F2' : 'none',
                    background: alert.read ? '#fff' : '#FFFBFB',
                    cursor: alert.read ? 'default' : 'pointer',
                    transition: 'background 0.15s',
                  }}>
                  {/* Unread dot */}
                  <div style={{ width: 6, height: 6, borderRadius: '50%', background: alert.read ? 'transparent' : '#E2001A', marginTop: 8, flexShrink: 0 }} />

                  {/* Icon */}
                  <div style={{ width: 36, height: 36, borderRadius: 4, background: meta.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontSize: 14 }}>
                    {meta.icon}
                  </div>

                  {/* Content */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontSize: 13, fontWeight: alert.read ? 400 : 500, color: '#111', marginBottom: 2 }}>
                      {alert.title}
                    </p>
                    <p style={{ fontSize: 12, color: '#666', lineHeight: 1.5 }}>{alert.message}</p>
                    {alert.idea_id && (
                      <Link href={`/ideas/${alert.idea_id}`} onClick={e => e.stopPropagation()}
                        style={{ fontSize: 11, color: '#E2001A', textDecoration: 'none', marginTop: 4, display: 'inline-block' }}>
                        View idea →
                      </Link>
                    )}
                  </div>

                  {/* Time */}
                  <span style={{ fontSize: 11, color: '#CCC', flexShrink: 0 }}>
                    {formatRelative(alert.created_at)}
                  </span>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
