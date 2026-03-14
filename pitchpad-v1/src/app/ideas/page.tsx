// src/app/ideas/page.tsx
'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'

export default function IdeasPage() {
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

    fetch('/api/ideas')
      .then(res => res.json())
      .then(d => setIdeas(Array.isArray(d) ? d : []))
      .catch(() => setIdeas([]))
      .finally(() => setLoading(false))
  }, [status, router])

  const STATUS_COLORS: Record<string, { bg: string; color: string }> = {
    SUBMITTED: { bg: '#FFF8E6', color: '#FF8800' },
    IN_REVIEW: { bg: '#EBF3FF', color: '#0066CC' },
    COMPLETE: { bg: '#E6F9F1', color: '#00875A' },
    DRAFT: { bg: '#F2F2F2', color: '#666' },
  }

  if (status === 'loading' || loading) {
    return <div style={{ padding: 40, color: '#999', fontSize: 13 }}>Loading…</div>
  }

  return (
    <div style={{ maxWidth: 900 }}>
      <div className="anim-fade-up" style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: 32 }}>
        <div>
          <div style={{ width: 40, height: 3, background: '#E2001A', marginBottom: 12 }} />
          <h1 style={{ fontSize: 28, fontWeight: 300, color: '#111', letterSpacing: '-0.02em' }}>My Ideas</h1>
          <p style={{ color: '#999', fontSize: 13, marginTop: 4 }}>{ideas.length} idea{ideas.length !== 1 ? 's' : ''}</p>
        </div>
        <Link href="/ideas/new" className="lv-btn lv-btn-primary">+ New Idea</Link>
      </div>

      {ideas.length === 0 ? (
        <div className="lv-card" style={{ padding: 60, textAlign: 'center' }}>
          <p style={{ color: '#999', fontSize: 13, marginBottom: 16 }}>No ideas yet</p>
          <Link href="/ideas/new" className="lv-btn lv-btn-primary">Submit your first idea →</Link>
        </div>
      ) : (
        <div className="lv-card overflow-hidden anim-fade-up anim-stagger-1">
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: '#F8F8F8', borderBottom: '1px solid #E6E6E6' }}>
                {['Idea', 'Tags', 'Score', 'Status', ''].map(h => (
                  <th key={h} style={{ padding: '10px 16px', textAlign: 'left', fontSize: 11, fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.07em', color: '#999' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {ideas.map((idea: any, i: number) => {
                const st = STATUS_COLORS[idea.status] ?? STATUS_COLORS.DRAFT
                const score = idea.pitchScore
                return (
                  <tr key={idea.id} style={{ borderBottom: i < ideas.length - 1 ? '1px solid #F2F2F2' : 'none' }}>
                    <td style={{ padding: '14px 16px' }}>
                      <Link href={`/ideas/${idea.id}`} style={{ fontSize: 13, fontWeight: 500, color: '#111', textDecoration: 'none' }}>
                        {idea.title}
                      </Link>
                    </td>
                    <td style={{ padding: '14px 16px', fontSize: 12, color: '#999' }}>
                      {idea.tags?.length > 0 ? idea.tags.slice(0, 2).join(', ') : '—'}
                    </td>
                    <td style={{ padding: '14px 16px', fontFamily: 'IBM Plex Mono', fontSize: 13, color: score >= 70 ? '#00875A' : score >= 40 ? '#FF8800' : '#999' }}>
                      {score ? `${score}/100` : '—'}
                    </td>
                    <td style={{ padding: '14px 16px' }}>
                      <span className="lv-badge" style={{ background: st.bg, color: st.color }}>{idea.status}</span>
                    </td>
                    <td style={{ padding: '14px 16px', textAlign: 'right' }}>
                      <Link href={`/ideas/${idea.id}`} style={{ fontSize: 12, color: '#E2001A', textDecoration: 'none' }}>View →</Link>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
