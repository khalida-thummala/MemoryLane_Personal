import * as albumService from '../services/albumService.js';
import { supabase } from '../config/supabase.js';
import { validateAlbum } from '../models/albumModel.js';

/**
 * getAlbums - Fetches all albums the user owns or is a collaborator on
 */
export const getAlbums = async (req, res) => {
    try {
        console.log(`[AlbumController] Fetching albums for user: ${req.user.id}`);
        const albums = await albumService.getAlbumsService(req.user.id);
        console.log(`[AlbumController] Found ${albums.length} albums`);
        res.json(albums);
    } catch (error) {
        console.error('[AlbumController] getAlbums error:', error.message);
        res.status(500).json({ message: error.message });
    }
};

/**
 * createAlbum - Creates a new album and assigns owner
 */
export const createAlbum = async (req, res) => {
    try {
        const { error } = validateAlbum(req.body);
        if (error) return res.status(400).json({ message: error.details[0].message });

        const album = await albumService.createAlbumService(req.body, req.user.id);
        res.status(201).json(album);
    } catch (error) {
        console.error('createAlbum error:', error);
        res.status(500).json({ message: error.message });
    }
};

/**
 * getAlbumById - Retrieves an album with members and memories
 */
export const getAlbumById = async (req, res) => {
    try {
        const album = await albumService.getAlbumByIdService(req.params.id);
        res.json(album);
    } catch (error) {
        console.error('getAlbumById error:', error.message);
        res.status(500).json({ message: error.message });
    }
};

/**
 * updateAlbum - Updates an existing album
 */
export const updateAlbum = async (req, res) => {
    try {
        const album = await albumService.updateAlbumService(req.params.id, req.body);
        res.json(album);
    } catch (error) {
        console.error('updateAlbum error:', error);
        res.status(500).json({ message: error.message });
    }
};

/**
 * deleteAlbum - Removes an album
 */
export const deleteAlbum = async (req, res) => {
    try {
        const result = await albumService.deleteAlbumService(req.params.id);
        res.json(result);
    } catch (error) {
        console.error('deleteAlbum error:', error);
        res.status(500).json({ message: error.message });
    }
};

/**
 * addMemoryToAlbum - For adding a memory to a collaborative album
 */
export const addMemoryToAlbum = async (req, res) => {
    try {
        const { memoryId } = req.params;
        const albumId = req.params.id;

        const { data: link, error } = await supabase
            .from('album_memories')
            .upsert([{ album_id: albumId, memory_id: memoryId }]);

        if (error) throw error;
        res.json({ message: 'Memory successfully added to album' });
    } catch (error) {
        console.error('addMemoryToAlbum error:', error);
        res.status(500).json({ message: error.message });
    }
};

/**
 * getPendingRequests
 */
export const getPendingRequests = async (req, res) => {
    try {
        const requests = await albumService.getPendingRequestsService(req.user.id);
        res.json(requests);
    } catch (error) {
        console.error('getPendingRequests error:', error);
        res.status(500).json({ message: error.message });
    }
};

/**
 * acceptInvitation
 */
export const acceptInvitation = async (req, res) => {
    try {
        const result = await albumService.acceptInvitationService(req.params.id, req.user.id);
        res.json(result);
    } catch (error) {
        console.error('acceptInvitation error:', error);
        res.status(500).json({ message: error.message });
    }
};

/**
 * rejectInvitation
 */
export const rejectInvitation = async (req, res) => {
    try {
        const result = await albumService.rejectInvitationService(req.params.id, req.user.id);
        res.json(result);
    } catch (error) {
        console.error('rejectInvitation error:', error);
        res.status(500).json({ message: error.message });
    }
};

/**
 * inviteCollaborator
 */
export const inviteCollaborator = async (req, res) => {
    try {
        const { userId } = req.body;
        const albumId = req.params.id;
        const result = await albumService.inviteCollaboratorService(albumId, userId);
        res.json(result);
    } catch (error) {
        console.error('inviteCollaborator error:', error);
        res.status(500).json({ message: error.message });
    }
};
