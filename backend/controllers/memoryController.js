import { supabase, adminSupabase } from '../config/supabase.js';
import cloudinary from '../config/cloudinary.js';
import fs from 'fs';
import { v4 as uuidv4 } from 'uuid';

// Helper: upload files to Cloudinary and categorize by mimetype
const uploadFiles = async (files) => {
    const photos = [], videos = [], voiceNotes = [];

    if (!files || files.length === 0) return { photos, videos, voiceNotes };

    const uploads = files.map(async (file) => {
        try {
            const result = await cloudinary.uploader.upload(file.path, {
                resource_type: 'auto',
                folder: 'memorylane'
            });
            try { if (fs.existsSync(file.path)) fs.unlinkSync(file.path); } catch (_) { }

            // Use result.resource_type instead of file.mimetype for more accuracy (e.g. webm audio)
            if (result.resource_type === 'video') {
                // Cloudinary categorize webm audio as 'video' sometimes, but we check specifically if it should be voiceNote
                if (file.mimetype.startsWith('audio/')) {
                    voiceNotes.push(result.secure_url);
                } else {
                    videos.push(result.secure_url);
                }
            } else if (result.resource_type === 'audio') {
                voiceNotes.push(result.secure_url);
            } else {
                photos.push(result.secure_url);
            }
        } catch (err) {
            try { if (fs.existsSync(file.path)) fs.unlinkSync(file.path); } catch (_) { }
            throw new Error(`Failed to upload ${file.originalname}: ${err.message}`);
        }
    });

    await Promise.all(uploads);
    return { photos, videos, voiceNotes };
};

// Helper: upsert tags and return their IDs
const upsertTags = async (tagNames) => {
    if (!tagNames || tagNames.length === 0) return [];
    const names = Array.isArray(tagNames) ? tagNames : tagNames.split(',').map(t => t.trim());
    const tagUpserts = names.map(name => ({ name }));

    const { data, error } = await supabase
        .from('tags')
        .upsert(tagUpserts, { onConflict: 'name' })
        .select('id, name');

    if (error) throw new Error('Failed to upsert tags: ' + error.message);
    return data;
};

// Helper: format a memory row + its media + tags into the API response shape
const formatMemory = (memory, media = [], tags = []) => {
    const photos = media.filter(m => m.media_type === 'image').map(m => m.media_url);
    const videos = media.filter(m => m.media_type === 'video').map(m => m.media_url);
    const voiceNotes = media.filter(m => m.media_type === 'audio').map(m => m.media_url);

    console.log(`[Format] Memory ${memory.id} ("${memory.title}") -> Photos: ${photos.length}, Videos: ${videos.length}, Audio: ${voiceNotes.length}`);

    return {
        id: memory.id,
        _id: memory.id, // keep _id for backward compat with frontend
        user: memory.user_id,
        title: memory.title,
        description: memory.description,
        date: memory.memory_date,
        locationName: memory.location,
        latitude: memory.latitude,
        longitude: memory.longitude,
        visibility: memory.visibility || (memory.is_public ? 'public' : 'private'),
        isPublic: memory.is_public, // Deprecated, keeping for mapping
        milestone: memory.is_milestone,
        photos,
        videos,
        voiceNotes,
        tags: tags.map(t => t.name || t),
        created_at: memory.created_at,
        updated_at: memory.updated_at,
    };
};

