// src/app/ideas/[id]/page.tsx
'use client'
import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import { api, getUserFromStorage } from '@/lib/api'

export default function IdeaDetailPage() {
  const { id }   = useParams<{ id: string }>()
  const [idea, setIdea]         = useState<any>(null)
  const [feedback, setFeedback] = useState<any[]>([])
  const [pitch, setPitch]       = useState<string | null>(null)
  const [newFeedback, setNewFeedback] = useState('')
  const [loading, setLoading]   = useState(true)
  const [generating, setGenerating] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const user = getUserFromStorage()

  useEffect(() => {
    Promise.all([api.ideas.get(id), api.feedback.forIdea(id)])
      .then(([i, f]) => { setIdea(i); setFeedback(Array.isArray(f) ? f : []) })
      .finally(() => setLoading(false))
  }, [id])

  async function generatePitch() {
    setGenerating(true)
    try {
      const res = await api.ideas.generatePitch(id)
      setPitch(res.summary)
    } catch (e: any) { alert(e.message) }
    finally { setGenerating(false) }
  }

  async function submitFeedback() {
    if (!newFeedback.trim()) return
    setSubmitting(true)
    try {
      await api.feedback.submit({ idea_id: id, reviewer_id: user?.user_id ?? '', content: newFeedback, role: 'reviewer' })
      setNewFeedback('')
      const f = await api.feedback.forIdea(id)
      setFeedback(Array.isArray(f) ? f : [])
    } catch (e: any) { alert(e.message) }
    finally { setSubmitting(false) }
  }

  if (loading) return <div style={{ padding: 40, color: '#999', fontSize: 13 }}>Loading…</div>
  if (!idea)   return <div style={{ padding: 40, color: '#999', fontSize: 13 }}>Idea not found</div>

  const scoreColor = idea.score >= 7 ? '#00875A' : idea.score >= 4 ? '#FF8800' : '#E2001A'

  return (
    <div style={{ maxWidth: 800, margin: '0 auto' }}>
      {/* Header */}
      <div className="anim-fade-up" style={{ marginBottom: 32 }}>
        <div style={{ width: 40, height: 3, background: '#E2001A', marginBottom: 12 }} />
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16 }}>
          <div>
            <h1 style={{ fontSize: 28, fontWeight: 300, color: '#111', letterSpacing: '-0.02em', marginBottom: 8 }}>{idea.title}</h1>
            {idea.category && <span className="lv-badge" style={{ background: '#FFF0F2', color: '#E2001A', border: '1px solid #F5B8C0' }}>{idea.category}</span>}
          </div>
          {idea.score && (
            <div className="lv-metric" style={{ textAlign: 'center', minWidth: 80 }}>
              <div className="lv-metric-value" style={{ color: scoreColor }}>{idea.score}</div>
              <div className="lv-metric-label">/ 10</div>
            </div>
          )}
        </div>
      </div>

      {/* Description */}
      <div className="lv-card anim-fade-up anim-stagger-1" style={{ padding: 24, marginBottom: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
          <div style={{ width: 3, height: 16, background: '#E2001A' }} />
          <h2 style={{ fontSize: 12, fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.07em', color: '#999', margin: 0 }}>Description</h2>
        </div>
        <p style={{ fontSize: 14, color: '#444', lineHeight: 1.75, whiteSpace: 'pre-wrap' }}>{idea.description}</p>
      </div>

      {/* AI Evaluation */}
      {idea.ai_evaluation && (
        <div className="lv-card anim-fade-up anim-stagger-2" style={{ padding: 24, marginBottom: 16, borderLeft: '3px solid #FF8800' }}>
          <h2 style={{ fontSize: 12, fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.07em', color: '#999', marginBottom: 16 }}>AI Evaluation</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginBottom: 16 }}>
            {['market_potential','feasibility','originality'].map(key => idea.ai_evaluation[key] && (
              <div key={key} style={{ padding: 12, background: '#F8F8F8', borderRadius: 4 }}>
                <p style={{ fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.07em', color: '#999', margin: '0 0 4px' }}>{key.replace('_',' ')}</p>
                <p style={{ fontSize: 12, color: '#333', margin: 0, lineHeight: 1.5 }}>{idea.ai_evaluation[key]}</p>
              </div>
            ))}
          </div>
          {idea.ai_evaluation.verdict && (
            <span className="lv-badge" style={{ background: idea.ai_evaluation.verdict === 'strong' ? '#E6F9F1' : '#FFF8E6', color: idea.ai_evaluation.verdict === 'strong' ? '#00875A' : '#FF8800', border: '1px solid currentColor' }}>
              {idea.ai_evaluation.verdict}
            </span>
          )}
        </div>
      )}

      {/* Pitch generator */}
      <div className="lv-card anim-fade-up anim-stagger-3" style={{ padding: 24, marginBottom: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: pitch ? 16 : 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ width: 3, height: 16, background: '#E2001A' }} />
            <h2 style={{ fontSize: 12, fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.07em', color: '#999', margin: 0 }}>AI Pitch Summary</h2>
          </div>
          <button onClick={generatePitch} disabled={generating} className="lv-btn lv-btn-primary lv-btn-sm">
            {generating ? 'Generating…' : pitch ? '↻ Regenerate' : '⚡ Generate'}
          </button>
        </div>
        {pitch && <p style={{ fontSize: 13, color: '#444', lineHeight: 1.8, whiteSpace: 'pre-wrap' }}>{pitch}</p>}
        {!pitch && !generating && <p style={{ fontSize: 12, color: '#CCC', marginTop: 12 }}>Click Generate to create your AI pitch summary</p>}
        {generating && (
          <div style={{ display: 'flex', gap: 4, marginTop: 16 }}>
            {[0,1,2].map(i => <div key={i} style={{ width: 6, height: 6, borderRadius: '50%', background: '#E2001A', animation: 'bounce 1s ease-in-out infinite', animationDelay: `${i*0.15}s` }} />)}
          </div>
        )}
      </div>

      {/* Feedback */}
      <div className="anim-fade-up anim-stagger-4">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ width: 3, height: 16, background: '#E2001A' }} />
            <h2 style={{ fontSize: 12, fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.07em', color: '#999', margin: 0 }}>Feedback ({feedback.length})</h2>
          </div>
        </div>

        {/* Submit feedback */}
        <div className="lv-card" style={{ padding: 20, marginBottom: 12 }}>
          <label className="lv-label">Leave feedback</label>
          <textarea className="lv-input" rows={3} placeholder="Share your thoughts, suggestions, or questions…"
            value={newFeedback} onChange={e => setNewFeedback(e.target.value)}
            style={{ resize: 'vertical', marginBottom: 10 }} />
          <button onClick={submitFeedback} disabled={submitting || !newFeedback.trim()} className="lv-btn lv-btn-primary lv-btn-sm">
            {submitting ? 'Submitting…' : 'Submit feedback →'}
          </button>
        </div>

        {/* Feedback list */}
        {feedback.length === 0 ? (
          <div className="lv-card" style={{ padding: 24, textAlign: 'center', color: '#CCC', fontSize: 13 }}>No feedback yet</div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {feedback.map((f: any) => (
              <div key={f.id} className="lv-card" style={{ padding: 16, borderLeft: f.role === 'ai' ? '3px solid #FF8800' : '3px solid #E6E6E6' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                  <span className="lv-badge" style={{ background: f.role === 'ai' ? '#FFF8E6' : '#F2F2F2', color: f.role === 'ai' ? '#FF8800' : '#666' }}>
                    {f.role ?? 'reviewer'}
                  </span>
                  <span style={{ fontSize: 11, color: '#CCC' }}>{new Date(f.created_at).toLocaleDateString()}</span>
                </div>
                <p style={{ fontSize: 13, color: '#444', lineHeight: 1.7, margin: 0, whiteSpace: 'pre-wrap' }}>{f.content}</p>
              </div>
            ))}
          </div>
        )}
      </div>
      <style>{`@keyframes bounce { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-5px)} }`}</style>
    </div>
  )
}
