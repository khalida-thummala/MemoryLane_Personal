import { GoogleGenerativeAI } from '@google/generative-ai';
import cloudinary from '../config/cloudinary.js';
import axios from 'axios';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const POETIC_FALLBACKS = [
    { title: 'A Beautiful Moment', description: 'Every photograph holds a thousand unspoken words — a frozen instant of time that whispers stories only the heart can hear.' },
    { title: 'Whispering Shadows', description: 'In the dance of light and shadow, we find the echoes of yesterday lingering like a sweet melody.' },
    { title: 'Timeless Connection', description: 'Some moments transcend the ticking clock, capturing a bond that grows stronger with every passing season.' },
    { title: 'Golden Hour Memories', description: 'The warmth of the sun may fade, but the glow of these cherished times remains forever bright in our minds.' },
    { title: 'Eternal Snapshot', description: 'A bridge between then and now, preserving the laughter and the silence of a life well-lived.' }
];

class AIService {
    constructor() {
        const apiKey = process.env.GEMINI_API_KEY;
        if (apiKey && apiKey !== 'your_gemini_api_key_here') {
            this.genAI = new GoogleGenerativeAI(apiKey);
            this.model = this.genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
        }
    }

    /**
     * formatUrl - Ensures we have a full URL for external AI processing
     */
    formatUrl(url) {
        if (!url) return null;
        if (url.startsWith('http')) return url;
        const port = process.env.PORT || 5000;
        const baseUrl = process.env.BASE_URL || `http://localhost:${port}`;
        return `${baseUrl}${url.startsWith('/') ? '' : '/'}${url}`;
    }

