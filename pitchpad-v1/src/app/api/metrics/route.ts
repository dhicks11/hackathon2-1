// GET /api/metrics — dashboard summary numbers
import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(req: NextRequest) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const isReviewer = session.user.role === 'REVIEWER'

  // Get idea counts
  const whereClause = isReviewer ? {} : { authorId: session.user.id }

  const [
    totalIdeas,
    submittedIdeas,
    inReviewIdeas,
    completeIdeas,
    draftIdeas,
    totalFeedback,
    feedbackData,
    practiceSessions,
  ] = await Promise.all([
    prisma.idea.count({ where: whereClause }),
    prisma.idea.count({ where: { ...whereClause, status: 'SUBMITTED' } }),
    prisma.idea.count({ where: { ...whereClause, status: 'IN_REVIEW' } }),
    prisma.idea.count({ where: { ...whereClause, status: 'COMPLETE' } }),
    prisma.idea.count({ where: { ...whereClause, status: 'DRAFT' } }),
    isReviewer
      ? prisma.feedback.count({ where: { reviewerId: session.user.id } })
      : prisma.feedback.count(),
    prisma.feedback.findMany({
      where: isReviewer ? { reviewerId: session.user.id } : {},
      select: {
        scoreclarity: true,
        scoreMarket: true,
        scoreInnovation: true,
        scoreExecution: true,
        createdAt: true,
      }
    }),
    prisma.practiceSession.count({ where: { userId: session.user.id } }),
  ])

  // Compute averages
  const allScores = feedbackData.flatMap(f =>
    [f.scoreclarity, f.scoreMarket, f.scoreInnovation, f.scoreExecution].filter(Boolean) as number[]
  )
  const avgScore = allScores.length
    ? Math.round((allScores.reduce((a, b) => a + b, 0) / allScores.length) * 20)
    : null

  const avgByDimension = {
    clarity: avg(feedbackData, 'scoreclarity'),
    market: avg(feedbackData, 'scoreMarket'),
    innovation: avg(feedbackData, 'scoreInnovation'),
    execution: avg(feedbackData, 'scoreExecution'),
  }

  // Monthly trend
  const monthlyData: Record<string, { scores: number[]; count: number }> = {}
  feedbackData.forEach(f => {
    const month = new Date(f.createdAt).toLocaleString('default', { month: 'short' })
    if (!monthlyData[month]) monthlyData[month] = { scores: [], count: 0 }
    const scores = [f.scoreclarity, f.scoreMarket, f.scoreInnovation, f.scoreExecution].filter(Boolean) as number[]
    if (scores.length) {
      monthlyData[month].scores.push(scores.reduce((a, b) => a + b, 0) / scores.length)
      monthlyData[month].count++
    }
  })

  const feedbackTrend = Object.entries(monthlyData).slice(-6).map(([month, data]) => ({
    month,
    avg: data.scores.length ? data.scores.reduce((a, b) => a + b, 0) / data.scores.length : 0,
    count: data.count,
  }))

  return NextResponse.json({
    ideas: {
      total: totalIdeas,
      submitted: submittedIdeas,
      inReview: inReviewIdeas,
      complete: completeIdeas,
      draft: draftIdeas,
    },
    feedback: {
      total: totalFeedback,
      avgScore,
      byDimension: avgByDimension,
      trend: feedbackTrend,
    },
    practice: {
      total: practiceSessions,
    },
  })
}

function avg(rows: any[], field: string): number | null {
  if (!rows?.length) return null
  const vals = rows.map(r => r[field]).filter(Boolean)
  if (!vals.length) return null
  return Math.round((vals.reduce((a: number, b: number) => a + b, 0) / vals.length) * 10) / 10
}
