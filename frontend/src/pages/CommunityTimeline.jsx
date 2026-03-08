import { useState, useEffect, useContext, useRef } from 'react';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Globe, Calendar, MapPin, Heart, MessageSquare, Loader2, Star,
    Share2, Search, Send, UserPlus, UserMinus, X, ChevronLeft,
    MoreHorizontal, Edit3, Trash2, CornerDownRight, Check, Image as ImageIcon
} from 'lucide-react';
import { AuthContext } from '../context/AuthContext';
import ShareOptions from '../components/ShareOptions';
import { getMediaUrl } from '../utils/mediaUtils';

// ─────────────────────────────────────────────────────────
// Avatar helper
// ─────────────────────────────────────────────────────────
const Avatar = ({ user, size = 'md' }) => {
    const sizes = { sm: 'w-7 h-7 text-[10px]', md: 'w-10 h-10 text-sm', lg: 'w-12 h-12 text-base' };
    const letter = (user?.full_name || user?.username || user?.name || 'A').charAt(0).toUpperCase();
    return (
        <div className={`${sizes[size]} rounded-full bg-gradient-to-br from-indigo-400 to-purple-500 flex items-center justify-center text-white font-bold shrink-0 overflow-hidden ring-2 ring-white dark:ring-slate-900`}>
            {user?.avatar_url || user?.avatar
                ? <img src={getMediaUrl(user.avatar_url || user.avatar)} alt={letter} className="w-full h-full object-cover" />
                : letter}
        </div>
    );
};

