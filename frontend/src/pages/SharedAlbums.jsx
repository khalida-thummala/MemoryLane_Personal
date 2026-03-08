import { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Users, BookOpen, Compass, Settings2, Image as ImageIcon, Loader, Check, X } from 'lucide-react';
import { motion } from 'framer-motion';
import { AuthContext } from '../context/AuthContext';

const SharedAlbums = () => {
    const { user } = useContext(AuthContext);
    const navigate = useNavigate();

    const [albums, setAlbums] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [isRequestsModalOpen, setIsRequestsModalOpen] = useState(false);
    const [pendingRequests, setPendingRequests] = useState([]);

    const [editingAlbum, setEditingAlbum] = useState(null);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [editData, setEditData] = useState({ title: '', description: '', is_shared: true });

    const getAlbumCover = (album) => {
        if (album.coverImage) return album.coverImage;
        if (album.cover_url) return album.cover_url;
        if (album.memories && album.memories.length > 0) {
            const memWithPhoto = album.memories.find(m => m?.photos?.length > 0);
            if (memWithPhoto) return memWithPhoto.photos[0];
        }
        return null;
    };

    useEffect(() => {
        const fetchSharedAlbums = async () => {
            if (!user) return;
            try {
                const config = { headers: { Authorization: `Bearer ${user.token}` } };
                const { data } = await axios.get('/api/albums', config);
                // Show albums that are shared OR where user is a collaborator (not owner)
                const shared = data.filter(album =>
                    album.is_shared ||
                    (album.members && album.members.length > 0) ||
                    String(album.user_id) !== String(user.id)
                );
                setAlbums(shared);
                setLoading(false);
            } catch (err) {
                console.error('Error fetching albums:', err);
                setError('Failed to load collaborative albums.');
                setLoading(false);
            }
        };

        const fetchPendingRequests = async () => {
            if (!user) return;
            try {
                const config = { headers: { Authorization: `Bearer ${user.token}` } };
                const { data } = await axios.get('/api/albums/requests/pending', config);
                setPendingRequests(data);
            } catch (_) {
                // Endpoint may not exist yet — fail silently
                console.warn('Pending requests endpoint not available');
            }
        };

        fetchSharedAlbums();
        fetchPendingRequests();
    }, [user]);

    const openEditModal = (album) => {
        setEditingAlbum(album);
        setEditData({
            title: album.title,
            description: album.description || '',
            is_shared: album.is_shared ?? true,
        });
        setIsEditModalOpen(true);
    };

    const handleUpdateAlbum = async (e) => {
        e.preventDefault();
        try {
            const config = { headers: { Authorization: `Bearer ${user.token}` } };
            const { data } = await axios.put(`/api/albums/${editingAlbum.id}`, editData, config);
            setAlbums(prev => prev.map(a => a.id === editingAlbum.id ? { ...a, ...data } : a));
            setIsEditModalOpen(false);
            setEditingAlbum(null);
        } catch (_) {
            console.error('Error updating album:', _);
            alert('Failed to update album. You may not have permission.');
        }
    };

    const handleDeleteAlbum = async (albumId) => {
        if (!window.confirm('Delete this collaborative album? All members will lose access.')) return;
        try {
            const config = { headers: { Authorization: `Bearer ${user.token}` } };
            await axios.delete(`/api/albums/${albumId}`, config);
            setAlbums(prev => prev.filter(a => a.id !== albumId));
        } catch (_) {
            console.error('Error deleting album:', _);
            alert('Failed to delete album. You may not have permission.');
        }
    };

    const handleAcceptRequest = async (albumId) => {
        try {
            const config = { headers: { Authorization: `Bearer ${user.token}` } };
            await axios.post(`/api/albums/${albumId}/accept`, {}, config);
            setPendingRequests(prev => prev.filter(a => a.id !== albumId));
            window.location.reload();
        } catch (_) {
            console.error('Error:', _);
        }
    };

    const handleRejectRequest = async (albumId) => {
        try {
            const config = { headers: { Authorization: `Bearer ${user.token}` } };
            await axios.post(`/api/albums/${albumId}/reject`, {}, config);
            setPendingRequests(prev => prev.filter(a => a.id !== albumId));
        } catch (_) {
            console.error('Error rejecting:', _);
        }
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center h-64">
                <Loader className="w-10 h-10 text-purple-600 animate-spin" />
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex justify-center items-center h-64 text-red-500">
                {error}
            </div>
        );
    }

    return (
        <div className="py-8 relative max-w-6xl mx-auto overflow-hidden min-h-[80vh]">

            <div className="flex justify-between items-center mb-10 relative z-10 px-4">
                <h1 className="text-3xl font-bold flex items-center gap-3 text-purple-600">
                    <Users className="text-purple-600" /> Collaborative Albums
                </h1>
                <div className="flex gap-4">
                    <button onClick={() => navigate('/albums')} className="px-4 py-2.5 bg-gray-100 dark:bg-slate-800 text-gray-700 dark:text-gray-300 rounded-xl hover:bg-gray-200 dark:hover:bg-slate-700 transition-colors font-semibold hidden md:flex items-center gap-2">
                        <BookOpen size={18} /> My Personal Albums
                    </button>
                    <button
                        onClick={() => setIsRequestsModalOpen(true)}
                        className="px-5 py-2.5 bg-purple-600 text-white rounded-xl hover:bg-purple-700 transition-colors font-medium shadow-lg shadow-purple-600/30 flex items-center gap-2 relative"
                    >
                        <Compass size={20} /> Pending Invites
                        {pendingRequests.length > 0 && (
                            <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs font-bold w-5 h-5 flex items-center justify-center rounded-full shadow-md">
                                {pendingRequests.length}
                            </span>
                        )}
                    </button>
                </div>
            </div>

            {albums.length === 0 ? (
                <div className="glass-panel p-10 rounded-2xl text-center flex flex-col items-center justify-center opacity-70 mt-10">
                    <Users size={48} className="text-purple-300 mb-4" />
                    <h3 className="text-xl font-medium mb-2">No Collaborative Albums</h3>
                    <p>You haven't joined or created any shared albums yet. Ask friends for an invite link or invite them to yours!</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 px-4 relative z-10 mt-8">
                    {albums.map((album, index) => {
                        const displayCover = getAlbumCover(album);
                        // isOwner: user_id on album matches the logged-in user
                        const isOwner = user && String(album.user_id) === String(user.id);
                        // owner name: use the joined profile data if available
                        const ownerProfile = album.owner;
                        const ownerName = ownerProfile?.full_name || ownerProfile?.username || (isOwner ? (user.name || 'You') : 'A collaborator');

                        return (
                            <motion.div
                                key={album.id}
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ delay: index * 0.05 }}
                                onClick={() => navigate(`/album/${album.id}`)}
                                className="glass-panel rounded-3xl overflow-hidden shadow-xl shadow-black/5 dark:shadow-white/5 group cursor-pointer border border-transparent hover:border-purple-500/30 transition-all flex flex-col"
                            >
                                <div className="h-48 bg-gray-200 dark:bg-slate-800 relative overflow-hidden flex items-center justify-center">
                                    {displayCover ? (
                                        <img src={displayCover.startsWith('http') ? displayCover : `http://localhost:5000/${displayCover.replace(/\\/g, '/').replace(/^\//, '')}`} alt={album.title} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
                                    ) : (
                                        <div className="text-slate-400 opacity-50 flex flex-col items-center group-hover:scale-110 transition-transform duration-700">
                                            <ImageIcon size={48} />
                                            <span className="mt-2 text-sm font-medium">No Cover</span>
                                        </div>
                                    )}
                                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent"></div>

                                    {/* Top-left badge */}
                                    <div className="absolute top-4 left-4">
                                        <span className="px-2 py-1 bg-purple-600/80 backdrop-blur-md rounded-lg text-white text-[10px] font-black uppercase tracking-widest flex items-center gap-1 shadow-md">
                                            <Users size={11} /> {album.members?.length || 0} Members
                                        </span>
                                    </div>

                                    {/* Bottom overlay: title + owner */}
                                    <div className="absolute bottom-4 left-4 right-4">
                                        <span className="px-2 py-1 bg-white/15 backdrop-blur-md rounded-lg text-white text-[10px] font-black uppercase tracking-widest mb-2 inline-block">
                                            {album.memories?.length || 0} Shared Memories
                                        </span>
                                        <h3 className="text-xl font-bold text-white truncate leading-tight">{album.title}</h3>
                                        <p className="text-[10px] text-white/70 font-bold uppercase tracking-widest mt-0.5">
                                            {isOwner ? '👑 You own this' : `By ${ownerName}`}
                                        </p>
                                    </div>

                                    {/* Edit/Delete — only for owner, reveal on hover */}
                                    {isOwner && (
                                        <div className="absolute top-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-all duration-200">
                                            <button
                                                onClick={(e) => { e.stopPropagation(); openEditModal(album); }}
                                                className="p-2 bg-white/25 backdrop-blur-md hover:bg-white/50 text-white rounded-xl border border-white/30 shadow-md"
                                                title="Edit album"
                                            >
                                                <Settings2 size={15} />
                                            </button>
                                            <button
                                                onClick={(e) => { e.stopPropagation(); handleDeleteAlbum(album.id); }}
                                                className="p-2 bg-red-500/30 backdrop-blur-md hover:bg-red-500 text-white rounded-xl border border-red-400/40 shadow-md"
                                                title="Delete album"
                                            >
                                                <X size={15} />
                                            </button>
                                        </div>
                                    )}
                                </div>

                                <div className="p-5 flex-1 flex flex-col">
                                    <p className="opacity-60 text-sm leading-relaxed line-clamp-2 text-gray-600 dark:text-gray-300">
                                        {album.description || 'No description provided.'}
                                    </p>
                                    <div className="mt-auto pt-4 flex items-center justify-between opacity-40">
                                        <div className="flex -space-x-1">
                                            {(album.members || []).slice(0, 3).map((_, i) => (
                                                <div key={i} className="w-5 h-5 rounded-full bg-purple-300 border border-white" />
                                            ))}
                                        </div>
                                        <span className="text-[10px] font-black uppercase tracking-widest">Enter →</span>
                                    </div>
                                </div>
                            </motion.div>
                        );
                    })}
                </div>
            )}

            {/* Edit Album Modal */}
            {isEditModalOpen && (
                <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md">
                    <motion.div
                        initial={{ scale: 0.9, y: 20 }}
                        animate={{ scale: 1, y: 0 }}
                        className="bg-white dark:bg-slate-900 rounded-[2rem] w-full max-w-md p-8 shadow-2xl border border-purple-100 dark:border-slate-800"
                    >
                        <h2 className="text-2xl font-black mb-6 text-purple-600 tracking-tight">Update Album</h2>
                        <form onSubmit={handleUpdateAlbum} className="flex flex-col gap-5">
                            <div>
                                <label className="block text-[10px] font-black uppercase tracking-widest mb-2 opacity-40">Title</label>
                                <input
                                    type="text"
                                    value={editData.title}
                                    onChange={(e) => setEditData({ ...editData, title: e.target.value })}
                                    className="w-full px-5 py-3 rounded-2xl bg-purple-50 dark:bg-slate-800 border border-transparent focus:border-purple-400 outline-none font-bold"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-[10px] font-black uppercase tracking-widest mb-2 opacity-40">Description</label>
                                <textarea
                                    value={editData.description}
                                    onChange={(e) => setEditData({ ...editData, description: e.target.value })}
                                    className="w-full px-5 py-3 rounded-2xl bg-purple-50 dark:bg-slate-800 border border-transparent focus:border-purple-400 outline-none font-semibold text-sm h-24 resize-none"
                                />
                            </div>
                            <div className="flex gap-3 mt-2">
                                <button
                                    type="button"
                                    onClick={() => { setIsEditModalOpen(false); setEditingAlbum(null); }}
                                    className="flex-1 py-3 rounded-2xl font-black text-xs uppercase opacity-40 hover:opacity-100 transition-opacity"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="flex-[2] py-4 bg-purple-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl shadow-purple-600/20 hover:bg-purple-700 transition-colors"
                                >
                                    Save Changes
                                </button>
                            </div>
                        </form>
                    </motion.div>
                </div>
            )}

            {/* Pending Requests Modal */}
            {isRequestsModalOpen && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                    <motion.div
                        initial={{ scale: 0.9, y: 20 }}
                        animate={{ scale: 1, y: 0 }}
                        className="bg-white dark:bg-slate-900 rounded-[2.5rem] w-full max-w-lg shadow-2xl overflow-hidden flex flex-col border border-purple-100 dark:border-slate-800"
                    >
                        <div className="p-7 border-b border-gray-100 dark:border-slate-800 flex justify-between items-center">
                            <h2 className="text-xl font-black text-purple-600 dark:text-purple-400 uppercase tracking-tight">Album Invitations</h2>
                            <button
                                onClick={() => setIsRequestsModalOpen(false)}
                                className="p-2 rounded-2xl hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors"
                            >
                                <X size={20} className="text-gray-500" />
                            </button>
                        </div>

                        <div className="p-7 flex-1 max-h-[60vh] overflow-y-auto">
                            {pendingRequests.length === 0 ? (
                                <div className="text-center py-10 opacity-60 flex flex-col items-center">
                                    <Compass size={40} className="mb-3 text-purple-300" />
                                    <p className="font-bold text-sm">No pending invitations.</p>
                                </div>
                            ) : (
                                <div className="flex flex-col gap-4">
                                    {pendingRequests.map(album => (
                                        <div key={album.id} className="bg-purple-50 dark:bg-slate-800 p-4 rounded-2xl flex items-center gap-4">
                                            <div className="w-14 h-14 rounded-2xl bg-white dark:bg-slate-700 flex-shrink-0 flex items-center justify-center overflow-hidden shadow-sm">
                                                {album.cover_url ? (
                                                    <img src={album.cover_url} alt="cover" className="w-full h-full object-cover" />
                                                ) : (
                                                    <ImageIcon className="text-purple-400" size={22} />
                                                )}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <h4 className="font-black text-slate-800 dark:text-white truncate">{album.title}</h4>
                                                <p className="text-xs opacity-60 mt-1">
                                                    Invited by <span className="font-bold text-purple-600">{album.owner?.username || album.owner?.full_name || 'Someone'}</span>
                                                </p>
                                            </div>
                                            <div className="flex gap-2 shrink-0">
                                                <button
                                                    onClick={() => handleAcceptRequest(album.id)}
                                                    className="w-11 h-11 bg-purple-600 hover:bg-purple-700 text-white rounded-2xl flex items-center justify-center shadow-lg"
                                                    title="Accept"
                                                >
                                                    <Check size={18} />
                                                </button>
                                                <button
                                                    onClick={() => handleRejectRequest(album.id)}
                                                    className="w-11 h-11 bg-red-50 hover:bg-red-100 dark:bg-red-900/20 text-red-500 rounded-2xl flex items-center justify-center"
                                                    title="Decline"
                                                >
                                                    <X size={18} />
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </motion.div>
                </div>
            )}
        </div>
    );
};

export default SharedAlbums;
