// src/app/ai-assistant/page.tsx
'use client'
import { useState, useRef, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'

interface Msg { role: 'user' | 'assistant'; content: string }

const QUICK = [
  'How do I make my pitch stronger?',
  'What makes a great problem statement?',
  'How should I describe my market size?',
  'What do investors look for in early stage ideas?',
  'How do I handle weaknesses in my pitch?',
]

export default function AIAssistantPage() {
  const router = useRouter()
  const { status } = useSession()
  const [msgs, setMsgs] = useState<Msg[]>([
    { role: 'assistant', content: "Hi! I'm your PitchPad AI coach. Ask me anything about pitching, or record a pitch for feedback." },
  ])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [recording, setRecording] = useState(false)
  const [processing, setProcessing] = useState(false)
  const [ideas, setIdeas] = useState<any[]>([])
  const [selectedIdea, setSelectedIdea] = useState('')
  const bottomRef = useRef<HTMLDivElement>(null)
  const mrRef = useRef<MediaRecorder | null>(null)
  const chunksRef = useRef<Blob[]>([])
  const startTimeRef = useRef<number>(0)

  useEffect(() => {
    if (status === 'loading') return
    if (status === 'unauthenticated') {
      router.push('/auth/login')
      return
    }

    fetch('/api/ideas?mine=true')
      .then(res => res.json())
      .then(data => {
        const arr = Array.isArray(data) ? data : []
        setIdeas(arr)
        if (arr[0]) setSelectedIdea(arr[0].id)
      })
      .catch(() => setIdeas([]))
  }, [status, router])

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [msgs, loading, processing])

  async function send(text?: string) {
    const msg = text ?? input.trim()
    if (!msg || loading) return
    setInput('')
    const next = [...msgs, { role: 'user' as const, content: msg }]
    setMsgs(next)
    setLoading(true)
    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: next.slice(-8).map(m => ({ role: m.role, content: m.content })),
          ideaId: selectedIdea || undefined,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Request failed')
      setMsgs(prev => [...prev, { role: 'assistant', content: data.answer || data.data?.message || 'No response' }])
    } catch (err: any) {
      setMsgs(prev => [...prev, { role: 'assistant', content: `Error: ${err.message}. Please try again.` }])
    } finally { setLoading(false) }
  }

  async function startRecording() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const mr = new MediaRecorder(stream)
      chunksRef.current = []
      mr.ondataavailable = e => { if (e.data.size > 0) chunksRef.current.push(e.data) }
      mr.start(100)
      mrRef.current = mr
      setRecording(true)
      startTimeRef.current = Date.now()
    } catch {
      setMsgs(prev => [...prev, { role: 'assistant', content: 'Could not access microphone. Please allow microphone access.' }])
    }
  }

  async function stopRecording() {
    if (!mrRef.current) return
    setRecording(false)
    setProcessing(true)

    const durationSec = Math.round((Date.now() - startTimeRef.current) / 1000)
    const blob = await new Promise<Blob>(resolve => {
      const mr = mrRef.current!
      mr.onstop = () => resolve(new Blob(chunksRef.current, { type: 'audio/webm' }))
      mr.stop()
      mr.stream.getTracks().forEach(t => t.stop())
    })

    setMsgs(prev => [...prev, { role: 'user', content: `[Voice recording - ${durationSec}s]` }])

    try {
      if (!selectedIdea) {
        throw new Error('Please select an idea first')
      }

      const formData = new FormData()
      formData.append('audio', blob, 'recording.webm')
      formData.append('duration', durationSec.toString())

      const res = await fetch(`/api/ideas/${selectedIdea}/practice`, {
        method: 'POST',
        body: formData,
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Analysis failed')

      const score = data.evaluation?.delivery_score || 5
      let feedback = `Delivery Score: ${score}/10\n\n`
      if (data.evaluation?.overall) feedback += `Overall: ${data.evaluation.overall}\n\n`
      if (data.evaluation?.strengths) feedback += `Strengths: ${data.evaluation.strengths}\n\n`
      if (data.evaluation?.improvements) feedback += `To improve: ${data.evaluation.improvements}\n\n`
      if (data.metrics) {
        feedback += `Metrics: ${data.metrics.wpm} WPM | ${data.metrics.fillerWords} filler words | Clarity: ${data.metrics.clarityScore}/100`
      }

      setMsgs(prev => [...prev, { role: 'assistant', content: feedback }])
    } catch (err: any) {
      setMsgs(prev => [...prev, { role: 'assistant', content: `Voice analysis error: ${err.message}` }])
    } finally {
      setProcessing(false)
    }
  }

  if (status === 'loading') {
    return <div style={{ padding: 40, color: '#999', fontSize: 13 }}>Loading...</div>
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - 120px)', maxWidth: 800, margin: '0 auto' }}>
      <div className="anim-fade-up" style={{ marginBottom: 16 }}>
        <div style={{ width: 40, height: 3, background: '#E2001A', marginBottom: 12 }} />
        <h1 style={{ fontSize: 28, fontWeight: 300, color: '#111', letterSpacing: '-0.02em' }}>AI Assistant</h1>
        <p style={{ color: '#999', fontSize: 13, marginTop: 4 }}>Pitch coaching with AI plus voice feedback</p>
      </div>

      <div className="lv-card" style={{ padding: 12, marginBottom: 12, display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
        <span style={{ fontSize: 12, color: '#666' }}>Practice pitch for:</span>
        <select
          className="lv-input"
          style={{ flex: 1, minWidth: 200, padding: '6px 10px', fontSize: 12 }}
          value={selectedIdea}
          onChange={e => setSelectedIdea(e.target.value)}
        >
          {ideas.length === 0 ? (
            <option value="">No ideas yet - create one first</option>
          ) : (
            ideas.map(i => <option key={i.id} value={i.id}>{i.title}</option>)
          )}
        </select>
        <button
          onClick={recording ? stopRecording : startRecording}
          disabled={processing || !selectedIdea}
          className={`lv-btn ${recording ? 'lv-btn-ghost' : 'lv-btn-primary'}`}
          style={{
            padding: '8px 16px',
            borderColor: recording ? '#E2001A' : undefined,
            color: recording ? '#E2001A' : undefined,
          }}
        >
          {processing ? 'Analyzing...' : recording ? 'Stop and analyze' : 'Record pitch'}
        </button>
      </div>

      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 12 }}>
        {QUICK.map(q => (
          <button key={q} onClick={() => send(q)} className="lv-btn lv-btn-ghost"
            style={{ fontSize: 11, padding: '4px 10px' }}>
            {q.length > 38 ? q.slice(0, 36) + '...' : q}
          </button>
        ))}
      </div>

      <div className="lv-card flex-1 overflow-y-auto" style={{ padding: 20, minHeight: 0 }}>
        {msgs.map((m, i) => (
          <div key={i} style={{ display: 'flex', justifyContent: m.role === 'user' ? 'flex-end' : 'flex-start', marginBottom: 12 }}>
            {m.role === 'assistant' && (
              <div style={{ width: 26, height: 26, background: '#E2001A', borderRadius: 2, display: 'flex', alignItems: 'center', justifyContent: 'center', marginRight: 8, flexShrink: 0, marginTop: 2, fontSize: 12, color: '#fff' }}>AI</div>
            )}
            <div style={{
              maxWidth: '72%',
              padding: '10px 14px',
              borderRadius: m.role === 'user' ? '12px 12px 2px 12px' : '2px 12px 12px 12px',
              background: m.role === 'user' ? '#E2001A' : '#fff',
              color: m.role === 'user' ? '#fff' : '#333',
              fontSize: 13,
              lineHeight: 1.6,
              boxShadow: m.role === 'user' ? 'none' : '0 1px 4px rgba(0,0,0,0.08)',
              border: m.role === 'user' ? 'none' : '1px solid #E6E6E6',
              whiteSpace: 'pre-wrap'
            }}>
              {m.content}
            </div>
          </div>
        ))}
        {(loading || processing) && (
          <div style={{ display: 'flex', gap: 4, padding: '8px 0' }}>
            {[0, 1, 2].map(i => <div key={i} style={{ width: 6, height: 6, borderRadius: '50%', background: '#E2001A', animation: 'bounce 1s ease-in-out infinite', animationDelay: `${i * 0.15}s` }} />)}
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      <div style={{ display: 'flex', gap: 10, marginTop: 12 }}>
        <input className="lv-input flex-1" placeholder="Ask about your pitch, scores, or how to improve..."
          value={input} onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), send())}
          disabled={loading || processing} />
        <button onClick={() => send()} disabled={loading || processing || !input.trim()} className="lv-btn lv-btn-primary" style={{ flexShrink: 0 }}>Send</button>
      </div>
      <style>{`@keyframes bounce { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-5px)} }`}</style>
    </div>
  )
}
