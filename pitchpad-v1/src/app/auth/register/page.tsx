// src/app/auth/register/page.tsx
'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { signIn } from 'next-auth/react'

export default function RegisterPage() {
  const router = useRouter()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [focusedField, setFocusedField] = useState<string | null>(null)

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: name || email.split('@')[0], email, password, role: 'CREATOR' }),
      })

      if (!res.ok) {
        const data = await res.json()
        const fieldErrors = data?.error?.fieldErrors
        const message = fieldErrors
          ? Object.values(fieldErrors).flat().filter(Boolean).join(' ')
          : data.error
        throw new Error(message || 'Registration failed')
      }

      const result = await signIn('credentials', {
        email,
        password,
        redirect: false,
      })

      if (result?.error) {
        setError('Account created but login failed. Please try logging in.')
      } else {
        router.push('/dashboard')
      }
    } catch (err: any) {
      setError(err.message ?? 'Registration failed')
    } finally {
      setLoading(false)
    }
  }

  const inputStyle = (field: string, hasValue: boolean) => ({
    width: '100%',
    padding: '16px 0 8px',
    background: 'transparent',
    border: 'none',
    borderBottom: `2px solid ${focusedField === field ? '#E2001A' : hasValue ? '#333' : '#E6E6E6'}`,
    outline: 'none',
    fontSize: 15,
    color: '#111',
    transition: 'border-color 0.2s ease',
  })

  const labelStyle = (field: string, hasValue: boolean) => ({
    position: 'absolute' as const,
    left: 0,
    top: focusedField === field || hasValue ? 0 : 16,
    fontSize: focusedField === field || hasValue ? 11 : 14,
    color: focusedField === field ? '#E2001A' : '#999',
    fontWeight: focusedField === field || hasValue ? 500 : 400,
    transition: 'all 0.2s ease',
    pointerEvents: 'none' as const,
    textTransform: focusedField === field || hasValue ? 'uppercase' as const : 'none' as const,
    letterSpacing: focusedField === field || hasValue ? '0.05em' : 0,
  })

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #FAFAFA 0%, #F0F0F0 100%)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: 24,
    }}>
      <div style={{ width: '100%', maxWidth: 420 }}>
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: 40 }}>
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 10,
            marginBottom: 24,
          }}>
            <div style={{
              width: 28,
              height: 28,
              background: '#E2001A',
              borderRadius: 2,
              boxShadow: '0 4px 12px rgba(226, 0, 26, 0.3)',
            }} />
            <span style={{
              fontFamily: 'IBM Plex Sans',
              fontWeight: 600,
              fontSize: 20,
              color: '#111',
              letterSpacing: '-0.02em',
            }}>
              PitchPad
            </span>
          </div>
          <h1 style={{
            fontSize: 28,
            fontWeight: 300,
            color: '#111',
            marginBottom: 8,
            letterSpacing: '-0.02em',
          }}>
            Join the platform
          </h1>
          <p style={{ fontSize: 14, color: '#666' }}>
            Start sharing your innovative ideas
          </p>
        </div>

        {/* Main Card */}
        <div style={{
          background: '#fff',
          borderRadius: 16,
          padding: '40px 36px',
          boxShadow: '0 4px 24px rgba(0,0,0,0.06)',
        }}>
          {/* Form */}
          <form onSubmit={onSubmit}>
            {/* Name Field */}
            <div style={{ position: 'relative', marginBottom: 24 }}>
              <label style={labelStyle('name', !!name)}>Full Name</label>
              <input
                type="text"
                value={name}
                onChange={e => setName(e.target.value)}
                onFocus={() => setFocusedField('name')}
                onBlur={() => setFocusedField(null)}
                style={inputStyle('name', !!name)}
                autoComplete="name"
              />
            </div>

            {/* Email Field */}
            <div style={{ position: 'relative', marginBottom: 24 }}>
              <label style={labelStyle('email', !!email)}>Email Address</label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                onFocus={() => setFocusedField('email')}
                onBlur={() => setFocusedField(null)}
                style={inputStyle('email', !!email)}
                required
                autoComplete="email"
              />
            </div>

            {/* Password Field */}
            <div style={{ position: 'relative', marginBottom: 8 }}>
              <label style={labelStyle('password', !!password)}>Password</label>
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                onFocus={() => setFocusedField('password')}
                onBlur={() => setFocusedField(null)}
                style={inputStyle('password', !!password)}
                required
                minLength={8}
                autoComplete="new-password"
              />
            </div>
            <p style={{ fontSize: 11, color: '#999', marginBottom: 24 }}>
              Minimum 8 characters
            </p>

            {/* Error */}
            {error && (
              <div style={{
                padding: '12px 16px',
                background: 'linear-gradient(135deg, #FFF5F5 0%, #FFF0F2 100%)',
                borderRadius: 8,
                fontSize: 13,
                color: '#D32F2F',
                marginBottom: 20,
                borderLeft: '3px solid #E2001A',
              }}>
                {error}
              </div>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              style={{
                width: '100%',
                padding: '16px 24px',
                background: loading ? '#F5A5A5' : '#E2001A',
                border: 'none',
                borderRadius: 10,
                color: '#fff',
                fontSize: 14,
                fontWeight: 600,
                cursor: loading ? 'not-allowed' : 'pointer',
                transition: 'all 0.2s ease',
                boxShadow: loading ? 'none' : '0 4px 16px rgba(226, 0, 26, 0.3)',
              }}
              onMouseOver={e => { if (!loading) e.currentTarget.style.transform = 'translateY(-1px)' }}
              onMouseOut={e => { e.currentTarget.style.transform = 'translateY(0)' }}
            >
              {loading ? 'Creating account...' : 'Create Account'}
            </button>
          </form>

          {/* Terms */}
          <p style={{
            fontSize: 11,
            color: '#999',
            textAlign: 'center',
            marginTop: 20,
            lineHeight: 1.6,
          }}>
            By signing up, you agree to our{' '}
            <a href="#" style={{ color: '#666' }}>Terms</a> and{' '}
            <a href="#" style={{ color: '#666' }}>Privacy Policy</a>
          </p>
        </div>

        {/* Sign In Link */}
        <div style={{
          textAlign: 'center',
          marginTop: 24,
          padding: '16px',
          background: 'rgba(255,255,255,0.6)',
          borderRadius: 12,
        }}>
          <span style={{ fontSize: 14, color: '#666' }}>Already have an account? </span>
          <Link
            href="/auth/login"
            style={{
              color: '#E2001A',
              textDecoration: 'none',
              fontWeight: 600,
              fontSize: 14,
            }}
          >
            Sign in
          </Link>
        </div>

        {/* Footer */}
        <p style={{
          textAlign: 'center',
          fontSize: 11,
          color: '#BBB',
          marginTop: 24,
        }}>
          Lenovo Innovation Labs
        </p>
      </div>
    </div>
  )
}
