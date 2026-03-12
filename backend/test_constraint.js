import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkConstraint() {
    try {
        console.log("Checking constraint using RPC or selecting from a table that might expose it if possible, but actually Supabase JS doesn't support querying information_schema directly from the client without an RPC.");
        // We will just try a few inserts and see what fails/succeeds to guess the role.
        
        const testRoles = ['editor', 'contributor', 'viewer', 'member', 'admin', 'collaborator', 'guest'];
        
        for (const role of testRoles) {
            console.log(`Trying role: ${role}`);
            const { data, error } = await supabase
                .from('album_collaborators')
                .insert([{
                    album_id: '11111111-1111-1111-1111-111111111111', // Dummy ID
                    user_id: '11111111-1111-1111-1111-111111111111',  // Dummy ID
                    role: role,
                    status: 'pending'
                }]);
                
            if (error) {
                if (error.message.includes('violates check constraint "album_collaborators_role_check"')) {
                    console.log(`- ${role} violates constraint`);
                } else if (error.code === '23503') { 
                    // Foreign key violation means the role PASSED the check constraint!
                    console.log(`- ${role} PASSED the role check! (Failed on foreign key, which is expected)`);
                } else {
                    console.log(`- ${role} error:`, error.message);
                }
            } else {
                console.log(`- ${role} SUCCESS!`);
            }
        }
    } catch (err) {
        console.error("Script error:", err);
    }
}

checkConstraint();
