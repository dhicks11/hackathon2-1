// src/app/review/page.tsx
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { formatRelative, truncate } from '@/lib/utils'

export default async function ReviewQueuePage() {
  const session = await auth()
  if (!session) redirect('/auth/login')
  if (session.user.role === 'CREATOR') redirect('/dashboard')

  const ideas = await prisma.idea.findMany({
    where: {
      status: { in: ['SUBMITTED', 'IN_REVIEW'] },
      visibility: { in: ['TEAM', 'PUBLIC'] },
    },
    include: {
      author: { select: { name: true, email: true } },
      _count: { select: { feedbacks: true } },
    },
    orderBy: { createdAt: 'asc' },
  })

  const submitted  = ideas.filter(i => i.status === 'SUBMITTED')
  const inReview   = ideas.filter(i => i.status === 'IN_REVIEW')

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <div className="mb-8 animate-fade-up">
        <div className="w-6 h-0.5 bg-lenovo-red mb-4" />
        <h1 className="text-3xl font-light text-tp-white">Review queue</h1>
        <p className="text-tp-400 text-sm font-light mt-1">
          {submitted.length} awaiting first review · {inReview.length} in progress
        </p>
      </div>

      {/* Submitted (priority) */}
      {submitted.length > 0 && (
        <div className="mb-8 animate-fade-up stagger-1" style={{ animationFillMode: 'backwards' }}>
          <div className="flex items-center gap-2 mb-4">
            <span className="status-dot bg-signal-amber" />
            <h2 className="font-mono text-xs uppercase tracking-widest text-tp-400">
              Needs first review
            </h2>
            <span className="tp-badge text-signal-amber bg-signal-amber/10 border border-signal-amber/20">
              {submitted.length}
            </span>
          </div>
          <IdeaList ideas={submitted} />
        </div>
      )}

      {/* In review */}
      {inReview.length > 0 && (
        <div className="animate-fade-up stagger-2" style={{ animationFillMode: 'backwards' }}>
          <div className="flex items-center gap-2 mb-4">
            <span className="status-dot bg-signal-blue" />
            <h2 className="font-mono text-xs uppercase tracking-widest text-tp-400">
              In progress
            </h2>
            <span className="tp-badge text-signal-blue bg-signal-blue/10 border border-signal-blue/20">
              {inReview.length}
            </span>
          </div>
          <IdeaList ideas={inReview} />
        </div>
      )}

      {ideas.length === 0 && (
        <div className="tp-surface p-12 text-center animate-fade-up">
          <p className="font-mono text-xs text-tp-600">Queue is empty — check back later</p>
        </div>
      )}
    </div>
  )
}

function IdeaList({ ideas }: { ideas: any[] }) {
  return (
    <div className="space-y-2">
      {ideas.map((idea, i) => (
        <Link
          key={idea.id}
          href={`/ideas/${idea.id}`}
          className={`
            tp-surface flex gap-4 p-5 hover:border-tp-500 transition-all group
            animate-fade-up stagger-${Math.min(i + 1, 5)}
          `}
          style={{ animationFillMode: 'backwards' }}
        >
          {/* Index */}
          <span className="font-mono text-xs text-tp-700 tabular-nums w-5 shrink-0 mt-0.5">
            {String(i + 1).padStart(2, '0')}
          </span>

          {/* Main */}
          <div className="flex-1 min-w-0">
            <h3 className="font-mono text-sm text-tp-white group-hover:text-lenovo-red transition-colors mb-1">
              {idea.title}
            </h3>
            <p className="text-xs text-tp-500 font-light leading-relaxed">
              {truncate(idea.problem, 120)}
            </p>
            <div className="flex items-center gap-3 mt-2">
              <span className="font-mono text-2xs text-tp-600">
                by {idea.author?.name ?? idea.author?.email}
              </span>
              <span className="font-mono text-2xs text-tp-600">·</span>
              <span className="font-mono text-2xs text-tp-600">
                {formatRelative(idea.createdAt)}
              </span>
              {idea.tags?.slice(0, 3).map((tag: string) => (
                <span key={tag} className="tp-badge text-2xs text-tp-600 bg-tp-800 border-tp-700">
                  {tag}
                </span>
              ))}
            </div>
          </div>

          {/* Meta */}
          <div className="shrink-0 text-right">
            <p className="font-mono text-xs text-tp-400">
              {idea._count.feedbacks} <span className="text-tp-600">fb</span>
            </p>
            <p className="font-mono text-2xs text-tp-700 mt-1">{idea.visibility}</p>
          </div>
          <span className="text-tp-600 group-hover:text-tp-300 transition-colors text-sm self-center">→</span>
        </Link>
      ))}
    </div>
  )
}
