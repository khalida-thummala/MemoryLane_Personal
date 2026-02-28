import app from './app.js';

// Initialize Scheduled Background Jobs (Memory Milestones)
import { initCronJobs } from './utils/cronService.js';
initCronJobs();

const PORT = process.env.PORT || 5001;

app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running in ${process.env.NODE_ENV} mode on port ${PORT}!`);
    console.log(`📦 Database: Supabase (${process.env.SUPABASE_URL})`);
});
