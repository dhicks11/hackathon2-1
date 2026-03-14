// src/app/ideas/new/page.tsx
'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { api, getUserFromStorage } from '@/lib/api'

export default function NewIdeaPage() {
  const router = useRouter()
  const [step, setStep]           = useState(1)
  const [title, setTitle]         = useState('')
  const [description, setDescription] = useState('')
  const [category, setCategory]   = useState('')
  const [loading, setLoading]     = useState(false)
  const [error, setError]         = useState('')
  const user = getUserFromStorage()

  async function submit(asDraft = false) {
    if (!title || !description) { setError('Title and description are required'); return }
    setLoading(true); setError('')
    try {
      const result = await api.ideas.submit({
        user_id: user?.user_id ?? '',
        title,
        description,
        category,
      })
      router.push(`/ideas/${result.idea?.[0]?.id ?? result.idea?.id}`)
    } catch (err: any) {
      setError(err.message ?? 'Submission failed')
    } finally { setLoading(false) }
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
        {[1,2,3].map(s => (
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
              <label className="lv-label">Category</label>
              <input className="lv-input" placeholder="e.g. AI, hardware, sustainability"
                value={category} onChange={e => setCategory(e.target.value)} />
            </div>
          </div>
        )}

        {step === 2 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            <p style={{ fontSize: 12, color: '#999', textTransform: 'uppercase', letterSpacing: '0.08em', margin: 0 }}>Step 2 — Describe your idea</p>
            <div>
              <label className="lv-label">Full description *</label>
              <textarea className="lv-input" rows={8}
                placeholder="Describe the problem you're solving, your solution, target market, and why now. The more detail you provide, the better the AI feedback will be."
                value={description} onChange={e => setDescription(e.target.value)}
                style={{ resize: 'vertical', lineHeight: 1.7 }} />
            </div>
          </div>
        )}

        {step === 3 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            <p style={{ fontSize: 12, color: '#999', textTransform: 'uppercase', letterSpacing: '0.08em', margin: 0 }}>Step 3 — Review & submit</p>
            <div className="lv-card" style={{ padding: 20, background: '#F8F8F8' }}>
              <p style={{ fontSize: 13, fontWeight: 500, color: '#111', marginBottom: 8 }}>{title}</p>
              {category && <p style={{ fontSize: 11, color: '#E2001A', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 12 }}>{category}</p>}
              <p style={{ fontSize: 13, color: '#666', lineHeight: 1.7 }}>{description}</p>
            </div>
            <div style={{ padding: 14, background: '#FFF0F2', borderRadius: 4, border: '1px solid #F5B8C0' }}>
              <p style={{ fontSize: 12, color: '#E2001A', margin: 0 }}>
                ⚡ After submitting, AI will automatically score your idea on clarity, feasibility, and impact.
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
