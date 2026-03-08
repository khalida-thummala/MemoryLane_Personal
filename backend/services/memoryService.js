import { supabase } from '../config/supabase.js';

/**
 * createMemoryService - Creates memory and its associated media in Supabase
 */
export const createMemoryService = async (data, creatorId) => {
    const { photos, videos, voiceNotes, tags, ...baseData } = data;

    const { data: memory, error } = await supabase
        .from('memories')
        .insert([{
            user_id: creatorId,
            title: baseData.title,
            description: baseData.description,
            memory_date: baseData.memory_date || baseData.date,
            location: baseData.location || baseData.locationName,
            latitude: baseData.latitude,
            longitude: baseData.longitude,
            is_milestone: baseData.is_milestone === true || baseData.is_milestone === 'true' || baseData.milestone === true || baseData.milestone === 'true' || false,
            is_public: baseData.is_public === true || baseData.is_public === 'true' || baseData.visibility === 'public' || false,
            visibility: baseData.visibility || (baseData.is_public === true || baseData.is_public === 'true' ? 'public' : 'private')
        }])
        .select()
        .single();

    if (error) throw new Error(error.message);

    // Insert media (photos, videos, audio)
    const mediaToInsert = [];
    if (photos) photos.forEach(url => mediaToInsert.push({ memory_id: memory.id, media_url: url, media_type: 'image' }));
    if (videos) videos.forEach(url => mediaToInsert.push({ memory_id: memory.id, media_url: url, media_type: 'video' }));
    if (voiceNotes) voiceNotes.forEach(url => mediaToInsert.push({ memory_id: memory.id, media_url: url, media_type: 'audio' }));

    if (mediaToInsert.length > 0) {
        const { error: mediaError } = await supabase.from('memory_media').insert(mediaToInsert);
        if (mediaError) console.error('Error inserting media:', mediaError);
    }

    // Insert tags
    if (tags && tags.length > 0) {
        for (const tagName of tags) {
            let { data: tag } = await supabase.from('tags').select('id').eq('name', tagName).single();
            if (!tag) {
                const { data: newTag } = await supabase.from('tags').insert([{ name: tagName }]).select('id').single();
                tag = newTag;
            }
            if (tag) {
                await supabase.from('memory_tags').insert([{ memory_id: memory.id, tag_id: tag.id }]);
            }
        }
    }

    // Return fully populated memory
    return getMemoryByIdService(memory.id);
};

/**
 * updateMemoryService
 */
export const updateMemoryService = async (memoryId, data) => {
    const updateData = {};

    if (data.title !== undefined) updateData.title = data.title;
    if (data.description !== undefined) updateData.description = data.description;

    if (data.date !== undefined) updateData.memory_date = data.date;
    else if (data.memory_date !== undefined) updateData.memory_date = data.memory_date;

    if (data.locationName !== undefined) updateData.location = data.locationName;
    else if (data.location !== undefined) updateData.location = data.location;

    if (data.latitude !== undefined) updateData.latitude = data.latitude;
    if (data.longitude !== undefined) updateData.longitude = data.longitude;

    if (data.milestone !== undefined) {
        updateData.is_milestone = data.milestone === true || data.milestone === 'true';
    } else if (data.is_milestone !== undefined) {
        updateData.is_milestone = data.is_milestone === true || data.is_milestone === 'true';
    }

    if (data.visibility !== undefined) {
        updateData.visibility = data.visibility;
        updateData.is_public = data.visibility === 'public';
    } else if (data.is_public !== undefined) {
        updateData.is_public = data.is_public === true || data.is_public === 'true';
        if (updateData.is_public) updateData.visibility = 'public';
    }

    // Update base memory data
    const { data: memory, error } = await supabase
        .from('memories')
        .update(updateData)
        .eq('id', memoryId)
        .select()
        .single();
    if (error) throw new Error(error.message);

    // Update media
    if (data.photos || data.videos || data.voiceNotes || (data.attachedFiles && data.attachedFiles.length === 0)) {
        await supabase.from('memory_media').delete().eq('memory_id', memoryId);

        const mediaToInsert = [];
        if (data.photos) data.photos.forEach(url => mediaToInsert.push({ memory_id: memoryId, media_url: url, media_type: 'image' }));
        if (data.videos) data.videos.forEach(url => mediaToInsert.push({ memory_id: memoryId, media_url: url, media_type: 'video' }));
        if (data.voiceNotes) data.voiceNotes.forEach(url => mediaToInsert.push({ memory_id: memoryId, media_url: url, media_type: 'audio' }));

        if (mediaToInsert.length > 0) {
            await supabase.from('memory_media').insert(mediaToInsert);
        }
    }

    // Update tags
    if (data.tags) {
        await supabase.from('memory_tags').delete().eq('memory_id', memoryId);

        for (const tagName of data.tags) {
            let { data: tag } = await supabase.from('tags').select('id').eq('name', tagName).single();
            if (!tag) {
                const { data: newTag } = await supabase.from('tags').insert([{ name: tagName }]).select('id').single();
                tag = newTag;
            }
            if (tag) {
                await supabase.from('memory_tags').insert([{ memory_id: memoryId, tag_id: tag.id }]);
            }
        }
    }

    // Return populated memory so frontend updates properly
    return getMemoryByIdService(memoryId);
};

