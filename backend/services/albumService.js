import { supabase, adminSupabase } from '../config/supabase.js';

/**
 * createAlbumService
 */
export const createAlbumService = async (data, ownerId) => {
    const { data: album, error } = await supabase
        .from('albums')
        .insert([{ ...data, user_id: ownerId }])
        .select()
        .single();
    if (error) throw new Error(error.message);
    return album;
};

/**
 * updateAlbumService
 */
export const updateAlbumService = async (albumId, data) => {
    const { data: album, error } = await supabase
        .from('albums')
        .update(data)
        .eq('id', albumId)
        .select()
        .single();
    if (error) throw new Error(error.message);
    return album;
};

/**
 * deleteAlbumService
 */
export const deleteAlbumService = async (albumId) => {
    const { error } = await supabase
        .from('albums')
        .delete()
        .eq('id', albumId);
    if (error) throw new Error(error.message);
    return { message: 'Album deleted successfully' };
};

/**
 * getAlbumsService
 */
export const getAlbumsService = async (userId) => {
    const { data: owned, error: ownedError } = await supabase
        .from('albums')
        .select(`
            *,
            owner:profiles!user_id(id, username, avatar_url, full_name),
            members:album_collaborators(user_id)
        `)
        .eq('user_id', userId);

    if (ownedError) console.error('ownedError:', ownedError.message);

    const { data: collabIds } = await supabase
        .from('album_collaborators')
        .select('album_id')
        .eq('user_id', userId)
        .eq('status', 'accepted');

    let collabs = [];
    if (collabIds && collabIds.length > 0) {
        const { data: shared, error: sharedError } = await supabase
            .from('albums')
            .select(`
                *,
                owner:profiles!user_id(id, username, avatar_url, full_name),
                members:album_collaborators(user_id)
            `)
            .in('id', collabIds.map(c => c.album_id));

        if (sharedError) console.error('sharedError:', sharedError.message);
        collabs = shared || [];
    }

    const allAlbums = [...(owned || []), ...collabs];
    const uniqueAlbums = Array.from(new Map(allAlbums.map(a => [a.id, a])).values());

    // Resolve cover image and memory count for each unique album efficiently
    const albumsWithCovers = await Promise.all(uniqueAlbums.map(async (album) => {
        // Fetch the most recent memory that has at least one image
        const { data: coverData } = await supabase
            .from('album_memories')
            .select(`
                memory_id,
                memory:memories!inner(
                    id,
                    memory_date,
                    media:memory_media(media_url, media_type)
                )
            `)
            .eq('album_id', album.id)
            .order('memory_date', { foreignTable: 'memory', ascending: false })
            .limit(10); // Check top 10 recent memories for an image

        let coverUrl = null;
        if (coverData) {
            for (const item of coverData) {
                const img = item.memory?.media?.find(m => m.media_type === 'image');
                if (img) {
                    coverUrl = img.media_url;
                    break;
                }
            }
        }

        // Get total count separately for accuracy
        const { count: totalCount } = await supabase
            .from('album_memories')
            .select('*', { count: 'exact', head: true })
            .eq('album_id', album.id);

        return {
            ...album,
            coverImage: coverUrl,
            memoriesCount: totalCount || 0
        };
    }));

    return albumsWithCovers;
};

/**
 * getAlbumByIdService
 */
export const getAlbumByIdService = async (albumId) => {
    const { data: album, error } = await supabase
        .from('albums')
        .select(`
            *,
            owner:profiles!user_id(id, username, avatar_url, full_name),
            members:album_collaborators(
                user_id, 
                role, 
                profile:profiles!user_id(id, username, avatar_url, full_name)
            ),
            memories:album_memories(
                memory:memories!memory_id(
                    *,
                    user:profiles!user_id(id, username, avatar_url, full_name),
                    media:memory_media(*)
                )
            )
        `)
        .eq('id', albumId)
        .single();

    if (error || !album) {
        console.error('getAlbumByIdService DB error:', error?.message || 'Not found');
        throw new Error('Album not found or error fetching details');
    }

    return {
        ...album,
        memories: album.memories?.map(m => ({
            ...m.memory,
            addedBy: m.memory?.user,
            photos: m.memory?.media?.filter(med => med.media_type === 'image').map(med => med.media_url),
            videos: m.memory?.media?.filter(med => med.media_type === 'video').map(med => med.media_url),
            voiceNotes: m.memory?.media?.filter(med => med.media_type === 'audio').map(med => med.media_url),
        })) || []
    };
};

/**
 * getPendingRequestsService
 */
export const getPendingRequestsService = async (userId) => {
    const { data: collabRequests, error } = await supabase
        .from('album_collaborators')
        .select('album_id')
        .eq('user_id', userId)
        .eq('status', 'pending');

    if (error) throw new Error(error.message);
    if (!collabRequests || collabRequests.length === 0) return [];

    const { data: albums, error: albumError } = await supabase
        .from('albums')
        .select(`
            *,
            owner:profiles!user_id(id, username, avatar_url, full_name)
        `)
        .in('id', collabRequests.map(r => r.album_id));

    if (albumError) throw new Error(albumError.message);
    return albums;
};

/**
 * acceptInvitationService
 */
export const acceptInvitationService = async (albumId, userId) => {
    const { error } = await supabase
        .from('album_collaborators')
        .update({ status: 'accepted' })
        .eq('album_id', albumId)
        .eq('user_id', userId);

    if (error) throw new Error(error.message);
    return { success: true, message: 'Invitation accepted' };
};

/**
 * rejectInvitationService
 */
export const rejectInvitationService = async (albumId, userId) => {
    const { error } = await supabase
        .from('album_collaborators')
        .delete()
        .eq('album_id', albumId)
        .eq('user_id', userId);

    if (error) throw new Error(error.message);
    return { success: true, message: 'Invitation declined' };
};

/**
 * inviteCollaboratorService
 */
export const inviteCollaboratorService = async (albumId, userId) => {
    const { data: existing } = await supabase
        .from('album_collaborators')
        .select('*')
        .eq('album_id', albumId)
        .eq('user_id', userId)
        .single();

    if (existing) {
        throw new Error('User is already invited or a member of this album');
    }

    const { error } = await supabase
        .from('album_collaborators')
        .insert([{
            album_id: albumId,
            user_id: userId,
            role: 'editor',
            status: 'pending'
        }]);

    if (error) throw new Error(error.message);
    return { success: true, message: 'Invitation sent' };
};
