// src/app/export/page.tsx - Export / Pitch Summary screen
'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'

interface Idea { id: string; title: string; status: string }
interface PitchSlide { id: number; type: string; headline: string; body: string; bullets?: string[]; metric?: { value: string; label: string } }

const SLIDE_TYPE_COLORS: Record<string, string> = {
  cover: '#E2001A', problem: '#FF8800', solution: '#00875A',
  market: '#0066CC', traction: '#666', team: '#333', ask: '#E2001A', summary: '#666',
}

export default function ExportPage() {
  const router = useRouter()
  const { status } = useSession()
  const [ideas, setIdeas] = useState<Idea[]>([])
  const [selected, setSelected] = useState<string>('')
  const [deck, setDeck] = useState<PitchSlide[] | null>(null)
  const [generating, setGenerating] = useState(false)
  const [exporting, setExporting] = useState<'pptx' | 'pdf' | null>(null)
  const [shareUrl, setShareUrl] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (status === 'loading') return
    if (status === 'unauthenticated') {
      router.push('/auth/login')
      return
    }

    fetch('/api/ideas')
      .then(res => res.json())
      .then(data => {
        const arr = Array.isArray(data) ? data : []
        setIdeas(arr.map((i: any) => ({ id: i.id, title: i.title, status: i.status })))
        if (arr[0]) setSelected(arr[0].id)
      })
      .finally(() => setLoading(false))
  }, [status, router])

  useEffect(() => {
    if (!selected) return
    setDeck(null)

    fetch(`/api/ideas/${selected}`)
      .then(res => res.json())
      .then(data => {
        if (data.pitchDecks?.[0]?.slides) {
          setDeck(data.pitchDecks[0].slides as PitchSlide[])
        }
      })
      .catch(() => {})
  }, [selected])

  async function generateDeck() {
    if (!selected) return
    setGenerating(true)
    try {
      const res = await fetch(`/api/ideas/${selected}/pitch`, { method: 'POST' })
      if (!res.ok) throw new Error()
      const data = await res.json()
      setDeck(data.data?.slides || data.slides)
      toast.success('Pitch deck generated!')
    } catch {
      toast.error('Generation failed')
    } finally {
      setGenerating(false)
    }
  }

  async function exportAs(format: 'pptx' | 'pdf') {
    if (!deck || !selected) return
    setExporting(format)
    try {
      const res = await fetch('/api/pitch-deck/export', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ slides: deck, ideaId: selected, format }),
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err.error || 'Export failed')
      }
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `pitch-${selected}.${format}`
      a.click()
      URL.revokeObjectURL(url)
      toast.success(`Downloaded as .${format}`)
    } catch (e: any) {
      toast.error(e.message || 'Export failed')
    } finally {
      setExporting(null)
    }
  }

  async function copyShareLink() {
    const url = `${window.location.origin}/ideas/${selected}`
    await navigator.clipboard.writeText(url)
    setShareUrl(url)
    toast.success('Share link copied!')
    setTimeout(() => setShareUrl(null), 3000)
  }

  if (status === 'loading' || loading) {
    return <div style={{ padding: 40, color: '#999', fontSize: 13 }}>Loading...</div>
  }

  return (
    <div className="space-y-8 max-w-5xl">
      <div className="anim-fade-up">
        <div style={{ width: 40, height: 3, background: '#E2001A', marginBottom: 12 }} />
        <h1 style={{ fontSize: 28, fontWeight: 300, color: '#111', letterSpacing: '-0.02em' }}>Export</h1>
        <p style={{ color: '#999', fontSize: 13, marginTop: 4 }}>Generate and download your pitch deck</p>
      </div>

      <div className="lv-card p-6 anim-fade-up anim-stagger-1">
        <div style={{ display: 'flex', gap: 16, alignItems: 'flex-end', flexWrap: 'wrap' }}>
          <div style={{ flex: 1, minWidth: 200 }}>
            <label className="lv-label">Select idea</label>
            {ideas.length === 0 ? (
              <p style={{ color: '#999', fontSize: 13 }}>No ideas yet. Create an idea first.</p>
            ) : (
              <select className="lv-input" value={selected} onChange={e => setSelected(e.target.value)}
                style={{ fontFamily: 'IBM Plex Sans' }}>
                {ideas.map(i => (
                  <option key={i.id} value={i.id}>{i.title} - {i.status}</option>
                ))}
              </select>
            )}
          </div>

          <button onClick={generateDeck} disabled={!selected || generating} className="lv-btn lv-btn-primary" style={{ flexShrink: 0 }}>
            {generating ? (
              <><span style={{ display: 'inline-block', width: 12, height: 12, border: '2px solid rgba(255,255,255,0.4)', borderTopColor: '#fff', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} /> Generating...</>
            ) : deck ? 'Regenerate' : 'Generate deck'}
          </button>

          {deck && (
            <>
              <button onClick={() => exportAs('pptx')} disabled={!!exporting} className="lv-btn lv-btn-outline" style={{ flexShrink: 0 }}>
                {exporting === 'pptx' ? 'Exporting...' : 'Download PowerPoint'}
              </button>
              <button onClick={() => exportAs('pdf')} disabled={!!exporting} className="lv-btn lv-btn-ghost" style={{ flexShrink: 0 }}>
                {exporting === 'pdf' ? 'Exporting...' : 'Download PDF'}
              </button>
              <button onClick={copyShareLink} className="lv-btn lv-btn-ghost" style={{ flexShrink: 0 }}>
                {shareUrl ? 'Copied' : 'Copy share link'}
              </button>
            </>
          )}
        </div>
      </div>

      {generating && (
        <div className="lv-card p-12" style={{ textAlign: 'center' }}>
          <div style={{ display: 'flex', justifyContent: 'center', gap: 6, marginBottom: 12 }}>
            {[0, 1, 2].map(i => (
              <div key={i} style={{ width: 8, height: 8, borderRadius: '50%', background: '#E2001A', animation: 'bounce 1s ease-in-out infinite', animationDelay: `${i * 0.15}s` }} />
            ))}
          </div>
          <p style={{ color: '#999', fontSize: 13 }}>Building your pitch deck...</p>
        </div>
      )}

      {!generating && deck && (
        <div className="anim-fade-up anim-stagger-2">
          <p style={{ fontSize: 11, fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.07em', color: '#999', marginBottom: 12 }}>
            {deck.length} slides. Click "Download PowerPoint" to export.
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 12 }}>
            {deck.map((slide, i) => {
              const accentColor = SLIDE_TYPE_COLORS[slide.type] ?? '#333'
              return (
                <div key={slide.id || i} className="lv-card-hover p-5" style={{ position: 'relative', overflow: 'hidden' }}>
                  <div style={{ position: 'absolute', top: 12, right: 14, fontFamily: 'IBM Plex Mono', fontSize: 10, color: '#CCC' }}>
                    {String(i + 1).padStart(2, '0')}
                  </div>
                  <div style={{ display: 'inline-flex', alignItems: 'center', padding: '2px 8px', background: `${accentColor}15`, color: accentColor, borderRadius: 2, fontSize: 9, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 10 }}>
                    {slide.type}
                  </div>
                  <div style={{ width: 24, height: 2, background: accentColor, marginBottom: 8 }} />
                  <h3 style={{ fontSize: 14, fontWeight: 500, color: '#111', lineHeight: 1.3, marginBottom: 6 }}>
                    {slide.headline}
                  </h3>
                  <p style={{ fontSize: 12, color: '#666', lineHeight: 1.6, marginBottom: slide.bullets ? 8 : 0 }}>
                    {slide.body}
                  </p>
                  {slide.bullets && (
                    <ul style={{ margin: 0, padding: 0, listStyle: 'none' }}>
                      {slide.bullets.slice(0, 3).map((b, bi) => (
                        <li key={bi} style={{ display: 'flex', gap: 8, fontSize: 11, color: '#666', marginBottom: 3 }}>
                          <span style={{ color: accentColor, flexShrink: 0 }}>-</span>
                          <span>{b}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                  {slide.metric && (
                    <div style={{ display: 'inline-flex', alignItems: 'baseline', gap: 6, marginTop: 8, padding: '6px 12px', background: '#F8F8F8', borderRadius: 4, border: '1px solid #E6E6E6' }}>
                      <span style={{ fontFamily: 'IBM Plex Mono', fontSize: 18, fontWeight: 300, color: accentColor }}>
                        {slide.metric.value}
                      </span>
                      <span style={{ fontSize: 10, color: '#999', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                        {slide.metric.label}
                      </span>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      )}

      {!generating && !deck && selected && (
        <div className="lv-card p-12" style={{ textAlign: 'center' }}>
          <p style={{ color: '#999', fontSize: 13, marginBottom: 12 }}>No deck generated yet for this idea</p>
          <p style={{ color: '#CCC', fontSize: 12 }}>Click "Generate deck" to create your pitch summary</p>
        </div>
      )}

      <style>{`
        @keyframes spin { to { transform: rotate(360deg) } }
        @keyframes bounce { 0%,100% { transform: translateY(0) } 50% { transform: translateY(-6px) } }
      `}</style>
    </div>
  )
}
