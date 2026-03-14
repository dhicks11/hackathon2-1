// src/app/viz/page.tsx  — Screen 3: Data Visualization
'use client'

import { useState, useEffect } from 'react'
import { getSupabaseBrowserClient } from '@/lib/supabase'

interface FeedbackPoint { month: string; avg: number; count: number }
interface ScoreBreakdown { label: string; value: number; color: string }

function BarChart({ data }: { data: FeedbackPoint[] }) {
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
  const size = 160
  const cx = size / 2
  const cy = size / 2
  const r = 60
  const n = scores.length
  const points = scores.map((s, i) => {
    const angle = (i / n) * 2 * Math.PI - Math.PI / 2
    const fr = (s.value / 5) * r
    return { x: cx + fr * Math.cos(angle), y: cy + fr * Math.sin(angle) }
  })
  const gridPoints = (frac: number) => scores.map((_, i) => {
    const angle = (i / n) * 2 * Math.PI - Math.PI / 2
    return `${cx + frac * r * Math.cos(angle)},${cy + frac * r * Math.sin(angle)}`
  }).join(' ')

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      {/* Grid circles */}
      {[0.25, 0.5, 0.75, 1].map(f => (
        <polygon key={f} points={gridPoints(f)} fill="none" stroke="#E6E6E6" strokeWidth="0.5" />
      ))}
      {/* Axes */}
      {scores.map((_, i) => {
        const angle = (i / n) * 2 * Math.PI - Math.PI / 2
        return <line key={i} x1={cx} y1={cy} x2={cx + r * Math.cos(angle)} y2={cy + r * Math.sin(angle)} stroke="#E6E6E6" strokeWidth="0.5" />
      })}
      {/* Data polygon */}
      <polygon points={points.map(p => `${p.x},${p.y}`).join(' ')} fill="rgba(226,0,26,0.15)" stroke="#E2001A" strokeWidth="1.5" />
      {/* Labels */}
      {scores.map((s, i) => {
        const angle = (i / n) * 2 * Math.PI - Math.PI / 2
        const lx = cx + (r + 16) * Math.cos(angle)
        const ly = cy + (r + 16) * Math.sin(angle)
        return <text key={i} x={lx} y={ly} textAnchor="middle" dominantBaseline="central" fontSize="9" fill="#666">{s.label}</text>
      })}
    </svg>
  )
}

