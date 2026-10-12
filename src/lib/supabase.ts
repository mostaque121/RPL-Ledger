import { createClient } from '@supabase/supabase-js'
import type { Database } from '@/types/db'

const url = import.meta.env.VITE_SUPABASE_URL
const key = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY

/** False when `.env.local` is missing the Supabase URL or key. The app shows a setup screen instead. */
export const isSupabaseConfigured = Boolean(url && key)

export const supabase = createClient<Database>(
  url || 'http://localhost:54321',
  key || 'missing-key',
  { auth: { persistSession: true, autoRefreshToken: true } },
)
