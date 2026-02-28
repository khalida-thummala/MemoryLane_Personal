import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('Missing SUPABASE_URL or SUPABASE_ANON_KEY in environment');
}

// Client-safe client (use this for Auth.signUp, signIn, and basic RLS operations)
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

/**
 * Admin client — bypasses RLS for server-side operations
 * Only initialize if service key is actually provided
 */
let adminSupabase = null;
if (supabaseServiceKey && supabaseServiceKey !== 'your_supabase_service_role_key_here') {
    adminSupabase = createClient(supabaseUrl, supabaseServiceKey, {
        auth: {
            autoRefreshToken: false,
            persistSession: false,
        }
    });
} else {
    console.warn('⚠️ SUPABASE_SERVICE_ROLE_KEY is missing or invalid. Admin features will be restricted.');
}

// Default export is the standard client to prevent "Invalid API Key" during public actions
export default supabase;
export { adminSupabase };
