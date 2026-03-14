// src/app/ai-assistant/page.tsx
'use client'
import { useState, useRef, useEffect } from 'react'
import { api } from '@/lib/api'

interface Msg { role: 'user'|'assistant'; content: string }

const QUICK = [
  'How do I make my pitch stronger?',
  'What makes a great problem statement?',
  'How should I describe my market size?',
  'What do investors look for in early stage ideas?',
  'How do I handle weaknesses in my pitch?',
]

export default function AIAssistantPage() {
  const [msgs, setMsgs]     = useState<Msg[]>([{ role: 'assistant', content: "Hi! I'm your PitchPad AI coach. Ask me anything about pitching, your idea, or how to improve your score." }])
  const [input, setInput]   = useState('')
  const [loading, setLoading] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [msgs])

  async function send(text?: string) {
    const msg = text ?? input.trim()
    if (!msg || loading) return
    setInput('')
    const next = [...msgs, { role: 'user' as const, content: msg }]
    setMsgs(next)
    setLoading(true)
    try {
      const context = next.slice(-6).map(m => `${m.role}: ${m.content}`).join('\n')
      const res = await api.chat.ask(msg, context)
      setMsgs(prev => [...prev, { role: 'assistant', content: res.answer }])
    } catch {
      setMsgs(prev => [...prev, { role: 'assistant', content: 'Sorry, something went wrong. Try again.' }])
    } finally { setLoading(false) }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - 120px)', maxWidth: 800, margin: '0 auto' }}>
      <div className="anim-fade-up" style={{ marginBottom: 16 }}>
        <div style={{ width: 40, height: 3, background: '#E2001A', marginBottom: 12 }} />
        <h1 style={{ fontSize: 28, fontWeight: 300, color: '#111', letterSpacing: '-0.02em' }}>AI Assistant</h1>
        <p style={{ color: '#999', fontSize: 13, marginTop: 4 }}>Pitch coaching powered by Groq + Llama</p>
      </div>

      {/* Quick prompts */}
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 12 }}>
        {QUICK.map(q => (
          <button key={q} onClick={() => send(q)} className="lv-btn lv-btn-ghost"
            style={{ fontSize: 11, padding: '4px 10px' }}>
            {q.length > 38 ? q.slice(0, 36) + '…' : q}
          </button>
        ))}
      </div>

      {/* Messages */}
      <div className="lv-card flex-1 overflow-y-auto" style={{ padding: 20, minHeight: 0 }}>
        {msgs.map((m, i) => (
          <div key={i} style={{ display: 'flex', justifyContent: m.role === 'user' ? 'flex-end' : 'flex-start', marginBottom: 12 }}>
            {m.role === 'assistant' && (
              <div style={{ width: 26, height: 26, background: '#E2001A', borderRadius: 2, display: 'flex', alignItems: 'center', justifyContent: 'center', marginRight: 8, flexShrink: 0, marginTop: 2, fontSize: 12, color: '#fff' }}>⚡</div>
            )}
            <div style={{ maxWidth: '72%', padding: '10px 14px', borderRadius: m.role === 'user' ? '12px 12px 2px 12px' : '2px 12px 12px 12px', background: m.role === 'user' ? '#E2001A' : '#fff', color: m.role === 'user' ? '#fff' : '#333', fontSize: 13, lineHeight: 1.6, boxShadow: m.role === 'user' ? 'none' : '0 1px 4px rgba(0,0,0,0.08)', border: m.role === 'user' ? 'none' : '1px solid #E6E6E6', whiteSpace: 'pre-wrap' }}>
              {m.content}
            </div>
          </div>
        ))}
        {loading && (
          <div style={{ display: 'flex', gap: 4, padding: '8px 0' }}>
            {[0,1,2].map(i => <div key={i} style={{ width: 6, height: 6, borderRadius: '50%', background: '#E2001A', animation: 'bounce 1s ease-in-out infinite', animationDelay: `${i*0.15}s` }} />)}
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div style={{ display: 'flex', gap: 10, marginTop: 12 }}>
        <input className="lv-input flex-1" placeholder="Ask about your pitch, scores, or how to improve…"
          value={input} onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), send())}
          disabled={loading} />
        <button onClick={() => send()} disabled={loading || !input.trim()} className="lv-btn lv-btn-primary" style={{ flexShrink: 0 }}>Send</button>
      </div>
      <style>{`@keyframes bounce { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-5px)} }`}</style>
    </div>
  )
}
