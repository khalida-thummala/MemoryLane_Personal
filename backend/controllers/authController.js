import { supabase, adminSupabase } from '../config/supabase.js';

// @desc    Register a new user
// @route   POST /api/auth/register
// @access  Public
export const registerUser = async (req, res) => {
    try {
        const { name, email, password } = req.body;

        if (!name || !email || !password) {
            return res.status(400).json({ message: 'Please provide name, email and password' });
        }

        console.log('Registering user:', email);

        // Sign up user via standard Auth (anon key friendly)
        const { data: authData, error: authError } = await supabase.auth.signUp({
            email,
            password,
            options: {
                data: {
                    full_name: name,
                    username: name.toLowerCase().replace(/\s+/g, '_')
                }
            }
        });

        if (authError) {
            console.error('Registration error:', authError);
            return res.status(400).json({ message: authError.message });
        }

        if (!authData.user) {
            return res.status(500).json({ message: 'Registration failed: User not created' });
        }

        // Note: The public.profiles table is updated automatically via the handle_new_user() trigger in DB

        return res.status(201).json({
            id: authData.user.id,
            name: name,
            email: authData.user.email,
            token: authData.session?.access_token || null,
            refreshToken: authData.session?.refresh_token || null,
            message: authData.session ? 'Registration successful' : 'Check your email for confirmation link'
        });

    } catch (error) {
        console.error('Registration catch error:', error);
        res.status(500).json({ message: error.message });
    }
};

// @desc    Auth user & get token
// @route   POST /api/auth/login
// @access  Public
export const loginUser = async (req, res) => {
    try {
        const { email, password } = req.body;

        const { data, error } = await supabase.auth.signInWithPassword({ email, password });

        if (error) {
            return res.status(401).json({ message: 'Invalid email or password' });
        }

        // Fetch profile
        const { data: profile } = await supabase
            .from('profiles')
            .select('username, avatar_url, full_name')
            .eq('id', data.user.id)
            .single();

        res.cookie('jwt', data.session.refresh_token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict',
            maxAge: 7 * 24 * 60 * 60 * 1000
        });

        return res.json({
            id: data.user.id,
            email: data.user.email,
            name: profile?.full_name || profile?.username || data.user.email,
            avatar_url: profile?.avatar_url || '',
            token: data.session.access_token,
            refreshToken: data.session.refresh_token,
        });

    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Refresh access token
// @route   POST /api/auth/refresh
// @access  Public
export const refreshAccessToken = async (req, res) => {
    try {
        const refreshToken = req.cookies?.jwt || req.body.refreshToken;

        if (!refreshToken) {
            return res.status(401).json({ message: 'Not authorized, no refresh token' });
        }

        const { data, error } = await supabase.auth.refreshSession({ refresh_token: refreshToken });

        if (error || !data.session) {
            return res.status(403).json({ message: 'Refresh token expired or invalid' });
        }

        res.cookie('jwt', data.session.refresh_token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict',
            maxAge: 7 * 24 * 60 * 60 * 1000
        });

        return res.json({ token: data.session.access_token });

    } catch (error) {
        res.status(403).json({ message: 'Refresh token error', error: error.message });
    }
};

