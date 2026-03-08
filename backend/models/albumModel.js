import Joi from 'joi';

/**
 * validateAlbum - Joi validation schema for the Album model
 */
export const validateAlbum = (data) => {
    const schema = Joi.object({
        title: Joi.string().min(1).max(200).required(),
        description: Joi.string().allow('', null).max(2048),
        cover_url: Joi.string().allow('', null),
        is_shared: Joi.boolean(),
        collaborators: Joi.array().items(Joi.string()),
    });
    return schema.validate(data);
};
