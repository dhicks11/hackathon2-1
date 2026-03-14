// POST /api/ideas/:id/practice - upload audio, get Whisper transcript + delivery score
import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import OpenAI from 'openai'
import Anthropic from '@anthropic-ai/sdk'
import { countFillerWords } from '@/lib/utils'

const IDEAL_WPM_MIN = 130
const IDEAL_WPM_MAX = 160

function calcPacingScore(wpm: number): number {
  if (wpm >= IDEAL_WPM_MIN && wpm <= IDEAL_WPM_MAX) return 95
  if (wpm < IDEAL_WPM_MIN) return Math.max(20, 95 - (IDEAL_WPM_MIN - wpm) * 1.5)
  return Math.max(20, 95 - (wpm - IDEAL_WPM_MAX) * 1.5)
}

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const openaiApiKey = process.env.OPENAI_API_KEY
  const anthropicApiKey = process.env.ANTHROPIC_API_KEY
  if (!openaiApiKey) {
    return NextResponse.json({ error: 'OPENAI_API_KEY not configured' }, { status: 500 })
  }
  if (!anthropicApiKey) {
    return NextResponse.json({ error: 'ANTHROPIC_API_KEY not configured' }, { status: 500 })
  }

  const openai = new OpenAI({ apiKey: openaiApiKey })
  const anthropic = new Anthropic({ apiKey: anthropicApiKey })

  const formData = await req.formData()
  const audioFile = formData.get('audio') as File | null
  const durationSec = parseInt((formData.get('duration') as string) ?? '0', 10)

  if (!audioFile) return NextResponse.json({ error: 'No audio file provided' }, { status: 400 })

  const idea = await prisma.idea.findUnique({
    where: { id: params.id },
    select: { title: true, solution: true, market: true },
  })

  const transcription = await openai.audio.transcriptions.create({
    file: audioFile,
    model: 'whisper-1',
    language: 'en',
    response_format: 'text',
  })
  const transcript = typeof transcription === 'string' ? transcription : (transcription as any).text ?? ''

  const wordCount = transcript.split(/\s+/).filter(Boolean).length
  const wpm = durationSec > 0 ? Math.round((wordCount / durationSec) * 60) : 0
  const fillerWords = countFillerWords(transcript)
  const pacingScore = Math.round(calcPacingScore(wpm))

  const sentences = transcript.split(/[.!?]+/).filter((s: string) => s.trim().length > 10)
  const avgSentenceLen = sentences.length ? wordCount / sentences.length : 0
  const clarityScore = Math.round(Math.max(20, Math.min(100,
    100 - Math.abs(avgSentenceLen - 18) * 2 - fillerWords * 3
  )))

  let keywordMatch = 50
  if (idea) {
    const keywords = [
      ...idea.title.split(' '),
      ...idea.solution.split(' ').slice(0, 20),
      ...idea.market.split(' ').slice(0, 10),
    ].map(w => w.toLowerCase().replace(/[^a-z]/g, '')).filter(w => w.length > 4)
    const uniqueKeywords = [...new Set(keywords)]
    const lowerTranscript = transcript.toLowerCase()
    const matched = uniqueKeywords.filter(kw => lowerTranscript.includes(kw))
    keywordMatch = uniqueKeywords.length
      ? Math.round((matched.length / uniqueKeywords.length) * 100)
      : 50
  }

  const coachMsg = await anthropic.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 800,
    messages: [{
      role: 'user',
      content: `You are a pitch delivery coach. Analyze this recorded pitch transcript and rate the delivery.

TRANSCRIPT:
${transcript}

METRICS:
- Duration: ${durationSec}s | Pace: ${wpm} WPM (ideal: 130-160)
- Filler words: ${fillerWords} | Clarity: ${clarityScore}/100 | Keywords hit: ${keywordMatch}%

Respond with JSON only:
{
  "delivery_score": <1-10 rating>,
  "overall": "<1 sentence overall impression>",
  "strengths": "<what worked well, cite specific phrases>",
  "improvements": "<top 2 things to improve with concrete suggestions>",
  "pacing": "<pacing feedback based on WPM>"
}

Rating guide:
1-3: Needs significant work (unclear, many fillers, poor pacing)
4-5: Getting there (some good points but needs polish)
6-7: Good (clear message, reasonable pacing, minor issues)
8-9: Excellent (compelling, confident, well-paced)
10: Outstanding (investor-ready, memorable delivery)

Be direct, specific, and encouraging. Return ONLY valid JSON.`
    }],
  })

  const aiText = coachMsg.content[0].type === 'text' ? coachMsg.content[0].text : '{}'
  let evaluation: any = {}
  try {
    evaluation = JSON.parse(aiText.replace(/```json\n?|```\n?/g, '').trim())
  } catch {
    evaluation = { delivery_score: 5, overall: aiText, strengths: '', improvements: '', pacing: '' }
  }

  const practiceSession = await prisma.practiceSession.create({
    data: {
      transcript,
      durationSec,
      fillerWords,
      pacingScore,
      clarityScore,
      keywordMatch,
      aiFeedback: JSON.stringify(evaluation),
      ideaId: params.id,
      userId: session.user.id,
    },
  })

  return NextResponse.json({
    transcript,
    evaluation: {
      delivery_score: evaluation.delivery_score ?? 5,
      overall: evaluation.overall ?? '',
      strengths: evaluation.strengths ?? '',
      improvements: evaluation.improvements ?? '',
      pacing: evaluation.pacing ?? `Your pace was ${wpm} WPM`,
    },
    metrics: {
      durationSec,
      wpm,
      fillerWords,
      pacingScore,
      clarityScore,
      keywordMatch,
    },
    sessionId: practiceSession.id,
  })
}
