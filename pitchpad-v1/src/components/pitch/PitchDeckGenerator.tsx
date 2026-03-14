// src/components/pitch/PitchDeckGenerator.tsx
'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import type { PitchSlide } from '@/types'

interface Props {
  ideaId: string
  existingDeck: string | null
}

function SlideCard({ slide, index }: { slide: PitchSlide; index: number }) {
  const TYPE_COLORS: Record<string, string> = {
    cover:    'text-lenovo-red',
    problem:  'text-signal-amber',
    solution: 'text-signal-green',
    market:   'text-signal-blue',
    traction: 'text-tp-200',
    team:     'text-tp-200',
    ask:      'text-lenovo-red',
    summary:  'text-tp-300',
  }

  return (
    <div className="tp-surface p-4 group hover:border-tp-500 transition-all">
      <div className="flex items-start gap-3">
        <div className="shrink-0">
          <span className="font-mono text-2xs text-tp-600 tabular-nums">
            {String(index + 1).padStart(2, '0')}
          </span>
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1.5">
            <span className={`font-mono text-2xs uppercase tracking-widest ${TYPE_COLORS[slide.type] ?? 'text-tp-400'}`}>
              {slide.type}
            </span>
          </div>
          <h4 className="font-mono text-sm font-500 text-tp-white mb-1 leading-snug">{slide.headline}</h4>
          <p className="text-xs text-tp-400 font-light leading-relaxed mb-2">{slide.body}</p>
          {slide.bullets && slide.bullets.length > 0 && (
            <ul className="space-y-1">
              {slide.bullets.map((b, i) => (
                <li key={i} className="flex gap-2 text-xs text-tp-400 font-light">
                  <span className="text-lenovo-red shrink-0 mt-0.5">—</span>
                  <span>{b}</span>
                </li>
              ))}
            </ul>
          )}
          {slide.metric && (
            <div className="mt-2 inline-flex items-baseline gap-1.5 bg-tp-800 border border-tp-700 px-3 py-1.5 rounded-sm">
              <span className="font-mono text-lg font-light text-lenovo-red">{slide.metric.value}</span>
              <span className="font-mono text-2xs text-tp-500 uppercase tracking-wider">{slide.metric.label}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default function PitchDeckGenerator({ ideaId, existingDeck }: Props) {
  const [generating, setGenerating] = useState(false)
  const [exporting, setExporting] = useState(false)
  const [deck, setDeck] = useState<{ slides: PitchSlide[] } | null>(
    existingDeck ? JSON.parse(existingDeck) : null
  )
  const [expanded, setExpanded] = useState(false)

  async function generateDeck() {
    setGenerating(true)
    setExpanded(true)
    try {
      const res = await fetch('/api/pitch-deck', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ideaId }),
      })
      if (!res.ok) throw new Error()
      const { data } = await res.json()
      setDeck(data)
      toast.success('Pitch deck generated!')
    } catch {
      toast.error('Generation failed — check your API key')
    } finally {
      setGenerating(false)
    }
  }

  async function exportDeck() {
    if (!deck) return
    setExporting(true)
    try {
      const res = await fetch('/api/pitch-deck/export', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ slides: deck.slides, ideaId }),
      })
      if (!res.ok) throw new Error()
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `pitch-deck-${ideaId}.pptx`
      a.click()
      URL.revokeObjectURL(url)
      toast.success('Downloaded as .pptx')
    } catch {
      toast.error('Export failed')
    } finally {
      setExporting(false)
    }
  }

  return (
    <div className="tp-surface border-lenovo-red/20">
      {/* Header */}
      <div className="flex items-center justify-between p-5 border-b border-tp-700">
        <div className="flex items-center gap-3">
          <div className="w-1 h-5 bg-lenovo-red" />
          <div>
            <h3 className="font-mono text-xs uppercase tracking-widest text-tp-300">AI Pitch Deck</h3>
            {deck && (
              <p className="font-mono text-2xs text-tp-600 mt-0.5">{deck.slides.length} slides generated</p>
            )}
          </div>
        </div>
        <div className="flex gap-2">
          {deck && (
            <>
              <button
                onClick={() => setExpanded(e => !e)}
                className="tp-btn tp-btn-ghost text-xs"
              >
                {expanded ? 'Collapse' : 'View slides'}
              </button>
              <button
                onClick={exportDeck}
                disabled={exporting}
                className="tp-btn tp-btn-secondary text-xs"
              >
                {exporting ? 'Exporting...' : '↓ Export .pptx'}
              </button>
            </>
          )}
          <button
            onClick={generateDeck}
            disabled={generating}
            className="tp-btn tp-btn-primary text-xs"
          >
            {generating ? (
              <span className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-white animate-ping" />
                Generating...
              </span>
            ) : deck ? 'Regenerate →' : 'Generate deck →'}
          </button>
        </div>
      </div>

      {/* Generating state */}
      {generating && (
        <div className="p-8 text-center">
          <div className="inline-flex flex-col items-center gap-3">
            <div className="flex gap-1">
              {[0,1,2].map(i => (
                <div
                  key={i}
                  className="w-2 h-2 bg-lenovo-red rounded-full animate-bounce"
                  style={{ animationDelay: `${i * 0.1}s` }}
                />
              ))}
            </div>
            <p className="font-mono text-xs text-tp-500">Claude is structuring your pitch...</p>
          </div>
        </div>
      )}

      {/* Deck slides */}
      {!generating && deck && expanded && (
        <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-3">
          {deck.slides.map((slide, i) => (
            <SlideCard key={slide.id} slide={slide} index={i} />
          ))}
        </div>
      )}

      {/* Empty state */}
      {!generating && !deck && (
        <div className="p-8 text-center">
          <p className="font-mono text-xs text-tp-600 mb-1">
            No deck generated yet
          </p>
          <p className="text-xs text-tp-700 font-light">
            Claude will synthesize your idea + feedback into 8 investor-ready slides
          </p>
        </div>
      )}
    </div>
  )
}
