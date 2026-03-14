// GET /api/ideas/:id — single idea with scores + feedback
import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { getSupabaseServerClient } from '@/lib/supabase'

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const sb = getSupabaseServerClient()

  const { data: ideaData, error } = await sb
    .from('ideas')
    .select(`
      *,
      feedbacks (
        id, content, visibility, is_anonymous,
        score_clarity, score_market, score_innovation, score_execution,
        created_at, reviewer_id
      ),
      pitch_decks (
        id, slides, version, created_at
      )
    `)
    .eq('id', params.id)
    .single()

  const idea = ideaData as any

  if (error || !idea) {
    return NextResponse.json({ error: 'Idea not found' }, { status: 404 })
  }

  // Compute aggregate pitch score from feedback
  const scores = (idea.feedbacks ?? []).flatMap((f: any) =>
    [f.score_clarity, f.score_market, f.score_innovation, f.score_execution].filter(Boolean)
  )
  const pitchScore = scores.length
    ? Math.round((scores.reduce((a: number, b: number) => a + b, 0) / scores.length) * 20) // convert 1-5 → 0-100
    : null

  return NextResponse.json({
    data: {
      ...idea,
      pitchScore,
      feedbackCount: idea.feedbacks?.length ?? 0,
    }
  })
}
