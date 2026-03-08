import { useState, useEffect, useContext } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Calendar, MapPin, Tag, Heart, MessageSquare, Send, Trash2, Edit3, X, Image as ImageIcon } from 'lucide-react';
import { AuthContext } from '../context/AuthContext';
import { getMediaUrl } from '../utils/mediaUtils';

const MemoryDetail = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { user } = useContext(AuthContext);
    const [memory, setMemory] = useState(null);
    const [loading, setLoading] = useState(true);
    const [commentText, setCommentText] = useState('');

    useEffect(() => {
        fetchMemory();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [id]);

    const fetchMemory = async () => {
        try {
            const config = user ? { headers: { Authorization: `Bearer ${user.token}` } } : {};
            const res = await axios.get(`/api/memories/${id}`, config);
            setMemory(res.data);
        } catch (_) {
            console.error("Error fetching memory:", _);
        } finally {
            setLoading(false);
        }
    };

    const handleLike = async () => {
        if (!user) return alert('Please login to like');
        try {
            const config = { headers: { Authorization: `Bearer ${user.token}` } };
            await axios.post(`/api/memories/${id}/like`, {}, config);
            fetchMemory();
        } catch (_) { console.error(_); }
    };

    const submitComment = async () => {
        if (!commentText.trim()) return;
        try {
            const config = { headers: { Authorization: `Bearer ${user.token}` } };
            await axios.post(`/api/memories/${id}/comment`, { text: commentText }, config);
            setCommentText('');
            fetchMemory();
        } catch (_) { alert('Failed to add comment'); }
    };

    if (loading) return <div className="flex justify-center items-center h-[50vh]"><div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-600"></div></div>;
    if (!memory) return <div className="text-center py-10">Memory not found.</div>;

    const isOwner = user && (memory.user_id === user.id || memory.user?.id === user.id);

    return (
        <div className="max-w-4xl mx-auto py-12 px-4">
            <button onClick={() => navigate(-1)} className="mb-6 flex items-center gap-2 text-slate-500 hover:text-indigo-600 transition-colors font-bold uppercase tracking-widest text-xs">
                <ArrowLeft size={16} /> Back
            </button>

            <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                className="glass-panel p-8 rounded-[2.5rem] shadow-2xl shadow-indigo-500/10 border border-indigo-50 dark:border-slate-800"
            >
                <div className="flex justify-between items-start mb-8">
                    <div>
                        <h1 className="text-5xl font-black text-slate-900 dark:text-white tracking-tight mb-3">{memory.title}</h1>
                        <div className="flex flex-wrap gap-4 text-xs font-black uppercase tracking-widest opacity-40">
                            <span className="flex items-center gap-1.5"><Calendar size={14} /> {new Date(memory.date).toDateString()}</span>
                            {memory.locationName && <span className="flex items-center gap-1.5"><MapPin size={14} /> {memory.locationName}</span>}
                        </div>
                    </div>
                    {isOwner && (
                        <div className="flex gap-2">
                            <button className="p-3 bg-indigo-50 text-indigo-600 rounded-2xl hover:bg-indigo-600 hover:text-white transition-all shadow-lg shadow-indigo-600/10"><Edit3 size={20} /></button>
                            <button className="p-3 bg-red-50 text-red-600 rounded-2xl hover:bg-red-600 hover:text-white transition-all shadow-lg shadow-red-600/10"><Trash2 size={20} /></button>
                        </div>
                    )}
                </div>

                {/* Media Gallery */}
                {memory.photos?.length > 0 && (
                    <div className={`mb-10 grid gap-4 ${memory.photos.length === 1 ? 'grid-cols-1' : 'grid-cols-1 md:grid-cols-2'} rounded-3xl overflow-hidden shadow-2xl`}>
                        {memory.photos.map((photo, idx) => (
                            <img
                                key={idx}
                                src={getMediaUrl(photo)}
                                className="w-full h-auto max-h-[700px] object-contain bg-slate-50 dark:bg-slate-800/50 hover:scale-[1.02] transition-transform duration-700"
                                alt="memory"
                            />
                        ))}
                    </div>
                )}

                <p className="text-xl leading-relaxed text-slate-700 dark:text-slate-300 font-medium whitespace-pre-line mb-10">
                    {memory.description}
                </p>

                <div className="flex flex-wrap gap-3 mb-12">
                    {memory.tags?.map((tag, idx) => (
                        <span key={idx} className="px-4 py-2 bg-indigo-50 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-400 text-sm font-black rounded-2xl flex items-center gap-2 border border-indigo-100 dark:border-indigo-900/20">
                            <Tag size={14} /> {tag}
                        </span>
                    ))}
                </div>

                {/* Interactive Area */}
                <div className="pt-10 border-t border-indigo-50 dark:border-slate-800 flex flex-col gap-10">
                    <div className="flex gap-10">
                        <button onClick={handleLike} className="flex items-center gap-3 text-slate-600 hover:text-rose-500 transition-all group">
                            <Heart size={32} className={`transition-all ${memory.likes?.includes(user?.id) ? 'fill-rose-500 text-rose-500 scale-125' : 'group-hover:scale-125'}`} />
                            <span className="font-black text-2xl">{memory.likes?.length || 0}</span>
                        </button>
                    </div>

                    {/* Comments Section */}
                    <div className="space-y-8">
                        <h3 className="text-2xl font-black text-slate-900 dark:text-white">Reflections <span className="text-indigo-500 font-bold ml-2">({memory.comments?.length || 0})</span></h3>

                        <div className="space-y-6">
                            {memory.comments?.map((comment, i) => {
                                const isCommentOwner = user && (comment.user_id === user.id || comment.user === user.id);
                                return (
                                    <div key={i} className="flex gap-4 items-start group">
                                        <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-500 flex items-center justify-center text-white font-bold shrink-0 overflow-hidden shadow-lg shadow-indigo-500/20">
                                            {comment.user?.avatar ? <img src={comment.user.avatar} className="w-full h-full object-cover" /> : 'U'}
                                        </div>
                                        <div className="flex-1">
                                            <div className="bg-indigo-50/50 dark:bg-slate-800/50 p-5 rounded-3xl relative">
                                                <p className="text-xs font-black text-indigo-600 dark:text-indigo-400 mb-2 uppercase tracking-widest">{comment.user?.name || 'User'}</p>
                                                <p className="text-base font-semibold text-slate-700 dark:text-slate-300">{comment.text}</p>
                                                {isCommentOwner && (
                                                    <button className="absolute top-4 right-4 text-slate-300 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100"><Trash2 size={16} /></button>
                                                )}
                                            </div>

                                            {/* Replies */}
                                            {comment.replies?.map((reply, ridx) => (
                                                <div key={ridx} className="mt-4 ml-12 flex gap-3 items-start">
                                                    <div className="w-8 h-8 rounded-full bg-fuchsia-500 flex items-center justify-center text-white text-[10px] font-black shrink-0 shadow-lg shadow-fuchsia-500/20">O</div>
                                                    <div className="bg-fuchsia-50/30 dark:bg-fuchsia-900/10 p-4 rounded-2xl flex-1 border border-fuchsia-100/50 dark:border-fuchsia-900/20">
                                                        <div className="flex items-center gap-2 mb-1">
                                                            <p className="text-[10px] font-black text-fuchsia-600 dark:text-fuchsia-400 uppercase tracking-widest">Memory Owner</p>
                                                            <span className="px-1.5 py-0.5 bg-fuchsia-500 text-white text-[7px] font-black rounded uppercase">REPLY</span>
                                                        </div>
                                                        <p className="text-sm font-semibold">{reply.replyText}</p>
                                                    </div>
                                                </div>
                                            ))}

                                            {isOwner && (
                                                <button className="mt-3 ml-4 text-[10px] font-black text-indigo-600 hover:text-indigo-800 uppercase tracking-widest transition-colors">Reply as owner</button>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>

                        {user && (
                            <div className="flex gap-4 items-center mt-10">
                                <div className="flex-1 relative">
                                    <input
                                        type="text"
                                        placeholder="Add a comment... 💭"
                                        value={commentText}
                                        onChange={(e) => setCommentText(e.target.value)}
                                        onKeyDown={(e) => e.key === 'Enter' && submitComment()}
                                        className="w-full bg-indigo-50/30 dark:bg-slate-900 rounded-[2rem] px-8 py-6 outline-none focus:ring-4 focus:ring-indigo-500/10 font-bold transition-all text-lg border border-transparent focus:border-indigo-500/20 pr-16"
                                    />
                                    <button
                                        onClick={submitComment}
                                        className="absolute right-4 top-1/2 -translate-y-1/2 p-3 bg-indigo-600 text-white rounded-2xl hover:scale-110 active:scale-95 transition-all shadow-xl shadow-indigo-600/20"
                                    >
                                        <Send size={24} />
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </motion.div>
        </div>
    );
};

export default MemoryDetail;
