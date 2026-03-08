import Joi from 'joi';

/**
 * validateMemory - Joi validation schema for Memory data
 */
export const validateMemory = (data) => {
    const schema = Joi.object({
        title: Joi.string().min(1).max(200).required(),
        description: Joi.string().allow('', null).max(2000),
        memory_date: Joi.date().iso().allow(null),
        location: Joi.string().allow('', null),
        latitude: Joi.number().allow(null),
        longitude: Joi.number().allow(null),
        is_milestone: Joi.boolean(),
        is_public: Joi.boolean(),
        photos: Joi.any(),
        videos: Joi.any(),
        voiceNotes: Joi.any(),
        tags: Joi.alternatives().try(
            Joi.array().items(Joi.string()),
            Joi.string()
        ),
        album: Joi.string().uuid(),
    });
    return schema.validate(data, { allowUnknown: true });
};
