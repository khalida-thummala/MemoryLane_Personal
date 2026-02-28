import Joi from 'joi';

/**
 * Supabase Tables:
 * 1. public.friends (user_id, friend_id, created_at)
 * 2. public.friend_requests (id, sender_id, recipient_id, status, created_at)
 */

export const validateFriendRequest = (data) => {
    const schema = Joi.object({
        recipientId: Joi.string().uuid().required()
    });
    return schema.validate(data);
};

export const validateFriendAction = (data) => {
    const schema = Joi.object({
        status: Joi.string().valid('accepted', 'rejected').required()
    });
    return schema.validate(data);
};
