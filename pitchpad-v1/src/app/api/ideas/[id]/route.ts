// GET /api/ideas/:id — single idea with scores + feedback
import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const idea = await prisma.idea.findUnique({
    where: { id: params.id },
    include: {
      feedbacks: {
        orderBy: { createdAt: 'desc' },
        include: {
          reviewer: {
            select: { id: true, name: true, email: true }
          }
        }
      },
      pitchDecks: {
        orderBy: { version: 'desc' },
        take: 1,
      },
      author: {
        select: { id: true, name: true, email: true }
      }
    },
  })

  if (!idea) {
    return NextResponse.json({ error: 'Idea not found' }, { status: 404 })
  }

  // Compute aggregate pitch score from feedback
  const scores = idea.feedbacks.flatMap(f =>
    [f.scoreclarity, f.scoreMarket, f.scoreInnovation, f.scoreExecution].filter(Boolean) as number[]
  )
  const pitchScore = scores.length
    ? Math.round((scores.reduce((a, b) => a + b, 0) / scores.length) * 20) // convert 1-5 → 0-100
    : idea.pitchScore

  return NextResponse.json({
    ...idea,
    pitchScore,
    feedbackCount: idea.feedbacks.length,
  })
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()

  const idea = await prisma.idea.findUnique({
    where: { id: params.id },
  })

  if (!idea) {
    return NextResponse.json({ error: 'Idea not found' }, { status: 404 })
  }

  // Only author or admin can update
  if (idea.authorId !== session.user.id && session.user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const updated = await prisma.idea.update({
    where: { id: params.id },
    data: {
      title: body.title,
      problem: body.problem,
      solution: body.solution,
      market: body.market,
      ask: body.ask,
      tags: body.tags,
      status: body.status,
      visibility: body.visibility,
    },
  })

  return NextResponse.json(updated)
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const idea = await prisma.idea.findUnique({
    where: { id: params.id },
  })

  if (!idea) {
    return NextResponse.json({ error: 'Idea not found' }, { status: 404 })
  }

  // Only author or admin can delete
  if (idea.authorId !== session.user.id && session.user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  await prisma.idea.delete({
    where: { id: params.id },
  })

  return NextResponse.json({ success: true })
}