/**
 * deleteMemoryService
 */
export const deleteMemoryService = async (memoryId) => {
    const { error } = await supabase
        .from('memories')
        .delete()
        .eq('id', memoryId);
    if (error) throw new Error(error.message);
    return { message: 'Memory removed successfully' };
};

/**
 * getMemoryByIdService
 */
export const getMemoryByIdService = async (memoryId) => {
    const { data: memory, error } = await supabase
        .from('memories')
        .select(`
            *,
            user:profiles!user_id(id, username, avatar_url, full_name),
            media:memory_media(*),
            tags:memory_tags(tag:tag_id(name)),
            comments:memory_comments(
                *,
                user:profiles!user_id(id, username, avatar_url, full_name)
            ),
            likes:memory_likes(user_id)
        `)
        .eq('id', memoryId)
        .single();

    if (error) throw new Error(error.message);

    const buildCommentTree = (comments) => {
        const commentMap = {};
        const roots = [];
        (comments || []).forEach(c => {
            c.replies = [];
            commentMap[c.id] = c;
            if (!c.parent_id) roots.push(c);
        });
        (comments || []).forEach(c => {
            if (c.parent_id && commentMap[c.parent_id]) {
                commentMap[c.parent_id].replies.push({
                    ridx: c.id,
                    replyText: c.text,
                    user: c.user
                });
            }
        });
        return roots;
    };

    return {
        ...memory,
        date: memory.memory_date,
        locationName: memory.location,
        milestone: memory.is_milestone,
        visibility: memory.visibility || (memory.is_public ? 'public' : 'private'),
        photos: memory.media?.filter(med => med.media_type === 'image').map(med => med.media_url) || [],
        videos: memory.media?.filter(med => med.media_type === 'video').map(med => med.media_url) || [],
        voiceNotes: memory.media?.filter(med => med.media_type === 'audio').map(med => med.media_url) || [],
        tags: memory.tags?.map(t => t.tag?.name).filter(Boolean) || [],
        comments: buildCommentTree(memory.comments),
        likes: (memory.likes || []).map(l => l.user_id)
    };
};

/**
 * addCommentService - Joins with profiles!user_id
 */
export const addCommentService = async (memoryId, userId, text, parentId = null) => {
    const { data: comment, error } = await supabase
        .from('memory_comments')
        .insert([{
            memory_id: memoryId,
            user_id: userId,
            text,
            parent_id: parentId
        }])
        .select(`
            *,
            user:profiles!user_id(id, username, avatar_url, full_name)
        `)
        .single();

    if (error) throw new Error(error.message);
    return comment;
};

/**
 * deleteCommentService
 */
export const deleteCommentService = async (commentId) => {
    const { error } = await supabase
        .from('memory_comments')
        .delete()
        .eq('id', commentId);
    if (error) throw new Error(error.message);
    return { message: 'Comment deleted' };
};

/**
 * updateCommentService
 */
export const updateCommentService = async (commentId, text) => {
    const { data: comment, error } = await supabase
        .from('memory_comments')
        .update({ text })
        .eq('id', commentId)
        .select(`*, user:profiles!user_id(id, username, avatar_url, full_name)`)
        .single();
    if (error) throw new Error(error.message);
    return comment;
};

/**
 * getCommentsByMemoryService
 */
export const getCommentsByMemoryService = async (memoryId) => {
    const { data: comments, error } = await supabase
        .from('memory_comments')
        .select(`
            *,
            user:profiles!user_id(id, username, avatar_url, full_name)
        `)
        .eq('memory_id', memoryId)
        .order('created_at', { ascending: true });

    if (error) throw new Error(error.message);

    const commentMap = {};
    const rootComments = [];

    comments.forEach(c => {
        c.replies = [];
        commentMap[c.id] = c;
        if (!c.parent_id) rootComments.push(c);
    });

    comments.forEach(c => {
        if (c.parent_id && commentMap[c.parent_id]) {
            commentMap[c.parent_id].replies.push({
                ridx: c.id,
                replyText: c.text,
                repliedBy: c.user
            });
        }
    });

    return rootComments;
};

