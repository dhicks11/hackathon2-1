// src/lib/api.ts
// Central API client — all calls go to the Railway backend
// Set NEXT_PUBLIC_API_URL in .env.local to your Railway URL
// Falls back to localhost:8000 for local development

const BASE =
  process.env.NEXT_PUBLIC_API_URL ??
  'https://hackathon2-soxv-production.up.railway.app'

// ── Auth token (stored in memory + localStorage) ─────────────
let _token: string | null = null

export function setToken(token: string) {
  _token = token
  if (typeof window !== 'undefined') localStorage.setItem('tp_token', token)
}

export function getToken(): string | null {
  if (_token) return _token
  if (typeof window !== 'undefined') {
    _token = localStorage.getItem('tp_token')
  }
  return _token
}

export function clearToken() {
  _token = null
  if (typeof window !== 'undefined') localStorage.removeItem('tp_token')
}

export function getUserFromStorage(): { user_id: string; email: string; role: string } | null {
  if (typeof window === 'undefined') return null
  try {
    const raw = localStorage.getItem('tp_user')
    return raw ? JSON.parse(raw) : null
  } catch { return null }
}

export function setUser(user: { user_id: string; email: string; role: string }) {
  if (typeof window !== 'undefined') localStorage.setItem('tp_user', JSON.stringify(user))
}

export function clearUser() {
  if (typeof window !== 'undefined') localStorage.removeItem('tp_user')
}

// ── Base fetch wrapper ────────────────────────────────────────
async function call<T>(
  method: string,
  path: string,
  body?: unknown,
  isFormData = false
): Promise<T> {
  const token = getToken()
  const headers: Record<string, string> = {}

  if (token) headers['Authorization'] = `Bearer ${token}`
  if (!isFormData && body) headers['Content-Type'] = 'application/json'

  const res = await fetch(`${BASE}${path}`, {
    method,
    headers,
    body: isFormData ? (body as FormData) : body ? JSON.stringify(body) : undefined,
  })

  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: 'Request failed' }))
    throw new Error(err.detail ?? err.error ?? 'Request failed')
  }

  return res.json()
}

// ── Auth ──────────────────────────────────────────────────────
export const api = {
  auth: {
    async login(email: string, password: string) {
      const data = await call<{
        access_token: string
        user_id: string
        email: string
        role: string
      }>('POST', '/api/auth/login', { email, password })
      setToken(data.access_token)
      setUser({ user_id: data.user_id, email: data.email, role: data.role })
      return data
    },

    async signup(email: string, password: string) {
      return call<{ user_id: string; email: string }>(
        'POST', '/api/auth/signup', { email, password }
      )
    },

    logout() {
      clearToken()
      clearUser()
    },
  },

  // ── Ideas ───────────────────────────────────────────────────
  ideas: {
    list() {
      return call<any[]>('GET', '/api/ideas')
    },

    get(id: string) {
      return call<any>('GET', `/api/ideas/${id}`)
    },

    submit(idea: { user_id: string; title: string; description: string; category?: string }) {
      return call<{ idea: any; ai_evaluation: any }>('POST', '/api/ideas', idea)
    },

    generatePitch(id: string) {
      return call<{ summary: string; saved: any }>('POST', `/api/ideas/${id}/pitch`)
    },

    async practice(id: string, audioBlob: Blob) {
      const fd = new FormData()
      fd.append('audio', audioBlob, 'recording.wav')
      return call<{ transcript: string; evaluation: any }>(
        'POST', `/api/ideas/${id}/practice`, fd, true
      )
    },
  },

  // ── Feedback ─────────────────────────────────────────────────
  feedback: {
    forIdea(idea_id: string) {
      return call<any[]>('GET', `/api/feedback/${idea_id}`)
    },

    submit(fb: { idea_id: string; reviewer_id: string; content: string; role?: string }) {
      return call<any>('POST', '/api/feedback', fb)
    },
  },

  // ── Metrics ──────────────────────────────────────────────────
  metrics: {
    get() {
      return call<{
        total_ideas: number
        total_feedback: number
        pitch_attempts: number
        avg_idea_score: number
        promising_ideas: number
      }>('GET', '/api/metrics')
    },
  },

  // ── Chat / AI ────────────────────────────────────────────────
  chat: {
    ask(question: string, context = '') {
      return call<{ answer: string }>('POST', '/api/chat', { question, context })
    },
  },
}
