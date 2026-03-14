// src/components/feedback/FeedbackPanel.tsx
'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'
import TextareaAutosize from 'react-textarea-autosize'
import { formatRelative } from '@/lib/utils'
import type { Feedback, Visibility } from '@/types'

const feedbackSchema = z.object({
  content:        z.string().min(20, 'Provide at least 20 characters of feedback'),
  visibility:     z.enum(['PRIVATE', 'TEAM', 'PUBLIC']),
  isAnonymous:    z.boolean(),
  scoreclarity:   z.number().min(1).max(5).optional(),
  scoreMarket:    z.number().min(1).max(5).optional(),
  scoreInnovation:z.number().min(1).max(5).optional(),
  scoreExecution: z.number().min(1).max(5).optional(),
})
type FeedbackFormData = z.infer<typeof feedbackSchema>

const DIMENSIONS = [
  { key: 'scoreclarity',    label: 'Clarity' },
  { key: 'scoreMarket',     label: 'Market fit' },
  { key: 'scoreInnovation', label: 'Innovation' },
  { key: 'scoreExecution',  label: 'Execution' },
] as const

function ScoreSelector({ value, onChange }: { value?: number; onChange: (v: number) => void }) {
  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map(n => (
        <button
          key={n}
          type="button"
          onClick={() => onChange(n)}
          className={`
            w-7 h-7 font-mono text-xs rounded-sm border transition-all
            ${(value ?? 0) >= n
              ? 'bg-lenovo-red border-lenovo-red text-white'
              : 'bg-tp-900 border-tp-600 text-tp-500 hover:border-tp-400'
            }
          `}
        >
          {n}
        </button>
      ))}
    </div>
  )
}

