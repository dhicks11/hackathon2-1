// POST /api/chat — AI assistant (matches contracted endpoint name)
// Identical logic to /api/ai-assistant but at the contracted URL
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
}

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { messages, ideaId } = await req.json()
  if (!messages?.length) return NextResponse.json({ error: 'No messages provided' }, { status: 400 })

  const sb = getSupabaseServerClient()

  // Pull context: user's ideas
  const { data: ideasData } = await sb.from('ideas')
    .select('id, title, status, problem, solution, market')
    .eq('author_id', session.user.id)
    .order('updated_at', { ascending: false })
    .limit(3)

  const ideas = ideasData as Idea[] | null

  // Fetch feedbacks if ideaId provided
  let feedbacks: Feedback[] | null = null
  if (ideaId) {
    const { data: feedbacksData } = await sb.from('feedbacks')
      .select('content, score_clarity, score_market, score_innovation, score_execution')
      .eq('idea_id', ideaId)
      .order('created_at', { ascending: false })
      .limit(5)
    feedbacks = feedbacksData as Feedback[] | null
  }

  const contextLines: string[] = []

  if (ideas?.length) {
    contextLines.push(`USER IDEAS:\n${ideas.map(i =>
      `• "${i.title}" (${i.status}) — ${i.problem?.slice(0, 100)}`
    ).join('\n')}`)
  }

  if (feedbacks?.length) {
    const avg = (field: string) => {
      const vals = feedbacks.map((f: any) => f[field]).filter(Boolean)
      return vals.length ? (vals.reduce((a: number, b: number) => a + b, 0) / vals.length).toFixed(1) : 'N/A'
    }
    contextLines.push(`FEEDBACK SCORES (${feedbacks.length} reviews):\n• Clarity: ${avg('score_clarity')}/5\n• Market: ${avg('score_market')}/5\n• Innovation: ${avg('score_innovation')}/5\n• Execution: ${avg('score_execution')}/5`)
  }

  const system = `You are an expert pitch coach embedded in PitchPad, Lenovo's innovation platform.

${contextLines.join('\n\n')}

Help users strengthen their pitch, interpret feedback, and communicate ideas clearly.
Be direct, specific, and encouraging. Keep responses under 250 words unless detail is requested.`

  const response = await client.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 700,
    system,
    messages: messages.slice(-12),
  })

  const reply = response.content[0].type === 'text' ? response.content[0].text : ''

  return NextResponse.json({
    data: {
      message: reply,
      role: 'assistant',
    }
  })
}
