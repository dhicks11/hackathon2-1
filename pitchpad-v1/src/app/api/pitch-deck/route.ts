// src/app/api/pitch-deck/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { getSupabaseServerClient } from '@/lib/supabase'
import { createAlert } from '@/lib/alerts'
import Anthropic from '@anthropic-ai/sdk'
import type { PitchSlide } from '@/types'

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

const SYSTEM_PROMPT = `You are an expert pitch deck consultant for Lenovo's PitchPad innovation platform.
Given an idea and reviewer feedback, generate an 8-slide investor pitch deck.

Return ONLY a valid JSON object:
{
  "slides": [
    {
      "id": 1,
      "type": "cover",
      "title": "Slide title",
      "headline": "Compelling one-liner (max 10 words)",
      "body": "2-3 sentences of supporting context",
      "bullets": ["Point 1", "Point 2", "Point 3"],
      "metric": { "value": "$2B", "label": "Market size" }
    }
  ]
}

Slide types in order: cover, problem, solution, market, traction, team, ask, summary
- bullets: optional, 3-4 items when present
- metric: optional, only when a strong single data point exists
Return ONLY the JSON.`

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { ideaId } = await req.json()
  const sb = getSupabaseServerClient()

  const { data: idea } = await sb.from('ideas').select('*').eq('id', ideaId).single()
  if (!idea) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  if (idea.author_id !== session.user.id && session.user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { data: feedbacks } = await sb.from('feedbacks')
    .select('content, score_clarity, score_market')
    .eq('idea_id', ideaId)
    .in('visibility', ['TEAM', 'PUBLIC'])
    .order('created_at', { ascending: false })
    .limit(8)

  const feedbackSummary = feedbacks?.length
    ? feedbacks.map((f, i) =>
        `Reviewer ${i + 1}: ${f.content}` +
        (f.score_clarity ? ` (Clarity: ${f.score_clarity}/5, Market: ${f.score_market}/5)` : '')
      ).join('\n\n')
    : 'No feedback yet — generate based on the idea content.'

  const userMessage = `
IDEA TITLE: ${idea.title}
PROBLEM: ${idea.problem}
SOLUTION: ${idea.solution}
MARKET: ${idea.market}
${idea.ask ? `THE ASK: ${idea.ask}` : ''}

REVIEWER FEEDBACK:
${feedbackSummary}

Generate the 8-slide pitch deck JSON now.`.trim()

  const message = await client.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 2000,
    system: SYSTEM_PROMPT,
    messages: [{ role: 'user', content: userMessage }],
  })

  const text = message.content[0].type === 'text' ? message.content[0].text : ''
  const clean = text.replace(/```json\n?|```\n?/g, '').trim()
  const deckData = JSON.parse(clean) as { slides: PitchSlide[] }

  // Upsert pitch deck
  const { data: existing } = await sb.from('pitch_decks')
    .select('id, version').eq('idea_id', ideaId).order('version', { ascending: false }).limit(1).single()

  if (existing) {
    await sb.from('pitch_decks').update({ slides: deckData.slides as any, version: existing.version + 1 }).eq('id', existing.id)
  } else {
    await sb.from('pitch_decks').insert({ id: crypto.randomUUID(), idea_id: ideaId, slides: deckData.slides as any, version: 1 })
  }

  // Alert the creator
  await createAlert({
    userId: session.user.id,
    type: 'DECK_READY',
    title: 'Pitch deck ready',
    message: `Your deck for "${idea.title}" has been generated — ${deckData.slides.length} slides ready to export.`,
    ideaId,
  })

  return NextResponse.json({ data: deckData })
}
