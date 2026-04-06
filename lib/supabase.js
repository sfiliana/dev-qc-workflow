import { createClient } from '@supabase/supabase-js'

// Ini mengambil data URL dan KEY yang sudah otomatis ada di Vercel/Env
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

// Ini adalah "Remote Control" kamu
export const supabase = createClient(supabaseUrl, supabaseAnonKey)
