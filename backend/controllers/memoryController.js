import * as memoryService from '../services/memoryService.js';
import { validateMemory } from '../models/memoryModel.js';

/**
 * createMemory - Handles memory creation with media and tags
 */
export const createMemory = async (req, res) => {
    try {
        const { error } = validateMemory(req.body);
        if (error) return res.status(400).json({ message: error.details[0].message });

        // Ensure photos, videos, and voice notes are arrays
        req.body.photos = req.body.photos ? (Array.isArray(req.body.photos) ? req.body.photos : [req.body.photos]) : [];
        req.body.videos = req.body.videos ? (Array.isArray(req.body.videos) ? req.body.videos : [req.body.videos]) : [];
        req.body.voiceNotes = req.body.voiceNotes ? (Array.isArray(req.body.voiceNotes) ? req.body.voiceNotes : [req.body.voiceNotes]) : [];

        // Process uploaded files if any
        if (req.files && req.files.length > 0) {
            req.files.forEach(file => {
                const url = `/${file.path.replace(/\\/g, '/')}`;
                if (file.mimetype.startsWith('image/')) req.body.photos.push(url);
                else if (file.mimetype.startsWith('video/')) req.body.videos.push(url);
                else if (file.mimetype.startsWith('audio/')) req.body.voiceNotes.push(url);
            });
        }

        // Handle tags string to array conversion if it comes as string
        if (typeof req.body.tags === 'string') {
            req.body.tags = [req.body.tags];
        } else if (!req.body.tags) {
            req.body.tags = [];
        }

        const memory = await memoryService.createMemoryService(req.body, req.user.id);
        res.status(201).json(memory);
    } catch (error) {
        console.error('createMemory error:', error);
        res.status(500).json({ message: error.message });
    }
};

/**
 * getMemories - Fetches memories by album or user
 */
export const getMemories = async (req, res) => {
    try {
        const memories = await memoryService.getMemoriesByAlbumService(req.query.albumId, req.user?.id);
        res.json(memories);
    } catch (error) {
        console.error('getMemories error:', error);
        res.status(500).json({ message: error.message });
    }
};

/**
 * getMemoryById
 */
export const getMemoryById = async (req, res) => {
    try {
        const memory = await memoryService.getMemoryByIdService(req.params.id);
        res.json(memory);
    } catch (error) {
        console.error('getMemoryById error:', error);
        res.status(500).json({ message: error.message });
    }
};

/**
 * getCommunityMemories - Fetches public community feed
 */
export const getCommunityMemories = async (req, res) => {
    try {
        const memories = await memoryService.getCommunityMemoriesService(req.user?.id, req.query.filter);
        res.json(memories);
    } catch (error) {
        console.error('getCommunityMemories error:', error);
        res.status(500).json({ message: error.message });
    }
};

/**
 * likeMemory - Toggles like status
 */
export const likeMemory = async (req, res) => {
    try {
        const result = await memoryService.toggleLikeService(req.params.id, req.user.id);
        res.json(result);
    } catch (error) {
        console.error('likeMemory error:', error);
        res.status(500).json({ message: error.message });
    }
};

/**
 * updateMemory
 */
export const updateMemory = async (req, res) => {
    try {
        // Ensure photos, videos, and voice notes are arrays
        req.body.photos = req.body.photos ? (Array.isArray(req.body.photos) ? req.body.photos : [req.body.photos]) : [];
        req.body.videos = req.body.videos ? (Array.isArray(req.body.videos) ? req.body.videos : [req.body.videos]) : [];
        req.body.voiceNotes = req.body.voiceNotes ? (Array.isArray(req.body.voiceNotes) ? req.body.voiceNotes : [req.body.voiceNotes]) : [];

        // Process uploaded files if any
        if (req.files && req.files.length > 0) {
            req.files.forEach(file => {
                const url = `/${file.path.replace(/\\/g, '/')}`;
                if (file.mimetype.startsWith('image/')) req.body.photos.push(url);
                else if (file.mimetype.startsWith('video/')) req.body.videos.push(url);
                else if (file.mimetype.startsWith('audio/')) req.body.voiceNotes.push(url);
            });
        }

        // Handle tags string to array conversion if it comes as string
        if (typeof req.body.tags === 'string') {
            req.body.tags = [req.body.tags];
        } else if (!req.body.tags) {
            req.body.tags = [];
        }

        const memory = await memoryService.updateMemoryService(req.params.id, req.body);
        res.json(memory);
    } catch (error) {
        console.error('updateMemory error:', error);
        res.status(500).json({ message: error.message });
    }
};

