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
            const { data } = await axios.post('/api/albums', {
                title: newAlbumTitle,
                description: newAlbumDescription,
                isPublic: newAlbumIsPublic
            }, config);
            setAlbums([data, ...albums]);
            setIsCreateModalOpen(false);
            setNewAlbumTitle('');
            setNewAlbumDescription('');
            setNewAlbumIsPublic(false);
        } catch (err) {
            console.error('Error creating album:', err);
            // Optional: add UI error feedback
        } finally {
            setCreateLoading(false);
        }
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
            {/* Background stickers */}
            <motion.div animate={{ y: [0, -15, 0], rotate: [0, 5, 0] }} transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }} className="absolute top-0 right-10 text-5xl drop-shadow-lg opacity-80 z-0 hidden md:block">🏕️</motion.div>
            <motion.div animate={{ y: [0, 10, 0], rotate: [0, -5, 0] }} transition={{ duration: 5, repeat: Infinity, ease: "easeInOut", delay: 1 }} className="absolute bottom-10 left-10 text-5xl drop-shadow-lg opacity-80 z-0 hidden md:block">🎟️</motion.div>

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
                    return (
                        <motion.div
                            key={album.id}
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: index * 0.05 }}
                            onClick={() => navigate(`/album/${album.id}`)}
                            className="glass-panel rounded-3xl overflow-hidden shadow-xl shadow-black/5 dark:shadow-white/5 group cursor-pointer border border-transparent hover:border-indigo-500/30 transition-all"
                        >
                            <div className="h-48 bg-gray-200 dark:bg-slate-800 relative overflow-hidden flex items-center justify-center">
                                {displayCover ? (
                                    <img src={displayCover.startsWith('http') ? displayCover : `http://localhost:5001/${displayCover.replace(/\\/g, '/').replace(/^\//, '')}`} alt={album.title} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
                                ) : (
                                    <div className="text-slate-400 opacity-50 flex flex-col items-center group-hover:scale-110 transition-transform duration-700">
                                        <Image size={48} />
                                        <span className="mt-2 text-sm font-medium">No Cover</span>
                                    </div>
                                )}
                                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
                                <div className="absolute bottom-4 left-4 right-4 flex justify-between items-end">
                                    <div>
                                        <span className="px-2 py-1 bg-white/20 backdrop-blur-md rounded-lg text-white text-xs font-bold mb-2 inline-block">
                                            {album.memories?.length || 0} Memories
                                        </span>
                                        <h3 className="text-xl font-bold text-white truncate w-48">{album.title}</h3>
                                    </div>
                                </div>
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation(); // prevent navigation
                                        // Add logic for editing/deleting album if needed 
                                    }}
                                    className="absolute top-4 right-4 p-2 bg-black/30 backdrop-blur-md hover:bg-black/50 text-white rounded-full opacity-0 group-hover:opacity-100 transition-all border-none"
                                >
                                    <Settings2 size={16} />
                                </button>
                            </div>
                            <div className="p-5">
                                <p className="opacity-70 text-sm leading-relaxed line-clamp-2 text-gray-600 dark:text-gray-300">
                                    {album.description || "No description provided."}
                                </p>
                            </div>
                        </motion.div>
                    )
                })}
            </div>

            <div className="text-center opacity-40 mt-16 font-medium text-sm">
                Showing {albums.length} Album{albums.length !== 1 ? 's' : ''}
            </div>

            {/* Create Album Modal */}
            <AnimatePresence>
                {isCreateModalOpen && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
                    >
                        <motion.div
                            initial={{ scale: 0.9, y: 20 }}
                            animate={{ scale: 1, y: 0 }}
                            exit={{ scale: 0.9, y: 20 }}
                            className="bg-white dark:bg-slate-900 rounded-3xl w-full max-w-md p-6 shadow-2xl relative"
                        >
                            <button
                                onClick={() => setIsCreateModalOpen(false)}
                                className="absolute top-4 right-4 p-2 rounded-full hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors"
                            >
                                <X size={20} className="opacity-50 hover:opacity-100 text-slate-800 dark:text-white" />
                            </button>

                            <h2 className="text-2xl font-bold mb-6 text-indigo-600 dark:text-indigo-400">Create New Album</h2>

                            <form onSubmit={handleCreateAlbum} className="flex flex-col gap-4">
                                <div>
                                    <label className="block text-sm font-medium mb-1 opacity-80">Album Title</label>
                                    <input
                                        type="text"
                                        value={newAlbumTitle}
                                        onChange={(e) => setNewAlbumTitle(e.target.value)}
                                        className="w-full px-4 py-2 rounded-xl bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
                                        placeholder="E.g., Summer Trip 2024"
                                        required
                                        maxLength={100}
                                    />
                                </div>
                                <div className="mb-2">
                                    <label className="block text-sm font-medium mb-1 opacity-80">Description (Optional)</label>
                                    <textarea
                                        value={newAlbumDescription}
                                        onChange={(e) => setNewAlbumDescription(e.target.value)}
                                        className="w-full px-4 py-2 rounded-xl bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 h-24 resize-none"
                                        placeholder="Add a short description about this album..."
                                        maxLength={500}
                                    />
                                </div>

                                <div className="mb-2">
                                    <label className="block text-sm font-medium mb-3 opacity-80">Album Privacy & Collaboration</label>
                                    <div className="flex gap-4">
                                        <button
                                            type="button"
                                            onClick={() => setNewAlbumIsPublic(false)}
                                            className={`flex-1 flex flex-col items-center justify-center p-3 rounded-xl border-2 transition-all ${!newAlbumIsPublic ? 'border-indigo-500 bg-indigo-50/50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400' : 'border-transparent bg-gray-50 dark:bg-slate-800 text-gray-500'}`}
                                        >
                                            <Lock size={20} className="mb-1" />
                                            <span className="font-semibold text-sm">Private Collab</span>
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setNewAlbumIsPublic(true)}
                                            className={`flex-1 flex flex-col items-center justify-center p-3 rounded-xl border-2 transition-all ${newAlbumIsPublic ? 'border-fuchsia-500 bg-fuchsia-50/50 dark:bg-fuchsia-900/20 text-fuchsia-600 dark:text-fuchsia-400' : 'border-transparent bg-gray-50 dark:bg-slate-800 text-gray-500'}`}
                                        >
                                            <Globe size={20} className="mb-1" />
                                            <span className="font-semibold text-sm">Public Collab</span>
                                        </button>
                                    </div>
                                    <p className="text-xs text-center mt-3 opacity-60">
                                        {newAlbumIsPublic ? 'Anyone can view this album globally.' : 'Only you and invited friends can view this.'}
                                    </p>
                                </div>

                                <div className="flex gap-3 justify-end mt-2">
                                    <button
                                        type="button"
                                        onClick={() => setIsCreateModalOpen(false)}
                                        className="px-5 py-2.5 rounded-xl font-medium hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={createLoading || !newAlbumTitle.trim()}
                                        className="px-5 py-2.5 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-colors shadow-md disabled:opacity-50 flex items-center gap-2 font-medium"
                                    >
                                        {createLoading && <Loader size={16} className="animate-spin" />}
                                        {createLoading ? 'Creating...' : 'Create Album'}
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
