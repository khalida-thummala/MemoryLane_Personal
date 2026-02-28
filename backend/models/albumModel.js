import Joi from 'joi';

/**
 * Supabase Tables:
 * 1. public.albums (id, user_id, title, description, cover_url, is_shared, invite_token, created_at, updated_at)
 * 2. public.album_memories (album_id, memory_id)
 * 3. public.album_collaborators (album_id, user_id, role)
 */

export const validateAlbum = (data) => {
    const schema = Joi.object({
        title: Joi.string().min(1).max(200).required(),
        description: Joi.string().allow('', null).max(2048),
        cover_url: Joi.string().uri().allow('', null),
        is_shared: Joi.boolean(),
        collaborators: Joi.array().items(Joi.string().uuid()),
        memory_ids: Joi.array().items(Joi.string().uuid()),
    });
    return schema.validate(data);
};
