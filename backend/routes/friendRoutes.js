import express from 'express';
import {
    sendFriendRequest,
    acceptFriendRequest,
    rejectFriendRequest,
    cancelFriendRequest,
    getPendingFriendRequests,
    getSentFriendRequests,
    getFriends,
    getNotifications,
    markNotificationRead
} from '../controllers/friendController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.get('/', protect, getFriends);
router.get('/pending', protect, getPendingFriendRequests);
router.get('/sent', protect, getSentFriendRequests);
router.post('/request/:id', protect, sendFriendRequest);
router.post('/accept/:id', protect, acceptFriendRequest);
router.post('/reject/:id', protect, rejectFriendRequest);
router.post('/cancel/:id', protect, cancelFriendRequest);
router.get('/notifications', protect, getNotifications);
router.put('/notifications/:id', protect, markNotificationRead);

export default router;
