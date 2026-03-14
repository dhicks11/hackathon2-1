// src/app/practice/page.tsx — calls Railway /api/ideas/:id/practice
'use client'
import { useState, useRef, useEffect } from 'react'
import { api } from '@/lib/api'

export default function PracticePage() {
  const [ideas, setIdeas]         = useState<any[]>([])
  const [selectedId, setSelectedId] = useState('')
  const [recording, setRecording] = useState(false)
  const [processing, setProcessing] = useState(false)
  const [result, setResult]       = useState<any>(null)
  const [duration, setDuration]   = useState(0)
  const mrRef    = useRef<MediaRecorder | null>(null)
  const chunksRef = useRef<Blob[]>([])
  const timerRef  = useRef<NodeJS.Timeout>()

  useEffect(() => {
    api.ideas.list().then(d => { const arr = Array.isArray(d) ? d : []; setIdeas(arr); if (arr[0]) setSelectedId(arr[0].id) })
  }, [])

  async function start() {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
    const mr = new MediaRecorder(stream); chunksRef.current = []
    mr.ondataavailable = e => { if (e.data.size > 0) chunksRef.current.push(e.data) }
    mr.start(100); mrRef.current = mr
    setRecording(true); setDuration(0)
    timerRef.current = setInterval(() => setDuration(d => d + 1), 1000)
  }

  async function stop() {
    clearInterval(timerRef.current)
    return new Promise<Blob>(res => {
      const mr = mrRef.current!
      mr.onstop = () => res(new Blob(chunksRef.current, { type: 'audio/wav' }))
      mr.stop(); mr.stream.getTracks().forEach(t => t.stop()); setRecording(false)
    })
  }

  async function stopAndAnalyze() {
    const blob = await stop(); setProcessing(true)
    try {
      const res = await api.ideas.practice(selectedId, blob)
      setResult(res)
    } catch (e: any) { alert(e.message) }
    finally { setProcessing(false) }
  }

  const fmt = (s: number) => `${Math.floor(s/60)}:${String(s%60).padStart(2,'0')}`

  return (
    <div style={{ maxWidth: 680, margin: '0 auto' }}>
      <div className="anim-fade-up" style={{ marginBottom: 32 }}>
        <div style={{ width: 40, height: 3, background: '#E2001A', marginBottom: 12 }} />
        <h1 style={{ fontSize: 28, fontWeight: 300, color: '#111', letterSpacing: '-0.02em' }}>Voice Practice</h1>
        <p style={{ color: '#999', fontSize: 13, marginTop: 4 }}>Record your pitch · Whisper transcribes · AI coaches</p>
      </div>

      {/* Idea selector */}
      <div className="lv-card anim-fade-up anim-stagger-1" style={{ padding: 20, marginBottom: 20 }}>
        <label className="lv-label">Practice for which idea?</label>
        <select className="lv-input" value={selectedId} onChange={e => setSelectedId(e.target.value)}>
          {ideas.map(i => <option key={i.id} value={i.id}>{i.title}</option>)}
        </select>
      </div>

      {/* Recorder */}
      <div className="lv-card anim-fade-up anim-stagger-2" style={{ padding: 40, textAlign: 'center', marginBottom: 20 }}>
        <div style={{ display: 'inline-flex', width: 100, height: 100, borderRadius: '50%', border: `2px solid ${recording ? '#E2001A' : processing ? '#FF8800' : '#E6E6E6'}`, alignItems: 'center', justifyContent: 'center', marginBottom: 24, background: recording ? '#FFF0F2' : '#F8F8F8', ...(recording ? { animation: 'recording-pulse 1.2s ease-in-out infinite' } : {}) }}>
          {recording ? (
            <span style={{ fontFamily: 'IBM Plex Mono', fontSize: 13, color: '#E2001A' }}>● {fmt(duration)}</span>
          ) : processing ? (
            <div style={{ display: 'flex', gap: 4 }}>
              {[0,1,2].map(i => <div key={i} style={{ width: 6, height: 6, borderRadius: '50%', background: '#FF8800', animation: 'bounce 1s ease-in-out infinite', animationDelay: `${i*0.15}s` }} />)}
            </div>
          ) : (
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#CCC" strokeWidth="1.5">
              <path d="M12 2a3 3 0 0 1 3 3v7a3 3 0 0 1-6 0V5a3 3 0 0 1 3-3z"/>
              <path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" y1="19" x2="12" y2="22"/>
            </svg>
          )}
        </div>

        <div style={{ display: 'flex', justifyContent: 'center', gap: 12 }}>
          {!recording && !processing && (
            <button onClick={start} disabled={!selectedId} className="lv-btn lv-btn-primary" style={{ padding: '12px 32px' }}>
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
      </div>

      {/* Results */}
      {result && (
        <div className="space-y-4 anim-fade-up">
          <div className="lv-card" style={{ padding: 24 }}>
            <div style={{ width: 32, height: 2, background: '#E2001A', marginBottom: 16 }} />
            <h2 style={{ fontSize: 14, fontWeight: 500, color: '#111', marginBottom: 16 }}>Delivery Evaluation</h2>
            {result.evaluation && Object.entries(result.evaluation).map(([k, v]: any) => (
              typeof v === 'string' && k !== 'pacing' ? (
                <div key={k} style={{ marginBottom: 12 }}>
                  <p style={{ fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.07em', color: '#999', marginBottom: 4 }}>{k.replace(/_/g,' ')}</p>
                  <p style={{ fontSize: 13, color: '#444', margin: 0 }}>{v}</p>
                </div>
              ) : k === 'delivery_score' ? (
                <div key={k} className="lv-metric" style={{ display: 'inline-block', marginBottom: 16, padding: '12px 20px' }}>
                  <div className="lv-metric-value">{v}</div>
                  <div className="lv-metric-label">/ 10</div>
                </div>
              ) : null
            ))}
          </div>

          <div className="lv-card" style={{ padding: 24 }}>
            <h2 style={{ fontSize: 13, fontWeight: 500, color: '#999', marginBottom: 12 }}>Transcript</h2>
            <p style={{ fontSize: 12, color: '#666', lineHeight: 1.8, fontFamily: 'IBM Plex Mono' }}>{result.transcript}</p>
          </div>

          <button onClick={() => setResult(null)} className="lv-btn lv-btn-outline" style={{ width: '100%', justifyContent: 'center' }}>
            Record another take →
          </button>
        </div>
      )}
      <style>{`@keyframes bounce { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-5px)} }`}</style>
    </div>
  )
}
