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
    const [loadingRequests, setLoadingRequests] = useState(false);

    const getAlbumCover = (album) => {
        if (album.coverImage) return album.coverImage;
        if (album.memories && album.memories.length > 0) {
            const memoryWithDocs = album.memories.find(m => m && m.photos && m.photos.length > 0);
            if (memoryWithDocs) return memoryWithDocs.photos[0];
        }
        return null;
    };

    useEffect(() => {
        const fetchSharedAlbums = async () => {
            if (!user) return;
            try {
                const config = { headers: { Authorization: `Bearer ${user.token}` } };
                const { data } = await axios.get('/api/albums', config);

                // Filter only Collaborative Albums: (I am collaborator OR I am owner but it has collaborators)
                const shared = data.filter(album =>
                    album.collaborators?.length > 0 ||
                    (album.collaborators && album.collaborators.includes(user.id))
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
            } catch (err) {
                console.error('Error fetching requests:', err);
            }
        };

        fetchSharedAlbums();
        fetchPendingRequests();
    }, [user]);

    const handleAcceptRequest = async (albumId) => {
        try {
            const config = { headers: { Authorization: `Bearer ${user.token}` } };
            await axios.post(`/api/albums/${albumId}/accept`, {}, config);
            setPendingRequests(prev => prev.filter(a => a.id !== albumId));
            window.location.reload(); // Quick refresh to load the new album
        } catch (err) {
            console.error('Error accepting:', err);
        }
    };

    const handleRejectRequest = async (albumId) => {
        try {
            const config = { headers: { Authorization: `Bearer ${user.token}` } };
            await axios.post(`/api/albums/${albumId}/reject`, {}, config);
            setPendingRequests(prev => prev.filter(a => a.id !== albumId));
        } catch (err) {
            console.error('Error rejecting:', err);
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
            {/* Background stickers */}
            <motion.div animate={{ y: [0, -15, 0], rotate: [0, 5, 0] }} transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }} className="absolute top-0 right-10 text-5xl drop-shadow-lg opacity-80 z-0 hidden md:block">🤝</motion.div>
            <motion.div animate={{ y: [0, 10, 0], rotate: [0, -5, 0] }} transition={{ duration: 5, repeat: Infinity, ease: "easeInOut", delay: 1 }} className="absolute bottom-10 left-10 text-5xl drop-shadow-lg opacity-80 z-0 hidden md:block">🌍</motion.div>

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
                    {/* Render Shared Albums */}
                    {albums.map((album, index) => {
                        const displayCover = getAlbumCover(album);
                        return (
                            <motion.div
                                key={album.id}
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ delay: index * 0.05 }}
                                onClick={() => navigate(`/album/${album.id}`)}
                                className="glass-panel rounded-3xl overflow-hidden shadow-xl shadow-black/5 dark:shadow-white/5 group cursor-pointer border border-transparent hover:border-purple-500/30 transition-all"
                            >
                                <div className="h-48 bg-gray-200 dark:bg-slate-800 relative overflow-hidden flex items-center justify-center">
                                    {displayCover ? (
                                        <img src={displayCover.startsWith('http') ? displayCover : `http://localhost:5001/${displayCover.replace(/\\/g, '/').replace(/^\//, '')}`} alt={album.title} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
                                    ) : (
                                        <div className="text-slate-400 opacity-50 flex flex-col items-center group-hover:scale-110 transition-transform duration-700">
                                            <ImageIcon size={48} />
                                            <span className="mt-2 text-sm font-medium">No Cover</span>
                                        </div>
                                    )}
                                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
                                    <div className="absolute top-4 left-4">
                                        <span className="px-2 py-1 bg-purple-500/80 backdrop-blur-md rounded-lg text-white text-xs font-bold flex items-center gap-1 shadow-md">
                                            <Users size={12} /> {album.collaborators?.length || 0} Collaborators
                                        </span>
                                    </div>
                                    <div className="absolute bottom-4 left-4 right-4 flex justify-between items-end">
                                        <div>
                                            <span className="px-2 py-1 bg-white/20 backdrop-blur-md rounded-lg text-white text-xs font-bold mb-2 inline-block">
                                                {album.memories?.length || 0} Shared Memories
                                            </span>
                                            <h3 className="text-xl font-bold text-white truncate w-48">{album.title}</h3>
                                        </div>
                                    </div>
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation(); // prevent navigation
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
            )}

            {/* Pending Requests Modal */}
            {isRequestsModalOpen && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                    <motion.div
                        initial={{ scale: 0.9, y: 20 }}
                        animate={{ scale: 1, y: 0 }}
                        className="bg-white dark:bg-slate-900 rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden flex flex-col"
                    >
                        <div className="p-6 border-b border-gray-100 dark:border-slate-800 flex justify-between items-center">
                            <h2 className="text-xl font-bold text-purple-600 dark:text-purple-400">Album Invitations</h2>
                            <button
                                onClick={() => setIsRequestsModalOpen(false)}
                                className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors"
                            >
                                <X size={20} className="text-gray-500" />
                            </button>
                        </div>

                        <div className="p-6 flex-1 max-h-[60vh] overflow-y-auto bg-gray-50 dark:bg-slate-900/50">
                            {pendingRequests.length === 0 ? (
                                <div className="text-center py-10 opacity-60 flex flex-col items-center">
                                    <Compass size={40} className="mb-3 text-purple-300" />
                                    <p>No pending invitations.</p>
                                </div>
                            ) : (
                                <div className="flex flex-col gap-4">
                                    {pendingRequests.map(album => (
                                        <div key={album.id} className="bg-white dark:bg-slate-800 p-4 rounded-2xl border border-gray-100 dark:border-slate-700 shadow-sm flex items-center gap-4">
                                            <div className="w-16 h-16 rounded-xl bg-purple-100 dark:bg-purple-900/30 flex-shrink-0 flex items-center justify-center overflow-hidden">
                                                {album.coverImage ? (
                                                    <img src={album.coverImage.startsWith('http') ? album.coverImage : `http://localhost:5001/${album.coverImage.replace(/\\/g, '/').replace(/^\//, '')}`} alt="cover" className="w-full h-full object-cover" />
                                                ) : (
                                                    <ImageIcon className="text-purple-400" />
                                                )}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <h4 className="font-bold text-slate-800 dark:text-white truncate">{album.title}</h4>
                                                <p className="text-xs opacity-60 mt-1 truncate">
                                                    Invited by <span className="font-semibold text-purple-500">{album.user?.name || 'Someone'}</span>
                                                </p>
                                            </div>
                                            <div className="flex gap-2 shrink-0">
                                                <button
                                                    onClick={() => handleAcceptRequest(album.id)}
                                                    className="w-10 h-10 bg-green-500 hover:bg-green-600 text-white rounded-xl flex items-center justify-center transition-transform hover:scale-105 shadow-md shadow-green-500/20"
                                                    title="Accept"
                                                >
                                                    <Check size={18} />
                                                </button>
                                                <button
                                                    onClick={() => handleRejectRequest(album.id)}
                                                    className="w-10 h-10 bg-red-50 hover:bg-red-100 dark:bg-red-900/30 dark:hover:bg-red-900/50 text-red-500 rounded-xl flex items-center justify-center transition-colors"
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
