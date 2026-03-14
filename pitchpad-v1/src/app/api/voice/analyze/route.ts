// src/app/api/voice/analyze/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import OpenAI from 'openai'
import Anthropic from '@anthropic-ai/sdk'
import { countFillerWords } from '@/lib/utils'

const openai   = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

// Ideal pacing: 130–160 WPM for presentations
const IDEAL_WPM_MIN = 130
const IDEAL_WPM_MAX = 160

function calcPacingScore(wpm: number): number {
  if (wpm >= IDEAL_WPM_MIN && wpm <= IDEAL_WPM_MAX) return 95
  if (wpm < IDEAL_WPM_MIN) return Math.max(20, 95 - (IDEAL_WPM_MIN - wpm) * 1.5)
  return Math.max(20, 95 - (wpm - IDEAL_WPM_MAX) * 1.5)
}

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const formData = await req.formData()
  const audioFile = formData.get('audio') as File
  const durationSec = parseInt(formData.get('duration') as string ?? '0', 10)

  if (!audioFile) return NextResponse.json({ error: 'No audio file' }, { status: 400 })

  // ── Step 1: Transcribe with Whisper ─────────────────────────────
  const transcription = await openai.audio.transcriptions.create({
    file: audioFile,
    model: 'whisper-1',
    language: 'en',
    response_format: 'text',
  })
  const transcript = typeof transcription === 'string' ? transcription : (transcription as any).text ?? ''

  // ── Step 2: Compute objective metrics ───────────────────────────
  const wordCount   = transcript.split(/\s+/).filter(Boolean).length
  const wpm         = durationSec > 0 ? Math.round((wordCount / durationSec) * 60) : 0
  const fillerWords = countFillerWords(transcript)
  const pacingScore = Math.round(calcPacingScore(wpm))

  // Clarity proxy: sentences / paragraph-like structure
  const sentences   = transcript.split(/[.!?]+/).filter(s => s.trim().length > 10)
  const avgSentenceLen = sentences.length ? wordCount / sentences.length : 0
  const clarityScore = Math.round(Math.max(20, Math.min(100,
    100 - Math.abs(avgSentenceLen - 18) * 2 - fillerWords * 3
  )))

  // ── Step 3: Claude coaching feedback ────────────────────────────
  const coachingPrompt = `You are a presentation coach analyzing a pitch recording.

TRANSCRIPT:
${transcript}

METRICS:
- Duration: ${durationSec}s
- Pace: ${wpm} WPM (ideal: 130–160 WPM)
- Filler words detected: ${fillerWords}
- Estimated clarity score: ${clarityScore}/100

Provide concise, actionable coaching feedback in 3–4 paragraphs:
1. Overall impression (1 sentence)
2. What worked well (specific examples from transcript)
3. Key areas to improve (pace, fillers, structure, clarity)
4. One specific drill or technique to practice

Be direct, encouraging, and specific. Reference actual words or phrases from the transcript.`

  const coachingMsg = await anthropic.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 600,
    messages: [{ role: 'user', content: coachingPrompt }],
  })
  const aiFeedback = coachingMsg.content[0].type === 'text' ? coachingMsg.content[0].text : ''

  // Keyword match is placeholder — in prod, compare against stored pitch deck keywords
  const keywordMatch = Math.round(Math.min(100, 40 + Math.random() * 40))

  return NextResponse.json({
    data: {
      transcript,
      durationSec,
      fillerWords,
      pacingScore,
      clarityScore,
      keywordMatch,
      aiFeedback,
    },
  })
}
