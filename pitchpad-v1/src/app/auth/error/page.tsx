// src/app/auth/error/page.tsx
'use client'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'

const errorMessages: Record<string, { title: string; message: string }> = {
  Configuration: {
    title: 'Server Configuration Error',
    message: 'There is a problem with the server configuration. Please contact support.',
  },
  AccessDenied: {
    title: 'Access Denied',
    message: 'You do not have permission to access this resource.',
  },
  Verification: {
    title: 'Verification Error',
    message: 'The verification link may have expired or already been used.',
  },
  OAuthSignin: {
    title: 'SSO Sign-in Error',
    message: 'Could not start the SSO sign-in process. Please try again.',
  },
  OAuthCallback: {
    title: 'SSO Callback Error',
    message: 'There was a problem completing the SSO sign-in. Please try again.',
  },
  OAuthCreateAccount: {
    title: 'Account Creation Error',
    message: 'Could not create your account using SSO. The email may already be registered.',
  },
  EmailCreateAccount: {
    title: 'Account Creation Error',
    message: 'Could not create your account. Please try a different email address.',
  },
  Callback: {
    title: 'Authentication Error',
    message: 'There was a problem during authentication. Please try again.',
  },
  OAuthAccountNotLinked: {
    title: 'Account Not Linked',
    message: 'This email is already associated with another sign-in method. Please use your original sign-in method.',
  },
  EmailSignin: {
    title: 'Email Sign-in Error',
    message: 'The email sign-in link may have expired. Please request a new one.',
  },
  CredentialsSignin: {
    title: 'Sign-in Failed',
    message: 'Invalid email or password. Please check your credentials and try again.',
  },
  SessionRequired: {
    title: 'Session Required',
    message: 'You must be signed in to access this page.',
  },
  Default: {
    title: 'Authentication Error',
    message: 'An unexpected error occurred during authentication. Please try again.',
  },
}

export default function AuthErrorPage() {
  const searchParams = useSearchParams()
  const errorType = searchParams.get('error') || 'Default'
  const errorInfo = errorMessages[errorType] || errorMessages.Default

  return (
    <div style={{ minHeight: '100vh', background: '#F8F8F8', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
      <div style={{ width: '100%', maxWidth: 400 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 32, justifyContent: 'center' }}>
          <div style={{ width: 20, height: 20, background: '#E2001A', borderRadius: 1 }} />
          <span style={{ fontFamily: 'IBM Plex Sans', fontWeight: 600, fontSize: 16, color: '#111' }}>PitchPad</span>
        </div>

        <div className="lv-card" style={{ padding: 36, textAlign: 'center' }}>
          {/* Error Icon */}
          <div style={{
            width: 56,
            height: 56,
            borderRadius: '50%',
            background: '#FFF0F2',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 20px',
          }}>
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#E2001A" strokeWidth="1.5">
              <circle cx="12" cy="12" r="10"/>
              <line x1="12" y1="8" x2="12" y2="12"/>
              <line x1="12" y1="16" x2="12.01" y2="16"/>
            </svg>
          </div>

          <h1 style={{ fontSize: 20, fontWeight: 500, color: '#111', marginBottom: 8 }}>
            {errorInfo.title}
          </h1>
          <p style={{ fontSize: 13, color: '#666', marginBottom: 24, lineHeight: 1.5 }}>
            {errorInfo.message}
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <Link
              href="/auth/login"
              className="lv-btn lv-btn-primary"
              style={{ width: '100%', justifyContent: 'center', textDecoration: 'none' }}
            >
              Try Again
            </Link>
            <Link
              href="/"
              className="lv-btn"
              style={{ width: '100%', justifyContent: 'center', textDecoration: 'none', background: '#F8F8F8', color: '#666' }}
            >
              Go to Homepage
            </Link>
          </div>

          {errorType !== 'Default' && (
            <p style={{ fontSize: 11, color: '#999', marginTop: 20 }}>
              Error code: {errorType}
            </p>
          )}
        </div>

        <p style={{ textAlign: 'center', fontSize: 11, color: '#CCC', marginTop: 20 }}>
          Need help? <a href="mailto:support@pitchpad.io" style={{ color: '#999' }}>Contact support</a>
        </p>
      </div>
    </div>
  )
}
