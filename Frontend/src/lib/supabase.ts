import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://xykoedllapxslyxbvbsd.supabase.co'
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh5a29lZGxsYXB4c2x5eGJ2YnNkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODUzMzI4MDcsImV4cCI6MjEwMDkwODgwN30.slusGtTHh2z__OFaOjXt_Yf9JaAlLS83Jc0FgFmF_ro'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
export default supabase
