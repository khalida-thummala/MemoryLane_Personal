import express from 'express';
import {
    getAlbums,
    createAlbum,
    getAlbumById,
    updateAlbum,
    deleteAlbum,
    addMemoryToAlbum,
    getPendingRequests,
    acceptInvitation,
    rejectInvitation,
    inviteCollaborator
} from '../controllers/albumController.js';
import { protect } from '../middleware/authMiddleware.js';
import { isAlbumOwner } from '../middleware/ownershipMiddleware.js';

const router = express.Router();

router.use(protect);

// ── Requests & Collaborations ──────────────────────────────────────────
router.get('/requests/pending', getPendingRequests);
router.post('/:id/accept', acceptInvitation);
router.post('/:id/reject', rejectInvitation);
router.post('/:id/request', inviteCollaborator);

router.route('/')
    .get(getAlbums)
    .post(createAlbum);

router.route('/:id')
    .get(getAlbumById)
    .put(isAlbumOwner, updateAlbum)
    .delete(isAlbumOwner, deleteAlbum);

// For adding memories to communal albums
router.post('/:id/memories/:memoryId', addMemoryToAlbum);

export default router;
