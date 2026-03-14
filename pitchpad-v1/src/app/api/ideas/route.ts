// src/app/api/ideas/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { getSupabaseServerClient } from '@/lib/supabase'
import { z } from 'zod'

const createSchema = z.object({
  title:      z.string().min(5).max(120),
  problem:    z.string().min(10),
  solution:   z.string().min(10),
  market:     z.string().min(10),
  ask:        z.string().optional(),
  tags:       z.array(z.string()).optional().default([]),
  visibility: z.enum(['PRIVATE', 'TEAM', 'PUBLIC']),
  status:     z.enum(['DRAFT', 'SUBMITTED']).default('DRAFT'),
})

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (session.user.role === 'REVIEWER') {
    return NextResponse.json({ error: 'Reviewers cannot submit ideas' }, { status: 403 })
  }

  const body = await req.json()
  const parsed = createSchema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })

  const sb = getSupabaseServerClient()
  const { data, error } = await sb.from('ideas').insert({
    id: crypto.randomUUID(),
    author_id: session.user.id,
    ...parsed.data,
    ask: parsed.data.ask ?? null,
    pitch_score: null,
  }).select().single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ data }, { status: 201 })
}

export async function GET(req: NextRequest) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const mine = searchParams.get('mine') === 'true'
  const sb = getSupabaseServerClient()

  let query = sb.from('ideas').select('id, title, status, visibility, tags, created_at, updated_at, author_id')

  if (mine || session.user.role === 'CREATOR') {
    query = query.eq('author_id', session.user.id)
  }
  if (session.user.role === 'REVIEWER') {
    query = query.in('status', ['SUBMITTED', 'IN_REVIEW']).in('visibility', ['TEAM', 'PUBLIC'])
  }

  const { data, error } = await query.order('updated_at', { ascending: false })
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ data })
}
