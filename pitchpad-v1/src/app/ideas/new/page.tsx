// src/app/ideas/new/page.tsx
'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'

export default function NewIdeaPage() {
  const router = useRouter()
  const { data: session, status } = useSession()
  const [step, setStep] = useState(1)
  const [title, setTitle] = useState('')
  const [problem, setProblem] = useState('')
  const [solution, setSolution] = useState('')
  const [market, setMarket] = useState('')
  const [ask, setAsk] = useState('')
  const [tags, setTags] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  // Redirect if not authenticated
  if (status === 'loading') {
    return <div style={{ padding: 40, color: '#999', fontSize: 13 }}>Loading…</div>
  }
  if (status === 'unauthenticated') {
    router.push('/auth/login')
    return null
  }

  async function submit() {
    if (!title || !problem || !solution || !market) {
      setError('Title, problem, solution, and market are required')
      return
    }
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/ideas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          problem,
          solution,
          market,
          ask: ask || undefined,
          tags: tags ? tags.split(',').map(t => t.trim()).filter(Boolean) : [],
          status: 'SUBMITTED',
          visibility: 'TEAM',
        }),
      })
      const data = await res.json()
      if (!res.ok) {
        throw new Error(data.error?.fieldErrors ? 'Please fill all required fields with enough detail' : data.error || 'Submission failed')
      }
      router.push(`/ideas/${data.id}`)
    } catch (err: any) {
      setError(err.message ?? 'Submission failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ maxWidth: 640, margin: '0 auto' }}>
      <div className="anim-fade-up" style={{ marginBottom: 32 }}>
        <div style={{ width: 40, height: 3, background: '#E2001A', marginBottom: 12 }} />
        <h1 style={{ fontSize: 28, fontWeight: 300, color: '#111', letterSpacing: '-0.02em' }}>Submit Idea</h1>
        <p style={{ color: '#999', fontSize: 13, marginTop: 4 }}>Share your innovation with the team</p>
      </div>

      {/* Progress */}
      <div style={{ display: 'flex', gap: 4, marginBottom: 32 }}>
        {[1, 2, 3].map(s => (
          <div key={s} style={{ flex: 1, height: 3, borderRadius: 2, background: step >= s ? '#E2001A' : '#E6E6E6', transition: 'background 0.3s' }} />
        ))}
      </div>

      <div className="lv-card anim-fade-up anim-stagger-1" style={{ padding: 32, marginBottom: 20 }}>

        {step === 1 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            <p style={{ fontSize: 12, color: '#999', textTransform: 'uppercase', letterSpacing: '0.08em', margin: 0 }}>Step 1 — The concept</p>
            <div>
              <label className="lv-label">Idea title *</label>
              <input className="lv-input" placeholder="e.g. AI-powered supply chain optimizer"
                value={title} onChange={e => setTitle(e.target.value)} autoFocus />
            </div>
            <div>
              <label className="lv-label">Tags (comma-separated)</label>
              <input className="lv-input" placeholder="e.g. AI, hardware, sustainability"
                value={tags} onChange={e => setTags(e.target.value)} />
            </div>
          </div>
        )}

        {step === 2 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            <p style={{ fontSize: 12, color: '#999', textTransform: 'uppercase', letterSpacing: '0.08em', margin: 0 }}>Step 2 — Problem & Solution</p>
            <div>
              <label className="lv-label">Problem Statement *</label>
              <textarea className="lv-input" rows={4}
                placeholder="What problem does this idea solve? Who experiences this problem?"
                value={problem} onChange={e => setProblem(e.target.value)}
                style={{ resize: 'vertical', lineHeight: 1.7 }} />
            </div>
            <div>
              <label className="lv-label">Proposed Solution *</label>
              <textarea className="lv-input" rows={4}
                placeholder="How does your idea solve this problem? What makes it unique?"
                value={solution} onChange={e => setSolution(e.target.value)}
                style={{ resize: 'vertical', lineHeight: 1.7 }} />
            </div>
          </div>
        )}

        {step === 3 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            <p style={{ fontSize: 12, color: '#999', textTransform: 'uppercase', letterSpacing: '0.08em', margin: 0 }}>Step 3 — Market & Ask</p>
            <div>
              <label className="lv-label">Target Market *</label>
              <textarea className="lv-input" rows={3}
                placeholder="Who would use this? What's the market size and opportunity?"
                value={market} onChange={e => setMarket(e.target.value)}
                style={{ resize: 'vertical', lineHeight: 1.7 }} />
            </div>
            <div>
              <label className="lv-label">Your Ask (optional)</label>
              <textarea className="lv-input" rows={2}
                placeholder="What do you need? Funding, team members, resources?"
                value={ask} onChange={e => setAsk(e.target.value)}
                style={{ resize: 'vertical', lineHeight: 1.7 }} />
            </div>
            <div className="lv-card" style={{ padding: 16, background: '#F8F8F8', marginTop: 8 }}>
              <p style={{ fontSize: 13, fontWeight: 500, color: '#111', marginBottom: 8 }}>{title}</p>
              {tags && <p style={{ fontSize: 11, color: '#E2001A', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8 }}>{tags}</p>}
              <p style={{ fontSize: 12, color: '#666', marginBottom: 4 }}><strong>Problem:</strong> {problem.slice(0, 100)}...</p>
              <p style={{ fontSize: 12, color: '#666' }}><strong>Solution:</strong> {solution.slice(0, 100)}...</p>
            </div>
            <div style={{ padding: 14, background: '#FFF0F2', borderRadius: 4, border: '1px solid #F5B8C0' }}>
              <p style={{ fontSize: 12, color: '#E2001A', margin: 0 }}>
                ⚡ After submitting, your idea will be visible to reviewers for feedback.
              </p>
            </div>
          </div>
        )}

        {error && <p style={{ fontSize: 12, color: '#E2001A', fontFamily: 'IBM Plex Mono', marginTop: 12 }}>{error}</p>}
      </div>

      {/* Nav buttons */}
      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
        <button onClick={() => step > 1 ? setStep(s => s - 1) : router.back()}
          className="lv-btn lv-btn-ghost">
          ← {step === 1 ? 'Cancel' : 'Back'}
        </button>
        <div style={{ display: 'flex', gap: 8 }}>
          {step < 3 ? (
            <button onClick={() => setStep(s => s + 1)} className="lv-btn lv-btn-primary">
              Next →
            </button>
          ) : (
            <button onClick={() => submit()} disabled={loading} className="lv-btn lv-btn-primary">
              {loading ? 'Submitting…' : 'Submit idea →'}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
