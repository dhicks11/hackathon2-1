// src/app/auth/login/page.tsx
'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { signIn } from 'next-auth/react'
import { api } from '@/lib/api'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail]       = useState('')
  const [password, setPassword] = useState('')
  const [error, setError]       = useState('')
  const [loading, setLoading]   = useState(false)

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(''); setLoading(true)
    try {
      await api.auth.login(email, password)
      router.push('/dashboard')
    } catch (err: any) {
      setError(err.message ?? 'Invalid email or password')
    } finally { setLoading(false) }
  }

  return (
    <div style={{ minHeight: '100vh', background: '#F8F8F8', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
      <div style={{ width: '100%', maxWidth: 400 }}>
        {/* Logo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 32, justifyContent: 'center' }}>
          <div style={{ width: 20, height: 20, background: '#E2001A', borderRadius: 1 }} />
          <span style={{ fontFamily: 'IBM Plex Sans', fontWeight: 600, fontSize: 16, color: '#111', letterSpacing: '-0.02em' }}>PitchPad</span>
        </div>

        <div className="lv-card" style={{ padding: 36 }}>
          <div style={{ width: 40, height: 3, background: '#E2001A', marginBottom: 20 }} />
          <h1 style={{ fontSize: 22, fontWeight: 300, color: '#111', marginBottom: 6 }}>Welcome back</h1>
          <p style={{ fontSize: 13, color: '#999', marginBottom: 28 }}>Sign in to your workspace</p>

          <form onSubmit={onSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
            <div>
              <label className="lv-label">Email address</label>
              <input type="email" className="lv-input" placeholder="you@example.com"
                value={email} onChange={e => setEmail(e.target.value)} required autoComplete="email" />
            </div>
            <div>
              <label className="lv-label">Password</label>
              <input type="password" className="lv-input" placeholder="••••••••"
                value={password} onChange={e => setPassword(e.target.value)} required autoComplete="current-password" />
            </div>

            {error && (
              <p style={{ fontSize: 12, color: '#E2001A', fontFamily: 'IBM Plex Mono', margin: 0 }}>{error}</p>
            )}

            <button type="submit" disabled={loading} className="lv-btn lv-btn-primary"
              style={{ width: '100%', justifyContent: 'center', marginTop: 4 }}>
              {loading ? 'Signing in…' : 'Sign in →'}
            </button>
          </form>

          <div style={{ display: 'flex', alignItems: 'center', gap: 12, margin: '24px 0' }}>
            <div style={{ flex: 1, height: 1, background: '#E6E6E6' }} />
            <span style={{ fontSize: 11, color: '#999', textTransform: 'uppercase', letterSpacing: '0.05em' }}>or</span>
            <div style={{ flex: 1, height: 1, background: '#E6E6E6' }} />
          </div>

          <button
            type="button"
            onClick={() => signIn('microsoft-entra-id', { callbackUrl: '/dashboard' })}
            className="lv-btn"
            style={{
              width: '100%',
              justifyContent: 'center',
              background: '#fff',
              border: '1px solid #E6E6E6',
              color: '#333',
              gap: 10,
            }}
          >
            <svg width="18" height="18" viewBox="0 0 21 21" fill="none">
              <rect x="1" y="1" width="9" height="9" fill="#F25022"/>
              <rect x="11" y="1" width="9" height="9" fill="#7FBA00"/>
              <rect x="1" y="11" width="9" height="9" fill="#00A4EF"/>
              <rect x="11" y="11" width="9" height="9" fill="#FFB900"/>
            </svg>
            Sign in with Microsoft
          </button>

          <div style={{ borderTop: '1px solid #E6E6E6', margin: '24px 0' }} />
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, color: '#999' }}>
            <span>No account?</span>
            <Link href="/auth/register" style={{ color: '#E2001A', textDecoration: 'none' }}>Register →</Link>
          </div>
        </div>
        <p style={{ textAlign: 'center', fontSize: 11, color: '#CCC', marginTop: 20 }}>Lenovo Innovation Labs · PitchPad</p>
      </div>
    </div>
  )
}
