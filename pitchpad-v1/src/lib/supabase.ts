// src/lib/supabase.ts
// Supabase JS Client — browser + server singleton
import { createClient } from '@supabase/supabase-js'
import type { Database } from '@/types/supabase'

const url  = process.env.NEXT_PUBLIC_SUPABASE_URL!
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

// Browser client (singleton pattern)
let browserClient: ReturnType<typeof createClient<Database>> | null = null

export function getSupabaseBrowserClient() {
  if (browserClient) return browserClient
  browserClient = createClient<Database>(url, anonKey, {
    auth: { persistSession: true, autoRefreshToken: true },
  })
  return browserClient
}

// Server client (service role — API routes only, never expose to browser)
export function getSupabaseServerClient() {
  return createClient<Database>(url, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
    auth: { autoRefreshToken: false, persistSession: false },
  })
}

// Shorthand for components
export const supabase = typeof window !== 'undefined'
  ? getSupabaseBrowserClient()
  : null
