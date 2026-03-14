// POST /api/ideas/:id/pitch — generate pitch deck summary
import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import Anthropic from '@anthropic-ai/sdk'

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY || 'missing' })

const SYSTEM_PROMPT = `You are an expert pitch consultant for Lenovo's PitchPad platform.
Given an idea and reviewer feedback, generate an 8-slide investor pitch deck.

Return ONLY valid JSON:
{
  "slides": [
    {
      "id": 1,
      "type": "cover|problem|solution|market|traction|team|ask|summary",
      "headline": "Compelling one-liner (max 10 words)",
      "body": "2-3 sentences of context",
      "bullets": ["optional", "bullet", "points"],
      "metric": { "value": "$2B", "label": "Market size" }
    }
  ],
  "summary": "3-sentence executive summary of the entire pitch",
  "strengthScore": 78,
  "topRecommendation": "Single most important improvement to make"
}
Return ONLY the JSON, no markdown fences.`

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const idea = await prisma.idea.findUnique({
    where: { id: params.id },
    include: {
      feedbacks: {
        where: { visibility: { in: ['TEAM', 'PUBLIC'] } },
        orderBy: { createdAt: 'desc' },
        take: 8,
      }
    }
  })

  if (!idea) return NextResponse.json({ error: 'Idea not found' }, { status: 404 })
  if (idea.authorId !== session.user.id && session.user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const feedbackText = idea.feedbacks.length
    ? idea.feedbacks.map((f, i) =>
        `Reviewer ${i + 1}: ${f.content}` +
        (f.scoreclarity ? ` [Clarity:${f.scoreclarity} Market:${f.scoreMarket} Innovation:${f.scoreInnovation} Execution:${f.scoreExecution}]` : '')
      ).join('\n')
    : 'No reviewer feedback yet.'

  const message = await client.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 2000,
    system: SYSTEM_PROMPT,
    messages: [{
      role: 'user',
      content: `TITLE: ${idea.title}\nPROBLEM: ${idea.problem}\nSOLUTION: ${idea.solution}\nMARKET: ${idea.market}\n${idea.ask ? `ASK: ${idea.ask}\n` : ''}FEEDBACK:\n${feedbackText}`
    }],
  })

  const text = message.content[0].type === 'text' ? message.content[0].text : ''
  const deckData = JSON.parse(text.replace(/```json\n?|```\n?/g, '').trim())

  // Upsert pitch deck
  const existingDeck = await prisma.pitchDeck.findFirst({
    where: { ideaId: params.id },
    orderBy: { version: 'desc' },
  })

  if (existingDeck) {
    await prisma.pitchDeck.update({
      where: { id: existingDeck.id },
      data: {
        slides: deckData.slides,
        version: existingDeck.version + 1,
      }
    })
  } else {
    await prisma.pitchDeck.create({
      data: {
        ideaId: params.id,
        slides: deckData.slides,
        version: 1,
      }
    })
  }

  // Update idea pitch score
  if (deckData.strengthScore) {
    await prisma.idea.update({
      where: { id: params.id },
      data: { pitchScore: deckData.strengthScore }
    })
  }

  return NextResponse.json({
    data: {
      slides: deckData.slides,
      summary: deckData.summary ?? null,
      strengthScore: deckData.strengthScore ?? null,
      topRecommendation: deckData.topRecommendation ?? null,
    }
  })
}
