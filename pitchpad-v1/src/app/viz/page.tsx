// src/app/viz/page.tsx  — Screen 3: Data Visualization
'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'

interface FeedbackPoint { month: string; avg: number; count: number }
interface ScoreBreakdown { label: string; value: number; color: string }

function BarChart({ data }: { data: FeedbackPoint[] }) {
  if (!data.length) {
    return (
      <div style={{ height: 160, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#999', fontSize: 13 }}>
        No feedback data yet
      </div>
    )
  }
  const max = Math.max(...data.map(d => d.avg), 5)
  return (
    <div style={{ display: 'flex', alignItems: 'flex-end', gap: 12, height: 160, padding: '0 8px' }}>
      {data.map((d, i) => (
        <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
          <span style={{ fontSize: 10, color: '#999', fontFamily: 'IBM Plex Mono' }}>
            {d.avg.toFixed(1)}
          </span>
          <div style={{ width: '100%', background: '#F2F2F2', borderRadius: 2, height: 120, display: 'flex', flexDirection: 'column', justifyContent: 'flex-end' }}>
            <div style={{
              width: '100%',
              background: '#E2001A',
              borderRadius: '2px 2px 0 0',
              height: `${(d.avg / max) * 100}%`,
              minHeight: 2,
              transition: 'height 0.5s ease',
            }} />
          </div>
          <span style={{ fontSize: 10, color: '#999' }}>{d.month}</span>
          <span style={{ fontSize: 9, color: '#CCC' }}>{d.count} fb</span>
        </div>
      ))}
    </div>
  )
}

function RadarChart({ scores }: { scores: ScoreBreakdown[] }) {
  if (!scores.length || scores.every(s => !s.value)) {
    return (
      <div style={{ width: 160, height: 160, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#999', fontSize: 12 }}>
        No scores yet
      </div>
    )
  }
  const size = 160
  const cx = size / 2
  const cy = size / 2
  const r = 60
  const n = scores.length
  const points = scores.map((s, i) => {
    const angle = (i / n) * 2 * Math.PI - Math.PI / 2
    const fr = ((s.value || 0) / 5) * r
    return { x: cx + fr * Math.cos(angle), y: cy + fr * Math.sin(angle) }
  })
  const gridPoints = (frac: number) => scores.map((_, i) => {
    const angle = (i / n) * 2 * Math.PI - Math.PI / 2
    return `${cx + frac * r * Math.cos(angle)},${cy + frac * r * Math.sin(angle)}`
  }).join(' ')

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      {[0.25, 0.5, 0.75, 1].map(f => (
        <polygon key={f} points={gridPoints(f)} fill="none" stroke="#E6E6E6" strokeWidth="0.5" />
      ))}
      {scores.map((_, i) => {
        const angle = (i / n) * 2 * Math.PI - Math.PI / 2
        return <line key={i} x1={cx} y1={cy} x2={cx + r * Math.cos(angle)} y2={cy + r * Math.sin(angle)} stroke="#E6E6E6" strokeWidth="0.5" />
      })}
      <polygon points={points.map(p => `${p.x},${p.y}`).join(' ')} fill="rgba(226,0,26,0.15)" stroke="#E2001A" strokeWidth="1.5" />
      {scores.map((s, i) => {
        const angle = (i / n) * 2 * Math.PI - Math.PI / 2
        const lx = cx + (r + 16) * Math.cos(angle)
        const ly = cy + (r + 16) * Math.sin(angle)
        return <text key={i} x={lx} y={ly} textAnchor="middle" dominantBaseline="central" fontSize="9" fill="#666">{s.label}</text>
      })}
    </svg>
  )
}

function ScoreRow({ label, value, max = 5 }: { label: string; value: number | null; max?: number }) {
  if (value === null) {
    return (
      <div style={{ marginBottom: 14 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
          <span style={{ fontSize: 12, color: '#333' }}>{label}</span>
          <span style={{ fontSize: 12, fontFamily: 'IBM Plex Mono', color: '#CCC' }}>—</span>
        </div>
        <div className="lv-progress-track">
          <div className="lv-progress-fill" style={{ width: '0%' }} />
        </div>
      </div>
    )
  }
  const pct = Math.round((value / max) * 100)
  const color = pct >= 70 ? '#00875A' : pct >= 40 ? '#FF8800' : '#E2001A'
  return (
    <div style={{ marginBottom: 14 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
        <span style={{ fontSize: 12, color: '#333' }}>{label}</span>
        <span style={{ fontSize: 12, fontFamily: 'IBM Plex Mono', color }}>{value.toFixed(1)}/{max}</span>
      </div>
      <div className="lv-progress-track">
        <div className="lv-progress-fill" style={{ width: `${pct}%`, background: color }} />
      </div>
    </div>
  )
}

export default function VizPage() {
  const router = useRouter()
  const { data: session, status } = useSession()
  const [loading, setLoading] = useState(true)
  const [metrics, setMetrics] = useState<any>(null)

  useEffect(() => {
    if (status === 'loading') return
    if (status === 'unauthenticated') {
      router.push('/auth/login')
      return
    }

    fetch('/api/metrics')
      .then(res => res.json())
      .then(data => {
        if (!data.error) setMetrics(data)
      })
      .finally(() => setLoading(false))
  }, [status, router])

  if (status === 'loading' || loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 300 }}>
        <p style={{ color: '#999', fontSize: 13 }}>Loading analytics...</p>
      </div>
    )
  }

  const ideas = metrics?.ideas || { total: 0, submitted: 0, inReview: 0, complete: 0, draft: 0 }
  const feedback = metrics?.feedback || { total: 0, avgScore: null, byDimension: {}, trend: [] }
  const practice = metrics?.practice || { total: 0 }

  const avgScore = feedback.avgScore ?? 0
  const feedbackTrend = feedback.trend || []
  const scoreBreakdown: ScoreBreakdown[] = [
    { label: 'Clarity', value: feedback.byDimension?.clarity || 0, color: '#E2001A' },
    { label: 'Market', value: feedback.byDimension?.market || 0, color: '#FF8800' },
    { label: 'Innovation', value: feedback.byDimension?.innovation || 0, color: '#0066CC' },
    { label: 'Execution', value: feedback.byDimension?.execution || 0, color: '#00875A' },
  ]

  const statusDist = [
    { label: 'Draft', count: ideas.draft, color: '#999' },
    { label: 'Submitted', count: ideas.submitted, color: '#FF8800' },
    { label: 'In Review', count: ideas.inReview, color: '#0066CC' },
    { label: 'Complete', count: ideas.complete, color: '#00875A' },
  ]

  const completionRate = ideas.total > 0 ? Math.round((ideas.complete / ideas.total) * 100) : 0

  return (
    <div className="space-y-8">
      <div className="anim-fade-up">
        <div style={{ width: 40, height: 3, background: '#E2001A', marginBottom: 12 }} />
        <h1 style={{ fontSize: 28, fontWeight: 300, color: '#111', letterSpacing: '-0.02em' }}>Analytics</h1>
        <p style={{ color: '#999', fontSize: 13, marginTop: 4 }}>Your idea & feedback metrics</p>
      </div>

      {/* KPI row */}
      <div className="grid grid-cols-4 gap-4 anim-fade-up anim-stagger-1">
        {[
          { label: 'Total Ideas', value: ideas.total, suffix: '' },
          { label: 'Total Feedback', value: feedback.total, suffix: '' },
          { label: 'Avg Score', value: avgScore ? (avgScore / 20).toFixed(1) : '—', suffix: avgScore ? '/5' : '' },
          { label: 'Completion Rate', value: completionRate, suffix: '%' },
        ].map(k => (
          <div key={k.label} className="lv-metric">
            <div className="lv-metric-value tabular-nums">{k.value}<span style={{ fontSize: 16, color: '#CCC' }}>{k.suffix}</span></div>
            <div className="lv-metric-label">{k.label}</div>
          </div>
        ))}
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-2 gap-6 anim-fade-up anim-stagger-2">

        {/* Monthly feedback trend */}
        <div className="lv-card p-6">
          <h3 style={{ fontSize: 13, fontWeight: 500, color: '#333', marginBottom: 16 }}>
            Feedback Score Trend
          </h3>
          <BarChart data={feedbackTrend} />
        </div>

        {/* Score radar */}
        <div className="lv-card p-6">
          <h3 style={{ fontSize: 13, fontWeight: 500, color: '#333', marginBottom: 16 }}>
            Dimension Breakdown
          </h3>
          <div style={{ display: 'flex', alignItems: 'center', gap: 24 }}>
            <RadarChart scores={scoreBreakdown} />
            <div style={{ flex: 1 }}>
              {scoreBreakdown.map(s => (
                <ScoreRow key={s.label} label={s.label} value={s.value || null} />
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Status distribution */}
      <div className="lv-card p-6 anim-fade-up anim-stagger-3">
        <h3 style={{ fontSize: 13, fontWeight: 500, color: '#333', marginBottom: 16 }}>
          Idea Pipeline
        </h3>
        {ideas.total === 0 ? (
          <p style={{ color: '#999', fontSize: 13 }}>No ideas yet. Submit your first idea to see your pipeline.</p>
        ) : (
          <>
            <div style={{ display: 'flex', gap: 0, height: 32, borderRadius: 4, overflow: 'hidden' }}>
              {statusDist.map(s => {
                const pct = ideas.total > 0 ? (s.count / ideas.total) * 100 : 0
                return (
                  <div key={s.label} title={`${s.label}: ${s.count}`}
                    style={{ width: `${pct}%`, background: s.color, minWidth: pct > 0 ? 4 : 0, transition: 'width 0.5s' }} />
                )
              })}
            </div>
            <div style={{ display: 'flex', gap: 20, marginTop: 12, flexWrap: 'wrap' }}>
              {statusDist.map(s => (
                <div key={s.label} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <div style={{ width: 10, height: 10, borderRadius: 2, background: s.color }} />
                  <span style={{ fontSize: 12, color: '#666' }}>{s.label} ({s.count})</span>
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      {/* Practice sessions */}
      <div className="lv-card p-6 anim-fade-up anim-stagger-4">
        <h3 style={{ fontSize: 13, fontWeight: 500, color: '#333', marginBottom: 16 }}>
          Voice Practice
        </h3>
        <div className="lv-metric" style={{ display: 'inline-block' }}>
          <div className="lv-metric-value">{practice.total}</div>
          <div className="lv-metric-label">Practice Sessions</div>
        </div>
      </div>
    </div>
  )
}
