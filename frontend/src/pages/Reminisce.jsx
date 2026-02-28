import { Sparkles, PlayCircle, Star, Music, Heart, Loader2, Video, Download, Trash2, Calendar, Tag, ChevronRight, Share2, Globe, Clock, Plus } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useState, useContext, useEffect } from 'react';
import axios from 'axios';
import { AuthContext } from '../context/AuthContext';

const Reminisce = () => {
    const { user } = useContext(AuthContext);
    const [loading, setLoading] = useState(false);
    const [generating, setGenerating] = useState(false);
    const [reminisceMemories, setReminisceMemories] = useState([]);
    const [savedVideos, setSavedVideos] = useState([]);
    const [showSaved, setShowSaved] = useState(false);

    // Filters
    const [tag, setTag] = useState('');
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [milestone, setMilestone] = useState(false);

    const [selectedPhotos, setSelectedPhotos] = useState([]);
    const [videoTitle, setVideoTitle] = useState('');

    useEffect(() => {
        fetchSavedVideos();
    }, [user]);

    const fetchSavedVideos = async () => {
        if (!user) return;
        try {
            const config = { headers: { Authorization: `Bearer ${user.token}` } };
            const res = await axios.get('/api/memories/reminisce/videos', config);
            setSavedVideos(res.data);
        } catch (error) {
            console.error('Error fetching saved videos:', error);
        }
    };

    const handleReminisce = async () => {
        if (!user) return;
        setLoading(true);
        setReminisceMemories([]);
        setSelectedPhotos([]);
        try {
            const config = { headers: { Authorization: `Bearer ${user.token}` } };
            let url = '/api/memories/reminisce?';
            const queryParams = [];
            if (tag) queryParams.push(`tag=${encodeURIComponent(tag)}`);
            if (startDate) queryParams.push(`startDate=${startDate}`);
            if (endDate) queryParams.push(`endDate=${endDate}`);
            if (milestone) queryParams.push(`milestone=true`);

            const res = await axios.get(url + queryParams.join('&'), config);

            if (res.data.length === 0) {
                alert("No memories found matching these criteria. Try broadening your flashback filters!");
            } else {
                setReminisceMemories(res.data);
                // Auto-select some photos if available
                const allPhotos = res.data.flatMap(m => m.photos || []);
                setSelectedPhotos(allPhotos.slice(0, 5));
            }
        } catch (error) {
            console.error('Error fetching reminisce:', error);
            alert('Failed to run Flashback Engine.');
        } finally {
            setLoading(false);
        }
    };

    const togglePhotoSelection = (photoUrl) => {
        setSelectedPhotos(prev =>
            prev.includes(photoUrl)
                ? prev.filter(p => p !== photoUrl)
                : [...prev, photoUrl]
        );
    };

    const handleGenerateVideo = async () => {
        if (selectedPhotos.length === 0) {
            alert("Please select at least one photo for the slideshow!");
            return;
        }
        setGenerating(true);
        try {
            const config = { headers: { Authorization: `Bearer ${user.token}` } };
            const res = await axios.post('/api/memories/reminisce/generate', {
                photos: selectedPhotos,
                title: videoTitle
            }, config);

            alert("Your cinematic flashback is ready!");
            setSavedVideos([res.data, ...savedVideos]);
            setShowSaved(true);
            setVideoTitle('');
        } catch (error) {
            console.error('Video generation failed:', error);
            alert('Failed to generate video. Cloudinary limits might have been reached.');
        } finally {
            setGenerating(false);
        }
    };

    return (
        <div className="py-12 max-w-6xl mx-auto px-4 relative z-0">
            {/* Header Area */}
            <div className="flex flex-col md:flex-row justify-between items-center mb-12 gap-6">
                <div className="flex flex-col items-center md:items-start">
                    <h1 className="text-5xl font-black bg-clip-text text-transparent bg-gradient-to-r from-indigo-500 via-purple-500 to-fuchsia-600 mb-2">
                        Reminisce Engine
                    </h1>
                    <p className="text-slate-500 dark:text-slate-400 font-bold tracking-tight uppercase text-xs">AI-Powered Cinematic Flashbacks</p>
                </div>

                <div className="flex gap-2 p-1.5 bg-indigo-50 dark:bg-slate-800 rounded-2xl border border-indigo-100 dark:border-slate-700 shadow-sm">
                    <button
                        onClick={() => setShowSaved(false)}
                        className={`px-6 py-2.5 rounded-xl font-black text-sm transition-all ${!showSaved ? 'bg-white dark:bg-slate-900 text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-indigo-500'}`}
                    >
                        Flashback Generator
                    </button>
                    <button
                        onClick={() => setShowSaved(true)}
                        className={`px-6 py-2.5 rounded-xl font-black text-sm transition-all ${showSaved ? 'bg-white dark:bg-slate-900 text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-indigo-500'}`}
                    >
                        My Saved Videos
                    </button>
                </div>
            </div>

            <AnimatePresence mode="wait">
                {!showSaved ? (
                    <motion.div
                        key="generator"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        className="grid grid-cols-1 lg:grid-cols-12 gap-10"
                    >
                        {/* Filters & Control - Column 4 */}
                        <div className="lg:col-span-4 flex flex-col gap-8">
                            <div className="glass-panel p-8 rounded-[2.5rem] border-indigo-500/10 shadow-xl relative overflow-hidden">
                                <div className="relative z-10">
                                    <div className="flex items-center gap-3 mb-6">
                                        <div className="p-3 bg-indigo-600 text-white rounded-2xl shadow-lg shadow-indigo-600/30">
                                            <Sparkles size={24} />
                                        </div>
                                        <h2 className="text-xl font-black">Flashback Source ✨</h2>
                                    </div>

                                    <div className="flex flex-col gap-5 text-left mb-8">
                                        <div>
                                            <label className="block text-[10px] font-black uppercase text-indigo-500 mb-2 ml-1">Specific Vibe / Tag</label>
                                            <div className="relative">
                                                <Tag className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
                                                <input
                                                    type="text"
                                                    value={tag} onChange={e => setTag(e.target.value)}
                                                    placeholder="Travel, Family, Summer..."
                                                    className="w-full pl-12 pr-4 py-4 rounded-2xl bg-slate-50 dark:bg-slate-900 border-2 border-transparent focus:border-indigo-500 outline-none font-bold transition-all"
                                                />
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <label className="block text-[10px] font-black uppercase text-indigo-500 mb-2 ml-1">From Date</label>
                                                <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className="w-full px-4 py-4 rounded-2xl bg-slate-50 dark:bg-slate-900 border-none outline-none font-bold" />
                                            </div>
                                            <div>
                                                <label className="block text-[10px] font-black uppercase text-indigo-500 mb-2 ml-1">To Date</label>
                                                <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} className="w-full px-4 py-4 rounded-2xl bg-slate-50 dark:bg-slate-900 border-none outline-none font-bold" />
                                            </div>
                                        </div>

                                        <label className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-900 rounded-2xl cursor-pointer hover:bg-amber-50 dark:hover:bg-amber-900/10 transition-colors">
                                            <div className="flex items-center gap-3">
                                                <Star className={milestone ? "text-amber-500" : "text-slate-300"} fill={milestone ? "currentColor" : "none"} />
                                                <span className="text-sm font-black">Only Milestones</span>
                                            </div>
                                            <input type="checkbox" checked={milestone} onChange={e => setMilestone(e.target.checked)} className="w-5 h-5 rounded-lg text-amber-500" />
                                        </label>
                                    </div>

                                    <button
                                        onClick={handleReminisce}
                                        disabled={loading}
                                        className="w-full premium-gradient text-white py-5 rounded-[2rem] font-black text-xl shadow-xl shadow-indigo-600/30 flex items-center justify-center gap-3 hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-50"
                                    >
                                        {loading ? <Loader2 className="animate-spin" /> : <PlayCircle />}
                                        {loading ? 'Booting Engine...' : 'Run Engine'}
                                    </button>
                                </div>
                                <div className="absolute -bottom-10 -right-10 opacity-5 text-indigo-400 rotate-12">
                                    <Clock size={240} />
                                </div>
                            </div>

                            {/* Video Creation Options */}
                            {reminisceMemories.length > 0 && (
                                <motion.div
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    className="glass-panel p-8 rounded-[2.5rem] bg-indigo-600 text-white shadow-2xl relative overflow-hidden"
                                >
                                    <div className="relative z-10">
                                        <h3 className="text-xl font-black mb-4 flex items-center gap-2">
                                            <Video /> Create Video 🎬
                                        </h3>
                                        <p className="text-sm font-medium opacity-80 mb-6 leading-relaxed">Combine your selected {selectedPhotos.length} photos into a cinematic memory video. 🎞️</p>

                                        <input
                                            type="text"
                                            placeholder="Video Title (optional)"
                                            value={videoTitle}
                                            onChange={e => setVideoTitle(e.target.value)}
                                            className="w-full px-4 py-4 rounded-2xl bg-white/10 border border-white/20 placeholder:text-white/40 text-white font-bold mb-6 outline-none focus:bg-white/20 transition-all"
                                        />

                                        <button
                                            onClick={handleGenerateVideo}
                                            disabled={generating || selectedPhotos.length === 0}
                                            className="w-full bg-white text-indigo-600 py-4 rounded-2xl font-black text-lg hover:shadow-2xl hover:scale-105 active:scale-95 transition-all disabled:opacity-50 relative group overflow-hidden"
                                        >
                                            <span className="relative z-10">
                                                {generating ? <Loader2 className="animate-spin inline mr-2" /> : '🚀 Generate Slideshow 🎨'}
                                            </span>
                                            <div className="absolute top-0 right-0 p-1 transform translate-x-2 -translate-y-2 group-hover:translate-x-0 group-hover:translate-y-0 transition-transform">⭐</div>
                                        </button>
                                    </div>
                                </motion.div>
                            )}
                        </div>

                        {/* Discovery Area - Column 8 */}
                        <div className="lg:col-span-8">
                            {reminisceMemories.length === 0 ? (
                                <div className="h-full flex flex-col items-center justify-center text-center opacity-30 py-20">
                                    <Clock size={120} strokeWidth={1} />
                                    <h2 className="text-2xl font-black mt-6 uppercase tracking-widest">Awaiting Command</h2>
                                    <p className="mt-2 font-medium">Flashback Engine initialized. Please select filters.</p>
                                </div>
                            ) : (
                                <div className="flex flex-col gap-10">
                                    <div className="flex justify-between items-center text-slate-500 dark:text-slate-400 font-black text-xs uppercase tracking-widest px-4">
                                        <span>Discovered Moments ({reminisceMemories.length})</span>
                                        <span>Click photos to select for video</span>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                        {reminisceMemories.map((m, idx) => (
                                            <motion.div
                                                key={m.id}
                                                initial={{ opacity: 0, scale: 0.9 }}
                                                animate={{ opacity: 1, scale: 1 }}
                                                transition={{ delay: idx * 0.05 }}
                                                className="glass-panel group rounded-[2.5rem] overflow-hidden hover:border-indigo-500/40 transition-all"
                                            >
                                                <div className="aspect-video relative overflow-hidden bg-slate-100 dark:bg-slate-900">
                                                    {m.photos && m.photos.length > 0 ? (
                                                        <div className="flex w-full h-full">
                                                            {m.photos.slice(0, 1).map((photo, pIdx) => (
                                                                <div
                                                                    key={pIdx}
                                                                    onClick={() => togglePhotoSelection(photo)}
                                                                    className={`relative w-full h-full cursor-pointer group-active:scale-95 transition-transform`}
                                                                >
                                                                    <img
                                                                        src={photo}
                                                                        className={`w-full h-full object-cover transition-all duration-700 ${selectedPhotos.includes(photo) ? 'brightness-50' : 'group-hover:scale-110'}`}
                                                                    />
                                                                    {selectedPhotos.includes(photo) && (
                                                                        <div className="absolute inset-0 flex items-center justify-center">
                                                                            <div className="p-3 bg-indigo-600 rounded-full text-white shadow-xl shadow-indigo-600/40">
                                                                                <Plus className="rotate-45" size={32} strokeWidth={4} />
                                                                            </div>
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            ))}
                                                        </div>
                                                    ) : (
                                                        <div className="w-full h-full flex items-center justify-center text-slate-300">
                                                            <Sparkles size={48} />
                                                        </div>
                                                    )}
                                                </div>

                                                <div className="p-8">
                                                    <div className="flex justify-between items-start mb-4">
                                                        <h3 className="font-black text-2xl group-hover:text-indigo-600 transition-colors uppercase tracking-tighter truncate max-w-[80%]">{m.title}</h3>
                                                        {m.milestone && <Star size={20} className="text-amber-500" fill="currentColor" />}
                                                    </div>
                                                    <p className="text-sm font-bold opacity-40 mb-4 flex items-center gap-2">
                                                        <Calendar size={14} /> {new Date(m.date).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })}
                                                    </p>
                                                    <p className="text-slate-600 dark:text-slate-400 font-medium leading-relaxed line-clamp-2">{m.description}</p>
                                                </div>
                                            </motion.div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    </motion.div>
                ) : (
                    <motion.div
                        key="saved"
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        className="flex flex-col gap-10"
                    >
                        {savedVideos.length === 0 ? (
                            <div className="flex flex-col items-center justify-center text-center py-32 opacity-30">
                                <Video size={100} strokeWidth={1} />
                                <h2 className="text-2xl font-black mt-6 uppercase tracking-widest">No Saved Videos</h2>
                                <p className="mt-2 font-medium">Use the generator to create your first cinematic masterpiece.</p>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                                {savedVideos.map((video, idx) => (
                                    <motion.div
                                        key={video.id}
                                        initial={{ opacity: 0, scale: 0.9 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        transition={{ delay: idx * 0.1 }}
                                        className="glass-panel p-4 rounded-[2.5rem] shadow-xl group hover:border-indigo-500/30 transition-all flex flex-col"
                                    >
                                        <div className="aspect-video rounded-[1.5rem] overflow-hidden bg-slate-900 relative shadow-inner mb-6">
                                            <video
                                                src={video.video_url}
                                                className="w-full h-full object-cover"
                                                poster={video.thumbnail_url}
                                                controls
                                            />
                                            <div className="absolute top-4 left-4 p-2 bg-indigo-600 text-white rounded-xl shadow-lg shadow-indigo-600/40 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <Video size={16} />
                                            </div>
                                        </div>

                                        <div className="px-4 pb-4">
                                            <h3 className="font-black text-xl mb-2 line-clamp-1">{video.title}</h3>
                                            <div className="flex justify-between items-center mt-6">
                                                <span className="text-xs font-black opacity-30 uppercase tracking-widest flex items-center gap-2">
                                                    <Clock size={12} /> {new Date(video.created_at).toLocaleDateString()}
                                                </span>
                                                <div className="flex gap-2">
                                                    <a
                                                        href={video.video_url}
                                                        download
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="p-3 bg-indigo-50 dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 rounded-2xl hover:bg-indigo-600 hover:text-white transition-all hover:shadow-lg hover:shadow-indigo-600/30"
                                                    >
                                                        <Download size={18} />
                                                    </a>
                                                    <button className="p-3 bg-rose-50 dark:bg-slate-800 text-rose-500 rounded-2xl hover:bg-rose-500 hover:text-white transition-all">
                                                        <Trash2 size={18} />
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    </motion.div>
                                ))}
                            </div>
                        )}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default Reminisce;
