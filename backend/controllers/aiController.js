import AIService from '../services/aiService.js';
import * as memoryService from '../services/memoryService.js';

/**
 * generateVideoSlideshow - Orchestrates video/slideshow generation
 */
export const generateVideoSlideshow = async (req, res) => {
    try {
        const { photos, title } = req.body;
        console.log('[AIController] Synthesizing Video Concept...', { title, photoCount: photos?.length });

        if (!photos || photos.length === 0) {
            return res.status(400).json({ message: 'No photos selected for video generation' });
        }

        // Since we are simulating cinematic output, we set videoUrl to null 
        // will tell the frontend to use the 'photos' array for a high-quality slideshow
        const videoUrl = null;
        const videoTitle = title || 'A Journey Through Time';

        try {
            const savedVideo = await memoryService.saveVideoService(req.user.id, {
                title: videoTitle,
                videoUrl,
                photos: photos,
                isPreview: true,
                thumbnailUrl: photos[0]
            });
            console.log('[AIController] Success: Synthesis saved under ID:', savedVideo?.id);
            res.json(savedVideo);
        } catch (dbErr) {
            console.warn('[AIController] Database save failed, providing ephemeral session:', dbErr.message);
            res.json({
                id: `temp-${Date.now()}`,
                title: `${videoTitle} (Preview ✨)`,
                video_url: videoUrl,
                thumbnail_url: photos[0],
                photos: photos,
                created_at: new Date(),
                is_preview: true
            });
        }
    } catch (error) {
        console.error('[AIController] Fatal Video Error:', error);
        res.status(500).json({ message: 'Failed to generate cinematic flashback' });
    }
};

/**
 * generateMemoryDescription - Advanced multimodal analysis
 */
export const generateMemoryDescription = async (req, res) => {
    try {
        const { imageUrls, existingTitle, existingDescription } = req.body;
        const mainImage = imageUrls?.[0] || null;
        console.log('[AIController] Generating narrative for:', mainImage);

        if (!mainImage) {
            return res.status(400).json({ message: 'No images provided for AI analysis.' });
        }

        const analysis = await AIService.analyzeImage(mainImage, { existingTitle, existingDescription });
        res.json(analysis);
    } catch (error) {
        console.error('[AIController] Fatal Analysis Error:', error);
        res.status(500).json({ message: 'AI failed to relive this memory.' });
    }
};


/**
 * getReminisceHighlights - Get AI-clustered story groups
 */
export const getReminisceHighlights = async (req, res) => {
    try {
        // We reuse the existing reminisce fetch logic but apply clustering
        const filters = {
            startDate: req.query.startDate,
            endDate: req.query.endDate,
            milestone: req.query.milestone === 'true'
        };

        const memories = await memoryService.getReminisceMemoriesService(req.user.id, filters);
        const highlights = AIService.groupMemoriesIntoHighlights(memories);

        res.json(highlights);
    } catch (error) {
        console.error('[AIController] Highlights Error:', error);
        res.status(500).json({ message: 'Failed to find your memory stories.' });
    }
};
