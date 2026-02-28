import supabase from '../config/supabase.js';

/**
 * Protect middleware - verifies Supabase JWT from Authorization header
 * Sets req.user = { id, email, ...metadata }
 */
export const protect = async (req, res, next) => {
    let token;

    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
        return res.status(401).json({ message: 'Not authorized, no token' });
    }

    try {
        const { data: { user }, error } = await supabase.auth.getUser(token);

        if (error || !user) {
            return res.status(401).json({ message: 'Not authorized, token failed' });
        }

        req.user = {
            id: user.id,
            email: user.email,
            ...user.user_metadata,
        };
        next();
    } catch (error) {
        console.error('Auth middleware error:', error);
        return res.status(401).json({ message: 'Not authorized, token failed' });
    }
};

/**
 * Optional protect - attaches req.user if token is valid, otherwise continues without auth
 */
export const optionalProtect = async (req, res, next) => {
    let token;

    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        token = req.headers.authorization.split(' ')[1];
    }

    if (!token) return next();

    try {
        const { data: { user }, error } = await supabase.auth.getUser(token);
        if (!error && user) {
            req.user = {
                id: user.id,
                email: user.email,
                ...user.user_metadata,
            };
        }
    } catch (_) {
        // Ignore and proceed without user
    }

    next();
};