/**
 * deleteMemory
 */
export const deleteMemory = async (req, res) => {
    try {
        const result = await memoryService.deleteMemoryService(req.params.id);
        res.json(result);
    } catch (error) {
        console.error('deleteMemory error:', error);
        res.status(500).json({ message: error.message });
    }
};

/**
 * commentOnMemory
 */
export const commentOnMemory = async (req, res) => {
    try {
        const { text, parentId } = req.body;
        const comment = await memoryService.addCommentService(req.params.id, req.user.id, text, parentId);
        res.status(201).json(comment);
    } catch (error) {
        console.error('commentOnMemory error:', error);
        res.status(500).json({ message: error.message });
    }
};

/**
 * updateComment
 */
export const updateComment = async (req, res) => {
    try {
        const { text } = req.body;
        const comment = await memoryService.updateCommentService(req.params.id, text);
        res.json(comment);
    } catch (error) {
        console.error('updateComment error:', error);
        res.status(500).json({ message: error.message });
    }
};

/**
 * deleteComment
 */
export const deleteComment = async (req, res) => {
    try {
        await memoryService.deleteCommentService(req.params.id);
        res.json({ message: 'Comment deleted' });
    } catch (error) {
        console.error('deleteComment error:', error);
        res.status(500).json({ message: error.message });
    }
};

/**
 * replyToComment - Wrapper for nested comments
 */
export const replyToComment = async (req, res) => {
    try {
        const { text } = req.body;
        const comment = await memoryService.addCommentService(req.params.memoryId, req.user.id, text, req.params.commentId);
        res.status(201).json(comment);
    } catch (error) {
        console.error('replyToComment error:', error);
        res.status(500).json({ message: error.message });
    }
};

/**
 * getReminisceMemories
 */
export const getReminisceMemories = async (req, res) => {
    try {
        const { tag, startDate, endDate, milestone } = req.query;
        const memories = await memoryService.getReminisceMemoriesService(req.user.id, {
            tag,
            startDate,
            endDate,
            milestone: milestone === 'true'
        });
        res.json(memories);
    } catch (error) {
        console.error('getReminisceMemories error:', error);
        res.status(500).json({ message: error.message });
    }
};

/**
 * getSavedVideos
 */
export const getSavedVideos = async (req, res) => {
    try {
        const videos = await memoryService.getSavedVideosService(req.user.id);
        res.json(videos);
    } catch (error) {
        console.error('getSavedVideos error:', error);
        res.status(500).json({ message: error.message });
    }
};
/**
 * saveSearch
 */
export const saveSearch = async (req, res) => {
    try {
        const result = await memoryService.saveSearchService(req.user.id, req.body);
        res.status(201).json(result);
    } catch (error) {
        console.error('saveSearch error:', error);
        res.status(500).json({ message: error.message });
    }
};

/**
 * getSavedSearches
 */
export const getSavedSearches = async (req, res) => {
    try {
        const result = await memoryService.getSavedSearchesService(req.user.id);
        res.json(result);
    } catch (error) {
        console.error('getSavedSearches error:', error);
        res.status(500).json({ message: error.message });
    }
};

/**
 * deleteSavedSearch
 */
export const deleteSavedSearch = async (req, res) => {
    try {
        await memoryService.deleteSavedSearchService(req.params.id);
        res.json({ success: true });
    } catch (error) {
        console.error('deleteSavedSearch error:', error);
        res.status(500).json({ message: error.message });
    }
};

/**
 * deleteVideo
 */
export const deleteVideo = async (req, res) => {
    try {
        await memoryService.deleteVideoService(req.params.id);
        res.json({ success: true });
    } catch (error) {
        console.error('deleteVideo error:', error);
        res.status(500).json({ message: error.message });
    }
};
