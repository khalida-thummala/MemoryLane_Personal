import { useState, useEffect, useContext } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { ArrowLeft, Plus, Image as ImageIcon, Trash2, Calendar, MapPin, Tag, Users, Search, UserPlus, CheckCircle, Clock, X, ChevronLeft, Settings2, Edit3 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { AuthContext } from '../context/AuthContext';
import { getMediaUrl } from '../utils/mediaUtils';

const AlbumDetail = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { user } = useContext(AuthContext);
    const [album, setAlbum] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [selectedImage, setSelectedImage] = useState(null);

    // Album edit state
    const [isEditAlbumOpen, setIsEditAlbumOpen] = useState(false);
    const [editAlbumData, setEditAlbumData] = useState({ title: '', description: '' });

    // Modal state for adding memories
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [availableMemories, setAvailableMemories] = useState([]);
    const [loadingMemories, setLoadingMemories] = useState(false);

    // Collab State
    const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
    const [friendSearchTerm, setFriendSearchTerm] = useState('');
    const [foundUsers, setFoundUsers] = useState([]);
    const [searchingFriends, setSearchingFriends] = useState(false);
    const [invitedUsers, setInvitedUsers] = useState(new Set());
    const [isMembersModalOpen, setIsMembersModalOpen] = useState(false);

    useEffect(() => {
        fetchAlbum();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [id]);

    const fetchAlbum = async () => {
        if (!user) return;
        try {
            const config = { headers: { Authorization: `Bearer ${user.token}` } };
            const { data } = await axios.get(`/api/albums/${id}`, config);
            setAlbum(data);
            setLoading(false);
        } catch (err) {
            console.error('Error fetching album:', err);
            setError('Failed to load album data.');
            setLoading(false);
        }
    };

    const fetchAvailableMemories = async () => {
        setLoadingMemories(true);
        try {
            const config = { headers: { Authorization: `Bearer ${user.token}` } };
            const { data } = await axios.get('/api/memories', config);

            // Filter out memories already in this album
            const existingMemoryIds = (album?.memories || []).map(m => m?.id).filter(Boolean);
            const filteredMemories = (data || []).filter(m => !existingMemoryIds.includes(m.id));

            setAvailableMemories(filteredMemories);
        } catch (err) {
            console.error('Error fetching memories:', err);
            setAvailableMemories([]);
        } finally {
            setLoadingMemories(false);
        }
    };

    const handleOpenAddModal = () => {
        setIsAddModalOpen(true);
        fetchAvailableMemories();
    };

    const handleAddMemoryToAlbum = async (memoryId) => {
        if (!user) return;
        try {
            const config = { headers: { Authorization: `Bearer ${user.token}` } };
            await axios.post(`/api/albums/${id}/memories/${memoryId}`, {}, config);
            // Refresh album data
            fetchAlbum();
            // Remove from available list
            setAvailableMemories(prev => prev.filter(m => m.id !== memoryId));
        } catch (err) {
            console.error('Error adding memory to album:', err);
        }
    };

    const handleRemoveMemory = async (memoryId) => {
        if (!window.confirm('Are you sure you want to remove this memory from the album?')) return;
        if (!user) return;

        try {
            const config = { headers: { Authorization: `Bearer ${user.token}` } };
            await axios.delete(`/api/albums/${id}/memories/${memoryId}`, config);
            setAlbum(prev => ({
                ...prev,
                memories: prev.memories.filter(m => m.id !== memoryId)
            }));
        } catch (err) {
            console.error('Error removing memory from album:', err);
        }
    };

    const handleSearchFriends = async (e) => {
        const searchTerm = e.target.value;
        setFriendSearchTerm(searchTerm);
        if (searchTerm.length < 2) {
            setFoundUsers([]);
            return;
        }

        setSearchingFriends(true);
        try {
            const config = { headers: { Authorization: `Bearer ${user.token}` } };
            const { data } = await axios.get(`/api/auth/users/search?search=${encodeURIComponent(searchTerm)}`, config);
            setFoundUsers(data);
        } catch (err) {
            console.error('Error searching users:', err);
        } finally {
            setSearchingFriends(false);
        }
    };

    const handleSendCollabRequest = async (userId) => {
        if (!user) return;
        try {
            const config = { headers: { Authorization: `Bearer ${user.token}` } };
            await axios.post(`/api/albums/${id}/request`, { userId }, config);

            // Mark as invited in UI
            setInvitedUsers(prev => new Set(prev).add(userId));
        } catch (err) {
            console.error('Error sending request:', err);
            alert(err.response?.data?.message || 'Failed to send request');
        }
    };

    const handleInvite = () => {
        setIsInviteModalOpen(true);
        setFriendSearchTerm('');
        setFoundUsers([]);
    };

    if (loading) return <div className="flex justify-center items-center h-[50vh]"><div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-600"></div></div>;
    if (error) return <div className="text-center text-red-500 py-10">{error}</div>;
    if (!album) return <div className="text-center py-10">Album not found.</div>;

    // Derive ownership — compare user_id strings directly
    const isAlbumOwner = user && String(album.user_id) === String(user.id);

    const handleEditAlbum = async (e) => {
        e.preventDefault();
        try {
            const config = { headers: { Authorization: `Bearer ${user.token}` } };
            const { data } = await axios.put(`/api/albums/${id}`, editAlbumData, config);
            setAlbum(prev => ({ ...prev, title: data.title || editAlbumData.title, description: data.description || editAlbumData.description }));
            setIsEditAlbumOpen(false);
        } catch (err) {
            console.error('Error updating album:', err);
            alert('Failed to update album.');
        }
    };

    const handleDeleteAlbum = async () => {
        if (!window.confirm('Delete this entire album? This cannot be undone.')) return;
        try {
            const config = { headers: { Authorization: `Bearer ${user.token}` } };
            await axios.delete(`/api/albums/${id}`, config);
            navigate('/albums');
        } catch (err) {
            console.error('Error deleting album:', err);
            alert('Failed to delete album.');
        }
    };

    return (
        <div className="py-8 max-w-6xl mx-auto relative px-4">
            {/* Header */}
            <div className="flex items-center gap-4 mb-8 flex-wrap">
                <Link to="/albums" className="p-2 bg-gray-100 dark:bg-slate-800 rounded-full hover:bg-gray-200 dark:hover:bg-slate-700 transition-colors shrink-0">
                    <ArrowLeft size={24} className="text-gray-600 dark:text-gray-300" />
                </Link>
                <div className="flex-1 min-w-0">
                    <h1 className="text-3xl font-bold text-indigo-600 truncate">{album.title}</h1>
                    <p className="text-gray-500 dark:text-gray-400 mt-1 text-sm">{album.description}</p>
                </div>

                <div className="ml-auto flex gap-2 shrink-0 flex-wrap">
                    {/* Owner-only: Edit & Delete album */}
                    {isAlbumOwner && (
                        <>
                            <button
                                onClick={() => { setEditAlbumData({ title: album.title, description: album.description || '' }); setIsEditAlbumOpen(true); }}
                                className="px-4 py-2 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 rounded-xl hover:bg-indigo-100 dark:hover:bg-indigo-900/40 transition-colors flex items-center gap-2 font-semibold"
                                title="Edit album"
                            >
                                <Edit3 size={16} /> <span className="hidden md:inline">Edit</span>
                            </button>
                            <button
                                onClick={handleDeleteAlbum}
                                className="px-4 py-2 bg-red-50 dark:bg-red-900/20 text-red-500 dark:text-red-400 rounded-xl hover:bg-red-100 dark:hover:bg-red-900/40 transition-colors flex items-center gap-2 font-semibold"
                                title="Delete album"
                            >
                                <Trash2 size={16} /> <span className="hidden md:inline">Delete</span>
                            </button>
                        </>
                    )}
                    <button
                        onClick={handleInvite}
                        className="px-4 py-2 bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400 rounded-xl hover:bg-purple-200 dark:hover:bg-purple-900/50 transition-colors flex items-center gap-2 font-medium"
                        title="Invite Collaborators"
                    >
                        <UserPlus size={18} /> <span className="hidden md:inline">Invite</span>
                    </button>
                    <button
                        onClick={() => setIsMembersModalOpen(true)}
                        className="px-4 py-2 bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300 rounded-xl hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors flex items-center gap-2 font-medium"
                        title="View Members"
                    >
                        <Users size={18} /> <span className="hidden md:inline">Members</span>
                    </button>
                    <button
                        onClick={handleOpenAddModal}
                        className="px-4 py-2 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-600/30 flex items-center gap-2 font-medium"
                    >
                        <Plus size={20} /> <span className="hidden md:inline">Add Memories</span>
                    </button>
                </div>
            </div>

            {/* Memories Grid */}
            {album.memories.length === 0 ? (
                <div className="glass-panel p-10 rounded-2xl text-center flex flex-col items-center justify-center opacity-70">
                    <ImageIcon size={48} className="text-indigo-300 mb-4" />
                    <h3 className="text-xl font-medium mb-2">No Memories Yet</h3>
                    <p>This album is empty. Start adding memories to build your collection!</p>
                    <button
                        onClick={handleOpenAddModal}
                        className="mt-6 px-6 py-2.5 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 rounded-xl font-medium hover:bg-indigo-100 dark:hover:bg-indigo-900/40 transition-colors"
                    >
                        Add Memories
                    </button>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {album.memories.filter(m => m !== null).map((memory) => {
                        let dateStr = 'Unknown Date';
                        if (memory.date) { try { dateStr = new Date(memory.date).toISOString().split('T')[0]; } catch (_) { console.error('Date error:', _); } }

                        return (
                            <motion.div
                                key={memory.id}
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                className="glass-panel rounded-2xl overflow-hidden group hover:border-indigo-500/30 transition-all border border-transparent shadow-lg shadow-black/5 flex flex-col h-full"
                            >
                                <div className={`relative overflow-hidden bg-gray-100 dark:bg-slate-800 ${memory.photos?.length > 0 ? '' : 'h-48'}`}>
                                    {memory.photos && memory.photos.length > 0 ? (
                                        <div className={`grid gap-1 ${memory.photos.length === 1 ? 'grid-cols-1' : memory.photos.length === 2 ? 'grid-cols-2' : 'grid-cols-2 md:grid-cols-3'}`}>
                                            {memory.photos.map((photoUrl, idx) => {
                                                const formattedUrl = getMediaUrl(photoUrl);
                                                return (
                                                    <img
                                                        key={idx}
                                                        src={formattedUrl}
                                                        alt={`${memory.title} img ${idx}`}
                                                        onClick={() => setSelectedImage({ url: formattedUrl, index: idx, allFiles: memory.photos.map(p => ({ url: getMediaUrl(p) })) })}
                                                        className={`w-full object-cover cursor-pointer hover:opacity-80 transition-opacity ${memory.photos.length === 1 ? 'h-64' : 'h-32'}`}
                                                    />
                                                );
                                            })}
                                        </div>
                                    ) : (
                                        <div className="w-full h-full absolute inset-0 flex items-center justify-center text-gray-400">
                                            <ImageIcon size={32} />
                                        </div>
                                    )}
                                    <div className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"></div>
                                    {/* Remove from album — memory creator OR album owner can remove */}
                                    {user && (String(memory.user_id) === String(user.id) || String(memory.addedBy?.id) === String(user.id) || isAlbumOwner) && (
                                        <div className="absolute top-4 right-4 flex gap-2 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-all duration-200">
                                            <button
                                                onClick={(e) => { e.stopPropagation(); handleRemoveMemory(memory.id); }}
                                                className="p-2 bg-red-500/90 hover:bg-red-600 text-white rounded-full backdrop-blur-md shadow-xl hover:scale-110 active:scale-95"
                                                title="Remove from album"
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
                                    )}

                                </div>
                                <div className="p-5 flex-1 flex flex-col">
                                    <h3 className="text-lg font-bold truncate mb-2 text-slate-800 dark:text-white">{memory.title}</h3>

                                    <div className="flex flex-wrap gap-3 mb-3 text-xs opacity-70 font-medium text-slate-600 dark:text-slate-300">
                                        <span className="flex items-center gap-1"><Calendar size={12} className="text-indigo-500" /> {dateStr}</span>
                                        {memory.locationName && (
                                            <span className="flex items-center gap-1 truncate max-w-[120px]">
                                                <MapPin size={12} className="text-rose-500" /> {memory.locationName}
                                            </span>
                                        )}
                                    </div>

                                    <p className="text-sm opacity-80 line-clamp-2 mb-4 text-slate-600 dark:text-slate-300">
                                        {memory.description}
                                    </p>

                                    <div className="mt-auto pt-4 border-t border-gray-100 dark:border-slate-800 flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <div className="w-6 h-6 rounded-full bg-gradient-to-br from-indigo-400 to-purple-500 flex items-center justify-center text-[10px] font-bold text-white overflow-hidden ring-2 ring-white dark:ring-slate-900">
                                                {(memory.addedBy?.avatar_url || memory.user?.avatar_url)
                                                    ? <img src={memory.addedBy?.avatar_url || memory.user?.avatar_url} alt="avatar" className="w-full h-full object-cover" />
                                                    : (memory.addedBy?.full_name || memory.addedBy?.username || memory.user?.full_name || memory.user?.username || '?').charAt(0).toUpperCase()
                                                }
                                            </div>
                                            <span className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 flex items-center gap-1">
                                                {isAlbumOwner && String(memory.user_id) === String(user.id) && <span title="Album owner">👑</span>}
                                                {memory.addedBy?.full_name || memory.addedBy?.username || memory.user?.full_name || memory.user?.username || 'User'}
                                            </span>
                                        </div>
                                        <div className="flex flex-wrap gap-2">
                                            {memory.tags && memory.tags.slice(0, 2).map((tag, idx) => (
                                                <span key={idx} className="px-2 py-0.5 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 text-xs font-bold rounded flex items-center gap-1">
                                                    <Tag size={10} /> {tag}
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                </div>

                            </motion.div>
                        );
                    })}
                </div>
            )}

            {/* Edit Album Modal */}
            <AnimatePresence>
                {isEditAlbumOpen && (
                    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md">
                        <motion.div
                            initial={{ scale: 0.9, y: 20 }}
                            animate={{ scale: 1, y: 0 }}
                            exit={{ scale: 0.9, y: 20 }}
                            className="bg-white dark:bg-slate-900 rounded-[2rem] w-full max-w-md p-8 shadow-2xl border border-indigo-50 dark:border-slate-800"
                        >
                            <h2 className="text-2xl font-black mb-6 text-indigo-600 tracking-tight">Edit Album</h2>
                            <form onSubmit={handleEditAlbum} className="flex flex-col gap-5">
                                <div>
                                    <label className="block text-[10px] font-black uppercase tracking-widest mb-2 opacity-40">Title</label>
                                    <input
                                        type="text"
                                        value={editAlbumData.title}
                                        onChange={(e) => setEditAlbumData({ ...editAlbumData, title: e.target.value })}
                                        className="w-full px-5 py-3 rounded-2xl bg-indigo-50 dark:bg-slate-800 border border-transparent focus:border-indigo-400 outline-none font-bold"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-[10px] font-black uppercase tracking-widest mb-2 opacity-40">Description</label>
                                    <textarea
                                        value={editAlbumData.description}
                                        onChange={(e) => setEditAlbumData({ ...editAlbumData, description: e.target.value })}
                                        className="w-full px-5 py-3 rounded-2xl bg-indigo-50 dark:bg-slate-800 border border-transparent focus:border-indigo-400 outline-none font-semibold text-sm h-24 resize-none"
                                    />
                                </div>
                                <div className="flex gap-3 mt-2">
                                    <button
                                        type="button"
                                        onClick={() => setIsEditAlbumOpen(false)}
                                        className="flex-1 py-3 rounded-2xl font-black text-xs uppercase opacity-40 hover:opacity-100 transition-opacity"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        className="flex-[2] py-4 bg-indigo-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl shadow-indigo-600/20 hover:bg-indigo-700 transition-colors"
                                    >
                                        Save Changes
                                    </button>
                                </div>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* Add Memory Modal */}
            <AnimatePresence>
                {isAddModalOpen && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                        <motion.div
                            initial={{ scale: 0.9, y: 20 }}
                            animate={{ scale: 1, y: 0 }}
                            exit={{ scale: 0.9, y: 20 }}
                            className="bg-white dark:bg-slate-900 rounded-3xl w-full max-w-2xl max-h-[80vh] flex flex-col shadow-2xl overflow-hidden"
                        >
                            <div className="p-6 border-b border-gray-100 dark:border-slate-800 flex justify-between items-center">
                                <h2 className="text-xl font-bold text-indigo-600 dark:text-indigo-400">Add Memories to {album.title}</h2>
                                <button
                                    onClick={() => setIsAddModalOpen(false)}
                                    className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors"
                                >
                                    <ArrowLeft size={20} className="rotate-180 opacity-50 hover:opacity-100" />
                                </button>
                            </div>

                            <div className="p-6 overflow-y-auto flex-1 bg-gray-50 dark:bg-slate-900/50">
                                {loadingMemories ? (
                                    <div className="flex justify-center py-10"><div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-indigo-600"></div></div>
                                ) : availableMemories.length === 0 ? (
                                    <div className="text-center py-10 opacity-60">No available memories to add.</div>
                                ) : (
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        {availableMemories.map(memory => {
                                            const displayImg = memory.photos?.[0];
                                            return (
                                                <div key={memory.id} className="bg-white dark:bg-slate-800 p-3 rounded-xl border border-gray-200 dark:border-slate-700 flex items-center gap-3">
                                                    {displayImg ? (
                                                        <img src={getMediaUrl(displayImg)} alt="thumb" className="w-16 h-16 object-cover rounded-lg" />
                                                    ) : (
                                                        <div className="w-16 h-16 bg-gray-100 dark:bg-slate-700 rounded-lg flex items-center justify-center">
                                                            <ImageIcon size={20} className="text-gray-400" />
                                                        </div>
                                                    )}
                                                    <div className="flex-1 min-w-0">
                                                        <h4 className="font-semibold text-sm truncate">{memory.title}</h4>
                                                        <p className="text-xs opacity-60 truncate">{memory.date || memory.memory_date ? new Date(memory.date || memory.memory_date).toISOString().split('T')[0] : 'No date'}</p>
                                                    </div>
                                                    <button
                                                        onClick={() => handleAddMemoryToAlbum(memory.id)}
                                                        className="p-2 bg-indigo-50 text-indigo-600 hover:bg-indigo-600 hover:text-white rounded-lg transition-colors"
                                                    >
                                                        <Plus size={18} />
                                                    </button>
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>

                            <div className="p-4 border-t border-gray-100 dark:border-slate-800 flex justify-end">
                                <button
                                    onClick={() => setIsAddModalOpen(false)}
                                    className="px-5 py-2 bg-gray-200 dark:bg-slate-800 text-slate-800 dark:text-white rounded-xl font-medium"
                                >
                                    Done
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* Members List Modal */}
            <AnimatePresence>
                {isMembersModalOpen && (
                    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            className="bg-white dark:bg-slate-900 rounded-3xl w-full max-w-md shadow-2xl overflow-hidden flex flex-col"
                        >
                            <div className="p-6 border-b border-gray-100 dark:border-slate-800 flex justify-between items-center">
                                <h2 className="text-xl font-bold text-indigo-600 dark:text-indigo-400 flex items-center gap-2">
                                    <Users size={24} /> Album Members
                                </h2>
                                <button
                                    onClick={() => setIsMembersModalOpen(false)}
                                    className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors"
                                >
                                    <X size={20} />
                                </button>
                            </div>

                            <div className="p-6 overflow-y-auto max-h-[60vh]">
                                <div className="space-y-4">
                                    {/* Owner first */}
                                    <div className="flex items-center justify-between p-3 bg-indigo-50/50 dark:bg-indigo-900/10 rounded-2xl border border-indigo-100/50 dark:border-indigo-900/20">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-full bg-indigo-600 flex items-center justify-center text-white font-bold ring-2 ring-indigo-200 dark:ring-indigo-900/50">
                                                {album.owner?.avatar_url ? (
                                                    <img src={album.owner.avatar_url} alt="owner" className="w-full h-full object-cover rounded-full" />
                                                ) : (
                                                    (album.owner?.username || 'O').charAt(0).toUpperCase()
                                                )}
                                            </div>
                                            <div>
                                                <p className="font-bold text-slate-800 dark:text-white flex items-center gap-1.5 text-sm">
                                                    {album.owner?.full_name || album.owner?.username || 'Owner'}
                                                    <span className="text-[10px] bg-indigo-600 text-white px-1.5 py-0.5 rounded-md uppercase tracking-wider font-black">Admin</span>
                                                </p>
                                                <p className="text-xs opacity-50 font-medium">@{album.owner?.username || 'owner'}</p>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Other Members */}
                                    {album.members?.filter(m => m.status === 'accepted' || !m.status).map((member, idx) => (
                                        <div key={idx} className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-700/50">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center text-slate-600 dark:text-slate-300 font-bold">
                                                    {member.profile?.avatar_url ? (
                                                        <img src={member.profile.avatar_url} alt="member" className="w-full h-full object-cover rounded-full" />
                                                    ) : (
                                                        (member.profile?.username || 'M').charAt(0).toUpperCase()
                                                    )}
                                                </div>
                                                <div>
                                                    <p className="font-bold text-slate-800 dark:text-white text-sm">
                                                        {member.profile?.full_name || member.profile?.username || 'Member'}
                                                    </p>
                                                    <p className="text-xs opacity-50 font-medium lowercase">@{member.profile?.username || 'member'}</p>
                                                </div>
                                            </div>
                                            <span className="text-[10px] font-black uppercase tracking-widest opacity-30">{member.role || 'Editor'}</span>
                                        </div>
                                    ))}

                                    {/* Pending Members */}
                                    {album.members?.filter(m => m.status === 'pending').map((member, idx) => (
                                        <div key={`pending-${idx}`} className="flex items-center justify-between p-3 bg-amber-50/30 dark:bg-amber-900/5 rounded-2xl border border-dashed border-amber-200/50 dark:border-amber-900/20 opacity-70">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-full bg-amber-100 dark:bg-amber-900/20 flex items-center justify-center text-amber-600 dark:text-amber-400 font-bold">
                                                    {member.profile?.avatar_url ? (
                                                        <img src={member.profile.avatar_url} alt="pending" className="w-full h-full object-cover rounded-full" />
                                                    ) : (
                                                        (member.profile?.username || 'P').charAt(0).toUpperCase()
                                                    )}
                                                </div>
                                                <div>
                                                    <p className="font-bold text-slate-800 dark:text-white text-sm">
                                                        {member.profile?.full_name || member.profile?.username || 'Guest'}
                                                    </p>
                                                    <p className="text-[9px] font-black uppercase text-amber-600 tracking-tighter">Waiting for response...</p>
                                                </div>
                                            </div>
                                            <span className="text-[10px] font-black uppercase tracking-widest text-amber-500">Pending</span>
                                        </div>
                                    ))}

                                    {(!album.members || album.members.length === 0) && (
                                        <div className="text-center py-8 opacity-40">
                                            <p className="text-sm font-medium">No other members yet.</p>
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div className="p-6 bg-slate-50 dark:bg-slate-800/30 border-t border-slate-100 dark:border-slate-800">
                                <button
                                    onClick={() => { setIsMembersModalOpen(false); handleInvite(); }}
                                    className="w-full py-3 bg-indigo-600 text-white rounded-2xl font-bold flex items-center justify-center gap-2 hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-600/20"
                                >
                                    <UserPlus size={18} /> Invite More People
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
            <AnimatePresence>
                {isInviteModalOpen && (
                    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                        <motion.div
                            initial={{ scale: 0.9, y: 20 }}
                            animate={{ scale: 1, y: 0 }}
                            exit={{ scale: 0.9, y: 20 }}
                            className="bg-white dark:bg-slate-900 rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden flex flex-col"
                        >
                            <div className="p-6 border-b border-gray-100 dark:border-slate-800 flex justify-between items-center">
                                <h2 className="text-xl font-bold text-indigo-600 dark:text-indigo-400">Invite Friends to Collab</h2>
                                <button
                                    onClick={() => setIsInviteModalOpen(false)}
                                    className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors"
                                >
                                    <X size={20} />
                                </button>
                            </div>

                            <div className="p-6 flex-1 flex flex-col min-h-[300px] max-h-[60vh] overflow-hidden">
                                <div className="relative mb-6">
                                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                                    <input
                                        type="text"
                                        placeholder="Search friends by name or email..."
                                        value={friendSearchTerm}
                                        onChange={handleSearchFriends}
                                        className="w-full pl-12 pr-4 py-3 rounded-xl bg-gray-50 dark:bg-slate-800 border-none focus:ring-2 focus:ring-indigo-500/50 outline-none"
                                    />
                                    {searchingFriends && <div className="absolute right-4 top-1/2 -translate-y-1/2"><div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-indigo-600"></div></div>}
                                </div>

                                <div className="flex-1 overflow-y-auto">
                                    {friendSearchTerm.length > 0 && foundUsers.length === 0 && !searchingFriends && (
                                        <div className="text-center py-8 opacity-60">No users found.</div>
                                    )}

                                    {foundUsers.map((u) => {
                                        const isAlreadyCollaborator = album.collaborators?.includes(u.id);
                                        const isPending = album.pendingCollaborators?.includes(u.id) || invitedUsers.has(u.id);

                                        return (
                                            <div key={u.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-slate-800/50 rounded-xl mb-3 border border-gray-100 dark:border-slate-700/50">
                                                <div className="flex items-center gap-3 overflow-hidden">
                                                    <div className="w-10 h-10 rounded-full bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center text-indigo-600 dark:text-indigo-400 font-bold shrink-0 overflow-hidden">
                                                        {u.avatar_url ? (
                                                            <img src={u.avatar_url} alt={u.username} className="w-full h-full object-cover" />
                                                        ) : (
                                                            (u.username || u.name || 'U').charAt(0).toUpperCase()
                                                        )}
                                                    </div>
                                                    <div className="truncate">
                                                        <p className="font-semibold text-sm truncate">{u.username || u.name || 'User'}</p>
                                                        <p className="text-xs opacity-60 truncate">@{u.username || 'user'}</p>
                                                    </div>
                                                </div>

                                                {isAlreadyCollaborator ? (
                                                    <span className="text-xs font-bold text-green-500 flex items-center gap-1 bg-green-50 dark:bg-green-900/20 px-2 py-1 rounded-md shrink-0">
                                                        <CheckCircle size={14} /> Joined
                                                    </span>
                                                ) : isPending ? (
                                                    <span className="text-xs font-bold text-amber-500 flex items-center gap-1 bg-amber-50 dark:bg-amber-900/20 px-2 py-1 rounded-md shrink-0">
                                                        <Clock size={14} /> Sent
                                                    </span>
                                                ) : (
                                                    <button
                                                        onClick={() => handleSendCollabRequest(u.id)}
                                                        className="p-2 bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-900/30 dark:hover:bg-indigo-900/50 text-indigo-600 dark:text-indigo-400 rounded-lg transition-colors shrink-0 flex items-center gap-1 text-sm font-semibold px-3 py-1.5"
                                                    >
                                                        <UserPlus size={16} /> Request
                                                    </button>
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* Lightbox / Fullscreen Image Viewer */}
            <AnimatePresence>
                {selectedImage && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[100] flex items-center justify-center bg-black/95 backdrop-blur-md p-4"
                    >
                        <button
                            onClick={() => setSelectedImage(null)}
                            className="absolute top-6 left-6 text-white flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 hover:bg-white/20 transition-all backdrop-blur-md group"
                        >
                            <ChevronLeft size={24} className="group-hover:-translate-x-1 transition-transform" />
                            <span className="font-semibold text-lg uppercase tracking-wider">Back to Album</span>
                        </button>

                        <button
                            onClick={() => setSelectedImage(null)}
                            className="absolute top-6 right-6 text-white/60 hover:text-white p-2 rounded-full hover:bg-white/10 transition-colors z-[110]"
                        >
                            <X size={28} />
                        </button>

                        <img
                            src={selectedImage.url}
                            alt="Fullscreen"
                            className="max-w-full max-h-[85vh] object-contain rounded-lg shadow-2xl"
                        />

                        {selectedImage.allFiles && selectedImage.allFiles.length > 1 && (
                            <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-3 overflow-x-auto max-w-full px-4 py-3 bg-black/60 rounded-3xl backdrop-blur-lg border border-white/10">
                                {selectedImage.allFiles.map((f, idx) => (
                                    <img
                                        key={idx}
                                        src={f.url}
                                        onClick={() => setSelectedImage({ ...selectedImage, url: f.url, index: idx })}
                                        className={`w-16 h-16 object-cover rounded-xl cursor-pointer border-2 transition-all hover:scale-110 flex-shrink-0 ${idx === selectedImage.index ? 'border-indigo-500 opacity-100 scale-105' : 'border-transparent opacity-40 hover:opacity-100'}`}
                                    />
                                ))}
                            </div>
                        )}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default AlbumDetail;
