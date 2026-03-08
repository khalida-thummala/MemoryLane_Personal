import mongoose from 'mongoose';
import Joi from 'joi';

const userSchema = new mongoose.Schema({
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    username: { type: String, unique: true, sparse: true },
    avatar_url: String,
    role: { type: String, enum: ['user', 'admin'], default: 'user' },
    created_at: { type: Date, default: Date.now },
    updated_at: { type: Date, default: Date.now }
}, { timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } });

const User = mongoose.model('User', userSchema);

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

export default User;

