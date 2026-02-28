import cron from 'node-cron';
import supabase from '../config/supabase.js';
import { sendMilestoneReminder } from './emailService.js';

// Run every day at 8:00 AM
export const initCronJobs = () => {
    cron.schedule('0 8 * * *', async () => {
        console.log('Running daily milestone reminder check...');
        try {
            const today = new Date();
            const currentMonth = today.getMonth() + 1; // 1-12
            const currentDay = today.getDate(); // 1-31

            // Find all memories flagged as milestones using Supabase
            // Note: We use the service role client (supabase) to bypass RLS for background jobs
            const { data: milestones, error } = await supabase
                .from('memories')
                .select('*, profiles(full_name, id)')
                .eq('is_milestone', true);

            if (error) throw error;
            if (!milestones) return;

            // Fetch emails from auth.admin as they aren't in the profiles table (best practice for security)
            const { data: authUsers, error: authError } = await supabase.auth.admin.listUsers();
            if (authError) throw authError;

            for (const memory of milestones) {
                const authUser = authUsers.users.find(u => u.id === memory.user_id);
                if (!authUser || !authUser.email) continue;

                const memDate = new Date(memory.memory_date);
                if (isNaN(memDate)) continue;

                const memMonth = memDate.getMonth() + 1;
                const memDay = memDate.getDate();

                // If it's the exact anniversary month/day
                if (memMonth === currentMonth && memDay === currentDay) {
                    const yearsAgo = today.getFullYear() - memDate.getFullYear();

                    if (yearsAgo > 0) {
                        try {
                            const userObj = {
                                name: memory.profiles?.full_name || authUser.user_metadata?.full_name || 'MemoryLane User',
                                email: authUser.email
                            };
                            await sendMilestoneReminder(userObj, memory, yearsAgo);
                            console.log(`Sent milestone reminder to ${userObj.email} for memory: ${memory.title}`);
                        } catch (err) {
                            console.error(`Failed to send milestone reminder to ${authUser.email}:`, err.message);
                        }
                    }
                }
            }
        } catch (error) {
            console.error('Error running milestone cron job:', error.message);
        }
    });
};