// @desc    Logout user
// @route   POST /api/auth/logout
// @access  Private
export const logoutUser = async (req, res) => {
    try {
        if (adminSupabase) {
            await adminSupabase.auth.admin.signOut(req.user.id);
        } else {
            // Fallback for non-admin client (sign out current session)
            await supabase.auth.signOut();
        }
        res.cookie('jwt', '', { httpOnly: true, expires: new Date(0) });
        return res.status(200).json({ message: 'Logged out successfully' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get user profile
// @route   GET /api/auth/profile
// @access  Private
export const getUserProfile = async (req, res) => {
    try {
        const { data: profile, error } = await supabase
            .from('profiles')
            .select('id, username, avatar_url, created_at')
            .eq('id', req.user.id)
            .single();

        if (error || !profile) {
            return res.status(404).json({ message: 'User not found' });
        }

        const { data: friendsData } = await supabase
            .from('friends')
            .select('friend_id')
            .eq('user_id', req.user.id);

        const following = friendsData ? friendsData.map(f => f.friend_id) : [];

        return res.json({
            id: profile.id,
            name: profile.username || 'User',
            email: req.user.email,
            avatar_url: profile.avatar_url,
            username: profile.username,
            created_at: profile.created_at,
            following: following
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Update user profile
// @route   PUT /api/auth/profile
// @access  Private
export const updateUserProfile = async (req, res) => {
    try {
        const updates = {};
        if (req.body.username) updates.username = req.body.username;
        if (req.body.avatar_url) updates.avatar_url = req.body.avatar_url;

        const { data, error } = await supabase
            .from('profiles')
            .update(updates)
            .eq('id', req.user.id)
            .select()
            .single();

        if (error) return res.status(400).json({ message: error.message });

        // Update email in auth if provided
        if (req.body.email && req.body.email !== req.user.email) {
            const { error: emailError } = await supabase.auth.admin.updateUserById(req.user.id, {
                email: req.body.email
            });
            if (emailError) return res.status(400).json({ message: emailError.message });
        }

        return res.json({
            id: data.id,
            name: data.full_name || data.username,
            email: req.body.email || req.user.email,
            avatar_url: data.avatar_url,
            username: data.username,
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Change Password
// @route   PUT /api/auth/password
// @access  Private
export const changePassword = async (req, res) => {
    try {
        const { error } = await supabase.auth.admin.updateUserById(req.user.id, {
            password: req.body.newPassword
        });
        if (error) return res.status(400).json({ message: error.message });
        return res.json({ message: 'Password updated successfully' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Delete Account
// @route   DELETE /api/auth/account
// @access  Private
export const deleteAccount = async (req, res) => {
    try {
        const { error } = await supabase.auth.admin.deleteUser(req.user.id);
        if (error) return res.status(400).json({ message: error.message });
        res.cookie('jwt', '', { httpOnly: true, expires: new Date(0) });
        return res.json({ message: 'User account deleted' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Auth user with Google OAuth
// @route   POST /api/auth/google
// @access  Public
export const googleLogin = async (req, res) => {
    try {
        const { email, name, picture } = req.body;

        // Check if user exists in auth
        const { data: existingUsers } = await supabase.auth.admin.listUsers();
        const existingUser = existingUsers?.users?.find(u => u.email === email);

        let userId;
        if (!existingUser) {
            const { data: newUser, error: createError } = await supabase.auth.admin.createUser({
                email,
                email_confirm: true,
                user_metadata: { full_name: name, avatar_url: picture }
            });
            if (createError) return res.status(400).json({ message: createError.message });
            userId = newUser.user.id;

            // Update profile
            await supabase.from('profiles')
                .update({ full_name: name, avatar_url: picture })
                .eq('id', userId);
        } else {
            userId = existingUser.id;
            // Update avatar if changed
            if (picture) {
                await supabase.from('profiles').update({ avatar_url: picture }).eq('id', userId);
            }
        }

        // Generate magic link session (OTP approach for Google)
        const { data: linkData, error: linkError } = await supabase.auth.admin.generateLink({
            type: 'magiclink',
            email,
        });

        if (linkError) return res.status(500).json({ message: linkError.message });

        const { data: profile } = await supabase.from('profiles').select('*').eq('id', userId).single();

        return res.json({
            id: userId,
            email,
            name: profile?.full_name || name,
            avatar_url: profile?.avatar_url || picture,
            // Note: For Google OAuth, the frontend should use Supabase client-side OAuth directly
            message: 'Google login: use Supabase client-side OAuth for full session support',
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Search for users
// @route   GET /api/auth/users/search
// @access  Private
export const searchUsers = async (req, res) => {
    try {
        const { search } = req.query;
        if (!search) return res.json([]);

        const { data: users, error } = await supabase
            .from('profiles')
            .select('id, username, avatar_url')
            .ilike('username', `%${search}%`)
            .limit(10);

        if (error) throw error;
        res.json(users || []);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Follow a user
// @route   POST /api/auth/users/:id/follow
// @access  Private
export const followUser = async (req, res) => {
    try {
        // Using friends table as a follow relationship
        const { error } = await supabase.from('friends').upsert({
            user_id: req.user.id,
            friend_id: req.params.id
        }, { onConflict: 'user_id,friend_id' });

        if (error) return res.status(400).json({ message: error.message });
        return res.json({ message: 'Successfully followed user' });
    } catch (error) {
        res.status(500).json({ message: 'Follow action failed' });
    }
};

// @desc    Unfollow a user
// @route   POST /api/auth/users/:id/unfollow
// @access  Private
export const unfollowUser = async (req, res) => {
    try {
        const { error } = await supabase.from('friends')
            .delete()
            .eq('user_id', req.user.id)
            .eq('friend_id', req.params.id);

        if (error) return res.status(400).json({ message: error.message });
        return res.json({ message: 'Successfully unfollowed user' });
    } catch (error) {
        res.status(500).json({ message: 'Unfollow action failed' });
    }
};
