import express from 'express';
import { generateVideoSlideshow, generateMemoryDescription } from '../controllers/aiController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.post('/generate-video', protect, generateVideoSlideshow);

// POST /api/ai/describe — Gemini Vision generates title + description from image(s)
router.post('/describe', protect, generateMemoryDescription);

export default router;