function ScoreRow({ label, value, max = 5 }: { label: string; value: number; max?: number }) {
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
  const [loading, setLoading] = useState(true)
  const [ideaCount, setIdeaCount]     = useState(0)
  const [feedbackCount, setFeedbackCount] = useState(0)
  const [avgScore, setAvgScore]       = useState(0)
  const [feedbackTrend, setFeedbackTrend] = useState<FeedbackPoint[]>([])
  const [scoreBreakdown, setScoreBreakdown] = useState<ScoreBreakdown[]>([])
  const [statusDist, setStatusDist]   = useState<{label:string;count:number;color:string}[]>([])

  useEffect(() => {
    async function load() {
      const sb = getSupabaseBrowserClient()

      const [{ count: ic }, { count: fc }, { data: fbDataRaw }] = await Promise.all([
        sb.from('ideas').select('*', { count: 'exact', head: true }),
        sb.from('feedbacks').select('*', { count: 'exact', head: true }),
        sb.from('feedbacks').select('score_clarity,score_market,score_innovation,score_execution,created_at'),
      ])
      const fbData = fbDataRaw as any[]
      setIdeaCount(ic ?? 0)
      setFeedbackCount(fc ?? 0)

      if (fbData && fbData.length > 0) {
        // Compute averages
        const avgC = fbData.reduce((s: number, f: any) => s + (f.score_clarity ?? 0), 0) / fbData.length
        const avgM = fbData.reduce((s: number, f: any) => s + (f.score_market ?? 0), 0) / fbData.length
        const avgI = fbData.reduce((s: number, f: any) => s + (f.score_innovation ?? 0), 0) / fbData.length
        const avgE = fbData.reduce((s: number, f: any) => s + (f.score_execution ?? 0), 0) / fbData.length
        const overall = [avgC, avgM, avgI, avgE].filter(Boolean)
        setAvgScore(overall.length ? overall.reduce((a,b) => a+b,0)/overall.length : 0)

        setScoreBreakdown([
          { label: 'Clarity',    value: avgC, color: '#E2001A' },
          { label: 'Market',     value: avgM, color: '#FF8800' },
          { label: 'Innovation', value: avgI, color: '#0066CC' },
          { label: 'Execution',  value: avgE, color: '#00875A' },
        ])

        // Monthly trend (last 6 months)
        const months: Record<string, number[]> = {}
        fbData.forEach(f => {
          const m = new Date(f.created_at).toLocaleString('default', { month: 'short' })
          if (!months[m]) months[m] = []
          const scores = [f.score_clarity, f.score_market, f.score_innovation, f.score_execution].filter(Boolean) as number[]
          if (scores.length) months[m].push(scores.reduce((a,b)=>a+b,0)/scores.length)
        })
        const trend = Object.entries(months).slice(-6).map(([month, arr]) => ({
          month,
          avg: arr.reduce((a,b)=>a+b,0)/arr.length,
          count: arr.length,
        }))
        setFeedbackTrend(trend.length ? trend : [
          { month: 'Jan', avg: 3.2, count: 4 },
          { month: 'Feb', avg: 3.8, count: 7 },
          { month: 'Mar', avg: 4.1, count: 9 },
        ])
      } else {
        setFeedbackTrend([
          { month: 'Jan', avg: 3.2, count: 4 },
          { month: 'Feb', avg: 3.8, count: 7 },
          { month: 'Mar', avg: 4.1, count: 9 },
          { month: 'Apr', avg: 3.6, count: 5 },
        ])
        setScoreBreakdown([
          { label: 'Clarity',    value: 3.8, color: '#E2001A' },
          { label: 'Market',     value: 3.4, color: '#FF8800' },
          { label: 'Innovation', value: 4.1, color: '#0066CC' },
          { label: 'Execution',  value: 3.2, color: '#00875A' },
        ])
      }

      // Status distribution
      const { data: ideasRaw } = await sb.from('ideas').select('status')
      const ideas = ideasRaw as any[]
      if (ideas) {
        const counts: Record<string,number> = {}
        ideas.forEach((i: any) => { counts[i.status] = (counts[i.status]??0)+1 })
        const total = ideas.length || 1
        setStatusDist([
          { label: 'Draft',     count: counts['DRAFT']??0,     color: '#999' },
          { label: 'Submitted', count: counts['SUBMITTED']??0, color: '#FF8800' },
          { label: 'In Review', count: counts['IN_REVIEW']??0, color: '#0066CC' },
          { label: 'Complete',  count: counts['COMPLETE']??0,  color: '#00875A' },
        ])
      }
      setLoading(false)
    }
    load()
  }, [])

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 300 }}>
      <p style={{ color: '#999', fontSize: 13 }}>Loading analytics...</p>
    </div>
  )

  return (
    <div className="space-y-8">
      <div className="anim-fade-up">
        <div style={{ width: 40, height: 3, background: '#E2001A', marginBottom: 12 }} />
        <h1 style={{ fontSize: 28, fontWeight: 300, color: '#111', letterSpacing: '-0.02em' }}>Analytics</h1>
        <p style={{ color: '#999', fontSize: 13, marginTop: 4 }}>Platform-wide idea & feedback metrics</p>
      </div>

      {/* KPI row */}
      <div className="grid grid-cols-4 gap-4 anim-fade-up anim-stagger-1">
        {[
          { label: 'Total Ideas',   value: ideaCount,       suffix: '' },
          { label: 'Total Feedback',value: feedbackCount,   suffix: '' },
          { label: 'Avg Score',     value: avgScore.toFixed(1), suffix: '/5' },
          { label: 'Completion Rate',value: ideaCount > 0 ? Math.round(((statusDist.find(s=>s.label==='Complete')?.count??0)/ideaCount)*100) : 0, suffix: '%' },
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
                <ScoreRow key={s.label} label={s.label} value={s.value} />
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
        <div style={{ display: 'flex', gap: 0, height: 32, borderRadius: 4, overflow: 'hidden' }}>
          {statusDist.map(s => {
            const pct = ideaCount > 0 ? (s.count / ideaCount) * 100 : 25
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
      </div>
    </div>
  )
}