    /**
     * analyzeImage - Uses Gemini to get Tags, Title, and Poetic Description
     */
    async analyzeImage(imageUrl, context = {}) {
        const { existingTitle, existingDescription } = context;
        const absoluteUrl = this.formatUrl(imageUrl);
        console.log('[AIService] Analyzing Image:', absoluteUrl);

        if (!this.model) {
            console.warn('[AIService] Gemini model not initialized. Using quality fallback.');
            const fallback = POETIC_FALLBACKS[Math.floor(Math.random() * POETIC_FALLBACKS.length)];
            return {
                ...fallback,
                tags: ['Memory', 'Heartfelt', 'Nostalgia']
            };
        }

        try {
            let base64, mimeType;

            // Performance Optimization: Direct Disk Access for Local Uploads
            if (imageUrl.includes('uploads') || imageUrl.includes('temp')) {
                try {
                    let relativePath = imageUrl;
                    if (imageUrl.startsWith('http')) {
                        try {
                            const urlObj = new URL(imageUrl);
                            relativePath = urlObj.pathname.startsWith('/') ? urlObj.pathname.substring(1) : urlObj.pathname;
                        } catch (e) {
                            // If URL parsing fails, stick to original but stripped if it contains localhost
                            if (imageUrl.includes('localhost')) {
                                relativePath = imageUrl.split(process.env.PORT || '5000')[1]?.replace(/^\//, '') || imageUrl;
                            }
                        }
                    } else if (imageUrl.startsWith('/')) {
                        relativePath = imageUrl.substring(1);
                    }

                    const fullPath = path.join(__dirname, '..', relativePath);
                    if (await fs.stat(fullPath).catch(() => null)) {
                        const buffer = await fs.readFile(fullPath);
                        base64 = buffer.toString('base64');
                        mimeType = `image/${path.extname(fullPath).substring(1) || 'jpeg'}`;
                    }
                } catch (fsErr) {
                    console.warn('[AIService] Local file read failed, falling back to network:', fsErr.message);
                }
            }

            // Fallback to Axios if disk access failed or if it's a remote URL
            if (!base64) {
                const resp = await axios.get(absoluteUrl, { responseType: 'arraybuffer', timeout: 8000 });
                base64 = Buffer.from(resp.data).toString('base64');
                mimeType = resp.headers['content-type'] || 'image/jpeg';
            }

            const prompt = `Analyze this photograph for a memory Reliving app. 
            ${existingTitle ? `The existing title is "${existingTitle}".` : ''}
            ${existingDescription ? `The user previously described it as: "${existingDescription}".` : ''}
            Respond strictly in valid JSON format:
            {
              "title": "Evocative Short Title (max 5 words, no quotes)",
              "description": "Lyrical narration from a first-person nostalgic perspective (2 sentences)",
              "tags": ["specific", "semantic", "labels", "emotion", "setting"]
            }`;

            const result = await this.model.generateContent([
                prompt,
                { inlineData: { data: base64, mimeType } }
            ]);

            const text = result.response.text().trim();
            const jsonPart = text.match(/\{[\s\S]*\}/);

            if (jsonPart) {
                const parsed = JSON.parse(jsonPart[0]);
                return {
                    title: parsed.title || 'Untitled Wonder',
                    description: parsed.description || 'A snapshot of a beautiful day.',
                    tags: Array.isArray(parsed.tags) ? parsed.tags.map(t => t.replace('#', '')) : []
                };
            }
            return { title: 'Wonder Moment', description: text, tags: [] };
        } catch (error) {
            console.error('[AIService] Image Analysis Error:', error.message);
            // Use context to make fallback slightly better, even if AI fails
            const randomFallback = POETIC_FALLBACKS[Math.floor(Math.random() * POETIC_FALLBACKS.length)];
            return {
                title: existingTitle || randomFallback.title,
                description: existingDescription || randomFallback.description,
                tags: ['Memory', 'Captured']
            };
        }
    }

    /**
     * generateSticker - Extract subject from image using Cloudinary AI
     */
    async generateSticker(imageUrl) {
        if (!imageUrl) return null;
        try {
            if (!imageUrl.includes('cloudinary.com')) return imageUrl;

            const parts = imageUrl.split('/upload/');
            if (parts.length !== 2) return imageUrl;

            // Apply background removal + white border + shadow for sticker look
            return `${parts[0]}/upload/e_background_removal,bo_10px_solid_white,e_shadow,c_scale,w_800/${parts[1].replace(/\.[^/.]+$/, ".png")}`;
        } catch (error) {
            console.error('[AIService] Sticker Generation Error:', error);
            return imageUrl;
        }
    }

    /**
     * findMemoryClusters - Detect related photos to create a "memory story"
     */
    groupMemoriesIntoHighlights(memories) {
        if (!memories || memories.length < 2) return [];

        const highlights = [];
        // Use memory_date instead of date
        const sorted = [...memories].sort((a, b) => new Date(a.memory_date) - new Date(b.memory_date));

        let currentCluster = [sorted[0]];
        for (let i = 1; i < sorted.length; i++) {
            const timeDiff = (new Date(sorted[i].memory_date) - new Date(currentCluster[currentCluster.length - 1].memory_date)) / (1000 * 60 * 60);
            // Use location instead of locationName
            const sameLoc = sorted[i].location && sorted[i].location === currentCluster[0].location;

            if (timeDiff < 72 || (sameLoc && timeDiff < 96)) {
                currentCluster.push(sorted[i]);
            } else {
                if (currentCluster.length >= 2) highlights.push(this.formatHighlight(currentCluster));
                currentCluster = [sorted[i]];
            }
        }
        if (currentCluster.length >= 2) highlights.push(this.formatHighlight(currentCluster));

        return highlights;
    }

    formatHighlight(cluster) {
        // Use location instead of locationName
        const locations = cluster.map(m => m.location).filter(Boolean);
        const commonLoc = locations.length > 0 ? locations[0] : null;
        const month = new Date(cluster[0].memory_date).toLocaleString('default', { month: 'long', year: 'numeric' });

        return {
            id: `highlight-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            title: commonLoc ? `Escape to ${commonLoc}` : `${month} Highlights`,
            memories: cluster,
            count: cluster.length,
            coverImage: this.formatUrl(cluster[0].photos?.[0] || cluster[0].media?.[0]?.media_url),
            period: `${new Date(cluster[0].memory_date).toLocaleDateString()} - ${new Date(cluster[cluster.length - 1].memory_date).toLocaleDateString()}`
        };
    }
}

export default new AIService();
