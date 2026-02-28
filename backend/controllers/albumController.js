import supabase from '../config/supabase.js';
import axios from 'axios';
import crypto from 'crypto';

// Helper: format album row
const formatAlbum = (album, memories = [], collaborators = []) => ({
    id: album.id,
    _id: album.id,
    user: album.user_id,
    title: album.title,
    description: album.description,
    coverImage: album.cover_url,
    isPublic: album.is_shared,
    memories,
    collaborators,
    inviteToken: album.invite_token,
    created_at: album.created_at,
    updated_at: album.updated_at,
});

// Helper: fetch memories for albums with media
const fetchAlbumMemories = async (albumIds) => {
    if (!albumIds.length) return {};
    const { data: amRows } = await supabase
        .from('album_memories')
        .select(`
            album_id, 
            memories (
                *,
                memory_media (media_url, media_type)
            )
        `)
        .in('album_id', albumIds);

    const map = {};
    (amRows || []).forEach(row => {
        if (!map[row.album_id]) map[row.album_id] = [];
        if (row.memories) {
            const m = row.memories;
            // Map memory_media to photos/videos/voiceNotes for frontend compatibility
            const photos = (m.memory_media || []).filter(me => me.media_type === 'image').map(me => me.media_url);
            const videos = (m.memory_media || []).filter(me => me.media_type === 'video').map(me => me.media_url);
            const voiceNotes = (m.memory_media || []).filter(me => me.media_type === 'audio').map(me => me.media_url);

            map[row.album_id].push({
                ...m,
                photos,
                videos,
                voiceNotes
            });
        }
    });
    return map;
};

const fetchAlbumCollaborators = async (albumIds) => {
    if (!albumIds.length) return {};
    const { data: collabRows } = await supabase
        .from('album_collaborators')
        .select('album_id, profiles(id, username, full_name, avatar_url), role')
        .in('album_id', albumIds);

    const map = {};
    (collabRows || []).forEach(row => {
        if (!map[row.album_id]) map[row.album_id] = [];
        map[row.album_id].push({ ...row.profiles, role: row.role });
    });
    return map;
};

// @desc    Get all albums for a user
// @route   GET /api/albums
// @access  Private
export const getAlbums = async (req, res) => {
    try {
        // Albums owned by user
        const { data: ownedAlbums, error: ownErr } = await supabase
            .from('albums')
            .select('*')
            .eq('user_id', req.user.id)
            .order('created_at', { ascending: false });

        if (ownErr) return res.status(500).json({ message: ownErr.message });

        // Albums where user is collaborator
        const { data: collabEntries } = await supabase
            .from('album_collaborators')
            .select('album_id')
            .eq('user_id', req.user.id);

        let collabAlbums = [];
        if (collabEntries && collabEntries.length > 0) {
            const ids = collabEntries.map(r => r.album_id);
            const { data } = await supabase.from('albums').select('*').in('id', ids);
            collabAlbums = data || [];
        }

        const allAlbums = [...(ownedAlbums || []), ...collabAlbums];
        const albumIds = allAlbums.map(a => a.id);

        const [memoriesMap, collaboratorsMap] = await Promise.all([
            fetchAlbumMemories(albumIds),
            fetchAlbumCollaborators(albumIds),
        ]);

        const result = allAlbums.map(a =>
            formatAlbum(a, memoriesMap[a.id] || [], collaboratorsMap[a.id] || [])
        );

        return res.status(200).json(result);
    } catch (error) {
        res.status(500).json({ message: 'Server Error fetching albums', error: error.message });
    }
};

// @desc    Get single album by ID
// @route   GET /api/albums/:id
// @access  Private
export const getAlbumById = async (req, res) => {
    try {
        const { data: album, error } = await supabase
            .from('albums')
            .select('*')
            .eq('id', req.params.id)
            .single();

        if (error || !album) return res.status(404).json({ message: 'Album not found' });

        // Check access
        const isOwner = album.user_id === req.user.id;
        if (!isOwner) {
            const { data: collab } = await supabase
                .from('album_collaborators')
                .select('user_id')
                .eq('album_id', album.id)
                .eq('user_id', req.user.id)
                .single();
            if (!collab) return res.status(401).json({ message: 'Not authorized to access this album' });
        }

        const [memoriesMap, collaboratorsMap] = await Promise.all([
            fetchAlbumMemories([album.id]),
            fetchAlbumCollaborators([album.id]),
        ]);

        return res.status(200).json(formatAlbum(album, memoriesMap[album.id] || [], collaboratorsMap[album.id] || []));
    } catch (error) {
        res.status(500).json({ message: error.message || 'Server Error fetching album' });
    }
};

