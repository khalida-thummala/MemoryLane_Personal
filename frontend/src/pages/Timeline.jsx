import { useState, useRef, useEffect, useContext } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Clock, Plus, Image as ImageIcon, Video, Mic, MapPin, Tag, Calendar, X, Heart, Edit3, Trash2, Search, File, Star, Share2, Globe, Lock, ChevronLeft, Users } from 'lucide-react';
import axios from 'axios';
import { AuthContext } from '../context/AuthContext';

// Custom hook for debouncing search input
function useDebounce(value, delay) {
    const [debouncedValue, setDebouncedValue] = useState(value);
    useEffect(() => {
        const handler = setTimeout(() => setDebouncedValue(value), delay);
        return () => clearTimeout(handler);
    }, [value, delay]);
    return debouncedValue;
}

const Timeline = () => {
    const { user } = useContext(AuthContext);
    const [isAdding, setIsAdding] = useState(false);
    const [editId, setEditId] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const debouncedSearchTerm = useDebounce(searchTerm, 500);
    const [filterTags, setFilterTags] = useState('');
    const [filterMilestone, setFilterMilestone] = useState(false);
    const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);
    const [selectedImage, setSelectedImage] = useState(null);

    const [isRecording, setIsRecording] = useState(false);
    const mediaRecorderRef = useRef(null);
    const audioChunksRef = useRef([]);

    // Hidden file inputs
    const photoRef = useRef(null);
    const videoRef = useRef(null);
    const audioRef = useRef(null);

    // Real memories from database
    const [memories, setMemories] = useState([]);
    const [loading, setLoading] = useState(true);

    const [newMemory, setNewMemory] = useState({
        title: '',
        description: '',
        location: '',
        date: '',
        tagsText: '',
        attachedFiles: [],
        mediaUrls: [],
        milestone: false,
        visibility: 'private'
    });

    // Keyboard support for Gallery close (ESC)
    useEffect(() => {
        const handleKeyDown = (e) => {
            if (e.key === 'Escape' && selectedImage) setSelectedImage(null);
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [selectedImage]);

    // Fetch Memories dynamically based on Advanced Search
    useEffect(() => {
        const fetchMemories = async () => {
            if (!user) return;
            try {
                let url = '/api/memories?';
                const queryParams = [];
                if (debouncedSearchTerm) queryParams.push(`search=${encodeURIComponent(debouncedSearchTerm)}`);
                if (filterTags) queryParams.push(`tags=${encodeURIComponent(filterTags)}`);
                if (filterMilestone) queryParams.push(`milestone=true`);

                const config = { headers: { Authorization: `Bearer ${user.token}` } };
                const res = await axios.get(url + queryParams.join('&'), config);

                // Transform backend data to match UI structure
                const formattedMemories = res.data.map(m => {
                    let dateStr = '';
                    try {
                        const d = new Date(m.date);
                        dateStr = isNaN(d) ? 'Unknown Date' : d.toISOString().split('T')[0];
                    } catch (_) {
                        dateStr = 'Unknown Date';
                    }

                    return {
                        id: m.id,
                        title: m.title,
                        description: m.description,
                        date: dateStr,
                        location: m.locationName || (m.location && m.location.address) || '',
                        tags: m.tags || [],
                        isFavorite: m.likes?.includes(user?.id) || false,
                        likes: m.likes || [],
                        commentCount: m.commentCount || 0,
                        attachedFiles: [
                            ...(m.photos ? m.photos.map((photo, i) => ({ name: `Image ${i + 1}`, url: photo, type: 'image/jpeg' })) : []),
                            ...(m.videos ? m.videos.map((video, i) => ({ name: `Video ${i + 1}`, url: video, type: 'video/mp4' })) : []),
                            ...(m.voiceNotes ? m.voiceNotes.map((audio, i) => ({ name: `Audio ${i + 1}`, url: audio, type: 'audio/mpeg' })) : [])
                        ],
                        milestone: m.milestone || false,
                        visibility: m.visibility || (m.is_public ? 'public' : 'private')
                    };
                });
                setMemories(formattedMemories);
            } catch (error) {
                console.error("Error fetching memories:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchMemories();
    }, [user, debouncedSearchTerm, filterTags, filterMilestone]);

    const handleAddMemory = async (e) => {
        e.preventDefault();
        if (!user) return;

        // Use multipart/form-data for native File uploads
        const config = { headers: { Authorization: `Bearer ${user.token}`, 'Content-Type': 'multipart/form-data' } };
        const tagsArray = newMemory.tagsText.split(',').map(tag => tag.trim()).filter(tag => tag !== '');

        try {
            const formData = new FormData();
            formData.append('title', newMemory.title);
            formData.append('description', newMemory.description);
            formData.append('date', newMemory.date || new Date().toISOString().split('T')[0]);
            if (newMemory.location) formData.append('locationName', newMemory.location);

            tagsArray.forEach(tag => formData.append('tags', tag));
            if (tagsArray.length === 0) formData.append('tags', 'General');

            formData.append('milestone', newMemory.milestone || false);
            formData.append('visibility', newMemory.visibility || 'private');

            for (let i = 0; i < newMemory.attachedFiles.length; i++) {
                const file = newMemory.attachedFiles[i];
                if (file.fileObj) {
                    // It's a raw File object, send to Multer
                    formData.append('mediaFiles', file.fileObj);
                } else {
                    // It's an existing URL from the database, send as string
                    const fileType = file.type || 'image/jpeg';
                    if (fileType.startsWith('video/')) formData.append('videos', file.url);
                    else if (fileType.startsWith('audio/')) formData.append('voiceNotes', file.url);
                    else formData.append('photos', file.url);
                }
            }

            if (editId) {
                const res = await axios.put(`/api/memories/${editId}`, formData, config);
                const m = res.data;
                let dateStr = 'Unknown Date';
                if (m.date) { try { dateStr = new Date(m.date).toISOString().split('T')[0]; } catch (_) { console.error('Date error', _); } }
                const updatedFormattedMemory = {
                    id: m.id,
                    title: m.title,
                    description: m.description,
                    date: dateStr,
                    location: m.locationName || (m.location && m.location.address) || '',
                    tags: m.tags || [],
                    isFavorite: m.milestone || m.is_milestone || false,
                    milestone: m.milestone || m.is_milestone || false,
                    visibility: m.visibility || (m.isPublic !== undefined ? (m.isPublic ? 'public' : 'private') : (m.is_public ? 'public' : 'private')),
                    attachedFiles: [
                        ...(m.photos ? m.photos.map((photo, i) => ({ name: `Image ${i + 1}`, url: photo, type: 'image/jpeg' })) : []),
                        ...(m.videos ? m.videos.map((video, i) => ({ name: `Video ${i + 1}`, url: video, type: 'video/mp4' })) : []),
                        ...(m.voiceNotes ? m.voiceNotes.map((audio, i) => ({ name: `Audio ${i + 1}`, url: audio, type: 'audio/mpeg' })) : [])
                    ]
                };

                setMemories(memories.map(mp => mp.id === editId ? updatedFormattedMemory : mp));
            } else {
                const res = await axios.post('/api/memories', formData, config);
                const m = res.data;
                let dateStr = 'Unknown Date';
                if (m.date) { try { dateStr = new Date(m.date).toISOString().split('T')[0]; } catch (_) { console.error('Date error', _); } }
                const newFormattedMemory = {
                    id: m.id,
                    title: m.title,
                    description: m.description,
                    date: dateStr,
                    location: m.locationName || (m.location && m.location.address) || '',
                    tags: m.tags || [],
                    isFavorite: m.milestone || m.is_milestone || false,
                    milestone: m.milestone || m.is_milestone || false,
                    visibility: m.visibility || (m.isPublic !== undefined ? (m.isPublic ? 'public' : 'private') : (m.is_public ? 'public' : 'private')),
                    attachedFiles: [
                        ...(m.photos ? m.photos.map((photo, _) => ({ name: `Attachment`, url: photo, type: 'image/jpeg' })) : []),
                        ...(m.videos ? m.videos.map((video, _) => ({ name: `Video`, url: video, type: 'video/mp4' })) : []),
                        ...(m.voiceNotes ? m.voiceNotes.map((audio, _) => ({ name: `Audio`, url: audio, type: 'audio/mpeg' })) : [])
                    ]
                };
                setMemories([newFormattedMemory, ...memories]);
            }

            setIsAdding(false);
            setEditId(null);
            setNewMemory({ title: '', description: '', location: '', date: '', tagsText: '', attachedFiles: [], milestone: false, visibility: 'private' });
        } catch (error) {
            console.error("Error saving memory:", error);
            alert("Failed to save memory: " + (error.response?.data?.message || error.message));
        }
    };

    const handleEdit = (memory) => {
        setNewMemory({
            title: memory.title,
            description: memory.description,
            location: memory.location,
            date: memory.date,
            tagsText: memory.tags.join(', '),
            attachedFiles: memory.attachedFiles || [],
            milestone: memory.milestone || false,
            visibility: memory.visibility || 'private'
        });
        setEditId(memory.id);
        setIsAdding(true);
    };

    const handleDelete = async (id) => {
        if (!user) return;
        try {
            const config = { headers: { Authorization: `Bearer ${user.token}` } };
            await axios.delete(`/api/memories/${id}`, config);
            setMemories(memories.filter(m => m.id !== id));
        } catch (error) {
            if (error.response?.status === 404) {
                setMemories(memories.filter(m => m.id !== id));
            } else {
                console.error("Error deleting memory:", error);
                alert("Failed to delete memory: " + (error.response?.data?.message || error.message));
            }
        }
    };

    const toggleFavorite = async (id) => {
        if (!user) return;
        try {
            const config = { headers: { Authorization: `Bearer ${user.token}` } };
            const res = await axios.post(`/api/memories/${id}/like`, {}, config);

            setMemories(memories.map(m => {
                if (m.id === id) {
                    const newLikes = res.data.liked
                        ? [...(m.likes || []), user.id]
                        : (m.likes || []).filter(uid => uid !== user.id);
                    return { ...m, isFavorite: res.data.liked, likes: newLikes };
                }
                return m;
            }));
        } catch (error) {
            console.error("Error toggling like:", error);
        }
    };

    const handleMediaUpload = (e) => {
        if (e.target.files && e.target.files.length > 0) {
            const newFiles = Array.from(e.target.files).map(file => ({
                name: file.name,
                url: URL.createObjectURL(file), // temporary local URL for preview
                fileObj: file, // keeping the actual file to convert to base64 later
                type: file.type || 'image/jpeg'
            }));
            setNewMemory(prev => ({
                ...prev,
                attachedFiles: [...prev.attachedFiles, ...newFiles]
            }));
        }
    };

    const toggleAudioRecording = async () => {
        if (isRecording) {
            if (mediaRecorderRef.current) {
                mediaRecorderRef.current.stop();
                mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
            }
            setIsRecording(false);
        } else {
            try {
                const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
                mediaRecorderRef.current = new MediaRecorder(stream);
                audioChunksRef.current = [];
                mediaRecorderRef.current.ondataavailable = (event) => {
                    if (event.data.size > 0) audioChunksRef.current.push(event.data);
                };
                mediaRecorderRef.current.onstop = () => {
                    // Browsers record in webm or ogg, setting extension to .webm for better compatibility
                    const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
                    const audioFile = new File([audioBlob], `voicenote_${Date.now()}.webm`, { type: 'audio/webm' });
                    const newAudioData = {
                        name: audioFile.name,
                        url: URL.createObjectURL(audioFile),
                        fileObj: audioFile,
                        type: 'audio/webm'
                    };
                    setNewMemory(prev => ({
                        ...prev,
                        attachedFiles: [...prev.attachedFiles, newAudioData]
                    }));
                };
                mediaRecorderRef.current.start();
                setIsRecording(true);
            } catch (err) {
                console.error("Error accessing microphone:", err);
                alert("Could not access microphone. Please check permissions.");
            }
        }
    };

    const removeAttachedFile = (indexToRemove) => {
        setNewMemory(prev => ({
            ...prev,
            attachedFiles: prev.attachedFiles.filter((_, index) => index !== indexToRemove)
        }));
    };

    const filteredMemories = showFavoritesOnly
        ? memories.filter(memory => memory.isFavorite)
        : memories;

    if (loading) {
        return (
            <div className="flex justify-center items-center h-[50vh]">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-600"></div>
            </div>
        );
    }

    return (
        <div className="py-8 max-w-5xl mx-auto relative px-4 md:px-0 z-0 text-slate-900 dark:text-slate-100">
            {/* Header */}
            <div className="flex justify-between items-center mb-10">
                <div className="flex flex-col">
                    <h1 className="text-4xl font-extrabold flex items-center gap-3 text-indigo-600 dark:text-indigo-400">
                        <Clock className="text-indigo-600" /> My Timeline
                    </h1>
                    <p className="text-slate-500 dark:text-slate-400 font-medium mt-1">A curated collection of your life's best moments</p>
                </div>
                <button
                    onClick={() => {
                        setEditId(null);
                        setNewMemory({ title: '', description: '', location: '', date: '', tagsText: '', attachedFiles: [], milestone: false, visibility: 'private' });
                        setIsAdding(true);
                    }}
                    className="px-6 py-3 bg-indigo-600 text-white rounded-2xl hover:bg-indigo-700 transition-all font-bold shadow-xl shadow-indigo-600/30 flex items-center gap-2 hover:scale-105 active:scale-95"
                >
                    <Plus size={24} strokeWidth={3} /> Add Flashback
                </button>
            </div>

            {/* Advanced Search Filters */}
            <div className="glass-panel p-6 rounded-[2rem] mb-12 flex flex-col gap-5 shadow-sm border border-indigo-50 dark:border-slate-800">
                <div className="flex flex-col md:flex-row gap-4">
                    <div className="relative flex-1">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                        <input
                            type="text"
                            placeholder="Search your journey..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-12 pr-4 py-4 rounded-2xl bg-white dark:bg-slate-900 border border-indigo-100 dark:border-slate-700 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition-all outline-none text-lg shadow-sm"
                        />
                    </div>
                </div>
                <div className="flex flex-wrap gap-3 items-center">
                    <div className="flex items-center gap-2 bg-white dark:bg-slate-900 border border-indigo-100 dark:border-slate-700 rounded-xl px-4 py-2 shadow-sm">
                        <Tag size={16} className="text-indigo-400" />
                        <input
                            type="text"
                            placeholder="Tag Filter"
                            value={filterTags}
                            onChange={(e) => setFilterTags(e.target.value)}
                            className="bg-transparent outline-none w-28 text-sm font-medium"
                        />
                    </div>
                    <button
                        onClick={() => setFilterMilestone(!filterMilestone)}
                        className={`px-5 py-2.5 rounded-xl text-sm font-bold transition-all flex items-center gap-2 border shadow-sm ${filterMilestone ? 'bg-amber-100 text-amber-700 border-amber-300' : 'bg-white dark:bg-slate-900 text-slate-500 border-indigo-100 dark:border-slate-700 hover:bg-amber-50 dark:hover:bg-amber-900/10'}`}
                    >
                        <Star size={16} fill={filterMilestone ? "currentColor" : "none"} strokeWidth={filterMilestone ? 0 : 2} />
                        Milestones
                    </button>
                    <button
                        onClick={() => setShowFavoritesOnly(!showFavoritesOnly)}
                        className={`px-5 py-2.5 rounded-xl text-sm font-bold flex items-center gap-2 transition-all outline-none border shadow-sm ${showFavoritesOnly ? 'bg-rose-100 text-rose-600 border-rose-300' : 'bg-white dark:bg-slate-900 text-slate-500 border-indigo-100 dark:border-slate-700 hover:bg-rose-50 dark:hover:bg-rose-900/10'}`}
                    >
                        <Heart size={16} fill={showFavoritesOnly ? "currentColor" : "none"} strokeWidth={showFavoritesOnly ? 0 : 2} />
                        Favorites
                    </button>
                </div>
            </div>

            {/* Add Memory Modal Overlay */}
            <AnimatePresence>
                {isAdding && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[100] flex items-start justify-center p-4 md:p-8 bg-black/60 backdrop-blur-md overflow-y-auto pt-10 md:pt-20"
                    >
                        <motion.div
                            initial={{ scale: 0.9, y: 50, opacity: 0 }}
                            animate={{ scale: 1, y: 0, opacity: 1 }}
                            exit={{ scale: 0.9, y: 50, opacity: 0 }}
                            className="bg-white dark:bg-slate-900 rounded-[2.5rem] p-8 md:p-10 w-full max-w-3xl shadow-2xl relative border border-indigo-100 dark:border-slate-800 mb-20"
                        >
                            <button type="button"
                                onClick={() => setIsAdding(false)}
                                className="absolute top-8 right-8 p-3 rounded-full hover:bg-gray-100 dark:hover:bg-slate-800 transition-all hover:rotate-90"
                            >
                                <X size={24} />
                            </button>

                            <div className="mb-8">
                                <h2 className="text-3xl font-black text-slate-900 dark:text-white flex items-center gap-3">
                                    <Edit3 size={32} className="text-indigo-600" />
                                    {editId ? 'Refine Your Memory' : 'Preserve a New Moment'}
                                </h2>
                                <p className="text-slate-500 dark:text-slate-400 font-medium mt-1">Capture the sights, sounds, and feelings of right now.</p>
                            </div>

                            <form onSubmit={handleAddMemory} className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                <div className="flex flex-col gap-6">
                                    <div>
                                        <label className="block text-sm font-bold mb-2 text-slate-700 dark:text-slate-300">TITLE</label>
                                        <input
                                            type="text"
                                            required
                                            value={newMemory.title}
                                            onChange={e => setNewMemory({ ...newMemory, title: e.target.value })}
                                            className="w-full px-5 py-4 rounded-2xl bg-slate-50 dark:bg-slate-800 border-2 border-transparent focus:border-indigo-500 focus:bg-white dark:focus:bg-slate-900 transition-all outline-none font-semibold"
                                            placeholder="A beautiful day at..."
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-bold mb-2 text-slate-700 dark:text-slate-300">THE STORY</label>
                                        <textarea
                                            rows="5"
                                            required
                                            value={newMemory.description}
                                            onChange={e => setNewMemory({ ...newMemory, description: e.target.value })}
                                            className="w-full px-5 py-4 rounded-2xl bg-slate-50 dark:bg-slate-800 border-2 border-transparent focus:border-indigo-500 focus:bg-white dark:focus:bg-slate-900 transition-all outline-none resize-none font-medium leading-relaxed"
                                            placeholder="Write from the heart..."
                                        />
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm font-bold mb-2 text-slate-700 dark:text-slate-300">WHEN</label>
                                            <div className="relative">
                                                <Calendar size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-indigo-500" />
                                                <input
                                                    type="date"
                                                    required
                                                    value={newMemory.date}
                                                    onChange={e => setNewMemory({ ...newMemory, date: e.target.value })}
                                                    className="w-full pl-12 pr-4 py-4 rounded-2xl bg-slate-50 dark:bg-slate-800 border-none focus:ring-4 focus:ring-indigo-500/10 outline-none font-bold"
                                                />
                                            </div>
                                        </div>
                                        <div>
                                            <label className="block text-sm font-bold mb-2 text-slate-700 dark:text-slate-300">WHERE</label>
                                            <div className="relative">
                                                <MapPin size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-rose-500" />
                                                <input
                                                    type="text"
                                                    value={newMemory.location}
                                                    onChange={e => setNewMemory({ ...newMemory, location: e.target.value })}
                                                    className="w-full pl-12 pr-4 py-4 rounded-2xl bg-slate-50 dark:bg-slate-800 border-none focus:ring-4 focus:ring-indigo-500/10 outline-none font-bold"
                                                    placeholder="Location"
                                                />
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="flex flex-col gap-6">
                                    <div>
                                        <label className="block text-sm font-bold mb-2 text-slate-700 dark:text-slate-300">ATTACH MEDIA</label>
                                        <div className="p-6 rounded-[2rem] bg-indigo-50 dark:bg-indigo-900/10 border-2 border-dashed border-indigo-200 dark:border-indigo-800 hover:border-indigo-500 transition-all flex flex-col gap-4">
                                            <div className="flex justify-around items-center">
                                                <input type="file" className="hidden" ref={photoRef} accept="image/*" multiple onChange={handleMediaUpload} />
                                                <input type="file" className="hidden" ref={videoRef} accept="video/*" multiple onChange={handleMediaUpload} />
                                                <input type="file" className="hidden" ref={audioRef} accept="audio/*" multiple onChange={handleMediaUpload} />

                                                <button type="button" onClick={() => photoRef.current.click()} className="flex flex-col items-center gap-1 group text-slate-600 dark:text-slate-400 hover:text-indigo-600 transition-colors">
                                                    <div className="p-4 rounded-2xl bg-white dark:bg-slate-800 shadow-sm group-hover:scale-110 transition-transform">
                                                        <ImageIcon size={24} />
                                                    </div>
                                                    <span className="text-[10px] font-black uppercase">Photos</span>
                                                </button>

                                                <button type="button" onClick={() => videoRef.current.click()} className="flex flex-col items-center gap-1 group text-slate-600 dark:text-slate-400 hover:text-indigo-600 transition-colors">
                                                    <div className="p-4 rounded-2xl bg-white dark:bg-slate-800 shadow-sm group-hover:scale-110 transition-transform">
                                                        <Video size={24} />
                                                    </div>
                                                    <span className="text-[10px] font-black uppercase">Videos</span>
                                                </button>

                                                <button
                                                    type="button"
                                                    onClick={toggleAudioRecording}
                                                    className={`flex flex-col items-center gap-1 group transition-colors ${isRecording ? 'text-rose-600' : 'text-slate-600 dark:text-slate-400 hover:text-indigo-600'}`}
                                                >
                                                    <div className={`p-4 rounded-2xl shadow-sm group-hover:scale-110 transition-transform ${isRecording ? 'bg-rose-100 animate-pulse' : 'bg-white dark:bg-slate-800'}`}>
                                                        <Mic size={24} />
                                                    </div>
                                                    <span className="text-[10px] font-black uppercase">{isRecording ? "Stop" : "Voice"}</span>
                                                </button>
                                            </div>

                                            {newMemory.attachedFiles.length > 0 && (
                                                <div className="flex flex-wrap gap-3 mt-2 max-h-[160px] overflow-y-auto pr-2 custom-scrollbar">
                                                    {newMemory.attachedFiles.map((file, index) => (
                                                        <div key={index} className="relative group w-20 h-20">
                                                            {file.type?.startsWith('video') ? <div className="w-full h-full rounded-xl bg-indigo-500 flex items-center justify-center text-white"><Video size={20} /></div> :
                                                                file.type?.startsWith('audio') ? <div className="w-full h-full rounded-xl bg-rose-500 flex items-center justify-center text-white"><Mic size={20} /></div> :
                                                                    <img src={file.url} alt="preview" className="w-full h-full object-cover rounded-xl shadow-sm border-2 border-white" />}
                                                            <button
                                                                type="button"
                                                                onClick={() => removeAttachedFile(index)}
                                                                className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 shadow-md opacity-0 group-hover:opacity-100 transition-opacity"
                                                            >
                                                                <X size={12} strokeWidth={4} />
                                                            </button>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-bold mb-2 text-slate-700 dark:text-slate-300">TAGS</label>
                                        <input
                                            type="text"
                                            value={newMemory.tagsText}
                                            onChange={e => setNewMemory({ ...newMemory, tagsText: e.target.value })}
                                            className="w-full px-5 py-4 rounded-2xl bg-slate-50 dark:bg-slate-800 border-none focus:ring-4 focus:ring-indigo-500/10 outline-none font-semibold text-indigo-600"
                                            placeholder="Family, Travel, Love..."
                                        />
                                    </div>

                                    <div className="flex flex-col gap-4 bg-slate-50 dark:bg-slate-800 p-6 rounded-3xl">
                                        <label className="flex items-center justify-between cursor-pointer">
                                            <div className="flex items-center gap-3">
                                                <div className={`p-2 rounded-lg ${newMemory.milestone ? 'bg-amber-100 text-amber-600' : 'bg-white dark:bg-slate-900 text-slate-400'}`}>
                                                    <Star size={18} fill={newMemory.milestone ? "currentColor" : "none"} />
                                                </div>
                                                <span className="font-bold text-sm">Major Milestone</span>
                                            </div>
                                            <input
                                                type="checkbox"
                                                checked={newMemory.milestone}
                                                onChange={(e) => setNewMemory({ ...newMemory, milestone: e.target.checked })}
                                                className="w-6 h-6 rounded-lg text-indigo-600 focus:ring-indigo-500 outline-none"
                                            />
                                        </label>
                                        <div className="flex flex-col gap-3">
                                            <span className="text-[10px] font-black uppercase text-slate-400 tracking-widest pl-1">Visibility</span>
                                            <div className="flex bg-white dark:bg-slate-900 p-1.5 rounded-2xl gap-2 shadow-inner border border-indigo-50 dark:border-slate-800">
                                                {[
                                                    { id: 'private', label: 'Private', icon: Lock, color: 'text-slate-500', activeBg: 'bg-slate-100 dark:bg-slate-800' },
                                                    { id: 'friends', label: 'Friends Only', icon: Users, color: 'text-indigo-500', activeBg: 'bg-indigo-50 dark:bg-indigo-900/30' },
                                                    { id: 'public', label: 'Public', icon: Globe, color: 'text-emerald-500', activeBg: 'bg-emerald-50 dark:bg-emerald-900/30' }
                                                ].map(mode => (
                                                    <button
                                                        key={mode.id}
                                                        type="button"
                                                        onClick={() => setNewMemory({ ...newMemory, visibility: mode.id })}
                                                        className={`flex-1 flex flex-col items-center justify-center py-3 rounded-xl transition-all gap-1.5 ${newMemory.visibility === mode.id ? mode.activeBg + ' ' + mode.color + ' ring-1 ring-black/5 dark:ring-white/5 shadow-sm' : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-200'}`}
                                                    >
                                                        <mode.icon size={18} strokeWidth={newMemory.visibility === mode.id ? 3 : 2} />
                                                        <span className="text-[10px] font-bold uppercase tracking-tight">{mode.label}</span>
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <button type="submit" className="md:col-span-2 w-full premium-gradient text-white py-5 rounded-3xl font-black text-xl mt-4 hover:shadow-2xl hover:shadow-indigo-500/40 transition-all hover:-translate-y-1 active:scale-[0.98]">
                                    {editId ? 'UPDATE MOMENT' : 'LOCK IN MEMORY'}
                                </button>
                            </form>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Timeline Feed */}
            {filteredMemories.length === 0 ? (
                <div className="flex flex-col gap-8 opacity-60 text-center py-20">
                    <div className="w-20 h-20 mx-auto glass-panel rounded-full flex items-center justify-center">
                        <Clock size={32} />
                    </div>
                    <div>
                        <h3 className="text-xl font-semibold mb-2">My First Memory</h3>
                        <p>You haven't added any memories yet. Click the Add Memory button to document your journey!</p>
                    </div>
                </div>
            ) : (
                <div className="flex flex-col gap-16 mt-4">
                    {Object.entries(
                        filteredMemories.reduce((acc, memory) => {
                            const dateObj = new Date(memory.date);
                            const monthYear = isNaN(dateObj) ? 'Unknown Date' : dateObj.toLocaleDateString(undefined, { year: 'numeric', month: 'long' });
                            if (!acc[monthYear]) acc[monthYear] = [];
                            acc[monthYear].push(memory);
                            return acc;
                        }, {})
                    ).map(([monthYear, memoriesInGroup]) => (
                        <div key={monthYear} className="relative">
                            <div className="sticky top-20 z-20 flex items-center mb-8">
                                <div className="bg-indigo-600 text-white px-5 py-2 rounded-full font-bold shadow-md shadow-indigo-600/30 text-sm tracking-wide">
                                    {monthYear}
                                </div>
                                <div className="h-px bg-indigo-100 dark:bg-indigo-900/30 flex-1 ml-4 rounded-full"></div>
                            </div>

                            <div className="relative border-l-2 border-indigo-100 dark:border-slate-800 ml-4 md:ml-8 pl-8 md:pl-12 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-12">
                                {memoriesInGroup.map((memory, index) => (
                                    <motion.div
                                        key={memory.id}
                                        initial={{ opacity: 0, scale: 0.9 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        transition={{ delay: index * 0.05 }}
                                        className="relative group h-full flex flex-col"
                                    >


                                        <div className="glass-panel rounded-[2.5rem] shadow-xl shadow-black/5 dark:shadow-white/5 group hover:border-indigo-500/30 transition-all overflow-hidden flex flex-col h-full">
                                            {/* Media Section - Pinterest/Grid style */}
                                            <div className="relative aspect-[4/3] overflow-hidden bg-slate-100 dark:bg-slate-800">
                                                {memory.attachedFiles && memory.attachedFiles.length > 0 ? (
                                                    <div className="w-full h-full">
                                                        {memory.attachedFiles[0].type?.startsWith('video') ? (
                                                            <video src={memory.attachedFiles[0].url} className="w-full h-full object-cover" />
                                                        ) : memory.attachedFiles[0].type?.startsWith('audio') ? (
                                                            <div className="w-full h-full flex items-center justify-center bg-rose-50 dark:bg-rose-900/10 text-rose-500">
                                                                <Mic size={40} />
                                                            </div>
                                                        ) : (
                                                            <img
                                                                src={memory.attachedFiles[0].url}
                                                                alt="thumbnail"
                                                                onClick={() => setSelectedImage({ url: memory.attachedFiles[0].url, index: 0, allFiles: memory.attachedFiles.filter(f => !f.type?.startsWith('video') && !f.type?.startsWith('audio')) })}
                                                                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700 cursor-zoom-in"
                                                            />
                                                        )}
                                                    </div>
                                                ) : (
                                                    <div className="w-full h-full flex flex-col items-center justify-center text-slate-300 gap-2">
                                                        <ImageIcon size={40} />
                                                        <span className="text-[10px] font-black uppercase">No Media</span>
                                                    </div>
                                                )}

                                                {/* Overlay Badges */}
                                                <div className="absolute top-4 left-4 flex flex-col gap-2">
                                                    {memory.milestone && (
                                                        <span className="bg-amber-400 text-white text-[8px] font-black uppercase px-2 py-1 rounded-lg flex items-center gap-1 shadow-lg">
                                                            <Star size={8} fill="currentColor" /> Milestone
                                                        </span>
                                                    )}
                                                    {memory.visibility === 'public' ? (
                                                        <span className="bg-emerald-500 text-white text-[8px] font-black uppercase px-2 py-1 rounded-lg flex items-center gap-1 shadow-lg">
                                                            <Globe size={8} /> Public
                                                        </span>
                                                    ) : memory.visibility === 'friends' ? (
                                                        <span className="bg-indigo-500 text-white text-[8px] font-black uppercase px-2 py-1 rounded-lg flex items-center gap-1 shadow-lg">
                                                            <Users size={8} /> Friends
                                                        </span>
                                                    ) : (
                                                        <span className="bg-slate-700 text-white text-[8px] font-black uppercase px-2 py-1 rounded-lg flex items-center gap-1 shadow-lg">
                                                            <Lock size={8} /> Private
                                                        </span>
                                                    )}
                                                </div>

                                                {/* Edit/Delete Actions Overlay */}
                                                <div className="absolute top-4 right-4 flex gap-2 z-20 opacity-100 transition-opacity">
                                                    <button onClick={() => handleEdit(memory)} className="p-2 bg-white/90 dark:bg-slate-900/90 text-indigo-600 rounded-xl hover:bg-white transition-all shadow-lg hover:scale-110">
                                                        <Edit3 size={16} />
                                                    </button>
                                                    <button onClick={() => handleDelete(memory.id)} className="p-2 bg-white/90 dark:bg-slate-900/90 text-red-500 rounded-xl hover:bg-white transition-all shadow-lg hover:scale-110">
                                                        <Trash2 size={16} />
                                                    </button>
                                                </div>
                                            </div>

                                            {/* Info Section */}
                                            <div className="p-6 flex flex-col flex-1">
                                                <div className="flex justify-between items-start mb-3">
                                                    <div className="flex-1 min-w-0">
                                                        <div className="flex items-center gap-2 text-[10px] font-black text-indigo-500 uppercase tracking-widest mb-1">
                                                            <Calendar size={12} /> {memory.date}
                                                        </div>
                                                        <h3 className="text-xl font-black text-slate-900 dark:text-white truncate group-hover:text-indigo-600 transition-colors">{memory.title}</h3>
                                                    </div>
                                                    <button
                                                        onClick={() => toggleFavorite(memory.id)}
                                                        className={`p-2 rounded-xl transition-all ${memory.isFavorite ? 'text-rose-500' : 'text-slate-300 hover:text-rose-400'}`}
                                                    >
                                                        <Heart size={20} fill={memory.isFavorite ? "currentColor" : "none"} strokeWidth={memory.isFavorite ? 0 : 2} />
                                                    </button>
                                                </div>

                                                {memory.location && (
                                                    <div className="flex items-center gap-1 text-[10px] font-bold text-rose-500 uppercase tracking-tight mb-3">
                                                        <MapPin size={12} /> {memory.location}
                                                    </div>
                                                )}

                                                <p className="text-slate-600 dark:text-slate-400 text-sm line-clamp-3 font-medium leading-relaxed mb-4 flex-1">
                                                    {memory.description}
                                                </p>

                                                <div className="flex flex-wrap gap-1.5 mt-auto pt-4 border-t border-gray-50 dark:border-slate-800/50">
                                                    {memory.tags.slice(0, 3).map((tag, idx) => (
                                                        <span key={idx} className="px-2 py-0.5 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 text-[10px] font-black rounded-full uppercase tracking-tighter">
                                                            #{tag}
                                                        </span>
                                                    ))}
                                                    {memory.tags.length > 3 && <span className="text-[10px] font-black text-slate-300">+{memory.tags.length - 3}</span>}
                                                </div>
                                            </div>
                                        </div>
                                    </motion.div>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Lightbox */}
            <AnimatePresence>
                {selectedImage && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={() => setSelectedImage(null)} // Click background to close
                        className="fixed inset-0 z-[200] flex items-center justify-center bg-black/95 backdrop-blur-xl p-4 cursor-zoom-out"
                    >
                        {/* Close Button Top Right */}
                        <button
                            onClick={(e) => { e.stopPropagation(); setSelectedImage(null); }}
                            className="absolute top-8 right-8 z-[210] p-4 rounded-full bg-white/10 hover:bg-white/20 text-white transition-all backdrop-blur-md hover:rotate-90 group"
                            aria-label="Close Lightbox"
                        >
                            <X size={32} strokeWidth={3} />
                        </button>

                        {/* Back Button Top Left (kept for redundant clarity but styled better) */}
                        <button
                            onClick={(e) => { e.stopPropagation(); setSelectedImage(null); }}
                            className="absolute top-8 left-8 z-[210] text-white flex items-center gap-3 px-6 py-4 rounded-full bg-white/10 hover:bg-white/20 transition-all backdrop-blur-md font-black uppercase tracking-widest text-xs border border-white/10"
                        >
                            <ChevronLeft size={20} strokeWidth={3} /> Return
                        </button>

                        <motion.img
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            transition={{ type: "spring", damping: 25, stiffness: 200 }}
                            src={selectedImage.url}
                            alt="Fullscreen"
                            onClick={(e) => e.stopPropagation()} // Prevent closing when clicking the image
                            className="max-w-[90vw] max-h-[80vh] object-contain rounded-3xl shadow-[0_0_100px_rgba(0,0,0,0.5)] ring-1 ring-white/20 cursor-default"
                        />

                        {selectedImage.allFiles && selectedImage.allFiles.length > 1 && (
                            <div
                                onClick={(e) => e.stopPropagation()}
                                className="absolute bottom-10 flex gap-4 overflow-x-auto max-w-[90vw] px-8 py-5 bg-white/5 rounded-[2rem] backdrop-blur-2xl border border-white/10 shadow-2xl no-scrollbar"
                            >
                                {selectedImage.allFiles.map((f, idx) => (
                                    <img
                                        key={idx}
                                        src={f.url}
                                        onClick={() => setSelectedImage({ ...selectedImage, url: f.url, index: idx })}
                                        className={`w-24 h-24 object-cover rounded-2xl cursor-pointer border-4 transition-all hover:scale-110 flex-shrink-0 ${idx === selectedImage.index ? 'border-indigo-500 opacity-100 scale-110' : 'border-transparent opacity-30 hover:opacity-60'}`}
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

export default Timeline;
