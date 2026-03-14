// src/lib/alerts.ts
import { getSupabaseServerClient } from '@/lib/supabase'

type AlertType = 'FEEDBACK_RECEIVED' | 'IDEA_REVIEWED' | 'DECK_READY' | 'SYSTEM'

export async function createAlert(params: {
  userId: string
  type: AlertType
  title: string
  message: string
  ideaId?: string
}) {
  const sb = getSupabaseServerClient()
  await (sb.from('alerts') as any).insert({
    id: crypto.randomUUID(),
    user_id: params.userId,
    type: params.type,
    title: params.title,
    message: params.message,
    idea_id: params.ideaId ?? null,
    read: false,
  })
}
