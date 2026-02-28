import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

async function debug() {
    console.log("--- Testing with Anon Client ---");
    const supabase = createClient(supabaseUrl, supabaseAnonKey);
    const { data: anonData, error: anonError } = await supabase
        .from('memories')
        .select('*')
        .eq('is_public', true);

    if (anonError) console.error("Anon Error:", anonError.message);
    else console.log(`Anon Result: ${anonData?.length} public memories found`);

    if (anonData && anonData.length > 0) {
        const ids = anonData.map(m => m.id);
        const { data: mediaData, error: mediaError } = await supabase
            .from('memory_media')
            .select('*')
            .in('memory_id', ids);

        if (mediaError) console.error("Media Fetch Error:", mediaError.message);
        else console.log(`Media Result: ${mediaData?.length} media items found for these memories`);

        if (mediaData) {
            console.log("Media Distribution:", mediaData.map(m => m.media_type));
        }
    }
}

debug();
