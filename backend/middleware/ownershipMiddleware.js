import { supabase } from '../config/supabase.js';

/**
 * isAlbumOwner - verifies if the current user is the owner (user_id) of the album
 */
export const isAlbumOwner = async (req, res, next) => {
    try {
        const { data: album, error } = await supabase
            .from('albums')
            .select('user_id')
            .eq('id', req.params.id)
            .single();

        if (error || !album) {
            return res.status(404).json({ message: 'Album not found' });
        }

        if (album.user_id !== req.user.id) {
            return res.status(403).json({ message: 'Unauthorized: Only the owner can modify this album' });
        }

        next();
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

/**
 * canModifyMemory - verifies if the current user is the creator (user_id)
 * Or the owner of the album they're in (for deletion only)
 */
export const canModifyMemory = async (req, res, next) => {
    try {
        // We fetch the memory and join with album via the junctions or check user_id
        const { data: memory, error } = await supabase
            .from('memories')
            .select('id, user_id')
            .eq('id', req.params.id)
            .single();

        if (error || !memory) {
            return res.status(404).json({ message: 'Memory not found' });
        }

        const isOwner = memory.user_id === req.user.id;

        // For deletion, also check if they are the album owner (if the memory is in an album they own)
        let isAlbumOwner = false;
        if (!isOwner && req.method === 'DELETE') {
            // Check if this memory is in any album the user owns
            const { data: albumLinks } = await supabase
                .from('album_memories')
                .select('album_id')
                .eq('memory_id', req.params.id);

            if (albumLinks && albumLinks.length > 0) {
                const albumIds = albumLinks.map(l => l.album_id);
                const { data: ownedAlbums } = await supabase
                    .from('albums')
                    .select('id')
                    .eq('user_id', req.user.id)
                    .in('id', albumIds);

                if (ownedAlbums && ownedAlbums.length > 0) {
                    isAlbumOwner = true;
                }
            }
        }

        if (req.method === 'PUT' || req.method === 'PATCH') {
            if (!isOwner) return res.status(403).json({ message: 'Unauthorized: Only the creator can edit' });
        } else if (req.method === 'DELETE') {
            if (!isOwner && !isAlbumOwner) {
                return res.status(403).json({ message: 'Unauthorized: Only the creator or album owner can delete' });
            }
        }

        next();
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

/**
 * canModifyComment - verifies if the current user is the comment author
 */
export const canModifyComment = async (req, res, next) => {
    try {
        const { data: comment, error } = await supabase
            .from('memory_comments')
            .select('user_id')
            .eq('id', req.params.id)
            .single();

        if (error || !comment) {
            return res.status(404).json({ message: 'Comment not found' });
        }

        if (comment.user_id !== req.user.id) {
            return res.status(403).json({ message: 'Unauthorized: You can only modify your own comments' });
        }

        next();
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

/**
 * isMemoryOwnerForReply - verifies if the current user is the owner of the memory
 */
export const isMemoryOwnerForReply = async (req, res, next) => {
    try {
        const { data: memory, error } = await supabase
            .from('memories')
            .select('user_id')
            .eq('id', req.params.memoryId)
            .single();

        if (error || !memory) {
            return res.status(404).json({ message: 'Memory not found' });
        }

        if (memory.user_id !== req.user.id) {
            return res.status(403).json({ message: 'Unauthorized: Only the memory owner can reply as owner' });
        }

        next();
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
