import dotenv from 'dotenv';
import * as memoryService from './backend/services/memoryService.js';

dotenv.config({ path: './backend/.env' });

const test = async () => {
    try {
        console.log('Testing Reminisce Service...');
        // Use a dummy user ID or one from the DB
        const userId = '550e8400-e29b-41d4-a716-446655440000'; // Change this to a real ID if needed
        const filters = {
            startDate: '2026-03-01',
            endDate: '2026-03-04',
            tag: '',
            milestone: false
        };
        const memories = await memoryService.getReminisceMemoriesService(userId, filters);
        console.log('Found memories:', memories.length);
        process.exit(0);
    } catch (err) {
        console.error('SERVICE ERROR:', err);
        process.exit(1);
    }
};

test();
