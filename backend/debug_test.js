import dotenv from 'dotenv';
import * as memoryService from './services/memoryService.js';
import * as albumService from './services/albumService.js';

dotenv.config();

const userId = '8ce6fb1e-b47a-4633-889d-b9a35bf1889d'; // Real user ID for khalida

const test = async () => {
    try {
        console.log('--- Testing getReminisceMemoriesService ---');
        const filters = {
            startDate: '2026-03-01',
            endDate: '2026-03-04',
            tag: '',
            milestone: false
        };
        const memories = await memoryService.getReminisceMemoriesService(userId, filters);
        console.log('SUCCESS: Found', memories.length, 'memories');

        console.log('--- Testing getAlbumsService ---');
        const albums = await albumService.getAlbumsService(userId);
        console.log('SUCCESS: Found', albums.length, 'albums');
        if (albums.length > 0) console.dir(albums[0], { depth: 2 });

        console.log('--- Testing getSavedVideos ---');
        const videos = await memoryService.getSavedVideosService(userId);
        console.log('SUCCESS: Found', videos.length, 'videos');

        process.exit(0);
    } catch (err) {
        console.error('CRITICAL SERVICE ERROR:', err.message);
        if (err.stack) console.error(err.stack);
        process.exit(1);
    }
};

test();
