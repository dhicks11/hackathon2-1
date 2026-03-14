// src/app/api/feedback/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const schema = z.object({
  ideaId: z.string(),
  content: z.string().min(10),
  visibility: z.enum(['PRIVATE', 'TEAM', 'PUBLIC']).default('TEAM'),
  isAnonymous: z.boolean().default(false),
  scoreclarity: z.number().min(1).max(5).optional(),
  scoreMarket: z.number().min(1).max(5).optional(),
  scoreInnovation: z.number().min(1).max(5).optional(),
  scoreExecution: z.number().min(1).max(5).optional(),
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

  // Verify idea exists
  const idea = await prisma.idea.findUnique({
    where: { id: parsed.data.ideaId },
  })

  if (!idea) return NextResponse.json({ error: 'Idea not found' }, { status: 404 })
  if (idea.status === 'DRAFT') return NextResponse.json({ error: 'Cannot review a draft' }, { status: 400 })

  // Insert feedback
  const feedback = await prisma.feedback.create({
    data: {
      ideaId: parsed.data.ideaId,
      reviewerId: session.user.id,
      content: parsed.data.content,
      visibility: parsed.data.visibility,
      isAnonymous: parsed.data.isAnonymous,
      scoreclarity: parsed.data.scoreclarity ?? null,
      scoreMarket: parsed.data.scoreMarket ?? null,
      scoreInnovation: parsed.data.scoreInnovation ?? null,
      scoreExecution: parsed.data.scoreExecution ?? null,
    },
  })

  // Update idea status
  if (idea.status === 'SUBMITTED') {
    await prisma.idea.update({
      where: { id: idea.id },
      data: { status: 'IN_REVIEW' }
    })
  }

  return NextResponse.json({ data: feedback }, { status: 201 })
}

export async function GET(req: NextRequest) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const ideaId = searchParams.get('ideaId')

  if (!ideaId) {
    return NextResponse.json({ error: 'ideaId is required' }, { status: 400 })
  }

  const feedbacks = await prisma.feedback.findMany({
    where: { ideaId },
    orderBy: { createdAt: 'desc' },
    include: {
      reviewer: {
        select: { id: true, name: true, email: true }
      }
    }
  })

  return NextResponse.json(feedbacks)
}
