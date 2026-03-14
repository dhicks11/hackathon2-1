# PitchPad v2.0 — Lenovo Innovation Platform

> Lenovo.com design language · Next.js 14 · Supabase JS Client · IBM Plex · 5 core screens

---

## Tech Stack

| Layer          | Technology                                  |
|----------------|---------------------------------------------|
| Framework      | Next.js 14 (App Router, Server Components)  |
| Hosting        | Vercel                                      |
| Database       | Supabase (Postgres)                         |
| Realtime       | Supabase Realtime (alerts channel)          |
| Auth           | NextAuth v5 (credentials) + Prisma adapter  |
| AI — text      | Anthropic Claude (claude-sonnet-4-20250514) |
| AI — voice     | OpenAI Whisper API                          |
| Voice capture  | Browser MediaRecorder API                   |
| Styling        | Tailwind CSS + IBM Plex fonts               |
| Export         | pptxgenjs (PowerPoint)                      |

---

## 5 Core Screens

| # | Screen          | Route            | Description                                      |
|---|-----------------|------------------|--------------------------------------------------|
| 1 | Login / Auth    | `/auth/login`    | Credentials sign-in, Lenovo.com light card UI    |
| 2 | Dashboard       | `/dashboard`     | Stats, recent ideas table, quick actions         |
| 3 | Data Viz        | `/viz`           | Bar chart, radar chart, pipeline distribution    |
| 4 | AI Assistant    | `/ai-assistant`  | Claude-powered pitch coaching chat               |
| 5 | Alerts          | `/alerts`        | Realtime notifications, read/unread management   |

### Additional screens
- `/ideas` — Idea list (creator)
- `/ideas/new` — 6-step idea submission wizard
- `/ideas/[id]` — Idea detail + feedback panel + deck generator
- `/review` — Reviewer queue
- `/practice` — Voice practice (MediaRecorder + Whisper + Claude coaching)
- `/export` — Pitch deck generator + .pptx export + share link

---

## Frontend Data Flow

```
Creator                              Reviewer
  │                                     │
  ├── /ideas/new                        ├── /review
  │   6-step form → POST /api/ideas     │   Supabase query → idea list
  │                                     │
  ├── /ideas/[id]                       ├── /ideas/[id]
  │   Server component → Supabase       │   POST /api/feedback
  │   PitchDeckGenerator client         │   → createAlert(FEEDBACK_RECEIVED)
  │   → POST /api/pitch-deck            │
  │   → Claude API                      │
  │   → pptxgenjs export                │
  │                                     │
  ├── /practice                         │
  │   MediaRecorder (browser)           │
  │   → POST /api/voice/analyze         │
  │   → OpenAI Whisper transcription    │
  │   → Claude coaching feedback        │
  │   → Supabase save session           │
  │                                     │
  ├── /viz                              │
  │   Supabase JS client (browser)      │
  │   → inline SVG charts               │
  │                                     │
  ├── /ai-assistant                     │
  │   POST /api/ai-assistant            │
  │   → Supabase context fetch          │
  │   → Claude streaming response       │
  │                                     │
  └── /alerts ←─── Supabase Realtime ──┘
      supabase.channel('alerts-rt')
      postgres_changes INSERT → live toast
```

---

## Quick Start

### 1. Install
```bash
unzip pitchpad-lenovo.zip && cd pitchpad-lenovo
npm install
```

### 2. Configure env
```bash
cp .env.example .env.local
# Fill in: NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY,
#          SUPABASE_SERVICE_ROLE_KEY, DATABASE_URL, AUTH_SECRET,
#          ANTHROPIC_API_KEY, OPENAI_API_KEY
```

### 3. Database setup
Option A — Supabase SQL editor (recommended):
- Open Supabase → SQL Editor → paste `supabase/migrations/001_initial.sql`

Option B — Prisma:
```bash
npx prisma db push
npx prisma generate
```

Option C — Supabase CLI:
```bash
npx supabase db push
```

### 4. Generate Supabase types (optional but recommended)
```bash
npm run supabase:types
```

