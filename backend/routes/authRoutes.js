import express from 'express';
import {
    registerUser, loginUser, googleLogin,
    getUserProfile, refreshAccessToken, logoutUser,
    updateUserProfile, changePassword, deleteAccount,
    searchUsers, followUser, unfollowUser
} from '../controllers/authController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.post('/register', registerUser);
router.post('/login', loginUser);
router.post('/google', googleLogin);
router.post('/refresh', refreshAccessToken);

router.post('/logout', protect, logoutUser);
router.get('/profile', protect, getUserProfile);
router.get('/users/search', protect, searchUsers);
router.post('/users/:id/follow', protect, followUser);
router.post('/users/:id/unfollow', protect, unfollowUser);
router.put('/profile', protect, updateUserProfile);
router.put('/password', protect, changePassword);
router.delete('/account', protect, deleteAccount);

export default router;
