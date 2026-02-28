import express from 'express';
import { exportDataJson, exportDataZip } from '../controllers/exportController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.get('/json', protect, exportDataJson);
router.get('/zip', protect, exportDataZip);

export default router;
