import { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import { Globe, Calendar, MapPin, Heart, MessageSquare, Loader2, Star, Share2, Search, Send, UserPlus, UserMinus, X, ChevronLeft } from 'lucide-react';
import { AuthContext } from '../context/AuthContext';

const CommunityTimeline = () => {
    const { user } = useContext(AuthContext);
    const [memories, setMemories] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [commentTexts, setCommentTexts] = useState({});
    const [feedFilter, setFeedFilter] = useState('all'); // 'all' or 'following'
    const [currentUserData, setCurrentUserData] = useState(null);
    const [selectedImage, setSelectedImage] = useState(null);

    useEffect(() => {
        fetchCommunityMemories();
        if (user) fetchUserProfile();
    }, [feedFilter, user]);

    const fetchUserProfile = async () => {
        try {
            const config = { headers: { Authorization: `Bearer ${user.token}` } };
            const res = await axios.get('/api/auth/profile', config);
            setCurrentUserData(res.data);
        } catch (err) {
            console.error("Error fetching user profile:", err);
        }
    };

    const fetchCommunityMemories = async () => {
        setLoading(true);
        console.log(`[Community] Fetching feed with filter: ${feedFilter}...`);
        try {
            const config = user ? { headers: { Authorization: `Bearer ${user.token}` } } : {};
            const res = await axios.get(`/api/memories/community?filter=${feedFilter}`, config);
            console.log(`[Community] Received memories:`, res.data);
            setMemories(res.data || []);
        } catch (err) {
            console.error("Error fetching community memories:", err);
        } finally {
            setLoading(false);
        }
    };

    const handleFollow = async (targetId) => {
        if (!user) return alert('Please login to follow users');
        try {
            const config = { headers: { Authorization: `Bearer ${user.token}` } };
            await axios.post(`/api/auth/follow/${targetId}`, {}, config);
            fetchUserProfile();
        } catch (err) {
            alert('Failed to follow user');
        }
    };

    const handleUnfollow = async (targetId) => {
        try {
            const config = { headers: { Authorization: `Bearer ${user.token}` } };
            await axios.post(`/api/auth/unfollow/${targetId}`, {}, config);
            fetchUserProfile();
        } catch (err) {
            alert('Failed to unfollow user');
        }
    };

    const handleLike = async (memoryId) => {
        if (!user) return alert('Please login to like memories');
        try {
            const config = { headers: { Authorization: `Bearer ${user.token}` } };
            await axios.post(`/api/memories/${memoryId}/like`, {}, config);
            fetchCommunityMemories();
        } catch (err) {
            console.error('Like error:', err);
        }
    };

    const submitComment = async (memoryId) => {
        const text = commentTexts[memoryId];
        if (!text?.trim()) return;

        try {
            const config = { headers: { Authorization: `Bearer ${user.token}` } };
            await axios.post(`/api/memories/${memoryId}/comment`, { text }, config);
            setCommentTexts({ ...commentTexts, [memoryId]: '' });
            fetchCommunityMemories();
        } catch (err) {
            alert('Failed to add comment');
        }
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
        <div className="max-w-4xl mx-auto py-12 px-4 md:px-0">
            <div className="flex flex-col gap-8 mb-16">
                <div className="flex justify-between items-end">
                    <div>
                        <h1 className="text-5xl font-black bg-clip-text text-transparent bg-gradient-to-r from-indigo-500 via-purple-500 to-fuchsia-600 mb-2">
                            Community Stream ✨
                        </h1>
                        <p className="text-slate-500 dark:text-slate-400 font-bold tracking-tight uppercase text-xs">Global memories shared with the world 🌍</p>
                    </div>
                    {user && (
                        <div className="flex p-1 bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-indigo-50 dark:border-slate-700">
                            <button
                                onClick={() => setFeedFilter('all')}
                                className={`px-6 py-2.5 rounded-xl text-xs font-black transition-all ${feedFilter === 'all' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20' : 'text-slate-500 hover:text-indigo-600'}`}
                            >
                                GLOBAL
                            </button>
                            <button
                                onClick={() => setFeedFilter('following')}
                                className={`px-6 py-2.5 rounded-xl text-xs font-black transition-all ${feedFilter === 'following' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20' : 'text-slate-500 hover:text-indigo-600'}`}
                            >
                                FOLLOWING
                            </button>
                        </div>
                    )}
                </div>

                <div className="relative group">
                    <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-indigo-500 transition-colors" size={24} />
                    <input
                        type="text"
                        placeholder="Search by name, place, or vibe... 🔍"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full bg-white dark:bg-slate-800 border-2 border-transparent focus:border-indigo-500/20 rounded-3xl py-6 pl-16 pr-8 shadow-xl shadow-indigo-500/5 outline-none font-bold text-lg transition-all"
                    />
                </div>
            </div>

            {filteredMemories.length === 0 ? (
                <div className="text-center py-20 bg-white/30 dark:bg-slate-800/20 rounded-[3rem] border-2 border-dashed border-slate-200 dark:border-slate-800">
                    <Globe size={64} className="mx-auto text-slate-200 mb-6" />
                    <h3 className="text-xl font-semibold mb-2">No matches found 🏜️</h3>
                    <p className="text-slate-500">We couldn't find any public memories matching your search.</p>
                </div>
            ) : (
                <div className="flex flex-col gap-12">
                    {filteredMemories.map((memory, index) => {
                        let dateStr = 'Unknown Date';
                        if (memory.date) { try { dateStr = new Date(memory.date).toISOString().split('T')[0]; } catch (e) { } }

                        const isOwnPost = user?.id === memory.user?.id;
                        const followingIds = currentUserData?.following?.map(f => typeof f === 'object' ? f.id : f) || [];
                        const isFollowing = followingIds.includes(memory.user?.id);

                        return (
                            <motion.div
                                key={memory.id}
                                initial={{ opacity: 0, y: 30 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: index * 0.1 }}
                                className="glass-panel p-6 md:p-8 rounded-[2rem] shadow-xl shadow-indigo-500/5 border border-indigo-50 dark:border-slate-800 relative group overflow-hidden"
                            >
                                <div className="flex items-center gap-4 mb-6 pb-6 border-b border-gray-100 dark:border-slate-800/50">
                                    <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-500 flex items-center justify-center text-white font-bold text-lg shadow-md shrink-0 overflow-hidden">
                                        {memory.user?.avatar ? (
                                            <img src={memory.user.avatar} alt={memory.user.name} className="w-full h-full object-cover" />
                                        ) : (
                                            memory.user?.name?.charAt(0).toUpperCase() || 'A'
                                        )}
                                    </div>
                                    <div className="min-w-0">
                                        <p className="font-bold text-lg text-slate-800 dark:text-white leading-none mb-1 truncate">
                                            {memory.user?.name || 'Anonymous'}
                                        </p>
                                        <p className="text-xs text-indigo-500 font-medium tracking-wide uppercase">@{memory.user?.username || 'user'}</p>
                                    </div>

                                    <div className="ml-auto flex items-center gap-2">
                                        {user && !isOwnPost && (
                                            <button
                                                onClick={() => isFollowing ? handleUnfollow(memory.user?.id) : handleFollow(memory.user?.id)}
                                                className={`px-4 py-2 rounded-xl text-sm font-bold transition-all flex items-center gap-2 ${isFollowing ? 'bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-slate-800 dark:text-gray-400' : 'bg-indigo-50 text-indigo-600 hover:bg-indigo-600 hover:text-white'}`}
                                            >
                                                {isFollowing ? (<><UserMinus size={16} /> Following</>) : (<><UserPlus size={16} /> Follow</>)}
                                            </button>
                                        )}
                                        <button
                                            onClick={() => {
                                                const url = `${window.location.origin}/public/${memory.id}`;
                                                navigator.clipboard.writeText(url).then(() => alert('Link copied to clipboard! 📋'));
                                            }}
                                            className="p-2.5 rounded-xl bg-gray-50 hover:bg-indigo-50 text-gray-400 hover:text-indigo-600 dark:bg-slate-800 transition-colors"
                                        >
                                            <Share2 size={18} />
                                        </button>
                                    </div>
                                </div>

                                <div className="mb-6">
                                    <div className="flex flex-wrap items-center gap-3 mb-3">
                                        <h3 className="text-2xl md:text-3xl font-black text-slate-900 dark:text-white tracking-tight">{memory.title}</h3>
                                        {memory.milestone && (
                                            <span className="bg-gradient-to-r from-amber-400 to-orange-500 text-white text-[10px] font-black uppercase px-3 py-1 rounded-full shadow-lg shadow-orange-500/20 flex items-center gap-1">
                                                <Star size={10} fill="currentColor" /> Milestone 🏆
                                            </span>
                                        )}
                                        {/* Debug Badges - Remove after verification */}
                                        <div className="flex gap-1 ml-auto">
                                            <span className="bg-slate-100 dark:bg-slate-800 text-slate-400 text-[8px] px-2 py-1 rounded font-black">📷 {memory.photos?.length || 0}</span>
                                            <span className="bg-slate-100 dark:bg-slate-800 text-slate-400 text-[8px] px-2 py-1 rounded font-black">🎥 {memory.videos?.length || 0}</span>
                                            <span className="bg-slate-100 dark:bg-slate-800 text-slate-400 text-[8px] px-2 py-1 rounded font-black">🎙️ {memory.voiceNotes?.length || 0}</span>
                                        </div>
                                    </div>
                                    <div className="flex flex-wrap gap-4 text-xs font-black uppercase tracking-widest opacity-40 mb-1">
                                        <span className="flex items-center gap-1.5"><Calendar size={14} /> {dateStr}</span>
                                        {memory.locationName && <span className="flex items-center gap-1.5"><MapPin size={14} /> {memory.locationName}</span>}
                                    </div>
                                </div>

                                {memory.photos && memory.photos.length > 0 && (
                                    <div className={`mb-8 grid gap-3 ${memory.photos.length === 1 ? 'grid-cols-1' : memory.photos.length === 2 ? 'grid-cols-2' : 'grid-cols-2 md:grid-cols-3'} rounded-3xl overflow-hidden shadow-xl`}>
                                        {memory.photos.map((photo, idx) => (
                                            <img
                                                key={idx}
                                                src={photo.startsWith('http') ? photo : `http://localhost:5001/${photo.replace(/\\/g, '/').replace(/^\//, '')}`}
                                                alt={`attachment-${idx}`}
                                                onClick={() => setSelectedImage({ url: photo, index: idx, all: memory.photos })}
                                                className={`w-full ${memory.photos.length === 1 ? 'h-96' : 'h-48 md:h-64'} object-cover cursor-zoom-in hover:brightness-110 transition-all duration-500`}
                                            />
                                        ))}
                                    </div>
                                )}

                                <p className="text-slate-700 dark:text-slate-300 leading-relaxed text-xl font-medium whitespace-pre-line mb-8">
                                    {memory.description}
                                </p>

                                <div className="pt-8 border-t border-gray-100 dark:border-slate-800/50 mt-4 flex flex-col gap-6">
                                    <div className="flex gap-8">
                                        <button
                                            onClick={() => handleLike(memory.id)}
                                            className="flex items-center gap-2 text-slate-600 dark:text-slate-400 hover:text-rose-500 transition-all group"
                                        >
                                            <Heart size={24} className={`transition-all ${memory.likes?.includes(user?.id) ? 'fill-rose-500 text-rose-500 scale-125' : 'group-hover:scale-125 group-hover:text-rose-400'}`} />
                                            <span className="font-black text-lg">{memory.likes?.length || 0}</span>
                                        </button>
                                        <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400">
                                            <MessageSquare size={24} />
                                            <span className="font-black text-lg">{memory.comments?.length || 0}</span>
                                        </div>
                                    </div>

                                    {memory.comments?.length > 0 && (
                                        <div className="space-y-4 mb-2 max-h-48 overflow-y-auto pr-2 custom-scrollbar border-l-2 border-indigo-50 dark:border-slate-800 pl-4">
                                            {memory.comments.map((comment, i) => (
                                                <div key={i} className="flex gap-3 items-start">
                                                    <div className="w-8 h-8 rounded-full bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center text-indigo-600 text-[10px] font-black shrink-0 overflow-hidden">
                                                        {comment.user?.avatar ? <img src={comment.user.avatar} className="w-full h-full object-cover" /> : (comment.user?.name ? comment.user.name.charAt(0).toUpperCase() : 'U')}
                                                    </div>
                                                    <div className="bg-gray-50/50 dark:bg-slate-800/30 p-3 rounded-2xl flex-1">
                                                        <p className="text-[10px] font-black text-indigo-600 dark:text-indigo-400 mb-1 uppercase tracking-widest">{comment.user?.name || 'User'}</p>
                                                        <p className="text-sm font-medium">{comment.text}</p>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}

                                    {user && (
                                        <div className="flex gap-3 items-center mt-2 group">
                                            <div className="flex-1 relative">
                                                <input
                                                    type="text"
                                                    placeholder="Share a thought... 💬"
                                                    value={commentTexts[memory.id] || ''}
                                                    onChange={(e) => setCommentTexts({ ...commentTexts, [memory.id]: e.target.value })}
                                                    onKeyDown={(e) => e.key === 'Enter' && submitComment(memory.id)}
                                                    className="w-full bg-slate-50 dark:bg-slate-900 rounded-2xl px-6 py-4 pr-12 outline-none focus:ring-4 focus:ring-indigo-500/10 font-bold transition-all text-sm border border-transparent focus:border-indigo-500/20"
                                                />
                                                <button
                                                    onClick={() => submitComment(memory.id)}
                                                    disabled={!commentTexts[memory.id]?.trim()}
                                                    className="absolute right-3 top-1/2 -translate-y-1/2 p-2 bg-indigo-600 text-white rounded-xl disabled:opacity-50 transition-all hover:scale-110 active:scale-95 shadow-lg shadow-indigo-600/20"
                                                >
                                                    <Send size={16} />
                                                </button>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </motion.div>
                        );
                    })}
                </div>
            )}

            <AnimatePresence>
                {selectedImage && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={() => setSelectedImage(null)}
                        className="fixed inset-0 z-[200] flex items-center justify-center bg-black/95 backdrop-blur-xl p-4 cursor-zoom-out"
                    >
                        <button onClick={() => setSelectedImage(null)} className="absolute top-8 right-8 z-[210] p-4 rounded-full bg-white/10 text-white hover:bg-white/20 transition-all hover:rotate-90"><X size={32} /></button>
                        <button onClick={() => setSelectedImage(null)} className="absolute top-8 left-8 z-[210] flex items-center gap-2 text-white font-black uppercase tracking-widest text-xs px-6 py-4 bg-white/10 rounded-full hover:bg-white/20 transition-all"><ChevronLeft size={20} /> Return</button>
                        <motion.img
                            initial={{ scale: 0.9 }}
                            animate={{ scale: 1 }}
                            src={selectedImage.url.startsWith('http') ? selectedImage.url : `http://localhost:5001/${selectedImage.url.replace(/\\/g, '/').replace(/^\//, '')}`}
                            className="max-w-[90vw] max-h-[80vh] object-contain rounded-3xl shadow-2xl"
                            onClick={e => e.stopPropagation()}
                        />
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default CommunityTimeline;
