// src/app/ideas/[id]/page.tsx
'use client'
import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'

export default function IdeaDetailPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const { data: session, status } = useSession()
  const [idea, setIdea] = useState<any>(null)
  const [pitch, setPitch] = useState<any>(null)
  const [newFeedback, setNewFeedback] = useState('')
  const [loading, setLoading] = useState(true)
  const [generating, setGenerating] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (status === 'loading') return
    if (status === 'unauthenticated') {
      router.push('/auth/login')
      return
    }

    fetch(`/api/ideas/${id}`)
      .then(res => res.json())
      .then(data => {
        if (data.error) {
          setError(data.error)
        } else {
          setIdea(data)
          if (data.pitchDecks?.[0]) {
            setPitch(data.pitchDecks[0])
          }
        }
      })
      .catch(() => setError('Failed to load idea'))
      .finally(() => setLoading(false))
  }, [id, status, router])

  async function generatePitch() {
    setGenerating(true)
    try {
      const res = await fetch(`/api/ideas/${id}/pitch`, { method: 'POST' })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Generation failed')
      setPitch({ slides: data.data?.slides || data.slides })
      // Refresh idea to get updated pitch
      const ideaRes = await fetch(`/api/ideas/${id}`)
      const ideaData = await ideaRes.json()
      if (!ideaData.error) setIdea(ideaData)
    } catch (e: any) {
      alert(e.message)
    } finally {
      setGenerating(false)
    }
  }

  async function submitFeedback() {
    if (!newFeedback.trim()) return
    setSubmitting(true)
    try {
      const res = await fetch('/api/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ideaId: id,
          content: newFeedback,
          visibility: 'TEAM',
          isAnonymous: false,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to submit feedback')
      setNewFeedback('')
      // Refresh idea to get updated feedback
      const ideaRes = await fetch(`/api/ideas/${id}`)
      const ideaData = await ideaRes.json()
      if (!ideaData.error) setIdea(ideaData)
    } catch (e: any) {
      alert(e.message)
    } finally {
      setSubmitting(false)
    }
  }

  if (status === 'loading' || loading) {
    return <div style={{ padding: 40, color: '#999', fontSize: 13 }}>Loading…</div>
  }
  if (error) {
    return <div style={{ padding: 40, color: '#E2001A', fontSize: 13 }}>{error}</div>
  }
  if (!idea) {
    return <div style={{ padding: 40, color: '#999', fontSize: 13 }}>Idea not found</div>
  }

  const scoreColor = (idea.pitchScore ?? 0) >= 70 ? '#00875A' : (idea.pitchScore ?? 0) >= 40 ? '#FF8800' : '#E2001A'
  const isReviewer = session?.user?.role === 'REVIEWER'
  const isAuthor = idea.authorId === session?.user?.id
  const feedbacks = idea.feedbacks || []

  return (
    <div style={{ maxWidth: 800, margin: '0 auto' }}>
      {/* Header */}
      <div className="anim-fade-up" style={{ marginBottom: 32 }}>
        <div style={{ width: 40, height: 3, background: '#E2001A', marginBottom: 12 }} />
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16 }}>
          <div>
            <h1 style={{ fontSize: 28, fontWeight: 300, color: '#111', letterSpacing: '-0.02em', marginBottom: 8 }}>{idea.title}</h1>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              <span className="lv-badge" style={{ background: '#F8F8F8', color: '#666' }}>{idea.status}</span>
              {idea.tags?.map((tag: string) => (
                <span key={tag} className="lv-badge" style={{ background: '#FFF0F2', color: '#E2001A', border: '1px solid #F5B8C0' }}>{tag}</span>
              ))}
            </div>
          </div>
          {idea.pitchScore && (
            <div className="lv-metric" style={{ textAlign: 'center', minWidth: 80 }}>
              <div className="lv-metric-value" style={{ color: scoreColor }}>{idea.pitchScore}</div>
              <div className="lv-metric-label">/ 100</div>
            </div>
          )}
        </div>
      </div>

      {/* Problem */}
      <div className="lv-card anim-fade-up anim-stagger-1" style={{ padding: 24, marginBottom: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
          <div style={{ width: 3, height: 16, background: '#E2001A' }} />
          <h2 style={{ fontSize: 12, fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.07em', color: '#999', margin: 0 }}>Problem</h2>
        </div>
        <p style={{ fontSize: 14, color: '#444', lineHeight: 1.75, whiteSpace: 'pre-wrap' }}>{idea.problem}</p>
      </div>

      {/* Solution */}
      <div className="lv-card anim-fade-up anim-stagger-1" style={{ padding: 24, marginBottom: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
          <div style={{ width: 3, height: 16, background: '#00875A' }} />
          <h2 style={{ fontSize: 12, fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.07em', color: '#999', margin: 0 }}>Solution</h2>
        </div>
        <p style={{ fontSize: 14, color: '#444', lineHeight: 1.75, whiteSpace: 'pre-wrap' }}>{idea.solution}</p>
      </div>

      {/* Market */}
      <div className="lv-card anim-fade-up anim-stagger-2" style={{ padding: 24, marginBottom: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
          <div style={{ width: 3, height: 16, background: '#0066CC' }} />
          <h2 style={{ fontSize: 12, fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.07em', color: '#999', margin: 0 }}>Target Market</h2>
        </div>
        <p style={{ fontSize: 14, color: '#444', lineHeight: 1.75, whiteSpace: 'pre-wrap' }}>{idea.market}</p>
      </div>

      {/* Ask (if present) */}
      {idea.ask && (
        <div className="lv-card anim-fade-up anim-stagger-2" style={{ padding: 24, marginBottom: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
            <div style={{ width: 3, height: 16, background: '#FF8800' }} />
            <h2 style={{ fontSize: 12, fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.07em', color: '#999', margin: 0 }}>The Ask</h2>
          </div>
          <p style={{ fontSize: 14, color: '#444', lineHeight: 1.75, whiteSpace: 'pre-wrap' }}>{idea.ask}</p>
        </div>
      )}

      {/* Pitch generator (only for author) */}
      {isAuthor && (
        <div className="lv-card anim-fade-up anim-stagger-3" style={{ padding: 24, marginBottom: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: pitch ? 16 : 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div style={{ width: 3, height: 16, background: '#E2001A' }} />
              <h2 style={{ fontSize: 12, fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.07em', color: '#999', margin: 0 }}>AI Pitch Deck</h2>
            </div>
            <button onClick={generatePitch} disabled={generating} className="lv-btn lv-btn-primary lv-btn-sm">
              {generating ? 'Generating…' : pitch ? '↻ Regenerate' : '⚡ Generate Deck'}
            </button>
          </div>
          {pitch && pitch.slides && (
            <div style={{ display: 'grid', gap: 12 }}>
              {pitch.slides.map((slide: any, i: number) => (
                <div key={i} style={{ padding: 16, background: '#F8F8F8', borderRadius: 4 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                    <span style={{ fontSize: 10, color: '#999', textTransform: 'uppercase' }}>Slide {i + 1}</span>
                    <span className="lv-badge" style={{ fontSize: 10 }}>{slide.type}</span>
                  </div>
                  <p style={{ fontSize: 14, fontWeight: 500, color: '#111', marginBottom: 4 }}>{slide.headline}</p>
                  {slide.body && <p style={{ fontSize: 13, color: '#666', lineHeight: 1.6 }}>{slide.body}</p>}
                  {slide.bullets?.length > 0 && (
                    <ul style={{ margin: '8px 0 0', paddingLeft: 20 }}>
                      {slide.bullets.map((b: string, j: number) => (
                        <li key={j} style={{ fontSize: 12, color: '#666' }}>{b}</li>
                      ))}
                    </ul>
                  )}
                </div>
              ))}
            </div>
          )}
          {!pitch && !generating && <p style={{ fontSize: 12, color: '#CCC', marginTop: 12 }}>Click Generate to create your AI pitch deck</p>}
          {generating && (
            <div style={{ display: 'flex', gap: 4, marginTop: 16 }}>
              {[0, 1, 2].map(i => <div key={i} style={{ width: 6, height: 6, borderRadius: '50%', background: '#E2001A', animation: 'bounce 1s ease-in-out infinite', animationDelay: `${i * 0.15}s` }} />)}
            </div>
          )}
        </div>
      )}

      {/* Feedback section */}
      <div className="anim-fade-up anim-stagger-4">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ width: 3, height: 16, background: '#E2001A' }} />
            <h2 style={{ fontSize: 12, fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.07em', color: '#999', margin: 0 }}>Feedback ({feedbacks.length})</h2>
          </div>
        </div>

        {/* Submit feedback (only for reviewers) */}
        {isReviewer && (
          <div className="lv-card" style={{ padding: 20, marginBottom: 12 }}>
            <label className="lv-label">Leave feedback</label>
            <textarea className="lv-input" rows={3} placeholder="Share your thoughts, suggestions, or questions…"
              value={newFeedback} onChange={e => setNewFeedback(e.target.value)}
              style={{ resize: 'vertical', marginBottom: 10 }} />
            <button onClick={submitFeedback} disabled={submitting || !newFeedback.trim()} className="lv-btn lv-btn-primary lv-btn-sm">
              {submitting ? 'Submitting…' : 'Submit feedback →'}
            </button>
          </div>
        )}

        {/* Feedback list */}
        {feedbacks.length === 0 ? (
          <div className="lv-card" style={{ padding: 24, textAlign: 'center', color: '#CCC', fontSize: 13 }}>No feedback yet</div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {feedbacks.map((f: any) => (
              <div key={f.id} className="lv-card" style={{ padding: 16, borderLeft: '3px solid #E6E6E6' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                  <span style={{ fontSize: 12, color: '#666' }}>
                    {f.isAnonymous ? 'Anonymous' : (f.reviewer?.name || f.reviewer?.email || 'Reviewer')}
                  </span>
                  <span style={{ fontSize: 11, color: '#CCC' }}>{new Date(f.createdAt).toLocaleDateString()}</span>
                </div>
                <p style={{ fontSize: 13, color: '#444', lineHeight: 1.7, margin: 0, whiteSpace: 'pre-wrap' }}>{f.content}</p>
                {(f.scoreclarity || f.scoreMarket || f.scoreInnovation || f.scoreExecution) && (
                  <div style={{ display: 'flex', gap: 12, marginTop: 12 }}>
                    {f.scoreclarity && <span className="lv-badge">Clarity: {f.scoreclarity}/5</span>}
                    {f.scoreMarket && <span className="lv-badge">Market: {f.scoreMarket}/5</span>}
                    {f.scoreInnovation && <span className="lv-badge">Innovation: {f.scoreInnovation}/5</span>}
                    {f.scoreExecution && <span className="lv-badge">Execution: {f.scoreExecution}/5</span>}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
      <style>{`@keyframes bounce { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-5px)} }`}</style>
    </div>
  )
}