// @desc    Create a new album
// @route   POST /api/albums
// @access  Private
export const createAlbum = async (req, res) => {
    try {
        const { title, description } = req.body;
        if (!title) return res.status(400).json({ message: 'Please provide an album title' });

        let coverImage = '';
        try {
            if (process.env.UNSPLASH_ACCESS_KEY) {
                const unsplashRes = await axios.get(
                    `https://api.unsplash.com/search/photos?query=${encodeURIComponent(title)}&client_id=${process.env.UNSPLASH_ACCESS_KEY}&per_page=1`
                );
                if (unsplashRes.data.results?.length > 0) {
                    coverImage = unsplashRes.data.results[0].urls.regular;
                }
            }
        } catch (err) {
            console.error('Unsplash error:', err.message);
        }

        const { data: album, error } = await supabase
            .from('albums')
            .insert({
                user_id: req.user.id,
                title,
                description: description || '',
                cover_url: coverImage,
                is_shared: req.body.isPublic === true || req.body.isPublic === 'true',
            })
            .select()
            .single();

        if (error) return res.status(500).json({ message: 'Server Error creating album', error: error.message });

        return res.status(201).json(formatAlbum(album, [], []));
    } catch (error) {
        res.status(500).json({ message: 'Server Error creating album', error: error.message });
    }
};

// @desc    Update album
// @route   PUT /api/albums/:id
// @access  Private
export const updateAlbum = async (req, res) => {
    try {
        const { data: existing, error: findErr } = await supabase
            .from('albums')
            .select('user_id')
            .eq('id', req.params.id)
            .single();

        if (findErr || !existing) return res.status(404).json({ message: 'Album not found' });
        if (existing.user_id !== req.user.id) return res.status(401).json({ message: 'Not authorized' });

        const updates = {};
        if (req.body.title) updates.title = req.body.title;
        if (req.body.description !== undefined) updates.description = req.body.description;
        if (req.body.coverImage !== undefined) updates.cover_url = req.body.coverImage;
        if (req.body.isPublic !== undefined) updates.is_shared = req.body.isPublic === true || req.body.isPublic === 'true';
        updates.updated_at = new Date().toISOString();

        const { data: album, error } = await supabase
            .from('albums')
            .update(updates)
            .eq('id', req.params.id)
            .select()
            .single();

        if (error) return res.status(500).json({ message: error.message });

        return res.json(formatAlbum(album));
    } catch (error) {
        res.status(500).json({ message: error.message || 'Server Error updating album' });
    }
};

// @desc    Delete album
// @route   DELETE /api/albums/:id
// @access  Private
export const deleteAlbum = async (req, res) => {
    try {
        const { data: existing, error: findErr } = await supabase
            .from('albums')
            .select('user_id')
            .eq('id', req.params.id)
            .single();

        if (findErr || !existing) return res.status(404).json({ message: 'Album not found' });
        if (existing.user_id !== req.user.id) return res.status(401).json({ message: 'Not authorized' });

        const { error } = await supabase.from('albums').delete().eq('id', req.params.id);
        if (error) return res.status(500).json({ message: error.message });

        return res.json({ message: 'Album removed' });
    } catch (error) {
        res.status(500).json({ message: error.message || 'Server Error deleting album' });
    }
};

// @desc    Add memory to album
// @route   POST /api/albums/:id/memories/:memoryId
// @access  Private
export const addMemoryToAlbum = async (req, res) => {
    try {
        const { data: album } = await supabase.from('albums').select('user_id').eq('id', req.params.id).single();
        const { data: memory } = await supabase.from('memories').select('user_id').eq('id', req.params.memoryId).single();

        if (!album || !memory) return res.status(404).json({ message: 'Album or Memory not found' });

        const isOwner = album.user_id === req.user.id;
        if (!isOwner) {
            const { data: collab } = await supabase.from('album_collaborators').select('user_id').eq('album_id', req.params.id).eq('user_id', req.user.id).single();
            if (!collab || memory.user_id !== req.user.id) {
                return res.status(401).json({ message: 'Not authorized to modify this album' });
            }
        }

        await supabase.from('album_memories').upsert(
            { album_id: req.params.id, memory_id: req.params.memoryId },
            { onConflict: 'album_id,memory_id' }
        );

        const [memoriesMap, collaboratorsMap] = await Promise.all([
            fetchAlbumMemories([req.params.id]),
            fetchAlbumCollaborators([req.params.id]),
        ]);

        const { data: updatedAlbum } = await supabase.from('albums').select('*').eq('id', req.params.id).single();
        return res.json(formatAlbum(updatedAlbum, memoriesMap[req.params.id] || [], collaboratorsMap[req.params.id] || []));
    } catch (error) {
        res.status(500).json({ message: error.message || 'Server Error adding memory to album' });
    }
};

