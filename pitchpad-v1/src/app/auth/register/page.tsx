// src/app/auth/register/page.tsx
'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { api } from '@/lib/api'

export default function RegisterPage() {
  const router = useRouter()
  const [email, setEmail]       = useState('')
  const [password, setPassword] = useState('')
  const [error, setError]       = useState('')
  const [loading, setLoading]   = useState(false)

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(''); setLoading(true)
    try {
      await api.auth.signup(email, password)
      // Auto login after signup
      await api.auth.login(email, password)
      router.push('/dashboard')
    } catch (err: any) {
      setError(err.message ?? 'Registration failed')
    } finally { setLoading(false) }
  }

  return (
    <div style={{ minHeight: '100vh', background: '#F8F8F8', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
      <div style={{ width: '100%', maxWidth: 400 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 32, justifyContent: 'center' }}>
          <div style={{ width: 20, height: 20, background: '#E2001A', borderRadius: 1 }} />
          <span style={{ fontFamily: 'IBM Plex Sans', fontWeight: 600, fontSize: 16, color: '#111' }}>PitchPad</span>
        </div>

        <div className="lv-card" style={{ padding: 36 }}>
          <div style={{ width: 40, height: 3, background: '#E2001A', marginBottom: 20 }} />
          <h1 style={{ fontSize: 22, fontWeight: 300, color: '#111', marginBottom: 6 }}>Create account</h1>
          <p style={{ fontSize: 13, color: '#999', marginBottom: 28 }}>Join the innovation platform</p>

          <form onSubmit={onSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
            <div>
              <label className="lv-label">Email address</label>
              <input type="email" className="lv-input" placeholder="you@example.com"
                value={email} onChange={e => setEmail(e.target.value)} required autoComplete="email" />
            </div>
            <div>
              <label className="lv-label">Password</label>
              <input type="password" className="lv-input" placeholder="Min 6 characters"
                value={password} onChange={e => setPassword(e.target.value)} required autoComplete="new-password" />
            </div>

            {error && (
              <p style={{ fontSize: 12, color: '#E2001A', fontFamily: 'IBM Plex Mono', margin: 0 }}>{error}</p>
            )}

            <button type="submit" disabled={loading} className="lv-btn lv-btn-primary"
              style={{ width: '100%', justifyContent: 'center', marginTop: 4 }}>
              {loading ? 'Creating account…' : 'Create account →'}
            </button>
          </form>

          <div style={{ borderTop: '1px solid #E6E6E6', margin: '24px 0' }} />
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, color: '#999' }}>
            <span>Have an account?</span>
            <Link href="/auth/login" style={{ color: '#E2001A', textDecoration: 'none' }}>Sign in →</Link>
          </div>
        </div>
      </div>
    </div>
  )
}
