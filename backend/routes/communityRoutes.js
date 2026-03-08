import express from 'express';
import { getCommunityMemories } from '../controllers/memoryController.js';
import { optionalAuth } from '../middleware/authMiddleware.js';

const router = express.Router();

// GET /api/community?filter=all|following
// Public route — optionalAuth attaches user if token is provided but does NOT block unauthenticated requests
router.get('/', optionalAuth, getCommunityMemories);

export default router;
