// src/app/api/ideas/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const createSchema = z.object({
  title:      z.string().min(5).max(120),
  problem:    z.string().min(10),
  solution:   z.string().min(10),
  market:     z.string().min(10),
  ask:        z.string().optional(),
  tags:       z.array(z.string()).optional().default([]),
  visibility: z.enum(['PRIVATE', 'TEAM', 'PUBLIC']).default('PRIVATE'),
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

  const idea = await prisma.idea.create({
    data: {
      title: parsed.data.title,
      problem: parsed.data.problem,
      solution: parsed.data.solution,
      market: parsed.data.market,
      ask: parsed.data.ask,
      tags: parsed.data.tags,
      visibility: parsed.data.visibility,
      status: parsed.data.status,
      authorId: session.user.id,
    },
  })

  return NextResponse.json(idea, { status: 201 })
}

export async function GET(req: NextRequest) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const mine = searchParams.get('mine') === 'true'

  let ideas
  if (mine || session.user.role === 'CREATOR') {
    ideas = await prisma.idea.findMany({
      where: { authorId: session.user.id },
      orderBy: { updatedAt: 'desc' },
    })
  } else if (session.user.role === 'REVIEWER') {
    ideas = await prisma.idea.findMany({
      where: {
        status: { in: ['SUBMITTED', 'IN_REVIEW'] },
        visibility: { in: ['TEAM', 'PUBLIC'] },
      },
      orderBy: { updatedAt: 'desc' },
    })
  } else {
    ideas = await prisma.idea.findMany({
      where: { authorId: session.user.id },
      orderBy: { updatedAt: 'desc' },
    })
  }

  return NextResponse.json(ideas)
}
