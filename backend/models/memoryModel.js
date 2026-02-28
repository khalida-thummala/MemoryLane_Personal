import Joi from 'joi';

/**
 * Supabase Tables:
 * 1. public.memories (id, user_id, title, description, memory_date, location, latitude, longitude, is_milestone, is_public, created_at, updated_at)
 * 2. public.memory_media (id, memory_id, media_url, media_type, created_at)
 * 3. public.tags (id, name)
 * 4. public.memory_tags (memory_id, tag_id)
 */

export const validateMemory = (data) => {
    const schema = Joi.object({
        title: Joi.string().min(1).max(200).required(),
        description: Joi.string().allow('', null).max(2000),
        date: Joi.date().iso(),
        locationName: Joi.string().allow('', null),
        tags: Joi.alternatives().try(Joi.array().items(Joi.string()), Joi.string()),
        milestone: Joi.boolean(),
        isPublic: Joi.boolean(),
        photos: Joi.array().items(Joi.string().uri()),
        videos: Joi.array().items(Joi.string().uri()),
        voiceNotes: Joi.array().items(Joi.string().uri()),
    });
    return schema.validate(data);
};