### 5. Run
```bash
npm run dev  # → http://localhost:3000
```

---

## Design System — Lenovo.com Faithful

Tokens in `tailwind.config.ts` and `globals.css`:

| Token         | Value     | Usage                          |
|---------------|-----------|--------------------------------|
| `lv-red`      | `#E2001A` | CTAs, accents, badges          |
| `lv-red-hover`| `#B5001A` | Button hover state             |
| `lv-red-light`| `#FFF0F2` | Soft red backgrounds           |
| `lv-50`       | `#F8F8F8` | Page background                |
| `lv-100`      | `#F2F2F2` | Hover states                   |
| `lv-200`      | `#E6E6E6` | Borders                        |
| `lv-300`      | `#CCCCCC` | Input borders                  |
| `lv-500`      | `#666666` | Secondary text, labels         |
| `lv-700`      | `#333333` | Body text                      |
| `lv-900`      | `#111111` | Headings                       |
| `lv-green`    | `#00875A` | Success states                 |
| `lv-amber`    | `#FF8800` | Warning, in-progress           |
| `lv-blue`     | `#0066CC` | Info, reviewer role            |

Key classes:
- `.lv-card` / `.lv-card-hover` — white card with shadow
- `.lv-btn-primary` / `-outline` / `-ghost` — button variants
- `.lv-input` / `.lv-label` — form elements  
- `.lv-badge` — status chip (2px radius)
- `.lv-nav-item` — top nav link with red underline active state
- `.lv-metric` / `.lv-metric-value` — stat display cards
- `.lv-progress-track` / `.lv-progress-fill` — progress bars

---

## Project Structure

```
src/
├── app/
│   ├── page.tsx                    # Landing (Lenovo promo style)
│   ├── auth/login/                 # Screen 1: Login
│   ├── auth/register/              # Registration with role picker
│   ├── dashboard/                  # Screen 2: Dashboard
│   ├── viz/                        # Screen 3: Data visualization
│   ├── ai-assistant/               # Screen 4: AI chat (Claude)
│   ├── alerts/                     # Screen 5: Notifications (Supabase Realtime)
│   ├── ideas/                      # Idea list + detail + submission
│   ├── review/                     # Reviewer queue
│   ├── practice/                   # Voice practice (MediaRecorder)
│   ├── export/                     # Pitch deck export
│   └── api/
│       ├── auth/[...nextauth]/     # NextAuth handler
│       ├── auth/register/          # User registration
│       ├── ideas/                  # Idea CRUD (Supabase)
│       ├── feedback/               # Feedback + alerts trigger
│       ├── pitch-deck/             # Claude generation
│       ├── pitch-deck/export/      # pptxgenjs export
│       ├── voice/analyze/          # Whisper + Claude coaching
│       ├── ai-assistant/           # Claude chat API
│       └── alerts/                 # Alert CRUD
├── components/
│   ├── layout/TopNav.tsx           # Lenovo.com-style nav with red stripe
│   ├── feedback/FeedbackPanel.tsx  # Reviewer form + rubric scoring
│   ├── pitch/PitchDeckGenerator.tsx
│   └── voice/
├── lib/
│   ├── auth.ts                     # NextAuth v5
│   ├── supabase.ts                 # Supabase JS client (browser + server)
│   ├── prisma.ts                   # Prisma client
│   ├── alerts.ts                   # Alert creation helper
│   └── utils.ts
├── types/
│   ├── index.ts                    # App types
│   └── supabase.ts                 # Supabase DB types (auto-generated)
└── middleware.ts                   # Route protection + role guards

supabase/
└── migrations/
    └── 001_initial.sql             # Full schema + RLS + Realtime
```

---

## Deploy to Vercel

```bash
npx vercel

# Required env vars in Vercel dashboard:
# NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY,
# SUPABASE_SERVICE_ROLE_KEY, DATABASE_URL (with pgbouncer),
# AUTH_SECRET, ANTHROPIC_API_KEY, OPENAI_API_KEY
```

**Supabase Realtime** works on Vercel with no extra config — the browser holds the WebSocket directly to Supabase, not through your API server.