// ─────────────────────────────────────────────────────────
// Single comment row (recursive for replies)
// ─────────────────────────────────────────────────────────
const CommentRow = ({ comment, memoryId, currentUser, onReply, onDelete, onUpdate, depth = 0 }) => {
    const [menuOpen, setMenuOpen] = useState(false);
    const [editing, setEditing] = useState(false);
    const [editText, setEditText] = useState(comment.text);
    const [showReplyBox, setShowReplyBox] = useState(false);
    const [replyText, setReplyText] = useState('');
    const menuRef = useRef(null);

    const isOwner = currentUser && String(comment.user_id || comment.user?.id) === String(currentUser.id);
    const displayName = comment.user?.full_name || comment.user?.username || comment.user?.name || 'User';
    const username = comment.user?.username || comment.user?.name || 'user';

    // Close menu on outside click
    useEffect(() => {
        const handler = (e) => { if (menuRef.current && !menuRef.current.contains(e.target)) setMenuOpen(false); };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, []);

    const handleSaveEdit = async () => {
        if (!editText.trim() || editText === comment.text) { setEditing(false); return; }
        await onUpdate(comment.id, editText.trim());
        setEditing(false);
    };

    const handleReplySubmit = () => {
        if (!replyText.trim()) return;
        onReply(memoryId, replyText.trim(), comment.id);
        setReplyText('');
        setShowReplyBox(false);
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            className={depth > 0 ? 'ml-8 border-l-2 border-indigo-100 dark:border-slate-700 pl-4' : ''}
        >
            <div className="flex gap-3 items-start group/comment">
                <Avatar user={comment.user} size="sm" />
                <div className="flex-1 min-w-0">
                    {/* Bubble */}
                    <div className="bg-gray-50/80 dark:bg-slate-800/60 rounded-2xl px-4 py-2.5 relative">
                        <div className="flex items-center gap-2 mb-0.5">
                            <span className="text-xs font-black text-slate-800 dark:text-white">{displayName}</span>
                            <span className="text-[9px] text-indigo-500 font-bold tracking-wide">@{username}</span>
                            {depth > 0 && (
                                <span className="text-[8px] bg-indigo-100 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-300 px-1.5 py-0.5 rounded-full font-black uppercase">Reply</span>
                            )}
                        </div>

                        {editing ? (
                            <div className="flex gap-2 mt-1">
                                <input
                                    autoFocus
                                    value={editText}
                                    onChange={e => setEditText(e.target.value)}
                                    onKeyDown={e => { if (e.key === 'Enter') handleSaveEdit(); if (e.key === 'Escape') setEditing(false); }}
                                    className="flex-1 bg-white dark:bg-slate-700 rounded-xl px-3 py-1.5 text-sm outline-none border border-indigo-300 dark:border-indigo-600 font-medium"
                                />
                                <button onClick={handleSaveEdit} className="p-1.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"><Check size={13} /></button>
                                <button onClick={() => setEditing(false)} className="p-1.5 bg-gray-100 dark:bg-slate-700 rounded-lg hover:bg-gray-200 transition-colors"><X size={13} /></button>
                            </div>
                        ) : (
                            <p className="text-sm text-slate-700 dark:text-slate-200 font-medium leading-relaxed">{comment.text}</p>
                        )}

                        {/* 3-dot menu — only for owner */}
                        {isOwner && !editing && (
                            <div className="absolute top-2 right-2 opacity-0 group-hover/comment:opacity-100 transition-opacity" ref={menuRef}>
                                <button
                                    onClick={() => setMenuOpen(v => !v)}
                                    className="p-1 rounded-full hover:bg-black/5 dark:hover:bg-white/10 transition-colors"
                                >
                                    <MoreHorizontal size={14} className="text-slate-400" />
                                </button>
                                <AnimatePresence>
                                    {menuOpen && (
                                        <motion.div
                                            initial={{ opacity: 0, scale: 0.9, y: -4 }}
                                            animate={{ opacity: 1, scale: 1, y: 0 }}
                                            exit={{ opacity: 0, scale: 0.9, y: -4 }}
                                            className="absolute right-0 top-7 w-32 bg-white dark:bg-slate-800 rounded-xl shadow-xl border border-gray-100 dark:border-slate-700 overflow-hidden z-20"
                                        >
                                            <button
                                                onClick={() => { setEditing(true); setMenuOpen(false); }}
                                                className="flex items-center gap-2 w-full px-3 py-2 text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-indigo-50 dark:hover:bg-slate-700 transition-colors"
                                            >
                                                <Edit3 size={12} /> Edit
                                            </button>
                                            <button
                                                onClick={() => { onDelete(comment.id); setMenuOpen(false); }}
                                                className="flex items-center gap-2 w-full px-3 py-2 text-xs font-bold text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                                            >
                                                <Trash2 size={12} /> Delete
                                            </button>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>
                        )}
                    </div>

                    {/* Action row */}
                    <div className="flex items-center gap-4 mt-1 ml-2">
                        {currentUser && depth === 0 && (
                            <button
                                onClick={() => setShowReplyBox(v => !v)}
                                className="text-[10px] font-black text-slate-400 hover:text-indigo-500 uppercase tracking-wider transition-colors flex items-center gap-1"
                            >
                                <CornerDownRight size={10} /> Reply
                            </button>
                        )}
                        {comment.created_at && (
                            <span className="text-[9px] text-slate-300 dark:text-slate-600 font-semibold">
                                {new Date(comment.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                            </span>
                        )}
                    </div>

                    {/* Reply box */}
                    <AnimatePresence>
                        {showReplyBox && (
                            <motion.div
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: 'auto' }}
                                exit={{ opacity: 0, height: 0 }}
                                className="mt-2 ml-2 flex gap-2 overflow-hidden"
                            >
                                <input
                                    autoFocus
                                    value={replyText}
                                    onChange={e => setReplyText(e.target.value)}
                                    onKeyDown={e => { if (e.key === 'Enter') handleReplySubmit(); if (e.key === 'Escape') setShowReplyBox(false); }}
                                    placeholder={`Reply to @${username}...`}
                                    className="flex-1 bg-white dark:bg-slate-800 border border-indigo-200 dark:border-slate-600 rounded-xl px-3 py-2 text-xs outline-none font-semibold focus:border-indigo-400 transition-colors"
                                />
                                <button onClick={handleReplySubmit} className="px-3 py-2 bg-indigo-600 text-white rounded-xl text-xs font-black hover:bg-indigo-700 transition-colors flex items-center gap-1">
                                    <Send size={11} /> Send
                                </button>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {/* Nested replies */}
                    {comment.replies?.length > 0 && (
                        <div className="mt-2 flex flex-col gap-2">
                            {comment.replies.map((reply, i) => (
                                <CommentRow
                                    key={reply.id || reply.ridx || i}
                                    comment={reply}
                                    memoryId={memoryId}
                                    currentUser={currentUser}
                                    onReply={onReply}
                                    onDelete={onDelete}
                                    onUpdate={onUpdate}
                                    depth={depth + 1}
                                />
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </motion.div>
    );
};

// ─────────────────────────────────────────────────────────
// Main Community Timeline
// ─────────────────────────────────────────────────────────
const CommunityTimeline = () => {
    const { user } = useContext(AuthContext);
    const [memories, setMemories] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [commentTexts, setCommentTexts] = useState({});
    const [feedFilter, setFeedFilter] = useState('all');
    const [currentUserData, setCurrentUserData] = useState(null);
    const [selectedImage, setSelectedImage] = useState(null);
    const [expandedComments, setExpandedComments] = useState({});
    const [sharingMemory, setSharingMemory] = useState(null);


    useEffect(() => {
        fetchCommunityMemories();
        if (user) fetchUserProfile();
    }, [feedFilter, user]); // eslint-disable-line react-hooks/exhaustive-deps

    const fetchUserProfile = async () => {
        try {
            const config = { headers: { Authorization: `Bearer ${user.token}` } };
            const res = await axios.get('/api/auth/profile', config);
            setCurrentUserData(res.data);
        } catch (_) { console.error('Profile fetch error:', _); }
    };

    const fetchCommunityMemories = async () => {
        setLoading(true);
        try {
            const config = user ? { headers: { Authorization: `Bearer ${user.token}` } } : {};
            const res = await axios.get(`/api/community?filter=${feedFilter}`, config);
            setMemories(res.data || []);
        } catch (_) {
            console.error('Community feed error:', _);
        } finally {
            setLoading(false);
        }
    };

    const handleLike = async (memoryId) => {
        if (!user) return alert('Please login to like memories');
        try {
            const config = { headers: { Authorization: `Bearer ${user.token}` } };
            await axios.post(`/api/memories/${memoryId}/like`, {}, config);
            fetchCommunityMemories();
        } catch (_) { console.error('Like error:', _); }
    };

    const handleFollow = async (targetId) => {
        if (!user) return alert('Please login to follow users');
        try {
            const config = { headers: { Authorization: `Bearer ${user.token}` } };
            await axios.post(`/api/auth/users/${targetId}/follow`, {}, config);
            fetchUserProfile();
        } catch (_) { alert('Failed to follow'); }
    };

    const handleUnfollow = async (targetId) => {
        try {
            const config = { headers: { Authorization: `Bearer ${user.token}` } };
            await axios.post(`/api/auth/users/${targetId}/unfollow`, {}, config);
            fetchUserProfile();
        } catch (_) { alert('Failed to unfollow'); }
    };

    const submitComment = async (memoryId, parentId = null) => {
        const text = typeof parentId === 'string' && commentTexts[memoryId]
            ? commentTexts[memoryId]
            : commentTexts[memoryId];
        if (!text?.trim()) return;
        try {
            const config = { headers: { Authorization: `Bearer ${user.token}` } };
            await axios.post(`/api/memories/${memoryId}/comment`, { text, parentId }, config);
            setCommentTexts(prev => ({ ...prev, [memoryId]: '' }));
            fetchCommunityMemories();
        } catch (_) { alert('Failed to add comment'); }
    };

    const handleReply = async (memoryId, text, parentId) => {
        try {
            const config = { headers: { Authorization: `Bearer ${user.token}` } };
            await axios.post(`/api/memories/${memoryId}/comment`, { text, parentId }, config);
            fetchCommunityMemories();
        } catch (_) { alert('Failed to reply'); }
    };

    const handleDeleteComment = async (commentId) => {
        if (!window.confirm('Delete this comment?')) return;
        try {
            const config = { headers: { Authorization: `Bearer ${user.token}` } };
            await axios.delete(`/api/memories/comments/${commentId}`, config);
            fetchCommunityMemories();
        } catch (_) { alert('Failed to delete comment'); }
    };

    const handleUpdateComment = async (commentId, text) => {
        try {
            const config = { headers: { Authorization: `Bearer ${user.token}` } };
            await axios.put(`/api/memories/comments/${commentId}`, { text }, config);
            fetchCommunityMemories();
        } catch (_) { alert('Failed to update comment'); }
    };

    const toggleComments = (memoryId) => {
        setExpandedComments(prev => ({ ...prev, [memoryId]: !prev[memoryId] }));
    };

    const filteredMemories = memories.filter(memory => {
        const search = searchTerm.toLowerCase();
        return (
            memory.title?.toLowerCase().includes(search) ||
            memory.description?.toLowerCase().includes(search) ||
            memory.locationName?.toLowerCase().includes(search) ||
            memory.user?.name?.toLowerCase().includes(search) ||
            memory.user?.username?.toLowerCase().includes(search) ||
            (Array.isArray(memory.tags) && memory.tags.some(tag => tag?.toLowerCase().includes(search)))
        );
    });

    if (loading && memories.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center h-[60vh] gap-4">
                <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
                <p className="text-slate-500 font-black animate-pulse uppercase tracking-widest text-xs">Scanning the Globe...</p>
            </div>
        );
    }

    return (
        <div className="max-w-[1400px] mx-auto py-12 px-4 md:px-8">
            {/* Header */}
            <div className="flex flex-col gap-8 mb-12">
                <div className="flex justify-between items-end flex-wrap gap-4">
                    <div>
                        <h1 className="text-4xl md:text-5xl font-black bg-clip-text text-transparent bg-gradient-to-r from-indigo-500 via-purple-500 to-fuchsia-600 mb-2">
                            Community Stream ✨
                        </h1>
                        <p className="text-slate-500 dark:text-slate-400 font-bold tracking-tight uppercase text-xs">Global memories shared with the world 🌍</p>
                    </div>
                    {user && (
                        <div className="flex p-1 bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-indigo-50 dark:border-slate-700">
                            {[
                                { id: 'all', label: 'GLOBAL' },
                                { id: 'following', label: 'FOLLOWING' }
                            ].map(filter => (
                                <button
                                    key={filter.id}
                                    onClick={() => setFeedFilter(filter.id)}
                                    className={`px-5 py-2 rounded-xl text-xs font-black transition-all ${feedFilter === filter.id ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20' : 'text-slate-500 hover:text-indigo-600'}`}
                                >{filter.label}</button>
                            ))}
                        </div>
                    )}
                </div>

                <div className="relative group max-w-2xl">
                    <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-indigo-500 transition-colors" size={20} />
                    <input
                        type="text"
                        placeholder="Search by name, place, or vibe... 🔍"
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                        className="w-full bg-white dark:bg-slate-800 border-2 border-transparent focus:border-indigo-500/20 rounded-2xl py-4 pl-14 pr-6 shadow-lg shadow-indigo-500/5 outline-none font-bold transition-all"
                    />
                </div>
            </div>

            {/* Feed Grid */}
            {filteredMemories.length === 0 ? (
                <div className="text-center py-20 bg-white/30 dark:bg-slate-800/20 rounded-[3rem] border-2 border-dashed border-slate-200 dark:border-slate-800">
                    <Globe size={64} className="mx-auto text-slate-200 mb-6" />
                    <h3 className="text-xl font-semibold mb-2">No matches found 🏜️</h3>
                    <p className="text-slate-500">We couldn't find any public memories matching your search.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-x-6 gap-y-10">
                    {filteredMemories.map((memory, index) => {
                        let dateStr = 'Unknown Date';
                        if (memory.date) { try { dateStr = new Date(memory.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }); } catch (_) { console.error('Date error', _); } }

                        const isOwnPost = user?.id === memory.user?.id;
                        const followingIds = currentUserData?.following?.map(f => typeof f === 'object' ? f.id : f) || [];
                        const isFollowing = followingIds.includes(memory.user?.id);
                        const showComments = expandedComments[memory.id];

                        return (
                            <motion.div
                                key={memory.id}
                                initial={{ opacity: 0, y: 30 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: index * 0.05 }}
                                className="group/card flex flex-col h-full bg-white dark:bg-slate-900 rounded-[2rem] shadow-sm hover:shadow-2xl hover:shadow-indigo-500/10 transition-all border border-gray-100 dark:border-slate-800 overflow-hidden"
                            >
                                {/* Media Section - Image on top */}
                                <div className="relative aspect-[4/5] overflow-hidden bg-slate-100 dark:bg-slate-800">
                                    {memory.photos?.length > 0 ? (
                                        <img
                                            src={getMediaUrl(memory.photos[0])}
                                            alt={memory.title}
                                            onClick={() => setSelectedImage({ url: memory.photos[0], index: 0, all: memory.photos })}
                                            className="w-full h-full object-cover cursor-zoom-in group-hover/card:scale-110 transition-transform duration-700"
                                        />
                                    ) : (
                                        <div className="w-full h-full flex flex-col items-center justify-center text-slate-300 gap-2">
                                            <ImageIcon size={40} />
                                            <span className="text-[10px] font-black uppercase">No Media</span>
                                        </div>
                                    )}

                                    {/* Badges on overlay */}
                                    <div className="absolute top-4 left-4 flex flex-col gap-2">
                                        {memory.milestone && (
                                            <span className="bg-amber-400 text-white text-[8px] font-black uppercase px-2 py-1 rounded-lg flex items-center gap-1 shadow-lg">
                                                <Star size={8} fill="currentColor" /> Milestone
                                            </span>
                                        )}
                                        {memory.photos?.length > 1 && (
                                            <span className="bg-black/60 backdrop-blur-md text-white text-[8px] font-black uppercase px-2 py-1 rounded-lg flex items-center gap-1 shadow-lg">
                                                <ImageIcon size={8} /> +{memory.photos.length - 1}
                                            </span>
                                        )}
                                    </div>

                                    {/* Action Buttons on overlay hover */}
                                    <div className="absolute inset-0 bg-black/20 opacity-0 group-hover/card:opacity-100 transition-opacity flex items-center justify-center gap-4">
                                        <button
                                            onClick={() => handleLike(memory.id)}
                                            className={`flex items-center gap-2 p-3 rounded-2xl backdrop-blur-md transition-all hover:scale-110 active:scale-90 ${memory.likes?.includes(user?.id) ? 'bg-rose-500 text-white' : 'bg-white/90 text-slate-900'}`}
                                        >
                                            <Heart size={20} fill={memory.likes?.includes(user?.id) ? "currentColor" : "none"} />
                                            {memory.likes?.length > 0 && <span className="text-sm font-bold">{memory.likes.length}</span>}
                                        </button>
                                        <button
                                            onClick={() => toggleComments(memory.id)}
                                            className="flex items-center gap-2 p-3 bg-white/90 rounded-2xl backdrop-blur-md text-slate-900 transition-all hover:scale-110 active:scale-90"
                                        >
                                            <MessageSquare size={20} />
                                            {memory.comments?.length > 0 && <span className="text-sm font-bold">{memory.comments.length}</span>}
                                        </button>
                                    </div>
                                </div>

                                {/* Content Section */}
                                <div className="p-5 flex flex-col flex-1">
                                    <div className="flex-1">
                                        <div className="flex items-center gap-2 mb-2 text-[10px] font-black text-indigo-500 uppercase tracking-widest">
                                            <Calendar size={12} />
                                            <span>{dateStr}</span>
                                            {memory.locationName && (
                                                <>
                                                    <span className="text-slate-300">•</span>
                                                    <span className="flex items-center gap-1 text-rose-500 truncate max-w-[100px]"><MapPin size={12} /> {memory.locationName}</span>
                                                </>
                                            )}
                                        </div>
                                        <h3 className="text-lg font-black text-slate-900 dark:text-white leading-tight mb-2 group-hover/card:text-indigo-600 transition-colors">
                                            {memory.title}
                                        </h3>
                                        <p className="text-slate-500 dark:text-slate-400 text-xs line-clamp-2 font-medium leading-relaxed">
                                            {memory.description || 'No description shared.'}
                                        </p>
                                    </div>

                                    {/* Footer / Meta info - Inspired by the screenshot */}
                                    <div className="mt-5 pt-4 border-t border-gray-50 dark:border-slate-800 flex items-center justify-between">
                                        <div className="flex items-center gap-2 min-w-0">
                                            <Avatar user={memory.user} size="sm" />
                                            <div className="min-w-0">
                                                <p className="text-[10px] font-black text-slate-800 dark:text-slate-200 truncate">
                                                    {memory.user?.username || memory.user?.full_name || 'Anonymous'}
                                                </p>
                                                <p className="text-[9px] text-slate-400 font-bold">@{memory.user?.username || 'user'}</p>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-1">
                                            {user && !isOwnPost && (
                                                <button
                                                    onClick={() => isFollowing ? handleUnfollow(memory.user?.id) : handleFollow(memory.user?.id)}
                                                    className={`p-1.5 rounded-lg transition-all ${isFollowing ? 'text-indigo-600' : 'text-slate-300 hover:text-indigo-500'}`}
                                                >
                                                    {isFollowing ? <UserMinus size={14} /> : <UserPlus size={14} />}
                                                </button>
                                            )}
                                            <button
                                                onClick={() => setSharingMemory(memory)}
                                                className="p-1.5 rounded-lg text-slate-300 hover:text-indigo-600 transition-colors"
                                            >
                                                <Share2 size={14} />
                                            </button>
                                        </div>
                                    </div>
                                </div>

                                {/* Comment Sidebar/Overlay could go here, but for now we keep the bottom section toggleable if needed */}
                                <AnimatePresence>
                                    {showComments && (
                                        <motion.div
                                            initial={{ height: 0 }}
                                            animate={{ height: 'auto' }}
                                            exit={{ height: 0 }}
                                            className="overflow-hidden bg-slate-50 dark:bg-slate-800/50"
                                        >
                                            <div className="p-5">
                                                <h4 className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-4">Reflections</h4>
                                                <div className="max-h-48 overflow-y-auto pr-2 flex flex-col gap-4 custom-scrollbar">
                                                    {memory.comments?.length > 0 ? (
                                                        memory.comments
                                                            .filter(c => !c.parent_id)
                                                            .map((comment, i) => (
                                                                <CommentRow
                                                                    key={comment.id || i}
                                                                    comment={comment}
                                                                    memoryId={memory.id}
                                                                    currentUser={user}
                                                                    onReply={handleReply}
                                                                    onDelete={handleDeleteComment}
                                                                    onUpdate={handleUpdateComment}
                                                                    depth={0}
                                                                />
                                                            ))
                                                    ) : (
                                                        <p className="text-[10px] text-slate-400 font-bold italic">No comments yet.</p>
                                                    )}
                                                </div>
                                                {user && (
                                                    <div className="mt-4 flex gap-2">
                                                        <input
                                                            type="text"
                                                            placeholder="Add thought..."
                                                            value={commentTexts[memory.id] || ''}
                                                            onChange={e => setCommentTexts(prev => ({ ...prev, [memory.id]: e.target.value }))}
                                                            onKeyDown={e => e.key === 'Enter' && submitComment(memory.id)}
                                                            className="flex-1 bg-white dark:bg-slate-900 rounded-xl px-3 py-2 text-[10px] outline-none font-bold border border-transparent focus:border-indigo-300"
                                                        />
                                                        <button
                                                            onClick={() => submitComment(memory.id)}
                                                            className="p-2 bg-indigo-600 text-white rounded-xl"
                                                        >
                                                            <Send size={12} />
                                                        </button>
                                                    </div>
                                                )}
                                            </div>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </motion.div>
                        );
                    })}
                </div>
            )}

            {/* Lightbox */}
            <AnimatePresence>
                {selectedImage && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={() => setSelectedImage(null)}
                        className="fixed inset-0 z-[200] flex items-center justify-center bg-black/95 backdrop-blur-xl p-4 cursor-zoom-out"
                    >
                        <button onClick={() => setSelectedImage(null)} className="absolute top-8 right-8 z-[210] p-3 rounded-full bg-white/10 text-white hover:bg-white/20 transition-all hover:rotate-90"><X size={28} /></button>
                        <button onClick={() => setSelectedImage(null)} className="absolute top-8 left-8 z-[210] flex items-center gap-2 text-white font-black uppercase tracking-widest text-xs px-5 py-3 bg-white/10 rounded-full hover:bg-white/20 transition-all"><ChevronLeft size={18} /> Back</button>
                        <motion.img
                            initial={{ scale: 0.9 }}
                            animate={{ scale: 1 }}
                            src={getMediaUrl(selectedImage.url)}
                            className="max-w-[90vw] max-h-[80vh] object-contain rounded-3xl shadow-2xl"
                            onClick={e => e.stopPropagation()}
                        />
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Share Logic */}
            <AnimatePresence>
                {sharingMemory && (
                    <div className="fixed inset-0 z-[300] flex items-center justify-center bg-black/40 backdrop-blur-sm p-4" onClick={() => setSharingMemory(null)}>
                        <ShareOptions
                            url={`${window.location.origin}/public/${sharingMemory.id}`}
                            title={sharingMemory.title}
                            imageUrl={sharingMemory.photos?.[0]}
                            onClose={() => setSharingMemory(null)}
                        />
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default CommunityTimeline;
