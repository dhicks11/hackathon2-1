-- ThinkPitch — Supabase initial schema
-- Run via: supabase db push  OR  paste into Supabase SQL editor

-- Enable UUID extension
create extension if not exists "pgcrypto";

-- ── Users (mirrors NextAuth User) ───────────────────────────
create table if not exists users (
  id           text primary key default gen_random_uuid()::text,
  name         text,
  email        text unique not null,
  password     text,
  role         text not null default 'CREATOR' check (role in ('CREATOR','REVIEWER','ADMIN')),
  image        text,
  created_at   timestamptz default now(),
  updated_at   timestamptz default now()
);

-- ── NextAuth tables ─────────────────────────────────────────
create table if not exists accounts (
  id                   text primary key default gen_random_uuid()::text,
  user_id              text not null references users(id) on delete cascade,
  type                 text not null,
  provider             text not null,
  provider_account_id  text not null,
  refresh_token        text,
  access_token         text,
  expires_at           int,
  token_type           text,
  scope                text,
  id_token             text,
  session_state        text,
  unique (provider, provider_account_id)
);

create table if not exists sessions (
  id            text primary key default gen_random_uuid()::text,
  session_token text unique not null,
  user_id       text not null references users(id) on delete cascade,
  expires       timestamptz not null
);

create table if not exists verification_tokens (
  identifier text not null,
  token      text unique not null,
  expires    timestamptz not null,
  primary key (identifier, token)
);

-- ── Ideas ────────────────────────────────────────────────────
create table if not exists ideas (
  id          text primary key default gen_random_uuid()::text,
  title       text not null,
  problem     text not null,
  solution    text not null,
  market      text not null,
  ask         text,
  tags        text[] default '{}',
  status      text not null default 'DRAFT' check (status in ('DRAFT','SUBMITTED','IN_REVIEW','COMPLETE')),
  visibility  text not null default 'PRIVATE' check (visibility in ('PRIVATE','TEAM','PUBLIC')),
  pitch_score int,
  author_id   text not null references users(id) on delete cascade,
  created_at  timestamptz default now(),
  updated_at  timestamptz default now()
);
create index if not exists ideas_author_idx on ideas(author_id);
create index if not exists ideas_status_idx on ideas(status);

-- ── Feedbacks ────────────────────────────────────────────────
create table if not exists feedbacks (
  id               text primary key default gen_random_uuid()::text,
  content          text not null,
  visibility       text not null default 'PRIVATE' check (visibility in ('PRIVATE','TEAM','PUBLIC')),
  is_anonymous     boolean default false,
  score_clarity    int check (score_clarity between 1 and 5),
  score_market     int check (score_market between 1 and 5),
  score_innovation int check (score_innovation between 1 and 5),
  score_execution  int check (score_execution between 1 and 5),
  idea_id          text not null references ideas(id) on delete cascade,
  reviewer_id      text not null references users(id) on delete cascade,
  created_at       timestamptz default now(),
  updated_at       timestamptz default now()
);
create index if not exists feedbacks_idea_idx on feedbacks(idea_id);

-- ── Pitch decks ──────────────────────────────────────────────
create table if not exists pitch_decks (
  id         text primary key default gen_random_uuid()::text,
  slides     jsonb not null default '[]',
  version    int not null default 1,
  idea_id    text not null references ideas(id) on delete cascade,
  created_at timestamptz default now()
);
create index if not exists pitch_decks_idea_idx on pitch_decks(idea_id);

-- ── Practice sessions ────────────────────────────────────────
create table if not exists practice_sessions (
  id            text primary key default gen_random_uuid()::text,
  transcript    text not null default '',
  duration_sec  int not null default 0,
  filler_words  int default 0,
  pacing_score  int,
  clarity_score int,
  keyword_match int,
  ai_feedback   text,
  idea_id       text not null references ideas(id) on delete cascade,
  user_id       text not null references users(id) on delete cascade,
  created_at    timestamptz default now()
);

-- ── Alerts ───────────────────────────────────────────────────
create table if not exists alerts (
  id         text primary key default gen_random_uuid()::text,
  user_id    text not null references users(id) on delete cascade,
  type       text not null check (type in ('FEEDBACK_RECEIVED','IDEA_REVIEWED','DECK_READY','SYSTEM')),
  title      text not null,
  message    text not null,
  read       boolean default false,
  idea_id    text references ideas(id) on delete set null,
  created_at timestamptz default now()
);
create index if not exists alerts_user_idx on alerts(user_id);

-- ── RLS policies ─────────────────────────────────────────────
alter table users            enable row level security;
alter table ideas            enable row level security;
alter table feedbacks        enable row level security;
alter table pitch_decks      enable row level security;
alter table practice_sessions enable row level security;
alter table alerts           enable row level security;

-- Service role bypasses RLS (used in API routes via SUPABASE_SERVICE_ROLE_KEY)
-- Anon/authenticated policies are for future Supabase Auth integration
-- For now, all DB access goes through service role in API routes

-- ── updated_at trigger ───────────────────────────────────────
create or replace function update_updated_at()
returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end; $$;

create trigger ideas_updated_at     before update on ideas     for each row execute function update_updated_at();
create trigger feedbacks_updated_at before update on feedbacks for each row execute function update_updated_at();
create trigger users_updated_at     before update on users     for each row execute function update_updated_at();

-- ── Enable Realtime on alerts table ──────────────────────────
alter publication supabase_realtime add table alerts;
