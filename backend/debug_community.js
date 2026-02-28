import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

// Force load env from backend/.env
dotenv.config({ path: './backend/.env' });

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
    console.error('Missing URL or Keys:', { supabaseUrl: !!supabaseUrl, supabaseAnonKey: !!supabaseAnonKey });
}

async function debug() {
    console.log("--- Testing with Anon Client ---");
    const supabase = createClient(supabaseUrl, supabaseAnonKey);
    const { data: anonData, error: anonError } = await supabase
        .from('memories')
        .select('id, title, is_public')
        .eq('is_public', true);

    if (anonError) console.error("Anon Error:", anonError.message);
    else console.log(`Anon Result: ${anonData?.length} rows found`);

    if (supabaseServiceKey) {
        console.log("\n--- Testing with Admin Client ---");
        const adminSupabase = createClient(supabaseUrl, supabaseServiceKey);
        const { data: adminData, error: adminError } = await adminSupabase
            .from('memories')
            .select('id, title, is_public')
            .eq('is_public', true);

        if (adminError) console.error("Admin Error:", adminError.message);
        else console.log(`Admin Result: ${adminData?.length} rows found`);
    } else {
        console.log("\n--- Admin Key not found ---");
    }
}

debug();
