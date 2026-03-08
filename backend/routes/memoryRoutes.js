import express from 'express';
import {
    getMemories,
    getCommunityMemories,
    createMemory,
    deleteMemory,
    updateMemory,
    commentOnMemory,
    updateComment,
    deleteComment,
    replyToComment,
    getMemoryById,
    likeMemory,
    getReminisceMemories,
    getSavedVideos,
    saveSearch,
    getSavedSearches,
    deleteSavedSearch,
    deleteVideo
} from '../controllers/memoryController.js';
import { generateVideoSlideshow, getReminisceHighlights } from '../controllers/aiController.js';
import { protect, optionalAuth } from '../middleware/authMiddleware.js';
import { canModifyMemory, canModifyComment, isMemoryOwnerForReply } from '../middleware/ownershipMiddleware.js';
import upload from '../middleware/uploadMiddleware.js';

const router = express.Router();

// Community feed — works unauthenticated, but passing a token enriches it
router.get('/community', optionalAuth, getCommunityMemories);

// ── Reminisce / Flashback routes ──────────────────────────────────────────
// These must come BEFORE /:id because 'reminisce' would be caught as an ID
router.get('/reminisce', protect, getReminisceMemories);
router.get('/reminisce/highlights', protect, getReminisceHighlights);
router.get('/reminisce/videos', protect, getSavedVideos);
router.post('/reminisce/generate', protect, generateVideoSlideshow);
router.post('/reminisce/save-search', protect, saveSearch);
router.get('/reminisce/saved-searches', protect, getSavedSearches);
router.delete('/reminisce/saved-searches/:id', protect, deleteSavedSearch);
router.delete('/reminisce/videos/:id', protect, deleteVideo);

// ── All routes below require auth ────────────────────────────────────────
router.use(protect);

router.route('/')
    .get(getMemories)
    .post(upload.array('mediaFiles', 10), createMemory);

router.route('/:id')
    .get(getMemoryById)
    .put(canModifyMemory, upload.array('mediaFiles', 10), updateMemory)
    .delete(canModifyMemory, deleteMemory);

// Like toggle
router.post('/:id/like', likeMemory);

// Community stream comments
router.post('/:id/comment', commentOnMemory);
router.route('/comments/:id')
    .put(canModifyComment, updateComment)
    .delete(canModifyComment, deleteComment);

// Nested replies by owner
router.post('/:memoryId/comments/:commentId/reply', isMemoryOwnerForReply, replyToComment);

export default router;
