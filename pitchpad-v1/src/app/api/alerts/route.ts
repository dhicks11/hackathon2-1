// src/app/api/alerts/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { getSupabaseServerClient } from '@/lib/supabase'

export async function GET(req: NextRequest) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const sb = getSupabaseServerClient()
  const { data } = await sb.from('alerts')
    .select('*').eq('user_id', session.user.id)
    .order('created_at', { ascending: false }).limit(50)
  return NextResponse.json({ data })
}

export async function PATCH(req: NextRequest) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { id, all } = await req.json()
  const sb = getSupabaseServerClient()
  if (all) {
    // @ts-ignore - alerts table not in generated types
    await sb.from('alerts').update({ read: true }).eq('user_id', session.user.id)
  } else if (id) {
    // @ts-ignore - alerts table not in generated types
    await sb.from('alerts').update({ read: true }).eq('id', id).eq('user_id', session.user.id)
  }
  return NextResponse.json({ success: true })
}
