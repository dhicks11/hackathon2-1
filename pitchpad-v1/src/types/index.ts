// src/types/index.ts

export type UserRole = 'CREATOR' | 'REVIEWER' | 'ADMIN'
export type IdeaStatus = 'DRAFT' | 'SUBMITTED' | 'IN_REVIEW' | 'COMPLETE'
export type Visibility = 'PRIVATE' | 'TEAM' | 'PUBLIC'

export interface User {
  id: string
  name: string | null
  email: string
  role: UserRole
  image?: string | null
  createdAt: Date
}

export interface Idea {
  id: string
  title: string
  problem: string
  solution: string
  market: string
  ask?: string | null
  tags: string[]
  status: IdeaStatus
  visibility: Visibility
  pitchScore?: number | null
  authorId: string
  author?: User
  feedbacks?: Feedback[]
  createdAt: Date
  updatedAt: Date
  _count?: { feedbacks: number }
}

export interface Feedback {
  id: string
  content: string
  visibility: Visibility
  isAnonymous: boolean
  scoreclarity?: number | null
  scoreMarket?: number | null
  scoreInnovation?: number | null
  scoreExecution?: number | null
  ideaId: string
  reviewerId: string
  reviewer?: User
  createdAt: Date
}

export interface PitchSlide {
  id: number
  type: 'cover' | 'problem' | 'solution' | 'market' | 'traction' | 'team' | 'ask' | 'summary'
  title: string
  headline: string
  body: string
  bullets?: string[]
  metric?: { value: string; label: string }
}

export interface PitchDeck {
  id: string
  slides: PitchSlide[]
  version: number
  ideaId: string
  createdAt: Date
}

export interface PracticeSession {
  id: string
  transcript: string
  durationSec: number
  fillerWords: number
  pacingScore?: number | null
  clarityScore?: number | null
  keywordMatch?: number | null
  aiFeedback?: string | null
  ideaId: string
  userId: string
  createdAt: Date
}

// Form input types
export interface IdeaFormData {
  title: string
  problem: string
  solution: string
  market: string
  ask?: string
  tags?: string[]
  visibility: Visibility
}

export interface FeedbackFormData {
  content: string
  visibility: Visibility
  isAnonymous: boolean
  scoreclarity?: number
  scoreMarket?: number
  scoreInnovation?: number
  scoreExecution?: number
}

// API response types
export interface ApiResponse<T> {
  data?: T
  error?: string
  message?: string
}
