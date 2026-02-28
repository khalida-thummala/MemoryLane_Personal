import Joi from 'joi';

/**
 * Supabase Table: public.profiles
 * Columns: id (uuid), username (text), full_name (text), avatar_url (text), created_at (timestamptz)
 */

export const validateUserUpdate = (data) => {
    const schema = Joi.object({
        name: Joi.string().min(2).max(50),
        username: Joi.string().min(3).max(30).alphanum(),
        avatar_url: Joi.string().uri(),
        email: Joi.string().email(),
    });
    return schema.validate(data);
};

export const validateRegistration = (data) => {
    const schema = Joi.object({
        name: Joi.string().min(2).max(50).required(),
        email: Joi.string().email().required(),
        password: Joi.string().min(6).required(),
    });
    return schema.validate(data);
};
