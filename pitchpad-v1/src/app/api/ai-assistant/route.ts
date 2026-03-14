// src/app/api/ai-assistant/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { getSupabaseServerClient } from '@/lib/supabase'
import Anthropic from '@anthropic-ai/sdk'

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY || 'missing' })

interface Idea {
  id: string
  title: string
  status: string
  problem: string | null
  solution: string | null
  market: string | null
}

interface Feedback {
  content: string
  score_clarity: number | null
  score_market: number | null
  score_innovation: number | null
  score_execution: number | null
  created_at: string
}

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { messages } = await req.json()
  const sb = getSupabaseServerClient()

  // Pull user context: their latest ideas
  const { data: ideasData } = await sb.from('ideas')
    .select('id, title, status, problem, solution, market')
    .eq('author_id', session.user.id)
    .order('updated_at', { ascending: false })
    .limit(3)

  const ideas = ideasData as Idea[] | null

  // Fetch feedbacks for the most recent idea
  let feedbacks: Feedback[] | null = null
  if (ideas?.[0]?.id) {
    const { data: feedbacksData } = await sb.from('feedbacks')
      .select('content, score_clarity, score_market, score_innovation, score_execution, created_at')
      .eq('idea_id', ideas[0].id)
      .order('created_at', { ascending: false })
      .limit(5)
    feedbacks = feedbacksData as Feedback[] | null
  }

  const contextBlocks: string[] = []

  if (ideas?.length) {
    contextBlocks.push(`USER'S RECENT IDEAS:\n${ideas.map(i =>
      `• "${i.title}" (${i.status})\n  Problem: ${i.problem?.slice(0, 120)}…\n  Solution: ${i.solution?.slice(0, 120)}…`
    ).join('\n')}`)
  }

  if (feedbacks?.length) {
    const avgC = feedbacks.reduce((s, f) => s + (f.score_clarity ?? 0), 0) / feedbacks.length
    const avgM = feedbacks.reduce((s, f) => s + (f.score_market ?? 0), 0) / feedbacks.length
    const avgI = feedbacks.reduce((s, f) => s + (f.score_innovation ?? 0), 0) / feedbacks.length
    const avgE = feedbacks.reduce((s, f) => s + (f.score_execution ?? 0), 0) / feedbacks.length
    contextBlocks.push(`FEEDBACK SCORES (avg of ${feedbacks.length} reviews):\n• Clarity: ${avgC.toFixed(1)}/5\n• Market Fit: ${avgM.toFixed(1)}/5\n• Innovation: ${avgI.toFixed(1)}/5\n• Execution: ${avgE.toFixed(1)}/5`)
  }

  const systemPrompt = `You are an expert pitch coach and innovation consultant embedded in PitchPad, Lenovo's internal idea development platform.

${contextBlocks.join('\n\n')}

Your role:
- Help users strengthen their pitch narratives
- Interpret feedback scores and highlight key areas to improve
- Suggest concrete improvements to problem/solution/market framing
- Coach on storytelling, investor psychology, and concise communication
- Reference their actual data when available

Tone: Direct, encouraging, specific. Keep responses under 250 words unless asked for detail.`

  const response = await client.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 600,
    system: systemPrompt,
    messages: messages.slice(-12), // last 12 turns
  })

  const text = response.content[0].type === 'text' ? response.content[0].text : ''
  return NextResponse.json({ data: text })
}
