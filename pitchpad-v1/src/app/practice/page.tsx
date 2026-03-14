// src/app/practice/page.tsx — Voice practice with Whisper transcription and AI coaching
'use client'
import { useState, useRef, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'

export default function PracticePage() {
  const router = useRouter()
  const { data: session, status } = useSession()
  const [ideas, setIdeas] = useState<any[]>([])
  const [selectedId, setSelectedId] = useState('')
  const [recording, setRecording] = useState(false)
  const [processing, setProcessing] = useState(false)
  const [result, setResult] = useState<any>(null)
  const [duration, setDuration] = useState(0)
  const [error, setError] = useState('')
  const mrRef = useRef<MediaRecorder | null>(null)
  const chunksRef = useRef<Blob[]>([])
  const timerRef = useRef<NodeJS.Timeout>()
  const startTimeRef = useRef<number>(0)

  useEffect(() => {
    if (status === 'loading') return
    if (status === 'unauthenticated') {
      router.push('/auth/login')
      return
    }

    // Fetch user's ideas
    fetch('/api/ideas?mine=true')
      .then(res => res.json())
      .then(data => {
        const arr = Array.isArray(data) ? data : []
        setIdeas(arr)
        if (arr[0]) setSelectedId(arr[0].id)
      })
      .catch(() => setIdeas([]))
  }, [status, router])

  async function start() {
    setError('')
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const mr = new MediaRecorder(stream)
      chunksRef.current = []
      mr.ondataavailable = e => { if (e.data.size > 0) chunksRef.current.push(e.data) }
      mr.start(100)
      mrRef.current = mr
      setRecording(true)
      setDuration(0)
      startTimeRef.current = Date.now()
      timerRef.current = setInterval(() => setDuration(d => d + 1), 1000)
    } catch (err) {
      setError('Could not access microphone. Please allow microphone access.')
    }
  }

  async function stop(): Promise<{ blob: Blob; durationSec: number }> {
    clearInterval(timerRef.current)
    const durationSec = Math.round((Date.now() - startTimeRef.current) / 1000)
    return new Promise(resolve => {
      const mr = mrRef.current!
      mr.onstop = () => resolve({
        blob: new Blob(chunksRef.current, { type: 'audio/webm' }),
        durationSec
      })
      mr.stop()
      mr.stream.getTracks().forEach(t => t.stop())
      setRecording(false)
    })
  }

  async function stopAndAnalyze() {
    const { blob, durationSec } = await stop()
    setProcessing(true)
    setError('')
    try {
      const formData = new FormData()
      formData.append('audio', blob, 'recording.webm')
      formData.append('duration', durationSec.toString())

      const res = await fetch(`/api/ideas/${selectedId}/practice`, {
        method: 'POST',
        body: formData,
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Analysis failed')
      setResult(data)
    } catch (e: any) {
      setError(e.message || 'Failed to analyze recording')
    } finally {
      setProcessing(false)
    }
  }

  const fmt = (s: number) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`

  if (status === 'loading') {
    return <div style={{ padding: 40, color: '#999', fontSize: 13 }}>Loading…</div>
  }

  const scoreColor = (score: number) =>
    score >= 8 ? '#00875A' : score >= 5 ? '#FF8800' : '#E2001A'

  return (
    <div style={{ maxWidth: 680, margin: '0 auto' }}>
      <div className="anim-fade-up" style={{ marginBottom: 32 }}>
        <div style={{ width: 40, height: 3, background: '#E2001A', marginBottom: 12 }} />
        <h1 style={{ fontSize: 28, fontWeight: 300, color: '#111', letterSpacing: '-0.02em' }}>Voice Practice</h1>
        <p style={{ color: '#999', fontSize: 13, marginTop: 4 }}>Record your pitch · Whisper transcribes · AI coaches you (1-10 rating)</p>
      </div>

      {/* Idea selector */}
      <div className="lv-card anim-fade-up anim-stagger-1" style={{ padding: 20, marginBottom: 20 }}>
        <label className="lv-label">Practice for which idea?</label>
        {ideas.length === 0 ? (
          <p style={{ color: '#999', fontSize: 13 }}>No ideas yet. Create an idea first to practice your pitch.</p>
        ) : (
          <select className="lv-input" value={selectedId} onChange={e => setSelectedId(e.target.value)}>
            {ideas.map(i => <option key={i.id} value={i.id}>{i.title}</option>)}
          </select>
        )}
      </div>

      {/* Recorder */}
      <div className="lv-card anim-fade-up anim-stagger-2" style={{ padding: 40, textAlign: 'center', marginBottom: 20 }}>
        <div style={{
          display: 'inline-flex',
          width: 100,
          height: 100,
          borderRadius: '50%',
          border: `2px solid ${recording ? '#E2001A' : processing ? '#FF8800' : '#E6E6E6'}`,
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: 24,
          background: recording ? '#FFF0F2' : '#F8F8F8',
          ...(recording ? { animation: 'recording-pulse 1.2s ease-in-out infinite' } : {})
        }}>
          {recording ? (
            <span style={{ fontFamily: 'IBM Plex Mono', fontSize: 13, color: '#E2001A' }}>● {fmt(duration)}</span>
          ) : processing ? (
            <div style={{ display: 'flex', gap: 4 }}>
              {[0, 1, 2].map(i => <div key={i} style={{ width: 6, height: 6, borderRadius: '50%', background: '#FF8800', animation: 'bounce 1s ease-in-out infinite', animationDelay: `${i * 0.15}s` }} />)}
            </div>
          ) : (
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#CCC" strokeWidth="1.5">
              <path d="M12 2a3 3 0 0 1 3 3v7a3 3 0 0 1-6 0V5a3 3 0 0 1 3-3z" />
              <path d="M19 10v2a7 7 0 0 1-14 0v-2" /><line x1="12" y1="19" x2="12" y2="22" />
            </svg>
          )}
        </div>

        <div style={{ display: 'flex', justifyContent: 'center', gap: 12 }}>
          {!recording && !processing && (
            <button onClick={start} disabled={!selectedId || ideas.length === 0} className="lv-btn lv-btn-primary" style={{ padding: '12px 32px' }}>
              ● Start Recording
            </button>
          )}
          {recording && (
            <button onClick={stopAndAnalyze} className="lv-btn lv-btn-ghost" style={{ padding: '12px 32px', borderColor: '#E2001A', color: '#E2001A' }}>
              ■ Stop & Analyze
            </button>
          )}
          {processing && <div style={{ fontSize: 13, color: '#999', paddingTop: 10 }}>Analyzing with Whisper + AI…</div>}
        </div>

        {error && <p style={{ fontSize: 12, color: '#E2001A', marginTop: 16 }}>{error}</p>}
      </div>

      {/* Results */}
      {result && (
        <div className="space-y-4 anim-fade-up">
          {/* Score */}
          <div className="lv-card" style={{ padding: 24, textAlign: 'center' }}>
            <div className="lv-metric" style={{ marginBottom: 16 }}>
              <div className="lv-metric-value" style={{ fontSize: 48, color: scoreColor(result.evaluation?.delivery_score || 0) }}>
                {result.evaluation?.delivery_score || '—'}
              </div>
              <div className="lv-metric-label" style={{ fontSize: 14 }}>/ 10 Delivery Score</div>
            </div>
            {result.evaluation?.overall && (
              <p style={{ fontSize: 14, color: '#444', marginTop: 12 }}>{result.evaluation.overall}</p>
            )}
          </div>

          {/* Metrics */}
          <div className="lv-card" style={{ padding: 24 }}>
            <h2 style={{ fontSize: 13, fontWeight: 500, color: '#333', marginBottom: 16 }}>Metrics</h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
              <div className="lv-metric">
                <div className="lv-metric-value">{result.metrics?.wpm || '—'}</div>
                <div className="lv-metric-label">WPM</div>
              </div>
              <div className="lv-metric">
                <div className="lv-metric-value">{result.metrics?.fillerWords || 0}</div>
                <div className="lv-metric-label">Filler Words</div>
              </div>
              <div className="lv-metric">
                <div className="lv-metric-value">{result.metrics?.clarityScore || '—'}</div>
                <div className="lv-metric-label">Clarity</div>
              </div>
            </div>
          </div>

          {/* Feedback */}
          <div className="lv-card" style={{ padding: 24 }}>
            <div style={{ width: 32, height: 2, background: '#E2001A', marginBottom: 16 }} />
            <h2 style={{ fontSize: 14, fontWeight: 500, color: '#111', marginBottom: 16 }}>AI Coaching Feedback</h2>

            {result.evaluation?.strengths && (
              <div style={{ marginBottom: 16 }}>
                <p style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.07em', color: '#00875A', marginBottom: 6 }}>Strengths</p>
                <p style={{ fontSize: 13, color: '#444', lineHeight: 1.6 }}>{result.evaluation.strengths}</p>
              </div>
            )}

            {result.evaluation?.improvements && (
              <div style={{ marginBottom: 16 }}>
                <p style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.07em', color: '#FF8800', marginBottom: 6 }}>To Improve</p>
                <p style={{ fontSize: 13, color: '#444', lineHeight: 1.6 }}>{result.evaluation.improvements}</p>
              </div>
            )}

            {result.evaluation?.pacing && (
              <div>
                <p style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.07em', color: '#0066CC', marginBottom: 6 }}>Pacing</p>
                <p style={{ fontSize: 13, color: '#444', lineHeight: 1.6 }}>{result.evaluation.pacing}</p>
              </div>
            )}
          </div>

          {/* Transcript */}
          <div className="lv-card" style={{ padding: 24 }}>
            <h2 style={{ fontSize: 13, fontWeight: 500, color: '#999', marginBottom: 12 }}>Transcript</h2>
            <p style={{ fontSize: 12, color: '#666', lineHeight: 1.8, fontFamily: 'IBM Plex Mono' }}>{result.transcript}</p>
          </div>

          <button onClick={() => setResult(null)} className="lv-btn lv-btn-outline" style={{ width: '100%', justifyContent: 'center' }}>
            Record another take →
          </button>
        </div>
      )}
      <style>{`
        @keyframes bounce { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-5px)} }
        @keyframes recording-pulse { 0%,100%{box-shadow:0 0 0 0 rgba(226,0,26,0.3)} 50%{box-shadow:0 0 0 12px rgba(226,0,26,0)} }
      `}</style>
    </div>
  )
}
