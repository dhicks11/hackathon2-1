// src/app/api/feedback/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { getSupabaseServerClient } from '@/lib/supabase'
import { createAlert } from '@/lib/alerts'
import { z } from 'zod'

const schema = z.object({
  ideaId:           z.string(),
  content:          z.string().min(10),
  visibility:       z.enum(['PRIVATE', 'TEAM', 'PUBLIC']),
  isAnonymous:      z.boolean().default(false),
  scoreclarity:     z.number().min(1).max(5).optional(),
  scoreMarket:      z.number().min(1).max(5).optional(),
  scoreInnovation:  z.number().min(1).max(5).optional(),
  scoreExecution:   z.number().min(1).max(5).optional(),
})

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (session.user.role !== 'REVIEWER' && session.user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Only reviewers can submit feedback' }, { status: 403 })
  }

  const body = await req.json()
  const parsed = schema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })

  const sb = getSupabaseServerClient()

  // Verify idea exists
  const { data: ideaData } = await sb.from('ideas').select('*').eq('id', parsed.data.ideaId).single()
  const idea = ideaData as { id: string; status: string; author_id: string; title: string } | null
  if (!idea) return NextResponse.json({ error: 'Idea not found' }, { status: 404 })
  if (idea.status === 'DRAFT') return NextResponse.json({ error: 'Cannot review a draft' }, { status: 400 })

  // Insert feedback
  // @ts-ignore - feedbacks table not in generated types
  const { data: feedback, error } = await sb.from('feedbacks').insert({
    id: crypto.randomUUID(),
    idea_id: parsed.data.ideaId,
    reviewer_id: session.user.id,
    content: parsed.data.content,
    visibility: parsed.data.visibility,
    is_anonymous: parsed.data.isAnonymous,
    score_clarity: parsed.data.scoreclarity ?? null,
    score_market: parsed.data.scoreMarket ?? null,
    score_innovation: parsed.data.scoreInnovation ?? null,
    score_execution: parsed.data.scoreExecution ?? null,
  }).select().single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Update idea status
  if (idea.status === 'SUBMITTED') {
    // @ts-ignore - ideas table not in generated types
    await sb.from('ideas').update({ status: 'IN_REVIEW' }).eq('id', idea.id)
  }

  // Notify the idea author
  const reviewerName = parsed.data.isAnonymous ? 'A reviewer' : (session.user.name ?? 'A reviewer')
  await createAlert({
    userId: idea.author_id,
    type: 'FEEDBACK_RECEIVED',
    title: 'New feedback on your idea',
    message: `${reviewerName} left feedback on "${idea.title}"`,
    ideaId: idea.id,
  })

  return NextResponse.json({ data: feedback }, { status: 201 })
}
