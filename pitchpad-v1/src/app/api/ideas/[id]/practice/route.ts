// POST /api/ideas/:id/practice — upload audio, get Whisper transcript + delivery score
import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { getSupabaseServerClient } from '@/lib/supabase'
import OpenAI from 'openai'
import Anthropic from '@anthropic-ai/sdk'
import { countFillerWords } from '@/lib/utils'

const openai    = new OpenAI({ apiKey: process.env.OPENAI_API_KEY || 'missing' })
const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY || 'missing' })

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

  const formData = await req.formData()
  const audioFile = formData.get('audio') as File | null
  const durationSec = parseInt(formData.get('duration') as string ?? '0', 10)

  if (!audioFile) return NextResponse.json({ error: 'No audio file provided' }, { status: 400 })

  const sb = getSupabaseServerClient()

  // Fetch idea so we can match keywords
  const { data: ideaData } = await sb.from('ideas').select('title, solution, market').eq('id', params.id).single()
  const idea = ideaData as { title: string; solution: string; market: string } | null

  // ── Whisper transcription ─────────────────────────────────
  const transcription = await openai.audio.transcriptions.create({
    file: audioFile,
    model: 'whisper-1',
    language: 'en',
    response_format: 'text',
  })
  const transcript = typeof transcription === 'string' ? transcription : (transcription as any).text ?? ''

  // ── Objective metrics ─────────────────────────────────────
  const wordCount   = transcript.split(/\s+/).filter(Boolean).length
  const wpm         = durationSec > 0 ? Math.round((wordCount / durationSec) * 60) : 0
  const fillerWords = countFillerWords(transcript)
  const pacingScore = Math.round(calcPacingScore(wpm))

  const sentences      = transcript.split(/[.!?]+/).filter((s: string) => s.trim().length > 10)
  const avgSentenceLen = sentences.length ? wordCount / sentences.length : 0
  const clarityScore   = Math.round(Math.max(20, Math.min(100,
    100 - Math.abs(avgSentenceLen - 18) * 2 - fillerWords * 3
  )))

  // Keyword match — compare transcript against idea keywords
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

  // ── Claude coaching ───────────────────────────────────────
  const coachMsg = await anthropic.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 600,
    messages: [{
      role: 'user',
      content: `You are a pitch delivery coach. Analyze this recorded pitch transcript.

TRANSCRIPT:
${transcript}

METRICS:
- Duration: ${durationSec}s | Pace: ${wpm} WPM (ideal: 130–160)
- Filler words: ${fillerWords} | Clarity: ${clarityScore}/100 | Keywords hit: ${keywordMatch}%

Give coaching feedback in 3 short paragraphs:
1. Overall impression (1 sentence)
2. What worked well (cite specific phrases from the transcript)
3. Top 2 things to improve with concrete suggestions

Be direct, specific, and encouraging. Max 200 words.`
    }],
  })

  const aiFeedback = coachMsg.content[0].type === 'text' ? coachMsg.content[0].text : ''

  // ── Save session ──────────────────────────────────────────
  const { data: session_record } = await (sb.from('practice_sessions') as any).insert({
    id: crypto.randomUUID(),
    transcript,
    duration_sec: durationSec,
    filler_words: fillerWords,
    pacing_score: pacingScore,
    clarity_score: clarityScore,
    keyword_match: keywordMatch,
    ai_feedback: aiFeedback,
    idea_id: params.id,
    user_id: session.user.id,
  }).select().single()

  return NextResponse.json({
    data: {
      sessionId: session_record?.id,
      transcript,
      durationSec,
      wpm,
      fillerWords,
      pacingScore,
      clarityScore,
      keywordMatch,
      aiFeedback,
    }
  })
}