// @desc    Remove memory from album
// @route   DELETE /api/albums/:id/memories/:memoryId
// @access  Private
export const removeMemoryFromAlbum = async (req, res) => {
    try {
        const { data: album } = await supabase.from('albums').select('user_id').eq('id', req.params.id).single();
        if (!album) return res.status(404).json({ message: 'Album not found' });
        if (album.user_id !== req.user.id) return res.status(401).json({ message: 'Not authorized' });

        await supabase.from('album_memories')
            .delete()
            .eq('album_id', req.params.id)
            .eq('memory_id', req.params.memoryId);

        const [memoriesMap, collaboratorsMap] = await Promise.all([
            fetchAlbumMemories([req.params.id]),
            fetchAlbumCollaborators([req.params.id]),
        ]);

        const { data: updatedAlbum } = await supabase.from('albums').select('*').eq('id', req.params.id).single();
        return res.json(formatAlbum(updatedAlbum, memoriesMap[req.params.id] || [], collaboratorsMap[req.params.id] || []));
    } catch (error) {
        res.status(500).json({ message: error.message || 'Server Error removing memory from album' });
    }
};

// @desc    Generate an invite token for collab
// @route   POST /api/albums/:id/invite
// @access  Private (Owner only)
export const generateInviteToken = async (req, res) => {
    try {
        const { data: album } = await supabase.from('albums').select('user_id').eq('id', req.params.id).single();
        if (!album) return res.status(404).json({ message: 'Album not found' });
        if (album.user_id !== req.user.id) return res.status(401).json({ message: 'Only owner can generate invites' });

        const token = crypto.randomBytes(20).toString('hex');
        await supabase.from('albums').update({ invite_token: token }).eq('id', req.params.id);

        return res.json({ token, albumId: req.params.id });
    } catch (error) {
        res.status(500).json({ message: 'Error generating invite' });
    }
};

// @desc    Join an album via invite token
// @route   POST /api/albums/join/:token
// @access  Private
export const joinAlbum = async (req, res) => {
    try {
        const { data: album } = await supabase
            .from('albums')
            .select('*')
            .eq('invite_token', req.params.token)
            .single();

        if (!album) return res.status(404).json({ message: 'Invalid or expired invite token' });
        if (album.user_id === req.user.id) return res.status(400).json({ message: 'You already own this album' });

        await supabase.from('album_collaborators').upsert(
            { album_id: album.id, user_id: req.user.id, role: 'contributor' },
            { onConflict: 'album_id,user_id' }
        );

        return res.json({ message: 'Successfully joined album!', album: formatAlbum(album) });
    } catch (error) {
        res.status(500).json({ message: 'Server error joining album' });
    }
};

// @desc    Send a collab request (direct invite)
// @route   POST /api/albums/:id/request
// @access  Private (Owner only)
export const sendCollabRequest = async (req, res) => {
    try {
        const { data: album } = await supabase.from('albums').select('user_id').eq('id', req.params.id).single();
        if (!album) return res.status(404).json({ message: 'Album not found' });
        if (album.user_id !== req.user.id) return res.status(401).json({ message: 'Only owner can send collab requests' });

        const { userId } = req.body;
        if (!userId) return res.status(400).json({ message: 'Please provide user ID to invite' });

        // Upsert as pending (using role 'pending' as a workaround)
        await supabase.from('album_collaborators').upsert(
            { album_id: req.params.id, user_id: userId, role: 'viewer' },
            { onConflict: 'album_id,user_id' }
        );

        return res.json({ message: 'Collaboration request sent!' });
    } catch (error) {
        res.status(500).json({ message: 'Error sending request' });
    }
};

// @desc    Accept a collab request
// @route   POST /api/albums/:id/accept
// @access  Private
export const acceptCollabRequest = async (req, res) => {
    try {
        const { error } = await supabase
            .from('album_collaborators')
            .update({ role: 'contributor' })
            .eq('album_id', req.params.id)
            .eq('user_id', req.user.id);

        if (error) return res.status(400).json({ message: error.message });
        return res.json({ message: 'Request accepted, you are now a collaborator!' });
    } catch (error) {
        res.status(500).json({ message: 'Error accepting request' });
    }
};

// @desc    Reject a collab request
// @route   POST /api/albums/:id/reject
// @access  Private
export const rejectCollabRequest = async (req, res) => {
    try {
        await supabase.from('album_collaborators')
            .delete()
            .eq('album_id', req.params.id)
            .eq('user_id', req.user.id);

        return res.json({ message: 'Collaboration request rejected.' });
    } catch (error) {
        res.status(500).json({ message: 'Error rejecting request' });
    }
};

// @desc    Get user's pending collab requests
// @route   GET /api/albums/requests/pending
// @access  Private
export const getPendingRequests = async (req, res) => {
    try {
        const { data, error } = await supabase
            .from('album_collaborators')
            .select('album_id, role, albums(id, title, cover_url, created_at, profiles(username, full_name, avatar_url))')
            .eq('user_id', req.user.id)
            .eq('role', 'viewer');

        if (error) return res.status(500).json({ message: error.message });
        return res.json(data || []);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching pending requests' });
    }
};