/**
 * getMemoriesByAlbumService
 */
export const getMemoriesByAlbumService = async (albumId, userId) => {
    let query = supabase
        .from('memories')
        .select(`
            *,
            user:profiles!user_id(id, username, avatar_url, full_name),
            media:memory_media(*),
            tags:memory_tags(tag:tag_id(name)),
            likes:memory_likes(user_id),
            comments:memory_comments(id)
        `);

    if (albumId) {
        const { data: albumMemories } = await supabase
            .from('album_memories')
            .select('memory_id')
            .eq('album_id', albumId);

        if (!albumMemories || albumMemories.length === 0) return [];
        query = query.in('id', albumMemories.map(am => am.memory_id));
        query = query.order('memory_date', { ascending: false });
    } else if (userId) {
        query = query.eq('user_id', userId).order('memory_date', { ascending: false });
    }

    const { data: memories, error } = await query;

    if (error) throw new Error(error.message);

    return memories.map(m => ({
        ...m,
        date: m.memory_date,
        locationName: m.location,
        milestone: m.is_milestone,
        visibility: m.visibility || (m.is_public ? 'public' : 'private'),
        photos: m.media?.filter(med => med.media_type === 'image').map(med => med.media_url) || [],
        videos: m.media?.filter(med => med.media_type === 'video').map(med => med.media_url) || [],
        voiceNotes: m.media?.filter(med => med.media_type === 'audio').map(med => med.media_url) || [],
        tags: m.tags?.map(t => t.tag?.name).filter(Boolean) || [],
        likes: (m.likes || []).map(l => l.user_id),
        commentCount: (m.comments || []).length
    }));
};

/**
 * getCommunityMemoriesService
 */
export const getCommunityMemoriesService = async (currentUserId, filter = 'all') => {
    let query = supabase
        .from('memories')
        .select(`
            *,
            user:profiles!user_id(id, username, avatar_url, full_name),
            media:memory_media(*),
            tags:memory_tags(tag:tag_id(name)),
            comments:memory_comments(
                *,
                user:profiles!user_id(id, username, avatar_url, full_name)
            ),
            likes:memory_likes(user_id)
        `)
        .eq('is_public', true)
        .order('memory_date', { ascending: false })
        .limit(20);

    if (filter === 'following' && currentUserId) {
        const { data: followingData } = await supabase
            .from('follows')
            .select('following_id')
            .eq('follower_id', currentUserId);

        if (followingData && followingData.length > 0) {
            query = query.in('user_id', followingData.map(f => f.following_id));
        } else {
            return [];
        }
    }

    const { data: memories, error } = await query;
    if (error) throw new Error(error.message);

    const buildCommentTree = (comments) => {
        const commentMap = {};
        const roots = [];
        (comments || []).forEach(c => {
            c.replies = [];
            commentMap[c.id] = c;
            if (!c.parent_id) roots.push(c);
        });
        (comments || []).forEach(c => {
            if (c.parent_id && commentMap[c.parent_id]) {
                commentMap[c.parent_id].replies.push(c);
            }
        });
        return roots;
    };

    return memories.map(m => ({
        ...m,
        visibility: m.visibility || (m.is_public ? 'public' : 'private'),
        photos: m.media?.filter(med => med.media_type === 'image').map(med => med.media_url) || [],
        videos: m.media?.filter(med => med.media_type === 'video').map(med => med.media_url) || [],
        voiceNotes: m.media?.filter(med => med.media_type === 'audio').map(med => med.media_url) || [],
        tags: m.tags?.map(t => t.tag?.name).filter(Boolean) || [],
        comments: buildCommentTree(m.comments),
        likes: (m.likes || []).map(l => l.user_id),
        milestone: m.is_milestone,
        date: m.memory_date,
        locationName: m.location,
    }));
};

/**
 * toggleLikeService
 */
export const toggleLikeService = async (memoryId, userId) => {
    const { data: existing } = await supabase
        .from('memory_likes')
        .select('id')
        .eq('memory_id', memoryId)
        .eq('user_id', userId)
        .single();

    if (existing) {
        await supabase.from('memory_likes').delete().eq('id', existing.id);
        return { liked: false };
    } else {
        await supabase.from('memory_likes').insert([{ memory_id: memoryId, user_id: userId }]);
        return { liked: true };
    }
};

/**
 * getReminisceMemoriesService
 */
