// src/lib/utils.ts
import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatDate(date: Date | string): string {
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(new Date(date))
}

export function formatRelative(date: Date | string): string {
  const now = new Date()
  const d = new Date(date)
  const diff = now.getTime() - d.getTime()
  const seconds = Math.floor(diff / 1000)
  const minutes = Math.floor(seconds / 60)
  const hours = Math.floor(minutes / 60)
  const days = Math.floor(hours / 24)

  if (days > 7) return formatDate(date)
  if (days > 0) return `${days}d ago`
  if (hours > 0) return `${hours}h ago`
  if (minutes > 0) return `${minutes}m ago`
  return 'just now'
}

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)+/g, '')
}

export function truncate(text: string, length: number): string {
  if (text.length <= length) return text
  return text.slice(0, length).trimEnd() + '…'
}

export function scoreToLabel(score: number): { label: string; color: string } {
  if (score >= 80) return { label: 'Strong', color: 'text-signal-green' }
  if (score >= 60) return { label: 'Good', color: 'text-signal-amber' }
  if (score >= 40) return { label: 'Fair', color: 'text-tp-200' }
  return { label: 'Needs work', color: 'text-lenovo-red' }
}

export const FILLER_WORDS = [
  'um', 'uh', 'like', 'you know', 'basically', 'literally',
  'actually', 'so', 'right', 'okay', 'kind of', 'sort of',
]

export function countFillerWords(transcript: string): number {
  const lower = transcript.toLowerCase()
  return FILLER_WORDS.reduce((count, word) => {
    const regex = new RegExp(`\\b${word}\\b`, 'gi')
    return count + (lower.match(regex)?.length ?? 0)
  }, 0)
}
