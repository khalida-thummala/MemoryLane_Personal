import app from './app.js';

// Initialize Scheduled Background Jobs
import { initCronJobs } from './utils/cronService.js';
initCronJobs();

const PORT = process.env.PORT || 5000;

app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running in ${process.env.NODE_ENV} mode on port ${PORT} with Supabase backend! ✨`);
});
