// src/types/supabase.ts
// Auto-generate the real version with: npx supabase gen types typescript --project-id <id> > src/types/supabase.ts

export type Json = string | number | boolean | null | { [key: string]: Json } | Json[]

export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string
          name: string | null
          email: string
          role: 'CREATOR' | 'REVIEWER' | 'ADMIN'
          image: string | null
          created_at: string
          updated_at: string
        }
        Insert: Omit<Database['public']['Tables']['users']['Row'], 'created_at' | 'updated_at'>
        Update: Partial<Database['public']['Tables']['users']['Insert']>
      }
      ideas: {
        Row: {
          id: string
          title: string
          problem: string
          solution: string
          market: string
          ask: string | null
          tags: string[]
          status: 'DRAFT' | 'SUBMITTED' | 'IN_REVIEW' | 'COMPLETE'
          visibility: 'PRIVATE' | 'TEAM' | 'PUBLIC'
          pitch_score: number | null
          author_id: string
          created_at: string
          updated_at: string
        }
        Insert: Omit<Database['public']['Tables']['ideas']['Row'], 'created_at' | 'updated_at'>
        Update: Partial<Database['public']['Tables']['ideas']['Insert']>
      }
      feedbacks: {
        Row: {
          id: string
          content: string
          visibility: 'PRIVATE' | 'TEAM' | 'PUBLIC'
          is_anonymous: boolean
          score_clarity: number | null
          score_market: number | null
          score_innovation: number | null
          score_execution: number | null
          idea_id: string
          reviewer_id: string
          created_at: string
          updated_at: string
        }
        Insert: Omit<Database['public']['Tables']['feedbacks']['Row'], 'created_at' | 'updated_at'>
        Update: Partial<Database['public']['Tables']['feedbacks']['Insert']>
      }
      pitch_decks: {
        Row: {
          id: string
          slides: Json
          version: number
          idea_id: string
          created_at: string
        }
        Insert: Omit<Database['public']['Tables']['pitch_decks']['Row'], 'created_at'>
        Update: Partial<Database['public']['Tables']['pitch_decks']['Insert']>
      }
      practice_sessions: {
        Row: {
          id: string
          transcript: string
          duration_sec: number
          filler_words: number
          pacing_score: number | null
          clarity_score: number | null
          keyword_match: number | null
          ai_feedback: string | null
          idea_id: string
          user_id: string
          created_at: string
        }
        Insert: Omit<Database['public']['Tables']['practice_sessions']['Row'], 'created_at'>
        Update: Partial<Database['public']['Tables']['practice_sessions']['Insert']>
      }
      alerts: {
        Row: {
          id: string
          user_id: string
          type: 'FEEDBACK_RECEIVED' | 'IDEA_REVIEWED' | 'DECK_READY' | 'SYSTEM'
          title: string
          message: string
          read: boolean
          idea_id: string | null
          created_at: string
        }
        Insert: Omit<Database['public']['Tables']['alerts']['Row'], 'created_at'>
        Update: Partial<Database['public']['Tables']['alerts']['Insert']>
      }
    }
    Views: {}
    Functions: {}
    Enums: {}
  }
}
