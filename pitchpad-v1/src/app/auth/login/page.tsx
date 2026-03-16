// src/app/auth/login/page.tsx
'use client'
import { useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { signIn } from 'next-auth/react'

export default function LoginPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const callbackUrl = searchParams.get('callbackUrl') || '/dashboard'
  const errorParam = searchParams.get('error')

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState(errorParam ? 'Authentication failed. Please try again.' : '')
  const [loading, setLoading] = useState(false)
  const [ssoLoading, setSsoLoading] = useState<string | null>(null)

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const result = await signIn('credentials', {
        email,
        password,
        redirect: false,
      })

      if (result?.error) {
        setError('Invalid email or password')
      } else {
        router.push(callbackUrl)
      }
    } catch (err: any) {
      setError(err.message ?? 'Invalid email or password')
    } finally {
      setLoading(false)
    }
  }

  async function handleSSOSignIn(provider: 'microsoft-entra-id' | 'google') {
    setSsoLoading(provider)
    try {
      await signIn(provider, { callbackUrl })
    } catch (err) {
      setError('SSO sign-in failed. Please try again.')
      setSsoLoading(null)
    }
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
          <p style={{ fontSize: 13, color: '#999', marginBottom: 24 }}>Sign in to your workspace</p>

          {/* SSO Buttons */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 24 }}>
            <button
              onClick={() => handleSSOSignIn('microsoft-entra-id')}
              disabled={ssoLoading !== null}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 10,
                width: '100%',
                padding: '12px 16px',
                background: '#fff',
                border: '1px solid #E6E6E6',
                borderRadius: 4,
                cursor: ssoLoading ? 'not-allowed' : 'pointer',
                fontSize: 13,
                fontWeight: 500,
                color: '#333',
                transition: 'all 0.15s',
              }}
              className="sso-btn"
            >
              {ssoLoading === 'microsoft-entra-id' ? (
                <span>Connecting...</span>
              ) : (
                <>
                  <svg width="18" height="18" viewBox="0 0 21 21" fill="none">
                    <path d="M10 0H0v10h10V0z" fill="#F25022"/>
                    <path d="M21 0H11v10h10V0z" fill="#7FBA00"/>
                    <path d="M10 11H0v10h10V11z" fill="#00A4EF"/>
                    <path d="M21 11H11v10h10V11z" fill="#FFB900"/>
                  </svg>
                  Continue with Microsoft
                </>
              )}
            </button>

            <button
              onClick={() => handleSSOSignIn('google')}
              disabled={ssoLoading !== null}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 10,
                width: '100%',
                padding: '12px 16px',
                background: '#fff',
                border: '1px solid #E6E6E6',
                borderRadius: 4,
                cursor: ssoLoading ? 'not-allowed' : 'pointer',
                fontSize: 13,
                fontWeight: 500,
                color: '#333',
                transition: 'all 0.15s',
              }}
              className="sso-btn"
            >
              {ssoLoading === 'google' ? (
                <span>Connecting...</span>
              ) : (
                <>
                  <svg width="18" height="18" viewBox="0 0 24 24">
                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                  </svg>
                  Continue with Google
                </>
              )}
            </button>
          </div>

          {/* Divider */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 24 }}>
            <div style={{ flex: 1, height: 1, background: '#E6E6E6' }} />
            <span style={{ fontSize: 11, color: '#999', textTransform: 'uppercase', letterSpacing: '0.05em' }}>or</span>
            <div style={{ flex: 1, height: 1, background: '#E6E6E6' }} />
          </div>

          {/* Email/Password Form */}
          <form onSubmit={onSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div>
              <label className="lv-label">Email address</label>
              <input
                type="email"
                className="lv-input"
                placeholder="you@example.com"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
                autoComplete="email"
              />
            </div>
            <div>
              <label className="lv-label">Password</label>
              <input
                type="password"
                className="lv-input"
                placeholder="Enter your password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
                autoComplete="current-password"
              />
            </div>

            {error && (
              <div style={{
                padding: '10px 12px',
                background: '#FFF0F2',
                borderRadius: 4,
                fontSize: 12,
                color: '#E2001A',
              }}>
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="lv-btn lv-btn-primary"
              style={{ width: '100%', justifyContent: 'center', marginTop: 4 }}
            >
              {loading ? 'Signing in...' : 'Sign in with Email'}
            </button>
          </form>

          <div style={{ marginTop: 20, textAlign: 'center' }}>
            <Link href="/auth/forgot-password" style={{ fontSize: 12, color: '#999', textDecoration: 'none' }}>
              Forgot your password?
            </Link>
          </div>

          <div style={{ borderTop: '1px solid #E6E6E6', margin: '20px 0' }} />

          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, color: '#999' }}>
            <span>No account?</span>
            <Link href="/auth/register" style={{ color: '#E2001A', textDecoration: 'none' }}>Create account →</Link>
          </div>
        </div>

        <p style={{ textAlign: 'center', fontSize: 11, color: '#CCC', marginTop: 20 }}>
          Lenovo Innovation Labs · PitchPad
        </p>

        <style jsx>{`
          .sso-btn:hover:not(:disabled) {
            background: #F8F8F8 !important;
            border-color: #CCC !important;
          }
        `}</style>
      </div>
    </div>
  )
}
