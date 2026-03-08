import { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { BookOpen, FolderPlus, Compass, Settings2, X, Plus, Image, Loader, Globe, Lock } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { AuthContext } from '../context/AuthContext';

const Albums = () => {
    const { user } = useContext(AuthContext);
    const navigate = useNavigate();
    const [albums, setAlbums] = useState([]);

    const getAlbumCover = (album) => {
        if (album.coverImage) return album.coverImage;
        if (album.memories && album.memories.length > 0) {
            const memoryWithDocs = album.memories.find(m => m && m.photos && m.photos.length > 0);
            if (memoryWithDocs) return memoryWithDocs.photos[0];
        }
        return null;
    };
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [newAlbumTitle, setNewAlbumTitle] = useState('');
    const [newAlbumDescription, setNewAlbumDescription] = useState('');
    const [newAlbumIsPublic, setNewAlbumIsPublic] = useState(false);
    const [createLoading, setCreateLoading] = useState(false);

    const [editingAlbum, setEditingAlbum] = useState(null);

    useEffect(() => {
        const fetchAlbums = async () => {
            if (!user) return;
            try {
                const config = { headers: { Authorization: `Bearer ${user.token}` } };
                const { data } = await axios.get('/api/albums', config);
                setAlbums(data);
                setLoading(false);
            } catch (err) {
                console.error('Error fetching albums:', err);
                setError('Failed to load albums.');
                setLoading(false);
            }
        };

        fetchAlbums();
    }, [user]);

    const handleCreateAlbum = async (e) => {
        e.preventDefault();
        if (!newAlbumTitle.trim()) return;

        setCreateLoading(true);
        try {
            const config = { headers: { Authorization: `Bearer ${user.token}` } };
            const payload = {
                title: newAlbumTitle,
                description: newAlbumDescription,
                is_shared: !newAlbumIsPublic // Assuming false means private collab/shared
            };

            if (editingAlbum) {
                const { data } = await axios.put(`/api/albums/${editingAlbum._id || editingAlbum.id}`, payload, config);
                setAlbums(albums.map(a => (a._id || a.id) === (data._id || data.id) ? data : a));
            } else {
                const { data } = await axios.post('/api/albums', payload, config);
                setAlbums([data, ...albums]);
            }

            closeModal();
        } catch (err) {
            console.error('Error saving album:', err);
        } finally {
            setCreateLoading(false);
        }
    };

    const openEditModal = (album) => {
        setEditingAlbum(album);
        setNewAlbumTitle(album.title);
        setNewAlbumDescription(album.description || '');
        setNewAlbumIsPublic(!album.is_shared);
        setIsCreateModalOpen(true);
    };

    const closeModal = () => {
        setIsCreateModalOpen(false);
        setEditingAlbum(null);
        setNewAlbumTitle('');
        setNewAlbumDescription('');
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center h-64">
                <Loader className="w-10 h-10 text-indigo-600 animate-spin" />
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
                <h1 className="text-3xl font-bold flex items-center gap-3 text-indigo-600">
                    <BookOpen className="text-indigo-600" /> Your Albums
                </h1>
                <div className="flex gap-4">
                    <button className="px-4 py-2.5 bg-indigo-50 text-indigo-600 rounded-xl hover:bg-indigo-100 transition-colors font-semibold hidden md:flex items-center gap-2">
                        <Compass size={18} /> Discover
                    </button>
                    <button
                        onClick={() => setIsCreateModalOpen(true)}
                        className="px-5 py-2.5 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-colors font-medium shadow-lg shadow-indigo-600/30 flex items-center gap-2"
                    >
                        <FolderPlus size={20} /> Create Album
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 px-4 relative z-10">
                {/* Create New Album Card */}
                <motion.div
                    onClick={() => setIsCreateModalOpen(true)}
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.1 }}
                    className="glass-panel border-2 border-dashed border-indigo-200 dark:border-indigo-500/20 rounded-3xl flex flex-col items-center justify-center p-8 h-[300px] cursor-pointer hover:bg-indigo-50/50 dark:hover:bg-indigo-900/10 hover:border-indigo-400 dark:hover:border-indigo-500/50 transition-all group"
                >
                    <div className="w-16 h-16 bg-indigo-100 dark:bg-indigo-900/40 rounded-full flex items-center justify-center mb-4 group-hover:scale-110 transition-transform text-indigo-600 dark:text-indigo-400">
                        <Plus size={32} />
                    </div>
                    <h3 className="text-xl font-bold mb-2 text-indigo-600 dark:text-indigo-400">New Album</h3>
                    <p className="opacity-60 text-center text-sm">Organize your memories into a beautiful collection.</p>
                </motion.div>

                {/* Render Albums */}
                {albums.map((album, index) => {
                    const displayCover = getAlbumCover(album);
                    // Compare user_id directly — always available in the raw album row
                    const isOwner = user && String(album.user_id) === String(user.id);
                    const ownerProfile = album.owner;
                    const ownerName = ownerProfile?.full_name || ownerProfile?.username || (isOwner ? (user.name || 'You') : 'A member');

                    return (
                        <motion.div
                            key={album._id || album.id}
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: index * 0.05 }}
                            onClick={() => navigate(`/album/${album._id || album.id}`)}
                            className="glass-panel rounded-3xl overflow-hidden shadow-xl shadow-black/5 dark:shadow-white/5 group cursor-pointer border border-transparent hover:border-indigo-500/30 transition-all flex flex-col"
                        >
                            <div className="h-48 bg-gray-200 dark:bg-slate-800 relative overflow-hidden flex items-center justify-center">
                                {displayCover ? (
                                    <img src={displayCover.startsWith('http') ? displayCover : `http://localhost:5000/${displayCover.replace(/\\/g, '/').replace(/^\//, '')}`} alt={album.title} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
                                ) : (
                                    <div className="text-slate-400 opacity-50 flex flex-col items-center group-hover:scale-110 transition-transform duration-700">
                                        <Image size={48} />
                                        <span className="mt-2 text-sm font-medium">No Cover</span>
                                    </div>
                                )}
                                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
                                <div className="absolute bottom-4 left-4 right-4 flex justify-between items-end">
                                    <div>
                                        <div className="flex gap-2 mb-2">
                                            <span className="px-2 py-1 bg-white/20 backdrop-blur-md rounded-lg text-white text-[10px] font-black uppercase tracking-widest">
                                                {album.memoriesCount || album.memories?.length || 0} Memories
                                            </span>
                                            {album.is_shared && (
                                                <span className="px-2 py-1 bg-indigo-500/60 backdrop-blur-md rounded-lg text-white text-[10px] font-black uppercase tracking-widest flex items-center gap-1">
                                                    <Globe size={10} /> Collaborative
                                                </span>
                                            )}
                                        </div>
                                        <h3 className="text-xl font-bold text-white truncate w-48 leading-tight">{album.title}</h3>
                                        <p className="text-[10px] text-white/60 font-black uppercase tracking-widest mt-1">
                                            {isOwner ? '👑 Your album' : `By ${ownerName}`}
                                        </p>
                                    </div>
                                </div>

                                {isOwner && (
                                    <div className="absolute top-4 right-4 flex gap-2 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-all duration-200">
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                openEditModal(album);
                                            }}
                                            className="p-2 bg-white/25 backdrop-blur-md hover:bg-white/50 text-white rounded-xl border border-white/30 shadow-md"
                                            title="Edit album"
                                        >
                                            <Settings2 size={15} />
                                        </button>
                                        <button
                                            onClick={async (e) => {
                                                e.stopPropagation();
                                                if (window.confirm('Delete this album? This cannot be undone.')) {
                                                    try {
                                                        const config = { headers: { Authorization: `Bearer ${user.token}` } };
                                                        await axios.delete(`/api/albums/${album.id}`, config);
                                                        setAlbums(prev => prev.filter(a => a.id !== album.id));
                                                    } catch (err) {
                                                        console.error('Error deleting album', err);
                                                        alert('Failed to delete. You may not have permission.');
                                                    }
                                                }
                                            }}
                                            className="p-2 bg-red-500/25 backdrop-blur-md hover:bg-red-500 text-white rounded-xl border border-red-400/40 shadow-md"
                                            title="Delete album"
                                        >
                                            <X size={15} />
                                        </button>
                                    </div>
                                )}
                            </div>
                            <div className="p-5 flex-1 flex flex-col">
                                <p className="opacity-70 text-sm font-semibold leading-relaxed line-clamp-2 text-gray-600 dark:text-gray-300 mb-4">
                                    {album.description || "No description provided."}
                                </p>
                                <div className="mt-auto pt-4 border-t border-black/5 dark:border-white/5 flex items-center justify-between">
                                    <div className="flex -space-x-2">
                                        {(album.members || []).slice(0, 3).map((m, i) => (
                                            <div key={i} className="w-6 h-6 rounded-full border-2 border-white dark:border-slate-900 bg-indigo-600 flex items-center justify-center text-[8px] text-white font-black shadow-sm">
                                                {m.user?.username?.charAt(0).toUpperCase() || 'U'}
                                            </div>
                                        ))}
                                        {(album.members || []).length === 0 && (
                                            <div className="w-6 h-6 rounded-full border-2 border-white dark:border-slate-900 bg-indigo-50 flex items-center justify-center text-[8px] text-indigo-300 font-black">
                                                👤
                                            </div>
                                        )}
                                    </div>
                                    <span className="text-[10px] font-black uppercase tracking-tighter opacity-30">View Album →</span>
                                </div>
                            </div>
                        </motion.div>
                    )
                })}

            </div>

            <div className="text-center opacity-40 mt-16 font-black uppercase tracking-widest text-xs">
                Showing {albums.length} Album{albums.length !== 1 ? 's' : ''}
            </div>

            {/* Create/Edit Album Modal */}
            <AnimatePresence>
                {isCreateModalOpen && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md"
                    >
                        <motion.div
                            initial={{ scale: 0.9, y: 20 }}
                            animate={{ scale: 1, y: 0 }}
                            exit={{ scale: 0.9, y: 20 }}
                            className="bg-white dark:bg-slate-900 rounded-[2.5rem] w-full max-w-md p-8 shadow-2xl relative border border-indigo-50 dark:border-slate-800"
                        >
                            <button
                                onClick={closeModal}
                                className="absolute top-6 right-6 p-2 rounded-2xl hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors"
                            >
                                <X size={20} className="opacity-50 hover:opacity-100 text-slate-800 dark:text-white" />
                            </button>

                            <h2 className="text-3xl font-black mb-8 text-indigo-600 dark:text-indigo-400 tracking-tight">
                                {editingAlbum ? 'Refine Album' : 'New Collection'}
                            </h2>

                            <form onSubmit={handleCreateAlbum} className="flex flex-col gap-6">
                                <div>
                                    <label className="block text-xs font-black uppercase tracking-widest mb-2 opacity-50">Album Title</label>
                                    <input
                                        type="text"
                                        value={newAlbumTitle}
                                        onChange={(e) => setNewAlbumTitle(e.target.value)}
                                        className="w-full px-6 py-4 rounded-2xl bg-indigo-50/50 dark:bg-slate-900 border border-transparent focus:border-indigo-500/30 outline-none focus:ring-4 focus:ring-indigo-500/5 transition-all font-bold"
                                        placeholder="E.g., Summer Trip 2024"
                                        required
                                        maxLength={100}
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-black uppercase tracking-widest mb-2 opacity-50">Heartfelt Description</label>
                                    <textarea
                                        value={newAlbumDescription}
                                        onChange={(e) => setNewAlbumDescription(e.target.value)}
                                        className="w-full px-6 py-4 rounded-2xl bg-indigo-50/50 dark:bg-slate-900 border border-transparent focus:border-indigo-500/30 outline-none focus:ring-4 focus:ring-indigo-500/5 transition-all h-32 resize-none font-semibold text-sm"
                                        placeholder="What makes this collection special?"
                                        maxLength={500}
                                    />
                                </div>

                                <div>
                                    <label className="block text-xs font-black uppercase tracking-widest mb-4 opacity-50">Privacy Dynamics</label>
                                    <div className="flex gap-4">
                                        <button
                                            type="button"
                                            onClick={() => setNewAlbumIsPublic(false)}
                                            className={`flex-1 flex flex-col items-center justify-center p-5 rounded-3xl border-2 transition-all ${!newAlbumIsPublic ? 'border-indigo-500 bg-indigo-500/10 text-indigo-600 dark:text-indigo-400' : 'border-transparent bg-gray-50 dark:bg-slate-800 text-gray-500'}`}
                                        >
                                            <Lock size={20} className="mb-2" />
                                            <span className="font-black text-[10px] uppercase tracking-widest">Private</span>
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setNewAlbumIsPublic(true)}
                                            className={`flex-1 flex flex-col items-center justify-center p-5 rounded-3xl border-2 transition-all ${newAlbumIsPublic ? 'border-fuchsia-500 bg-fuchsia-500/10 text-fuchsia-600 dark:text-fuchsia-400' : 'border-transparent bg-gray-50 dark:bg-slate-800 text-gray-500'}`}
                                        >
                                            <Globe size={20} className="mb-2" />
                                            <span className="font-black text-[10px] uppercase tracking-widest">Global</span>
                                        </button>
                                    </div>
                                </div>

                                <div className="flex gap-4 mt-4">
                                    <button
                                        type="button"
                                        onClick={closeModal}
                                        className="flex-1 py-4 rounded-2xl font-black uppercase tracking-widest text-xs hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors"
                                    >
                                        Go Back
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={createLoading || !newAlbumTitle.trim()}
                                        className="flex-[2] py-4 bg-indigo-600 text-white rounded-2xl hover:bg-indigo-700 transition-all shadow-xl shadow-indigo-600/20 disabled:opacity-50 flex items-center justify-center gap-2 font-black uppercase tracking-widest text-xs"
                                    >
                                        {createLoading && <Loader size={16} className="animate-spin" />}
                                        {createLoading ? 'Processing...' : (editingAlbum ? 'Update Album' : 'Create Album')}
                                    </button>
                                </div>
                            </form>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default Albums;

