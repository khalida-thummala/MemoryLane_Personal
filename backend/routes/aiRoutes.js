import express from 'express';
import { generateVideoSlideshow } from '../controllers/aiController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.post('/generate-video', protect, generateVideoSlideshow);

export default router;