// @desc    Get all memories for a user
// @route   GET /api/memories
// @access  Private
export const getMemories = async (req, res) => {
    try {
        let query = supabase
            .from('memories')
            .select('*')
            .eq('user_id', req.user.id)
            .order('memory_date', { ascending: false });

        if (req.query.milestone === 'true') {
            query = query.eq('is_milestone', true);
        }
        if (req.query.startDate && req.query.endDate) {
            query = query.gte('memory_date', req.query.startDate).lte('memory_date', req.query.endDate);
        }
        if (req.query.search) {
            const s = `%${req.query.search}%`;
            query = query.or(`title.ilike.${s},description.ilike.${s},location.ilike.${s}`);
        }

        const { data: memories, error } = await query;
        if (error) return res.status(500).json({ message: error.message });

        // Fetch media and tags for all memories
        const memoryIds = memories.map(m => m.id);
        if (memoryIds.length === 0) return res.json([]);

        const [{ data: medias }, { data: memTagRows }] = await Promise.all([
            supabase.from('memory_media').select('*').in('memory_id', memoryIds),
            supabase.from('memory_tags').select('memory_id, tags(name)').in('memory_id', memoryIds),
        ]);

        // Filter by tag if provided
        let filteredMemories = memories;
        if (req.query.tags) {
            const filterTags = req.query.tags.split(',').map(t => t.trim().toLowerCase());
            filteredMemories = memories.filter(m => {
                const mTags = (memTagRows || [])
                    .filter(r => r.memory_id === m.id)
                    .map(r => r.tags?.name?.toLowerCase());
                return filterTags.some(ft => mTags.includes(ft));
            });
        }

        const result = filteredMemories.map(m => {
            const media = (medias || []).filter(md => md.memory_id === m.id);
            const tags = (memTagRows || []).filter(r => r.memory_id === m.id).map(r => r.tags);
            return formatMemory(m, media, tags);
        });

        return res.json(result);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Create a memory
// @route   POST /api/memories
// @access  Private
export const createMemory = async (req, res) => {
    try {
        const { title, description, date, locationName, tags, milestone, visibility, isPublic } = req.body;

        let finalVisibility = visibility || (isPublic === 'true' || isPublic === true ? 'public' : 'private');

        let photos = req.body.photos ? (Array.isArray(req.body.photos) ? req.body.photos : [req.body.photos]) : [];
        let videos = req.body.videos ? (Array.isArray(req.body.videos) ? req.body.videos : [req.body.videos]) : [];
        let voiceNotes = req.body.voiceNotes ? (Array.isArray(req.body.voiceNotes) ? req.body.voiceNotes : [req.body.voiceNotes]) : [];

        if (req.files && req.files.length > 0) {
            const uploaded = await uploadFiles(req.files);
            photos = [...photos, ...uploaded.photos];
            videos = [...videos, ...uploaded.videos];
            voiceNotes = [...voiceNotes, ...uploaded.voiceNotes];
        }

        // Insert memory
        const { data: memory, error: memErr } = await supabase
            .from('memories')
            .insert({
                user_id: req.user.id,
                title,
                description,
                memory_date: date || new Date().toISOString().split('T')[0],
                location: locationName,
                is_milestone: milestone === 'true' || milestone === true,
                visibility: finalVisibility,
                is_public: finalVisibility === 'public', // Keep updated for backward compatibility
            })
            .select()
            .single();

        if (memErr) return res.status(500).json({ message: memErr.message });

        // Insert media
        const mediaRows = [
            ...photos.map(url => ({ memory_id: memory.id, media_url: url, media_type: 'image' })),
            ...videos.map(url => ({ memory_id: memory.id, media_url: url, media_type: 'video' })),
            ...voiceNotes.map(url => ({ memory_id: memory.id, media_url: url, media_type: 'audio' })),
        ];
        if (mediaRows.length > 0) {
            await supabase.from('memory_media').insert(mediaRows);
        }

        // Handle tags
        let tagObjects = [];
        if (tags) {
            tagObjects = await upsertTags(tags);
            if (tagObjects.length > 0) {
                await supabase.from('memory_tags').insert(
                    tagObjects.map(t => ({ memory_id: memory.id, tag_id: t.id }))
                );
            }
        }

        return res.status(201).json(formatMemory(memory, mediaRows, tagObjects));
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get random memories (Reminisce)
// @route   GET /api/memories/reminisce
// @access  Private
export const reminisceMemories = async (req, res) => {
    try {
        let query = supabase
            .from('memories')
            .select('*')
            .eq('user_id', req.user.id);

        if (req.query.milestone === 'true') query = query.eq('is_milestone', true);
        if (req.query.startDate && req.query.endDate) {
            query = query.gte('memory_date', req.query.startDate).lte('memory_date', req.query.endDate);
        }

        const { data: memories, error } = await query;
        if (error) return res.status(500).json({ message: error.message });
        if (!memories || memories.length === 0) return res.json([]);

        // Shuffle and take 5
        const shuffled = memories.sort(() => Math.random() - 0.5).slice(0, 5);
        const ids = shuffled.map(m => m.id);

        const [{ data: medias }, { data: memTagRows }] = await Promise.all([
            supabase.from('memory_media').select('*').in('memory_id', ids),
            supabase.from('memory_tags').select('memory_id, tags(name)').in('memory_id', ids),
        ]);

        const result = shuffled.map(m => {
            const media = (medias || []).filter(md => md.memory_id === m.id);
            const tags = (memTagRows || []).filter(r => r.memory_id === m.id).map(r => r.tags);
            return formatMemory(m, media, tags);
        });

        return res.json(result);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Update a memory
// @route   PUT /api/memories/:id
// @access  Private
export const updateMemory = async (req, res) => {
    try {
        // Check ownership
        const { data: existing, error: findErr } = await supabase
            .from('memories')
            .select('id, user_id')
            .eq('id', req.params.id)
            .single();

        if (findErr || !existing) return res.status(404).json({ message: 'Memory not found' });
        if (existing.user_id !== req.user.id) return res.status(401).json({ message: 'Not authorized' });

        const { title, description, date, locationName, tags, isPublic, visibility, milestone } = req.body;

        let photos = req.body.photos ? (Array.isArray(req.body.photos) ? req.body.photos : [req.body.photos]) : [];
        let videos = req.body.videos ? (Array.isArray(req.body.videos) ? req.body.videos : [req.body.videos]) : [];
        let voiceNotes = req.body.voiceNotes ? (Array.isArray(req.body.voiceNotes) ? req.body.voiceNotes : [req.body.voiceNotes]) : [];

        if (req.files && req.files.length > 0) {
            const uploaded = await uploadFiles(req.files);
            photos = [...photos, ...uploaded.photos];
            videos = [...videos, ...uploaded.videos];
            voiceNotes = [...voiceNotes, ...uploaded.voiceNotes];
        }

        let finalVisibility = visibility !== undefined ? visibility :
            (isPublic !== undefined ? (isPublic === 'true' || isPublic === true ? 'public' : 'private') : undefined);

        // Update memory row
        const updates = { updated_at: new Date().toISOString() };
        if (title !== undefined) updates.title = title;
        if (description !== undefined) updates.description = description;
        if (date !== undefined) updates.memory_date = date;
        if (locationName !== undefined) updates.location = locationName;
        if (milestone !== undefined) updates.is_milestone = milestone === 'true' || milestone === true;
        if (finalVisibility !== undefined) {
            updates.visibility = finalVisibility;
            updates.is_public = finalVisibility === 'public'; // Keep updated for backward compatibility
        }

        const { data: memory, error: updateErr } = await supabase
            .from('memories')
            .update(updates)
            .eq('id', req.params.id)
            .select()
            .single();

        if (updateErr) return res.status(500).json({ message: updateErr.message });

        // Replace media
        await supabase.from('memory_media').delete().eq('memory_id', memory.id);
        const mediaRows = [
            ...photos.map(url => ({ memory_id: memory.id, media_url: url, media_type: 'image' })),
            ...videos.map(url => ({ memory_id: memory.id, media_url: url, media_type: 'video' })),
            ...voiceNotes.map(url => ({ memory_id: memory.id, media_url: url, media_type: 'audio' })),
        ];
        if (mediaRows.length > 0) await supabase.from('memory_media').insert(mediaRows);

        // Replace tags
        let tagObjects = [];
        if (tags !== undefined) {
            await supabase.from('memory_tags').delete().eq('memory_id', memory.id);
            if (tags) {
                tagObjects = await upsertTags(tags);
                if (tagObjects.length > 0) {
                    await supabase.from('memory_tags').insert(
                        tagObjects.map(t => ({ memory_id: memory.id, tag_id: t.id }))
                    );
                }
            }
        }

        return res.json(formatMemory(memory, mediaRows, tagObjects));
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Delete a memory
// @route   DELETE /api/memories/:id
// @access  Private
export const deleteMemory = async (req, res) => {
    try {
        const { data: existing, error: findErr } = await supabase
            .from('memories')
            .select('id, user_id')
            .eq('id', req.params.id)
            .single();

        if (findErr || !existing) return res.status(404).json({ message: 'Memory not found' });
        if (existing.user_id !== req.user.id) return res.status(401).json({ message: 'Not authorized' });

        const { error } = await supabase.from('memories').delete().eq('id', req.params.id);
        if (error) return res.status(500).json({ message: error.message });

        return res.json({ message: 'Memory removed' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get a memory details (public/shared link)
// @route   GET /api/memories/public/:id
// @access  Public
export const getSharedMemory = async (req, res) => {
    try {
        const { id } = req.params;
        // Use admin client to ensure we can see it if we have the link, even if RLS is tight
        const { data: memory, error } = await (adminSupabase || supabase)
            .from('memories')
            .select('*, profiles!memories_user_id_fkey(id, username, avatar_url)')
            .eq('id', id)
            .single();

        if (error || !memory) {
            return res.status(404).json({ message: 'Memory not found or is private.' });
        }

        // Only allow if is_public is true
        if (!memory.is_public) {
            return res.status(403).json({ message: 'This memory is not set to public.' });
        }

        const [{ data: medias }, { data: memTagRows }] = await Promise.all([
            (adminSupabase || supabase).from('memory_media').select('*').eq('memory_id', id),
            (adminSupabase || supabase).from('memory_tags').select('tags(name)').eq('memory_id', id),
        ]);

        return res.json({
            ...formatMemory(memory, medias || [], (memTagRows || []).map(r => r.tags)),
            user: {
                id: memory.profiles?.id,
                name: memory.profiles?.username || 'User',
                username: memory.profiles?.username,
                avatar: memory.profiles?.avatar_url
            }
        });
    } catch (error) {
        console.error("Shared memory error:", error);
        res.status(500).json({ message: 'Server error retrieving shared memory' });
    }
};

// @desc    Get all public memories for community feed
// @route   GET /api/memories/community
// @access  Public (Optional Auth)
export const getCommunityMemories = async (req, res) => {
    try {
        console.log(`[Community Feed] Fetching public memories with Admin client...`);
        // Use adminSupabase to bypass RLS issues for public memories access
        // We only fetch is_public = true, so it's perfectly safe
        // Filter logic handling
        const filterStr = req.query.filter || 'all';
        let query = (adminSupabase || supabase)
            .from('memories')
            .select('*, profiles!memories_user_id_fkey(id, username, avatar_url)')
            .order('memory_date', { ascending: false });

        if (filterStr === 'following' && req.user) {
            // Get people the user is following
            const { data: friendsData } = await supabase
                .from('friends')
                .select('friend_id')
                .eq('user_id', req.user.id);

            const followingIds = (friendsData || []).map(f => f.friend_id);

            // Limit memories to people they follow
            if (followingIds.length > 0) {
                query = query.in('user_id', followingIds).in('visibility', ['public', 'friends']);
            } else {
                // If they don't follow anyone, return empty array immediately
                return res.json([]);
            }
        } else {
            // Global Feed logic applies
            query = query.eq('visibility', 'public');
        }

        const { data: memories, error } = await query.limit(100);

        if (error) {
            console.error(`[Community Feed] Supabase error: ${error.message}`);
            return res.status(500).json({ message: error.message });
        }

        const ids = memories.map(m => m.id);
        console.log(`[Community Feed] Found ${memories?.length || 0} public memories with IDs:`, ids);
        if (!memories || memories.length === 0) return res.json([]);

        const [{ data: medias, error: mediaErr }, { data: memTagRows }, { data: likes }, { data: comments }] = await Promise.all([
            (adminSupabase || supabase).from('memory_media').select('*').in('memory_id', ids),
            (adminSupabase || supabase).from('memory_tags').select('memory_id, tags(name)').in('memory_id', ids),
            (adminSupabase || supabase).from('memory_likes').select('memory_id, user_id').in('memory_id', ids),
            (adminSupabase || supabase).from('memory_comments').select('memory_id, id, text, created_at, profiles(id, username, avatar_url)').in('memory_id', ids),
        ]);

        if (mediaErr) console.error(`[Community Feed] Media fetch error:`, mediaErr);
        console.log(`[Community Feed] Fetched ${medias?.length || 0} total media items for these memories.`);

        const result = memories.map(m => {
            const media = (medias || []).filter(md => md.memory_id === m.id);
            const tags = (memTagRows || []).filter(r => r.memory_id === m.id).map(r => r.tags);
            const memLikes = (likes || []).filter(l => l.memory_id === m.id).map(l => l.user_id);
            const memComments = (comments || []).filter(c => c.memory_id === m.id).map(c => ({
                ...c,
                user: {
                    id: c.profiles?.id,
                    name: c.profiles?.username || 'User',
                    avatar: c.profiles?.avatar_url
                }
            }));

            return {
                ...formatMemory(m, media, tags),
                user: {
                    id: m.profiles?.id,
                    name: m.profiles?.username || 'User',
                    username: m.profiles?.username,
                    avatar: m.profiles?.avatar_url
                },
                likes: memLikes,
                comments: memComments,
            };
        });

        return res.json(result);
    } catch (error) {
        res.status(500).json({ message: 'Server error fetching community feed' });
    }
};

// @desc    Like or unlike a memory
// @route   POST /api/memories/:id/like
// @access  Private
export const likeMemory = async (req, res) => {
    try {
        const memoryId = req.params.id;
        const userId = req.user.id;

        // Check if already liked
        const { data: existing } = await supabase
            .from('memory_likes')
            .select('memory_id')
            .eq('memory_id', memoryId)
            .eq('user_id', userId)
            .single();

        if (existing) {
            await supabase.from('memory_likes').delete().eq('memory_id', memoryId).eq('user_id', userId);
        } else {
            await supabase.from('memory_likes').insert({ memory_id: memoryId, user_id: userId });
        }

        const { data: likes } = await supabase
            .from('memory_likes')
            .select('user_id')
            .eq('memory_id', memoryId);

        return res.json((likes || []).map(l => l.user_id));
    } catch (error) {
        res.status(500).json({ message: 'Error liking memory' });
    }
};

// @desc    Add a comment to a memory
// @route   POST /api/memories/:id/comment
// @access  Private
export const commentOnMemory = async (req, res) => {
    try {
        const { text } = req.body;
        if (!text || text.trim() === '') return res.status(400).json({ message: 'Comment text is required' });

        const { data: comment, error } = await supabase
            .from('memory_comments')
            .insert({ memory_id: req.params.id, user_id: req.user.id, text })
            .select('*, profiles(username, full_name, avatar_url)')
            .single();

        if (error) return res.status(500).json({ message: error.message });

        const { data: allComments } = await supabase
            .from('memory_comments')
            .select('id, text, created_at, profiles(username, full_name, avatar_url)')
            .eq('memory_id', req.params.id)
            .order('created_at', { ascending: true });

        return res.json(allComments || []);
    } catch (error) {
        res.status(500).json({ message: 'Error adding comment' });
    }
};

// @desc    Generate a slideshow video from a set of photos
// @route   POST /api/memories/reminisce/generate
// @access  Private
export const generateReminisceVideo = async (req, res) => {
    try {
        const { photos, title } = req.body;
        if (!photos || photos.length === 0) {
            return res.status(400).json({ message: "At least one photo is required to generate a slideshow." });
        }

        const uniqueTag = `reminisce_${req.user.id}_${Date.now()}`;

        // Extract public_ids from URLs correctly
        const publicIds = photos.map(url => {
            try {
                // Better regex to handle both with/without folder and with/without version prefix
                // Example: /upload/v12345/folder/id.jpg or /upload/folder/id.jpg
                const regex = /\/upload\/(?:v\d+\/)?(.+)\.[a-z0-9]+$/i;
                const match = url.match(regex);
                if (match && match[1]) {
                    // Normalize by decoding (in case of spaces or special chars in filename)
                    return decodeURIComponent(match[1]);
                }

                // Fallback for simple URLs
                const parts = url.split('/');
                const filenameWithExt = parts[parts.length - 1];
                return filenameWithExt.split('.')[0];
            } catch (e) {
                console.error("Extraction error for URL:", url, e);
                return null;
            }
        }).filter(id => id !== null);

        if (publicIds.length === 0) {
            return res.status(400).json({ message: "Unable to find valid media resources for generation." });
        }

        console.log(`[Reminisce] Processing ${publicIds.length} images with tag: ${uniqueTag}`);

        // Tag the resources in Cloudinary so 'multi' can find them
        // We do this individually to avoid failing the whole batch if one fails
        const tagResults = await Promise.all(publicIds.map(pid =>
            cloudinary.uploader.add_tag(uniqueTag, [pid]).catch(e => {
                console.warn(`Failed to tag ${pid}:`, e.message);
                return null;
            })
        ));

        if (tagResults.every(r => r === null)) {
            throw new Error("Cloudinary tagging failed. Images might not be hosted on this account or in the correct folder.");
        }

        // Tag propagation can take a moment in Cloudinary. Wait 2 seconds.
        console.log(`[Reminisce] Waiting for tag propagation...`);
        await new Promise(resolve => setTimeout(resolve, 2000));

        // Generate the video from tagged images explicitly using a smoother transition
        const result = await cloudinary.uploader.multi(uniqueTag, {
            resource_type: 'video',
            format: 'mp4',
            transformation: [
                { width: 1280, height: 720, crop: 'fill', gravity: 'center' },
            ],
            delay: 2000 // 2 seconds delay between frames (slides)
        });

        if (!result || !result.secure_url) {
            throw new Error("Slideshow generation failed: No URL returned from provider.");
        }

        console.log(`[Reminisce] Video generated: ${result.secure_url}`);

        // Save record to database
        const { data: videoRecord, error } = await supabase
            .from('reminisce_videos')
            .insert({
                user_id: req.user.id,
                video_url: result.secure_url,
                title: title || `Flashback Slideshow - ${new Date().toLocaleDateString()}`
            })
            .select()
            .single();

        if (error) throw error;

        res.json(videoRecord);
    } catch (error) {
        console.error("Video Gen Error:", error);
        res.status(500).json({ message: "Failed to generate video. " + error.message });
    }
};

// @desc    Get user's generated reminisce videos
// @route   GET /api/memories/reminisce/videos
// @access  Private
export const getReminisceVideos = async (req, res) => {
    try {
        const { data, error } = await supabase
            .from('reminisce_videos')
            .select('*')
            .eq('user_id', req.user.id)
            .order('created_at', { ascending: false });

        if (error) throw error;
        res.json(data || []);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
