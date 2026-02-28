import express from 'express';
import { getMemories, createMemory, reminisceMemories, deleteMemory, updateMemory, getSharedMemory, getCommunityMemories, likeMemory, commentOnMemory, generateReminisceVideo, getReminisceVideos } from '../controllers/memoryController.js';
import { protect, optionalProtect } from '../middleware/authMiddleware.js';
import upload from '../middleware/uploadMiddleware.js';

const router = express.Router();

router.get('/community', optionalProtect, getCommunityMemories);
router.get('/public/:id', getSharedMemory);

router.route('/')
    .get(protect, getMemories)
    .post(protect, upload.array('mediaFiles', 10), createMemory);

router.get('/reminisce', protect, reminisceMemories);
router.post('/reminisce/generate', protect, generateReminisceVideo);
router.get('/reminisce/videos', protect, getReminisceVideos);

router.route('/:id')
    .put(protect, upload.array('mediaFiles', 10), updateMemory)
    .delete(protect, deleteMemory);

router.post('/:id/like', protect, likeMemory);
router.post('/:id/comment', protect, commentOnMemory);

export default router;