export const getReminisceMemoriesService = async (userId, filters) => {
    console.log('Reminisce Engine Request:', { userId, filters });
    const { tag, startDate, endDate, milestone } = filters;

    let query = supabase
        .from('memories')
        .select(`
            *,
            user:profiles!user_id(id, username, avatar_url, full_name),
            media:memory_media(*),
            tags:memory_tags(tag:tag_id(name)),
            likes:memory_likes(user_id),
            comments:memory_comments(id)
        `)
        .eq('user_id', userId);

    if (startDate && startDate !== '') {
        const startVal = startDate.includes('T') ? startDate : `${startDate}T00:00:00.000Z`;
        query = query.gte('memory_date', startVal);
    }
    if (endDate && endDate !== '') {
        const endVal = endDate.includes('T') ? endDate : `${endDate}T23:59:59.999Z`;
        query = query.lte('memory_date', endVal);
    }

    // Explicitly check for both boolean and string "true"
    if (milestone === true || milestone === 'true') {
        query = query.eq('is_milestone', true);
    }

    const { data: memories, error } = await query.order('memory_date', { ascending: false });

    if (error) {
        console.error('Reminisce Query Error:', error);
        throw new Error(error.message);
    }

    console.log(`Base memories found: ${memories?.length || 0}`);

    let filtered = memories.map(m => ({
        ...m,
        date: m.memory_date,
        locationName: m.location,
        milestone: m.is_milestone,
        visibility: m.visibility || (m.is_public ? 'public' : 'private'),
        photos: m.media?.filter(med => med.media_type === 'image').map(med => med.media_url) || [],
        videos: m.media?.filter(med => med.media_type === 'video').map(med => med.media_url) || [],
        voiceNotes: m.media?.filter(med => med.media_type === 'audio').map(med => med.media_url) || [],
        tags: m.tags?.map(t => t.tag?.name).filter(Boolean) || [],
        likes: (m.likes || []).map(l => l.user_id),
        commentCount: (m.comments || []).length
    }));

    if (tag && tag.trim() !== '') {
        const searchTerms = tag.split(',').map(t => t.trim().toLowerCase()).filter(Boolean);
        if (searchTerms.length > 0) {
            filtered = filtered.filter(m =>
                searchTerms.some(term =>
                    m.tags.some(t => t.toLowerCase().includes(term)) ||
                    (m.title && m.title.toLowerCase().includes(term)) ||
                    (m.description && m.description.toLowerCase().includes(term)) ||
                    (m.locationName && m.locationName.toLowerCase().includes(term))
                )
            );
        }
    }

    console.log(`Final memories returned after tag filter: ${filtered.length}`);
    return filtered;
};

/**
 * getSavedVideosService
 */
export const getSavedVideosService = async (userId) => {
    const { data, error } = await supabase
        .from('reminisce_videos')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

    if (error) throw new Error(error.message);
    return data;
};
/**
 * saveVideoService
 */
export const saveVideoService = async (userId, videoData) => {
    const { title, videoUrl, thumbnailUrl, photos, isPreview } = videoData;
    const { data, error } = await supabase
        .from('reminisce_videos')
        .insert([{
            user_id: userId,
            title,
            video_url: videoUrl,
            thumbnail_url: thumbnailUrl || (videoUrl && videoUrl.replace('.mp4', '.jpg')) || (photos && photos[0]),
            photos: photos || [],
            is_preview: isPreview || false
        }])
        .select()
        .single();

    if (error) throw new Error(error.message);
    return data;
};
/**
 * saveSearchService
 */
export const saveSearchService = async (userId, searchData) => {
    const { name, tag, startDate, endDate, milestone } = searchData;
    const { data, error } = await supabase
        .from('reminisce_saved_searches')
        .insert([{
            user_id: userId,
            name,
            tag,
            start_date: startDate || null,
            end_date: endDate || null,
            is_milestone: milestone || false
        }])
        .select()
        .single();

    if (error) throw new Error(error.message);
    return data;
};

/**
 * getSavedSearchesService
 */
export const getSavedSearchesService = async (userId) => {
    const { data, error } = await supabase
        .from('reminisce_saved_searches')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

    if (error) throw new Error(error.message);
    return data;
};

/**
 * deleteSavedSearchService
 */
export const deleteSavedSearchService = async (searchId) => {
    const { error } = await supabase
        .from('reminisce_saved_searches')
        .delete()
        .eq('id', searchId);

    if (error) throw new Error(error.message);
    return { success: true };
};

/**
 * deleteVideoService
 */
export const deleteVideoService = async (videoId) => {
    const { error } = await supabase
        .from('reminisce_videos')
        .delete()
        .eq('id', videoId);

    if (error) throw new Error(error.message);
    return { success: true };
};
