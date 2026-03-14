// POST /api/chat - AI assistant
import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import Anthropic from '@anthropic-ai/sdk'

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const anthropicApiKey = process.env.ANTHROPIC_API_KEY
  if (!anthropicApiKey) {
    return NextResponse.json({ error: 'ANTHROPIC_API_KEY not configured' }, { status: 500 })
  }

  const body = await req.json()

  // Support both old format { question, context } and new format { messages, ideaId }
  let messages: { role: 'user' | 'assistant'; content: string }[] = []
  let ideaId: string | undefined

  if (body.messages) {
    messages = body.messages
    ideaId = body.ideaId
  } else if (body.question) {
    messages = [{ role: 'user', content: body.question }]
    if (body.context) {
      const lines = body.context.split('\n').filter(Boolean)
      const contextMsgs: { role: 'user' | 'assistant'; content: string }[] = []
      for (const line of lines) {
        if (line.startsWith('user: ')) {
          contextMsgs.push({ role: 'user', content: line.slice(6) })
        } else if (line.startsWith('assistant: ')) {
          contextMsgs.push({ role: 'assistant', content: line.slice(11) })
        }
      }
      messages = [...contextMsgs, { role: 'user', content: body.question }]
    }
  } else {
    return NextResponse.json({ error: 'No messages provided' }, { status: 400 })
  }

  const ideas = await prisma.idea.findMany({
    where: { authorId: session.user.id },
    orderBy: { updatedAt: 'desc' },
    take: 3,
    select: { id: true, title: true, status: true, problem: true, solution: true, market: true },
  })

  let feedbacks: any[] = []
  if (ideaId) {
    feedbacks = await prisma.feedback.findMany({
      where: { ideaId },
      orderBy: { createdAt: 'desc' },
      take: 5,
      select: { content: true, scoreclarity: true, scoreMarket: true, scoreInnovation: true, scoreExecution: true },
    })
  }

  const contextLines: string[] = []

  if (ideas.length) {
    contextLines.push(
      `USER IDEAS:\n${ideas.map(i =>
        `- "${i.title}" (${i.status}) - ${i.problem?.slice(0, 100) || 'No problem defined'}`
      ).join('\n')}`
    )
  }

  if (feedbacks.length) {
    const avg = (field: string) => {
      const vals = feedbacks.map((f: any) => f[field]).filter(Boolean)
      return vals.length ? (vals.reduce((a: number, b: number) => a + b, 0) / vals.length).toFixed(1) : 'N/A'
    }
    contextLines.push(
      `FEEDBACK SCORES (${feedbacks.length} reviews):\n- Clarity: ${avg('scoreclarity')}/5\n- Market: ${avg('scoreMarket')}/5\n- Innovation: ${avg('scoreInnovation')}/5\n- Execution: ${avg('scoreExecution')}/5`
    )
  }

  const system = `You are an expert pitch coach embedded in PitchPad, Lenovo's innovation platform.

${contextLines.join('\n\n')}

Help users strengthen their pitch, interpret feedback, and communicate ideas clearly.
Be direct, specific, and encouraging. Keep responses under 250 words unless detail is requested.`

  try {
    const client = new Anthropic({ apiKey: anthropicApiKey })
    const response = await client.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 700,
      system,
      messages: messages.slice(-12),
    })

    const reply = response.content[0].type === 'text' ? response.content[0].text : ''

    return NextResponse.json({
      answer: reply,
      data: {
        message: reply,
        role: 'assistant',
      },
    })
  } catch (err) {
    return NextResponse.json({ error: 'AI request failed' }, { status: 500 })
  }
}
