import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://yqbdmzdbthlndeegdfqr.supabase.co'
const supabaseAnonKey = 'sb_publishable_wYteLjPzxzETxjfyF5dFEQ_isVpqeMn'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
