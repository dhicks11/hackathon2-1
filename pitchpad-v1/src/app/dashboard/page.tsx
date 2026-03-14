// src/app/dashboard/page.tsx
'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useSession } from 'next-auth/react'

export default function DashboardPage() {
  const router = useRouter()
  const { data: session, status } = useSession()
  const [ideas, setIdeas] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (status === 'loading') return
    if (status === 'unauthenticated') {
      router.push('/auth/login')
      return
    }

    // Fetch ideas from our API
    fetch('/api/ideas')
      .then(res => res.json())
      .then(data => setIdeas(Array.isArray(data) ? data.slice(0, 6) : []))
      .catch(() => setIdeas([]))
      .finally(() => setLoading(false))
  }, [status, router])

  const STATUS_COLORS: Record<string, { bg: string; color: string }> = {
    SUBMITTED:  { bg: '#FFF8E6', color: '#FF8800' },
    IN_REVIEW:  { bg: '#EBF3FF', color: '#0066CC' },
    COMPLETE:   { bg: '#E6F9F1', color: '#00875A' },
    DRAFT:      { bg: '#F2F2F2', color: '#666' },
  }

  if (status === 'loading' || loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 300 }}>
      <p style={{ color: '#999', fontSize: 13 }}>Loading…</p>
    </div>
  )

  return (
    <div className="space-y-8">
      <div className="anim-fade-up">
        <div style={{ width: 40, height: 3, background: '#E2001A', marginBottom: 12 }} />
        <h1 style={{ fontSize: 28, fontWeight: 300, color: '#111', letterSpacing: '-0.02em' }}>
          {session?.user?.role === 'REVIEWER' ? 'Review Dashboard' : 'Your workspace'}
        </h1>
        <p style={{ color: '#999', fontSize: 13, marginTop: 4 }}>{session?.user?.email}</p>
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-3 gap-4 anim-fade-up anim-stagger-1">
        {[
          { label: 'Total Ideas',      value: ideas.length, accent: true  },
          { label: 'Submitted',        value: ideas.filter(i => i.status === 'SUBMITTED').length, accent: false },
          { label: 'In Review',        value: ideas.filter(i => i.status === 'IN_REVIEW').length, accent: false },
          { label: 'Complete',         value: ideas.filter(i => i.status === 'COMPLETE').length, accent: false },
          { label: 'Drafts',           value: ideas.filter(i => i.status === 'DRAFT').length, accent: false },
        ].map(s => (
          <div key={s.label} className="lv-metric">
            <div className="lv-metric-value tabular-nums" style={{ color: s.accent ? '#E2001A' : '#111' }}>
              {s.value}
            </div>
            <div className="lv-metric-label">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Ideas table + Quick actions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 anim-fade-up anim-stagger-2">
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
            <h2 style={{ fontSize: 11, fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.07em', color: '#999' }}>Recent Ideas</h2>
            <Link href="/ideas" style={{ fontSize: 12, color: '#E2001A', textDecoration: 'none' }}>View all →</Link>
          </div>
          <div className="lv-card overflow-hidden">
            {ideas.length === 0 ? (
              <div style={{ padding: 40, textAlign: 'center', color: '#999', fontSize: 13 }}>
                No ideas yet. <Link href="/ideas/new" style={{ color: '#E2001A' }}>Create your first idea →</Link>
              </div>
            ) : (
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ background: '#F8F8F8', borderBottom: '1px solid #E6E6E6' }}>
                    {['Idea', 'Score', 'Status'].map(h => (
                      <th key={h} style={{ padding: '10px 16px', textAlign: 'left', fontSize: 11, fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.07em', color: '#999' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {ideas.map((idea: any, i: number) => {
                    const st = STATUS_COLORS[idea.status] ?? STATUS_COLORS.DRAFT
                    return (
                      <tr key={idea.id} style={{ borderBottom: i < ideas.length - 1 ? '1px solid #F2F2F2' : 'none' }}>
                        <td style={{ padding: '12px 16px' }}>
                          <Link href={`/ideas/${idea.id}`} style={{ fontSize: 13, fontWeight: 500, color: '#111', textDecoration: 'none' }}>
                            {idea.title}
                          </Link>
                        </td>
                        <td style={{ padding: '12px 16px', fontFamily: 'IBM Plex Mono', fontSize: 13, color: idea.pitchScore >= 70 ? '#00875A' : idea.pitchScore >= 40 ? '#FF8800' : '#999' }}>
                          {idea.pitchScore ?? '—'}/100
                        </td>
                        <td style={{ padding: '12px 16px' }}>
                          <span className="lv-badge" style={{ background: st.bg, color: st.color }}>{idea.status}</span>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            )}
          </div>
        </div>

        {/* Quick actions */}
        <div className="space-y-3 anim-fade-up anim-stagger-3">
          <h2 style={{ fontSize: 11, fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.07em', color: '#999', marginBottom: 12 }}>Quick Actions</h2>
          {[
            { href: '/ideas/new',   label: 'New Idea',      sub: 'Submit your pitch',        bg: '#FFF0F2', color: '#E2001A', icon: '+' },
            { href: '/practice',    label: 'Practice Pitch',sub: 'AI voice coaching',        bg: '#EBF3FF', color: '#0066CC', icon: '◎' },
            { href: '/ai-assistant',label: 'AI Assistant',  sub: 'Get feedback',             bg: '#E6F9F1', color: '#00875A', icon: '⚡' },
            { href: '/export',      label: 'Export Deck',   sub: 'Download slides',          bg: '#F8F8F8', color: '#666',    icon: '↓' },
          ].map(a => (
            <Link key={a.href} href={a.href} className="lv-card-hover" style={{ display: 'flex', alignItems: 'center', gap: 12, padding: 14, textDecoration: 'none' }}>
              <div style={{ width: 36, height: 36, background: a.bg, borderRadius: 4, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, color: a.color, flexShrink: 0 }}>
                {a.icon}
              </div>
              <div>
                <p style={{ fontSize: 13, fontWeight: 500, color: '#111', margin: 0 }}>{a.label}</p>
                <p style={{ fontSize: 12, color: '#999', margin: 0 }}>{a.sub}</p>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  )
}
