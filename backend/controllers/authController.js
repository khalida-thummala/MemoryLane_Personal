import { supabase } from '../config/supabase.js';

/**
 * getUserProfile - Retrieves profile for the current authenticated user
 */
export const getUserProfile = async (req, res) => {
    try {
        const { data: profile, error } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', req.user.id)
            .single();

        if (error) return res.status(404).json({ message: 'Profile not found' });

        const { data: following } = await supabase
            .from('follows')
            .select('following_id')
            .eq('follower_id', req.user.id);

        profile.following = following ? following.map(f => f.following_id) : [];

        res.json(profile);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

/**
 * updateUserProfile - Updates profile info
 */
export const updateUserProfile = async (req, res) => {
    try {
        const { full_name, username, avatar_url } = req.body;

        // Prepare update object with only defined fields
        const updateData = {};
        if (full_name !== undefined) updateData.full_name = full_name;
        if (username !== undefined) updateData.username = username;
        if (avatar_url !== undefined) updateData.avatar_url = avatar_url;

        const { data: updated, error } = await supabase
            .from('profiles')
            .update(updateData)
            .eq('id', req.user.id)
            .select()
            .single();

        if (error) return res.status(500).json({ message: error.message });
        res.json(updated);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

/**
 * searchUsers - Searches for users to invite to albums
 */
export const searchUsers = async (req, res) => {
    try {
        const { search } = req.query;
        const { data: users, error } = await supabase
            .from('profiles')
            .select('id, username, full_name, avatar_url')
            .or(`username.ilike.%${search}%,full_name.ilike.%${search}%`)
            .limit(10);

        if (error) return res.status(500).json({ message: error.message });
        res.json(users);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Placeholder for logic handled on frontend or needing more context
export const registerUser = (req, res) => res.status(501).json({ message: 'Use Supabase Auth on Frontend' });
export const loginUser = (req, res) => res.status(501).json({ message: 'Use Supabase Auth on Frontend' });
export const logoutUser = (req, res) => res.json({ message: 'Handled via AuthContext' });
export const followUser = async (req, res) => {
    try {
        const followerId = req.user.id;
        const targetId = req.params.id;

        if (followerId === targetId) return res.status(400).json({ message: 'Cannot follow yourself' });

        const { error } = await supabase
            .from('follows')
            .insert({ follower_id: followerId, following_id: targetId });

        if (error) {
            if (error.code === '23505') return res.status(400).json({ message: 'Already following' });
            return res.status(500).json({ message: error.message });
        }

        res.json({ message: 'Followed user' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

export const unfollowUser = async (req, res) => {
    try {
        const followerId = req.user.id;
        const targetId = req.params.id;

        const { error } = await supabase
            .from('follows')
            .delete()
            .eq('follower_id', followerId)
            .eq('following_id', targetId);

        if (error) return res.status(500).json({ message: error.message });

        res.json({ message: 'Unfollowed user' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
export const changePassword = async (req, res) => {
    try {
        const { newPassword } = req.body;
        const { adminSupabase } = await import('../config/supabase.js');

        if (!adminSupabase) {
            return res.status(500).json({ message: 'Admin features not configured' });
        }

        const { error } = await adminSupabase.auth.admin.updateUserById(
            req.user.id,
            { password: newPassword }
        );

        if (error) return res.status(500).json({ message: error.message });
        res.json({ message: 'Password updated successfully' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
export const deleteAccount = (req, res) => res.status(501).json({ message: 'Not Implemented' });
export const refreshAccessToken = (req, res) => res.status(501).json({ message: 'Handled by SDK' });
