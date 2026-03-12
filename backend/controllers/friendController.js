import supabase from '../config/supabase.js';

// @desc    Send Friend Request
// @route   POST /api/friends/request/:id
// @access  Private
export const sendFriendRequest = async (req, res) => {
    try {
        const recipientId = req.params.id;
        const senderId = req.user.id;

        if (recipientId === senderId) {
            return res.status(400).json({ message: 'You cannot send a request to yourself' });
        }

        // Check if already friends
        const { data: existingFriend } = await supabase
            .from('friends')
            .select('user_id')
            .eq('user_id', senderId)
            .eq('friend_id', recipientId)
            .single();

        if (existingFriend) return res.status(400).json({ message: 'Already friends' });

        // Check for existing pending request
        const { data: existing } = await supabase
            .from('friend_requests')
            .select('id')
            .or(`and(sender_id.eq.${senderId},recipient_id.eq.${recipientId}),and(sender_id.eq.${recipientId},recipient_id.eq.${senderId})`)
            .eq('status', 'pending')
            .single();

        if (existing) return res.status(400).json({ message: 'Friend request already pending' });

        const { error } = await supabase.from('friend_requests').insert({
            sender_id: senderId,
            recipient_id: recipientId,
            status: 'pending'
        });

        if (error) return res.status(400).json({ message: error.message });

        // Create notification for recipient
        await supabase.from('notifications').insert({
            user_id: recipientId,
            sender_id: senderId,
            type: 'friend_request',
            content: `${req.user.user_metadata?.full_name || req.user.user_metadata?.name || req.user.email} sent you a friend request.`
        });

        return res.status(201).json({ message: 'Friend request sent' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Accept Friend Request
// @route   POST /api/friends/accept/:id
// @access  Private
export const acceptFriendRequest = async (req, res) => {
    try {
        const { data: request, error: findErr } = await supabase
            .from('friend_requests')
            .select('*')
            .eq('id', req.params.id)
            .eq('status', 'pending')
            .single();

        if (findErr || !request) return res.status(404).json({ message: 'Friend request not found' });
        if (request.recipient_id !== req.user.id) return res.status(401).json({ message: 'Not authorized' });

        // Update request status
        await supabase.from('friend_requests').update({ status: 'accepted' }).eq('id', req.params.id);

        await supabase.from('friends').upsert([
            { user_id: request.sender_id, friend_id: request.recipient_id },
            { user_id: request.recipient_id, friend_id: request.sender_id },
        ], { onConflict: 'user_id,friend_id' });

        // Create notification for the original sender that they accepted
        await supabase.from('notifications').insert({
            user_id: request.sender_id,
            sender_id: req.user.id,
            type: 'friend_accept',
            content: `${req.user.user_metadata?.full_name || req.user.user_metadata?.name || req.user.email} accepted your friend request.`
        });

        return res.json({ message: 'Friend request accepted' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Reject Friend Request
// @route   POST /api/friends/reject/:id
// @access  Private
export const rejectFriendRequest = async (req, res) => {
    try {
        const { data: request, error: findErr } = await supabase
            .from('friend_requests')
            .select('*')
            .eq('id', req.params.id)
            .eq('status', 'pending')
            .single();

        if (findErr || !request) return res.status(404).json({ message: 'Friend request not found' });
        if (request.recipient_id !== req.user.id) return res.status(401).json({ message: 'Not authorized' });

        await supabase.from('friend_requests').update({ status: 'rejected' }).eq('id', req.params.id);
        return res.json({ message: 'Friend request rejected' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Cancel Friend Request
// @route   POST /api/friends/cancel/:id
// @access  Private
export const cancelFriendRequest = async (req, res) => {
    try {
        const { data: request, error: findErr } = await supabase
            .from('friend_requests')
            .select('*')
            .eq('id', req.params.id)
            .eq('status', 'pending')
            .single();

        if (findErr || !request) return res.status(404).json({ message: 'Friend request not found' });
        if (request.sender_id !== req.user.id) return res.status(401).json({ message: 'Not authorized' });

        await supabase.from('friend_requests').delete().eq('id', req.params.id);
        return res.json({ message: 'Friend request cancelled' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get Pending Friend Requests
// @route   GET /api/friends/pending
// @access  Private
export const getPendingFriendRequests = async (req, res) => {
    try {
        const { data, error } = await supabase
            .from('friend_requests')
            .select('id, created_at, status, profiles!friend_requests_sender_id_fkey(id, username, avatar_url)')
            .eq('recipient_id', req.user.id)
            .eq('status', 'pending');

        if (error) return res.status(500).json({ message: error.message });
        return res.json(data || []);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get Sent Friend Requests
// @route   GET /api/friends/sent
// @access  Private
export const getSentFriendRequests = async (req, res) => {
    try {
        const { data, error } = await supabase
            .from('friend_requests')
            .select('id, created_at, status, profiles!friend_requests_recipient_id_fkey(id, username, avatar_url)')
            .eq('sender_id', req.user.id)
            .eq('status', 'pending');

        if (error) return res.status(500).json({ message: error.message });
        return res.json(data || []);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get All Friends
// @route   GET /api/friends
// @access  Private
export const getFriends = async (req, res) => {
    try {
        const { data, error } = await supabase
            .from('friends')
            .select('profiles!friends_friend_id_fkey(id, username, avatar_url)')
            .eq('user_id', req.user.id);

        if (error) return res.status(500).json({ message: error.message });
        return res.json((data || []).map(r => r.profiles));
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get All Notifications
// @route   GET /api/friends/notifications
// @access  Private
export const getNotifications = async (req, res) => {
    try {
        const { data, error } = await supabase
            .from('notifications')
            .select('*, profiles!notifications_sender_id_fkey(username, avatar_url)')
            .eq('user_id', req.user.id)
            .order('created_at', { ascending: false })
            .limit(20);

        if (error) return res.status(500).json({ message: error.message });
        return res.json(data || []);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Mark Notification as Read
// @route   PUT /api/friends/notifications/:id
// @access  Private
export const markNotificationRead = async (req, res) => {
    try {
        const { error } = await supabase
            .from('notifications')
            .update({ is_read: true })
            .eq('id', req.params.id)
            .eq('user_id', req.user.id);

        if (error) return res.status(500).json({ message: error.message });
        return res.json({ message: 'Marked as read' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
