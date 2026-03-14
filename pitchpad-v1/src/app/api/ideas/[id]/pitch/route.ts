// POST /api/ideas/:id/pitch — generate pitch deck summary
// Wraps the existing /api/pitch-deck logic under the contracted URL
import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { getSupabaseServerClient } from '@/lib/supabase'
import { createAlert } from '@/lib/alerts'
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

  const sb = getSupabaseServerClient()

  const { data: ideaData } = await sb.from('ideas').select('*').eq('id', params.id).single()
  const idea = ideaData as { id: string; author_id: string; title: string; problem: string; solution: string; market: string; ask?: string } | null
  if (!idea) return NextResponse.json({ error: 'Idea not found' }, { status: 404 })
  if (idea.author_id !== session.user.id && session.user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { data: feedbacksData } = await sb
    .from('feedbacks')
    .select('content, score_clarity, score_market, score_innovation, score_execution')
    .eq('idea_id', params.id)
    .in('visibility', ['TEAM', 'PUBLIC'])
    .order('created_at', { ascending: false })
    .limit(8)
  const feedbacks = feedbacksData as { content: string; score_clarity?: number; score_market?: number; score_innovation?: number; score_execution?: number }[] | null

  const feedbackText = feedbacks?.length
    ? feedbacks.map((f, i) =>
        `Reviewer ${i + 1}: ${f.content}` +
        (f.score_clarity ? ` [Clarity:${f.score_clarity} Market:${f.score_market} Innovation:${f.score_innovation} Execution:${f.score_execution}]` : '')
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
  const { data: existingData } = await sb.from('pitch_decks')
    .select('id, version').eq('idea_id', params.id)
    .order('version', { ascending: false }).limit(1).single()
  const existing = existingData as { id: string; version: number } | null

  if (existing) {
    await (sb.from('pitch_decks') as any).update({ slides: deckData.slides, version: existing.version + 1 }).eq('id', existing.id)
  } else {
    await (sb.from('pitch_decks') as any).insert({ id: crypto.randomUUID(), idea_id: params.id, slides: deckData.slides, version: 1 })
  }

  // Notify creator
  await createAlert({
    userId: session.user.id,
    type: 'DECK_READY',
    title: 'Pitch deck ready',
    message: `Your deck for "${idea.title}" is ready — ${deckData.slides.length} slides generated.`,
    ideaId: params.id,
  })

  return NextResponse.json({
    data: {
      slides: deckData.slides,
      summary: deckData.summary ?? null,
      strengthScore: deckData.strengthScore ?? null,
      topRecommendation: deckData.topRecommendation ?? null,
    }
  })
}