function FeedbackCard({ feedback, isOwner }: { feedback: Feedback & { reviewer?: any }; isOwner: boolean }) {
  const scores = [
    { label: 'Clarity', value: feedback.scoreclarity },
    { label: 'Market',  value: feedback.scoreMarket },
    { label: 'Innov.',  value: feedback.scoreInnovation },
    { label: 'Exec.',   value: feedback.scoreExecution },
  ].filter(s => s.value != null)

  const avgScore = scores.length
    ? (scores.reduce((sum, s) => sum + (s.value ?? 0), 0) / scores.length).toFixed(1)
    : null

  const VISIBILITY_COLORS: Record<string, string> = {
    PRIVATE: 'text-tp-500 bg-tp-800 border-tp-700',
    TEAM:    'text-signal-amber bg-signal-amber/10 border-signal-amber/20',
    PUBLIC:  'text-signal-green bg-signal-green/10 border-signal-green/20',
  }

  return (
    <div className="tp-surface p-5">
      {/* Header */}
      <div className="flex items-center gap-3 mb-3">
        <div className="w-6 h-6 rounded-sm bg-tp-700 border border-tp-600 flex items-center justify-center shrink-0">
          <span className="font-mono text-2xs text-tp-300">
            {feedback.isAnonymous
              ? '?'
              : (feedback.reviewer?.name ?? feedback.reviewer?.email ?? 'R').slice(0, 1).toUpperCase()
            }
          </span>
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-mono text-xs text-tp-200">
            {feedback.isAnonymous ? 'Anonymous reviewer' : (feedback.reviewer?.name ?? 'Reviewer')}
          </p>
          <p className="font-mono text-2xs text-tp-600">{formatRelative(feedback.createdAt)}</p>
        </div>
        <div className="flex items-center gap-2">
          {avgScore && (
            <span className="font-mono text-xs text-lenovo-red tabular-nums">{avgScore}/5</span>
          )}
          <span className={`tp-badge border text-2xs ${VISIBILITY_COLORS[feedback.visibility]}`}>
            {feedback.visibility}
          </span>
        </div>
      </div>

      {/* Scores */}
      {scores.length > 0 && (
        <div className="flex gap-4 flex-wrap mb-3 pb-3 border-b border-tp-800">
          {scores.map(s => (
            <div key={s.label} className="flex items-center gap-1.5">
              <span className="font-mono text-2xs text-tp-500 uppercase tracking-wider">{s.label}</span>
              <div className="flex gap-0.5">
                {[1,2,3,4,5].map(n => (
                  <div key={n} className={`w-2 h-2 rounded-full ${(s.value ?? 0) >= n ? 'bg-lenovo-red' : 'bg-tp-700'}`} />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Content */}
      <p className="text-sm text-tp-200 font-light leading-relaxed whitespace-pre-wrap">
        {feedback.content}
      </p>
    </div>
  )
}

interface FeedbackPanelProps {
  ideaId: string
  feedbacks: (Feedback & { reviewer?: any })[]
  isReviewer: boolean
  isOwner: boolean
}

export default function FeedbackPanel({ ideaId, feedbacks, isReviewer, isOwner }: FeedbackPanelProps) {
  const router = useRouter()
  const [showForm, setShowForm] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  const { register, handleSubmit, setValue, watch, formState: { errors }, reset } = useForm<FeedbackFormData>({
    resolver: zodResolver(feedbackSchema),
    defaultValues: {
      visibility: 'TEAM',
      isAnonymous: false,
    },
  })

  const visibility = watch('visibility')
  const isAnonymous = watch('isAnonymous')

  async function onSubmit(data: FeedbackFormData) {
    setSubmitting(true)
    try {
      const res = await fetch(`/api/feedback`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...data, ideaId }),
      })
      if (!res.ok) throw new Error()
      toast.success('Feedback submitted')
      reset()
      setShowForm(false)
      router.refresh()
    } catch {
      toast.error('Failed to submit feedback')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div>
      {/* Section header */}
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-3">
          <div className="w-1 h-5 bg-lenovo-red" />
          <h2 className="font-mono text-xs uppercase tracking-widest text-tp-400">
            Feedback
          </h2>
          <span className="tp-badge text-tp-500 bg-tp-800 border border-tp-700">
            {feedbacks.length}
          </span>
        </div>
        {isReviewer && !showForm && (
          <button onClick={() => setShowForm(true)} className="tp-btn tp-btn-primary text-xs">
            + Add feedback
          </button>
        )}
      </div>

      {/* Feedback form */}
      {showForm && isReviewer && (
        <div className="tp-surface p-6 mb-5 border-lenovo-red/30">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            {/* Dimension scores */}
            <div>
              <label className="tp-label mb-3">Dimension scores</label>
              <div className="grid grid-cols-2 gap-4 mt-2">
                {DIMENSIONS.map(dim => (
                  <div key={dim.key} className="flex items-center justify-between">
                    <span className="font-mono text-xs text-tp-300">{dim.label}</span>
                    <ScoreSelector
                      value={watch(dim.key as any)}
                      onChange={v => setValue(dim.key as any, v)}
                    />
                  </div>
                ))}
              </div>
            </div>

            <div className="tp-divider" />

            {/* Written feedback */}
            <div>
              <label className="tp-label">Written feedback *</label>
              <TextareaAutosize
                {...register('content')}
                minRows={4}
                placeholder="Share specific observations, suggestions, and questions about this idea..."
                className="tp-input w-full resize-none leading-relaxed"
              />
              {errors.content && (
                <p className="mt-1 text-xs font-mono text-lenovo-red">{errors.content.message}</p>
              )}
            </div>

            {/* Settings row */}
            <div className="flex items-center gap-4 flex-wrap">
              {/* Visibility */}
              <div className="flex-1">
                <label className="tp-label mb-2">Visibility</label>
                <div className="flex gap-2">
                  {(['PRIVATE', 'TEAM', 'PUBLIC'] as Visibility[]).map(v => (
                    <button
                      key={v}
                      type="button"
                      onClick={() => setValue('visibility', v)}
                      className={`
                        tp-badge border cursor-pointer transition-all text-2xs
                        ${visibility === v
                          ? 'border-lenovo-red text-lenovo-red bg-lenovo-red/10'
                          : 'border-tp-600 text-tp-400 hover:border-tp-400'
                        }
                      `}
                    >
                      {v}
                    </button>
                  ))}
                </div>
              </div>

              {/* Anonymous toggle */}
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setValue('isAnonymous', !isAnonymous)}
                  className={`
                    w-9 h-5 rounded-full border transition-all relative
                    ${isAnonymous ? 'bg-lenovo-red border-lenovo-red' : 'bg-tp-800 border-tp-600'}
                  `}
                >
                  <div className={`
                    absolute top-0.5 w-4 h-4 rounded-full bg-white transition-all
                    ${isAnonymous ? 'left-4' : 'left-0.5'}
                  `} />
                </button>
                <span className="font-mono text-xs text-tp-400">Anonymous</span>
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-3">
              <button type="submit" disabled={submitting} className="tp-btn tp-btn-primary text-xs">
                {submitting ? 'Submitting...' : 'Submit feedback →'}
              </button>
              <button type="button" onClick={() => setShowForm(false)} className="tp-btn tp-btn-ghost text-xs">
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Feedback list */}
      {feedbacks.length === 0 ? (
        <div className="tp-surface p-8 text-center">
          <p className="font-mono text-xs text-tp-600">No feedback yet</p>
        </div>
      ) : (
        <div className="space-y-3">
          {feedbacks.map(f => (
            <FeedbackCard key={f.id} feedback={f} isOwner={isOwner} />
          ))}
        </div>
      )}
    </div>
  )
}
