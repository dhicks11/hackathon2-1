// src/app/page.tsx — Lenovo.com-inspired landing
import Link from 'next/link'
import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'

export default async function HomePage() {
  const session = await auth()
  if (session) redirect('/dashboard')

  return (
    <main style={{ minHeight: '100vh', background: '#fff' }}>
      {/* Top red stripe */}
      <div style={{ height: 3, background: '#E2001A' }} />

      {/* Nav */}
      <nav style={{ borderBottom: '1px solid #E6E6E6', background: '#fff' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 24px', height: 56, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ width: 18, height: 18, background: '#E2001A', borderRadius: 1 }} />
            <span style={{ fontFamily: 'IBM Plex Sans', fontWeight: 600, fontSize: 15, color: '#111', letterSpacing: '-0.02em' }}>PitchPad</span>
            <span style={{ fontSize: 12, color: '#CCC', marginLeft: 4 }}>by Lenovo Innovation Labs</span>
          </div>
          <div style={{ display: 'flex', gap: 10 }}>
            <Link href="/auth/login" className="lv-btn lv-btn-ghost lv-btn-sm">Sign in</Link>
            <Link href="/auth/register" className="lv-btn lv-btn-primary lv-btn-sm">Get started</Link>
          </div>
        </div>
      </nav>

      {/* Hero — split layout like lenovo.com promo banners */}
      <section style={{ background: '#F8F8F8', borderBottom: '1px solid #E6E6E6' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', padding: '80px 24px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 60, alignItems: 'center' }}>
          <div className="anim-fade-up">
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '4px 12px', background: '#FFF0F2', borderRadius: 2, marginBottom: 24 }}>
              <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#E2001A' }} />
              <span style={{ fontSize: 11, fontWeight: 500, color: '#E2001A', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Innovation Accelerator</span>
            </div>
            <h1 style={{ fontSize: 44, fontWeight: 300, color: '#111', lineHeight: 1.15, letterSpacing: '-0.03em', marginBottom: 20 }}>
              From idea to<br /><strong style={{ fontWeight: 600, color: '#E2001A' }}>investor pitch</strong><br />in minutes.
            </h1>
            <p style={{ fontSize: 15, color: '#666', lineHeight: 1.7, marginBottom: 32, maxWidth: 440 }}>
              Submit your innovation. Get structured reviewer feedback with rubric scoring. Let AI generate your pitch deck. Then practice aloud with Whisper coaching.
            </p>
            <div style={{ display: 'flex', gap: 12 }}>
              <Link href="/auth/register" className="lv-btn lv-btn-primary" style={{ padding: '12px 28px', fontSize: 14 }}>Submit your first idea →</Link>
              <Link href="/auth/login" className="lv-btn lv-btn-outline" style={{ padding: '12px 28px', fontSize: 14 }}>Reviewer login</Link>
            </div>
          </div>

          {/* Flow diagram */}
          <div className="anim-fade-up anim-stagger-2" style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
            {[
              { n: '01', label: 'Submit Idea',     desc: '6-step guided form',         color: '#E2001A' },
              { n: '02', label: 'Get Feedback',    desc: 'Rubric scoring from reviewers', color: '#FF8800' },
              { n: '03', label: 'AI Pitch Deck',   desc: 'Claude generates 8 slides',  color: '#0066CC' },
              { n: '04', label: 'Voice Practice',  desc: 'Whisper + AI coaching',      color: '#00875A' },
            ].map((step, i) => (
              <div key={step.n} style={{ display: 'flex', gap: 0 }}>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                  <div style={{ width: 36, height: 36, borderRadius: 2, background: step.color, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <span style={{ fontFamily: 'IBM Plex Mono', fontSize: 11, color: '#fff', fontWeight: 500 }}>{step.n}</span>
                  </div>
                  {i < 3 && <div style={{ width: 1, height: 24, background: '#E6E6E6' }} />}
                </div>
                <div style={{ padding: '6px 16px 28px' }}>
                  <p style={{ fontSize: 14, fontWeight: 500, color: '#111', margin: 0 }}>{step.label}</p>
                  <p style={{ fontSize: 12, color: '#999', margin: '2px 0 0' }}>{step.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Feature tiles — Lenovo product grid style */}
      <section style={{ maxWidth: 1200, margin: '0 auto', padding: '64px 24px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
          {[
            { icon: '◈', title: 'Creator & Reviewer Roles', desc: 'Two-role system — creators develop ideas, reviewers score on 4 dimensions with public/private/anonymous modes.' },
            { icon: '◉', title: 'Grok Rubric Scoring',      desc: 'Structured feedback with Clarity, Market Fit, Innovation, and Execution scores plus written coaching notes.' },
            { icon: '◎', title: 'Whisper Voice Coach',      desc: 'Record your pitch. Whisper transcribes live. AI scores pacing, filler words, clarity, and keyword match.' },
          ].map(f => (
            <div key={f.title} className="lv-card" style={{ padding: 28 }}>
              <div style={{ fontSize: 22, color: '#E2001A', marginBottom: 12 }}>{f.icon}</div>
              <div style={{ width: 32, height: 2, background: '#E2001A', marginBottom: 14 }} />
              <h3 style={{ fontSize: 15, fontWeight: 500, color: '#111', marginBottom: 8 }}>{f.title}</h3>
              <p style={{ fontSize: 13, color: '#666', lineHeight: 1.65 }}>{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer style={{ borderTop: '1px solid #E6E6E6', padding: '20px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', maxWidth: 1200, margin: '0 auto' }}>
        <span style={{ fontSize: 12, color: '#CCC' }}>© 2025 Lenovo Innovation Labs</span>
        <span style={{ fontSize: 11, color: '#E6E6E6', fontFamily: 'IBM Plex Mono' }}>PitchPad v2.0</span>
      </footer>
    </main>
  )
}
