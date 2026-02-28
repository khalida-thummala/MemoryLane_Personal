import express from 'express';
import {
    getAlbums,
    createAlbum,
    getAlbumById,
    updateAlbum,
    deleteAlbum,
    addMemoryToAlbum,
    removeMemoryFromAlbum,
    generateInviteToken,
    joinAlbum,
    sendCollabRequest,
    acceptCollabRequest,
    rejectCollabRequest,
    getPendingRequests
} from '../controllers/albumController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

// Apply protect middleware to all routes
router.use(protect);

router.post('/join/:token', joinAlbum);
router.post('/:id/invite', generateInviteToken);

router.route('/')
    .get(getAlbums)
    .post(createAlbum);

router.get('/requests/pending', getPendingRequests);
router.post('/:id/request', sendCollabRequest);
router.post('/:id/accept', acceptCollabRequest);
router.post('/:id/reject', rejectCollabRequest);

router.route('/:id')
    .get(getAlbumById)
    .put(updateAlbum)
    .delete(deleteAlbum);

router.route('/:id/memories/:memoryId')
    .post(addMemoryToAlbum)
    .delete(removeMemoryFromAlbum);

export default router;
