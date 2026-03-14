// GET /api/metrics — dashboard summary numbers
import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { getSupabaseServerClient } from '@/lib/supabase'

export async function GET(req: NextRequest) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const sb = getSupabaseServerClient()
  const isReviewer = session.user.role === 'REVIEWER'

  const [
    { count: totalIdeas },
    { count: submittedIdeas },
    { count: inReviewIdeas },
    { count: completeIdeas },
    { count: totalFeedback },
    { data: scoreData },
    { count: practiceSessions },
    { count: unreadAlerts },
  ] = await Promise.all([
    // Idea counts
    isReviewer
      ? sb.from('ideas').select('*', { count: 'exact', head: true })
      : sb.from('ideas').select('*', { count: 'exact', head: true }).eq('author_id', session.user.id),

    isReviewer
      ? sb.from('ideas').select('*', { count: 'exact', head: true }).eq('status', 'SUBMITTED')
      : sb.from('ideas').select('*', { count: 'exact', head: true }).eq('author_id', session.user.id).eq('status', 'SUBMITTED'),

    isReviewer
      ? sb.from('ideas').select('*', { count: 'exact', head: true }).eq('status', 'IN_REVIEW')
      : sb.from('ideas').select('*', { count: 'exact', head: true }).eq('author_id', session.user.id).eq('status', 'IN_REVIEW'),

    isReviewer
      ? sb.from('ideas').select('*', { count: 'exact', head: true }).eq('status', 'COMPLETE')
      : sb.from('ideas').select('*', { count: 'exact', head: true }).eq('author_id', session.user.id).eq('status', 'COMPLETE'),

    // Feedback count
    isReviewer
      ? sb.from('feedbacks').select('*', { count: 'exact', head: true }).eq('reviewer_id', session.user.id)
      : sb.from('feedbacks').select('feedbacks!inner(*)', { count: 'exact', head: true }),

    // Avg scores
    isReviewer
      ? sb.from('feedbacks').select('score_clarity,score_market,score_innovation,score_execution').eq('reviewer_id', session.user.id)
      : sb.from('feedbacks').select('score_clarity,score_market,score_innovation,score_execution'),

    // Practice sessions
    sb.from('practice_sessions').select('*', { count: 'exact', head: true }).eq('user_id', session.user.id),

    // Unread alerts
    sb.from('alerts').select('*', { count: 'exact', head: true }).eq('user_id', session.user.id).eq('read', false),
  ])

  // Compute average scores
  const allScores = (scoreData ?? []).flatMap((f: any) =>
    [f.score_clarity, f.score_market, f.score_innovation, f.score_execution].filter(Boolean)
  )
  const avgScore = allScores.length
    ? Math.round((allScores.reduce((a: number, b: number) => a + b, 0) / allScores.length) * 20) // 1-5 → 0-100
    : null

  const avgByDimension = {
    clarity:    avg(scoreData, 'score_clarity'),
    market:     avg(scoreData, 'score_market'),
    innovation: avg(scoreData, 'score_innovation'),
    execution:  avg(scoreData, 'score_execution'),
  }

  return NextResponse.json({
    data: {
      ideas: {
        total:    totalIdeas    ?? 0,
        submitted: submittedIdeas ?? 0,
        inReview: inReviewIdeas  ?? 0,
        complete: completeIdeas  ?? 0,
      },
      feedback: {
        total:  totalFeedback ?? 0,
        avgScore,
        byDimension: avgByDimension,
      },
      practice: {
        total: practiceSessions ?? 0,
      },
      alerts: {
        unread: unreadAlerts ?? 0,
      },
    }
  })
}

function avg(rows: any[] | null, field: string): number | null {
  if (!rows?.length) return null
  const vals = rows.map(r => r[field]).filter(Boolean)
  if (!vals.length) return null
  return Math.round((vals.reduce((a: number, b: number) => a + b, 0) / vals.length) * 10) / 10
}
