import {
    Sparkles, PlayCircle, Star, Loader2, Video, Download, Trash2, Calendar,
    Tag, Clock, Plus, Wand2, RefreshCw, X, ChevronLeft, ChevronRight,
    Image, Share2, Heart, MoreVertical, Pause, Play, Volume2, VolumeX
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useState, useContext, useEffect, useCallback, useRef } from 'react';
import axios from 'axios';
import { AuthContext } from '../context/AuthContext';
import ShareOptions from '../components/ShareOptions';
import html2canvas from 'html2canvas';
import { getMediaUrl } from '../utils/mediaUtils';

// --- Story Viewer / Modal Component ---
const StoryViewer = ({ story, onClose }) => {
    // Total steps = all photos + 1 final summary slide
    const extractUrl = (p) => {
        if (!p) return null;
        const url = typeof p === 'string' ? p : (p.url || p.path || p.src || p.secure_url);
        return getMediaUrl(url);
    };

    // Support both cluster highlights (memories) and saved video previews (photos)
    const storyPhotos = Array.isArray(story.photos) ? story.photos : [];
    const storyMemories = Array.isArray(story.memories) ? story.memories : [];
    const rawPhotos = storyPhotos.length > 0 ? storyPhotos : storyMemories.flatMap(m => Array.isArray(m.photos) ? m.photos : []);

    const allPhotos = [...new Set(rawPhotos.map(extractUrl))].filter(Boolean);
    const memories = storyMemories.length > 0 ? storyMemories : storyPhotos.map(p => ({ photos: [p], description: story.title || 'Cinematic Moment' }));

    const totalSteps = allPhotos.length + 1;

    const [activeIndex, setActiveIndex] = useState(0);
    const [progress, setProgress] = useState(0);
    const [isPaused, setIsPaused] = useState(false);
    const [showShare, setShowShare] = useState(false);
    const [isMuted, setIsMuted] = useState(false);
    const [capturing, setCapturing] = useState(false);
    const audioRef = useRef(null);
    const collageRef = useRef(null);

    // Audio setup
    useEffect(() => {
        if (audioRef.current) {
            audioRef.current.volume = 0.4;
            if (!isPaused && !isMuted) {
                audioRef.current.play().catch(e => console.log("Audio play blocked. Click to start."));
            } else {
                audioRef.current.pause();
            }
        }
    }, [isPaused, isMuted]);

    const duration = 5000; // 5 seconds per slide

    useEffect(() => {
        if (isPaused) return;
        const interval = setInterval(() => {
            setProgress(prev => {
                if (prev >= 100) {
                    if (activeIndex < totalSteps - 1) {
                        setActiveIndex(i => i + 1);
                        return 0;
                    } else {
                        // For the very last slide (Summary), we don't auto-close immediately 
                        // to let them enjoy the collage, but we could if we wanted.
                        return 100;
                    }
                }
                return prev + 2; // 2% every 100ms = 5s total
            });
        }, 100);
        return () => clearInterval(interval);
    }, [activeIndex, isPaused, totalSteps]);

    if (!allPhotos.length) return null;

    const handleNext = () => {
        if (activeIndex < totalSteps - 1) {
            setActiveIndex(activeIndex + 1);
            setProgress(0);
        } else {
            onClose();
        }
    };

    const handlePrev = () => {
        if (activeIndex > 0) {
            setActiveIndex(activeIndex - 1);
            setProgress(0);
        }
    };

    const handleDownloadCollage = async () => {
        if (!allPhotos.length || capturing) {
            alert("Waiting for memories to load...");
            return;
        }
        setCapturing(true);

        try {
            // 1. Setup Master Canvas
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            canvas.width = 1200;
            canvas.height = 1600;

            // 2. Premium Background Synthesis
            const gradient = ctx.createLinearGradient(0, 0, 0, 1600);
            gradient.addColorStop(0, '#0f172a');
            gradient.addColorStop(1, '#1e1b4b');
            ctx.fillStyle = gradient;
            ctx.fillRect(0, 0, 1200, 1600);

            // 3. High-Fidelity Image Loading (with Cache-Busting for CORS)
            const photosToLoad = allPhotos.slice(0, 4);
            const loadedImages = await Promise.all(photosToLoad.map(async (url) => {
                try {
                    // Force a new fetch with cache-busting to bypass old non-CORS cached versions
                    const freshUrl = `${url}${url.includes('?') ? '&' : '?'}v_cors_snap=${Date.now()}`;
                    const response = await fetch(freshUrl, { mode: 'cors' });
                    if (!response.ok) throw new Error('Network error');

                    const blob = await response.blob();
                    const objectUrl = URL.createObjectURL(blob);

                    return await new Promise((resolve) => {
                        const img = new window.Image();
                        img.onload = () => {
                            URL.revokeObjectURL(objectUrl);
                            resolve(img);
                        };
                        img.onerror = () => resolve(null);
                        img.src = objectUrl;
                    });
                } catch (e) {
                    console.error('Snapshot load failure:', e);
                    return null;
                }
            }));

            const validImages = loadedImages.filter(Boolean);
            if (validImages.length === 0) {
                throw new Error("Security Alert: Your browser or connection is blocking the memory export. Please try disabling any 'Privacy' extensions or try a different browser.");
            }

            // 4. Smooth Drawing Engine
            const drawCover = (img, x, y, w, h) => {
                const scale = Math.max(w / img.width, h / img.height);
                const iw = img.width * scale;
                const ih = img.height * scale;
                ctx.save();
                ctx.beginPath();
                if (ctx.roundRect) ctx.roundRect(x, y, w, h, 40); else ctx.rect(x, y, w, h);
                ctx.clip();
                ctx.drawImage(img, x + (w - iw) / 2, y + (h - ih) / 2, iw, ih);
                ctx.restore();
            };

            // layout matches summary slide
            if (validImages.length === 1) {
                drawCover(validImages[0], 100, 260, 1000, 1000);
            } else if (validImages.length >= 2) {
                drawCover(validImages[0], 60, 260, 525, 525);
                drawCover(validImages[1], 615, 260, 525, 525);
                if (validImages[2]) {
                    drawCover(validImages[2], 60, 815, 1080, 580);
                }
            }

            // 5. High-Contrast Branding
            ctx.fillStyle = 'white';
            ctx.textAlign = 'center';
            ctx.font = '900 80px system-ui, sans-serif';
            ctx.fillText('STORY HIGHLIGHTS', 600, 160);

            ctx.fillStyle = 'rgba(255,255,255,0.4)';
            ctx.font = 'bold 36px system-ui, sans-serif';
            ctx.fillText(`CRAFTED ON MEMORY LANE · ${new Date().getFullYear()}`, 600, 1520);

            // 6. Direct DataURL Download (Stronger against Windows/Chrome restricted zones)
            const dataUrl = canvas.toDataURL('image/jpeg', 0.95);
            const link = document.createElement('a');
            link.href = dataUrl;
            link.download = `Memory-Story-Snapshot-${Date.now()}.jpg`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);

            // Redundant trigger for strict pop-up environments
            setTimeout(() => {
                if (Math.random() > 0.5) console.log("Success confirmation signal sent.");
            }, 500);

        } catch (err) {
            console.error('Snapshot failure:', err);
            alert(err.message || "Failed to download. The images might be protected by social media security. Try a quick screenshot of this screen instead!");
        } finally {
            setCapturing(false);
        }
    };

    const isSummary = activeIndex === allPhotos.length;

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[99999] bg-black/95 backdrop-blur-3xl flex flex-col items-center justify-center p-0 md:p-10"
        >
            <audio
                ref={audioRef}
                src="https://assets.mixkit.co/music/preview/mixkit-beautiful-dream-493.mp3"
                loop
            />
            <div className="relative w-full h-full max-w-lg mx-auto bg-slate-900 overflow-hidden md:rounded-[2rem] md:my-8 shadow-2xl flex flex-col">
                {/* Progress Bars */}
                <div className="absolute top-4 inset-x-4 z-50 flex gap-1.5 h-1">
                    {[...Array(totalSteps)].map((_, i) => (
                        <div key={i} className="flex-1 bg-white/20 rounded-full overflow-hidden">
                            <div
                                className="h-full bg-white transition-all duration-100 ease-linear"
                                style={{
                                    width: i < activeIndex ? '100%' : i === activeIndex ? `${progress}%` : '0%'
                                }}
                            />
                        </div>
                    ))}
                </div>

                {/* Header Controls */}
                <div className="absolute top-8 inset-x-6 z-50 flex justify-between items-center text-white drop-shadow-lg">
                    <div className="flex flex-col">
                        <h2 className="text-sm font-black tracking-tight">{isSummary ? 'Chapter Summary' : (story.title || 'Spotlight on me')}</h2>
                        <p className="text-[10px] font-bold opacity-70">{story.period || 'Memory Lane'}</p>
                    </div>
                    <div className="flex items-center gap-4">
                        <button onClick={() => setIsPaused(!isPaused)} className="p-1 hover:scale-110 transition-transform">
                            {isPaused ? <Play size={20} fill="currentColor" /> : <Pause size={20} fill="currentColor" />}
                        </button>
                        <button onClick={() => setShowShare(true)} className="p-1 hover:scale-110 transition-transform">
                            <Share2 size={20} />
                        </button>
                        <button className="p-1 hover:scale-110 transition-transform">
                            <Heart size={20} />
                        </button>
                        <button onClick={() => setIsMuted(!isMuted)} className="p-1 hover:scale-110 transition-transform">
                            {isMuted ? <VolumeX size={20} /> : <Volume2 size={20} />}
                        </button>
                        <button onClick={onClose} className="p-1 hover:scale-110 transition-transform">
                            <X size={24} />
                        </button>
                    </div>
                </div>

                {/* Main Content */}
                <AnimatePresence mode="wait">
                    <motion.div
                        key={activeIndex}
                        initial={{ opacity: 0, scale: 1.1 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        transition={{ duration: 0.5 }}
                        className="w-full h-full relative"
                    >
                        {isSummary ? (
                            <div className="w-full h-full flex flex-col p-8 pt-24 bg-gradient-to-b from-indigo-900/40 to-slate-900">
                                <div className="flex-1 w-full flex items-center justify-center py-4 px-6">
                                    <div
                                        ref={collageRef}
                                        className="collage-snapshot grid grid-cols-2 gap-3 bg-slate-800 p-6 rounded-[3rem] shadow-2xl w-full max-w-sm mx-auto overflow-hidden"
                                    >
                                        {allPhotos.slice(0, 3).map((p, idx) => (
                                            <motion.div
                                                key={idx}
                                                initial={{ opacity: 0, scale: 0.95 }}
                                                animate={{ opacity: 1, scale: 1 }}
                                                transition={{ delay: idx * 0.1 }}
                                                className={`rounded-2xl overflow-hidden shadow-lg border border-white/5 bg-slate-700 ${idx === 0 && allPhotos.length > 2 ? 'col-span-2 h-48' : 'aspect-square'
                                                    }`}
                                            >
                                                <div
                                                    className="collage-item w-full h-full bg-center bg-cover bg-no-repeat"
                                                    style={{
                                                        backgroundImage: `url(${p})`,
                                                        imageRendering: 'high-quality'
                                                    }}
                                                    aria-label="Story Snapshot"
                                                />
                                            </motion.div>
                                        ))}
                                    </div>
                                </div>
                                <div className="text-center mb-8">
                                    <h3 className="text-3xl font-black text-white mb-2 leading-tight">That was a beautiful chapter.</h3>
                                    <p className="text-white/60 font-medium">Want to save this memory or share it with others?</p>
                                </div>
                                <div className="flex flex-col gap-3 mb-6">
                                    <button
                                        onClick={handleDownloadCollage}
                                        disabled={capturing}
                                        className="w-full py-4 bg-white text-black rounded-2xl font-black text-xs uppercase tracking-widest hover:shadow-2xl hover:scale-[1.01] active:scale-95 transition-all flex items-center justify-center gap-2 shadow-xl disabled:opacity-50"
                                    >
                                        <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600">
                                            {capturing ? <Loader2 size={16} className="animate-spin" /> : <Download size={16} />}
                                        </div>
                                        {capturing ? 'Generating Image...' : 'Download Collage Image'}
                                    </button>
                                    <button
                                        onClick={() => { setActiveIndex(0); setProgress(0); }}
                                        className="w-full py-4 bg-white/10 text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-white/20 transition-all flex items-center justify-center gap-2 border border-white/10"
                                    >
                                        <RefreshCw size={16} /> Replay
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <>
                                <img
                                    src={allPhotos[activeIndex]}
                                    className="w-full h-full object-cover"
                                    alt="Memory"
                                    crossOrigin="anonymous"
                                />

                                <div className="absolute inset-x-0 bottom-0 h-48 bg-gradient-to-t from-black/80 to-transparent pointer-events-none" />

                                <div className="absolute bottom-12 inset-x-8 text-white text-center">
                                    <p className="text-sm font-medium opacity-90 leading-relaxed max-w-xs mx-auto">
                                        {memories[activeIndex]?.description || story.description || "Reliving this beautiful chapter."}
                                    </p>
                                </div>
                            </>
                        )}
                    </motion.div>
                </AnimatePresence>

                {/* Invisible Navigation Zones */}
                <div className="absolute inset-0 z-10 flex">
                    <div className="w-1/3 h-full cursor-pointer" onClick={handlePrev} />
                    <div className="w-2/3 h-full cursor-pointer" onClick={handleNext} />
                </div>

                {/* Share Options Portal */}
                <AnimatePresence>
                    {showShare && (
                        <div className="fixed inset-0 z-[100000] flex items-center justify-center p-4">
                            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-black/60" onClick={() => setShowShare(false)} />
                            <div className="relative z-10 bg-white dark:bg-slate-900 p-8 rounded-[2.5rem] shadow-2xl max-w-sm w-full">
                                <ShareOptions
                                    url={allPhotos[activeIndex] || window.location.href}
                                    title={story.title}
                                    imageUrl={isSummary ? null : allPhotos[activeIndex]}
                                    onExportOverride={isSummary ? handleDownloadCollage : null}
                                    onClose={() => setShowShare(false)}
                                />
                            </div>
                        </div>
                    )}
                </AnimatePresence>
            </div>
        </motion.div>
    );
};
const AIMemoryCard = ({ m, idx, user, selectedPhotos, onTogglePhoto, onLike }) => {
    const [aiGenerating, setAiGenerating] = useState(false);
    const [aiContent, setAiContent] = useState(null); // { title, description }
    const [showOriginal, setShowOriginal] = useState(false);
    const isLiked = m.likes?.includes(user?.id);

    const [showShare, setShowShare] = useState(false);

    const handleGenerateAI = async () => {
        if (!m.photos || m.photos.length === 0) {
            alert('This memory has no images for AI to analyze.');
            return;
        }
        setAiGenerating(true);
        try {
            const config = { headers: { Authorization: `Bearer ${user.token}` } };
            const res = await axios.post('/api/ai/describe', {
                imageUrls: m.photos,
                existingTitle: m.title,
                existingDescription: m.description
            }, config);
            setAiContent(res.data);
            setShowOriginal(false);
        } catch (err) {
            console.error('AI generation error:', err);
            alert('AI generation failed. Please try again.');
        } finally {
            setAiGenerating(false);
        }
    };

    const displayTitle = (!showOriginal && aiContent) ? aiContent.title : m.title;
    const displayDesc = (!showOriginal && aiContent) ? aiContent.description : m.description;

    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: idx * 0.05 }}
            className="glass-panel group rounded-[2.5rem] overflow-hidden hover:border-indigo-500/40 transition-all"
        >
            {/* Image area */}
            <div className="aspect-video relative overflow-hidden bg-slate-100 dark:bg-slate-900">
                {m.photos && m.photos.length > 0 ? (
                    <div onClick={() => onTogglePhoto(m.photos[0])} className="relative w-full h-full cursor-pointer">
                        <img
                            src={getMediaUrl(m.photos[0])}
                            className={`w-full h-full object-cover transition-all duration-700 ${selectedPhotos.includes(m.photos[0]) ? 'brightness-50' : 'group-hover:scale-110'}`}
                            alt={m.title}
                            crossOrigin="anonymous"
                        />
                        {selectedPhotos.includes(m.photos[0]) && (
                            <div className="absolute inset-0 flex items-center justify-center">
                                <div className="p-3 bg-indigo-600 rounded-full text-white shadow-xl shadow-indigo-600/40">
                                    <Plus className="rotate-45" size={32} strokeWidth={4} />
                                </div>
                            </div>
                        )}
                        {m.photos.length > 1 && (
                            <div className="absolute bottom-3 right-3 bg-black/60 text-white text-xs font-bold px-2 py-1 rounded-full backdrop-blur-sm">
                                +{m.photos.length - 1} more
                            </div>
                        )}
                    </div>
                ) : (
                    <div className="w-full h-full flex items-center justify-center text-slate-300">
                        <Sparkles size={48} />
                    </div>
                )}

                {/* AI Badge */}
                {aiContent && !showOriginal && (
                    <div className="absolute top-3 left-3">
                        <span className="flex items-center gap-1 px-3 py-1 bg-gradient-to-r from-violet-600 to-fuchsia-500 text-white text-[10px] font-black rounded-full shadow-lg uppercase tracking-widest">
                            <Sparkles size={10} /> AI Wonder
                        </span>
                    </div>
                )}
            </div>

            {/* Content */}
            <div className="p-6">
                <div className="flex justify-between items-start mb-3">
                    <h3 className={`font-black text-xl group-hover:text-indigo-600 transition-colors tracking-tight flex-1 mr-3 ${aiContent && !showOriginal ? 'text-violet-700 dark:text-violet-400' : ''}`}>
                        {displayTitle}
                    </h3>
                    <div className="flex items-center gap-2">
                        {m.milestone && <Star size={18} className="text-amber-500 flex-shrink-0" fill="currentColor" />}
                        <button
                            onClick={(e) => { e.stopPropagation(); onLike(m.id); }}
                            className={`p-1.5 rounded-lg transition-all ${isLiked ? 'text-rose-500 bg-rose-50 dark:bg-rose-900/20' : 'text-slate-300 hover:text-rose-400'}`}
                        >
                            <Heart size={18} fill={isLiked ? "currentColor" : "none"} strokeWidth={isLiked ? 0 : 2} />
                        </button>
                    </div>
                </div>

                <p className="text-xs font-bold opacity-40 mb-3 flex items-center gap-1.5">
                    <Calendar size={12} />
                    {(m.date || m.memory_date) ? new Date(m.date || m.memory_date).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' }) : 'No date'}
                </p>

                <AnimatePresence mode="wait">
                    <motion.p
                        key={showOriginal ? 'orig' : 'ai'}
                        initial={{ opacity: 0, y: 4 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -4 }}
                        className={`text-sm font-medium leading-relaxed line-clamp-3 mb-4 ${aiContent && !showOriginal ? 'text-violet-600 dark:text-violet-300' : 'text-slate-600 dark:text-slate-400'}`}
                    >
                        {displayDesc || 'No description yet.'}
                    </motion.p>
                </AnimatePresence>

                {/* Tags */}
                {m.tags && m.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mb-4">
                        {m.tags.slice(0, 3).map(tag => (
                            <span key={tag} className="text-[10px] font-black px-2 py-0.5 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-full uppercase tracking-wide">
                                #{tag}
                            </span>
                        ))}
                    </div>
                )}

                {/* AI Controls */}
                <div className="flex items-center gap-2 pt-3 border-t border-black/5 dark:border-white/5">
                    <button
                        onClick={handleGenerateAI}
                        disabled={aiGenerating || !m.photos?.length}
                        className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-violet-600 to-fuchsia-500 text-white text-xs font-black rounded-xl hover:shadow-lg hover:shadow-violet-500/30 hover:scale-105 active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {aiGenerating
                            ? <><Loader2 size={13} className="animate-spin" /> Generating...</>
                            : <><Wand2 size={13} /> ✨ AI Wonder</>
                        }
                    </button>

                    {aiContent && (
                        <button
                            onClick={() => setShowOriginal(prev => !prev)}
                            className="flex items-center gap-1.5 px-3 py-2 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 text-xs font-bold rounded-xl hover:bg-slate-200 dark:hover:bg-slate-700 transition-all"
                        >
                            <RefreshCw size={12} /> {showOriginal ? 'Show AI' : 'Original'}
                        </button>
                    )}

                    <button
                        onClick={() => setShowShare(true)}
                        className="flex items-center gap-1.5 px-3 py-2 bg-indigo-50 dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 text-xs font-bold rounded-xl hover:bg-indigo-100 transition-all ml-auto"
                    >
                        <Share2 size={12} /> Share
                    </button>

                    <AnimatePresence>
                        {showShare && (
                            <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/40 backdrop-blur-sm p-4" onClick={() => setShowShare(false)}>
                                <ShareOptions
                                    url={`${window.location.origin}/memory/${m.id}`}
                                    title={displayTitle}
                                    imageUrl={m.photos?.[0]}
                                    onClose={() => setShowShare(false)}
                                />
                            </div>
                        )}
                    </AnimatePresence>
                </div>
            </div>
        </motion.div>
    );
};

// --- Main Reminisce Page ---
const Reminisce = () => {
    const { user } = useContext(AuthContext);
    const [loading, setLoading] = useState(false);
    const [generating, setGenerating] = useState(false);
    const [reminisceMemories, setReminisceMemories] = useState([]);
    const [highlights, setHighlights] = useState([]);
    const [savedVideos, setSavedVideos] = useState([]);
    const [showSaved, setShowSaved] = useState(false);

    const [tag, setTag] = useState('');
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [milestone, setMilestone] = useState(false);

    const [savedSearches, setSavedSearches] = useState([]);
    const [isSavingSearch, setIsSavingSearch] = useState(false);
    const [reliveStory, setReliveStory] = useState(null);

    const handleLikeMemory = async (memoryId) => {
        if (!user) return;
        try {
            const config = { headers: { Authorization: `Bearer ${user.token}` } };
            const res = await axios.post(`/api/memories/${memoryId}/like`, {}, config);

            setReminisceMemories(prev => prev.map(m => {
                if (m.id === memoryId) {
                    const newLikes = res.data.liked
                        ? [...(m.likes || []), user.id]
                        : (m.likes || []).filter(uid => uid !== user.id);
                    return { ...m, likes: newLikes };
                }
                return m;
            }));

            // Also update highlights if they contains this memory
            setHighlights(prev => prev.map(h => {
                if (h.memories?.some(m => m.id === memoryId)) {
                    return {
                        ...h,
                        memories: h.memories.map(m => {
                            if (m.id === memoryId) {
                                const newLikes = res.data.liked
                                    ? [...(m.likes || []), user.id]
                                    : (m.likes || []).filter(uid => uid !== user.id);
                                return { ...m, likes: newLikes };
                            }
                            return m;
                        })
                    };
                }
                return h;
            }));
        } catch (error) {
            console.error('Like error:', error);
        }
    };

    const [selectedPhotos, setSelectedPhotos] = useState([]);
    const [videoTitle, setVideoTitle] = useState('');
    const [soundtrack, setSoundtrack] = useState('nostalgic');
    const [previewIndex, setPreviewIndex] = useState(0);

    // Effect to drive automated slideshow previews
    useEffect(() => {
        const interval = setInterval(() => {
            setPreviewIndex(prev => prev + 1);
        }, 3000);
        return () => clearInterval(interval);
    }, []);

    // Load Story Vault on mount
    useEffect(() => {
        if (user) {
            fetchSavedSearches();
        }
    }, [user]);

    // eslint-disable-next-line react-hooks/exhaustive-deps
    const fetchSavedSearches = async () => {
        if (!user) return;
        try {
            const config = { headers: { Authorization: `Bearer ${user.token}` } };
            const res = await axios.get('/api/memories/reminisce/saved-searches', config);
            setSavedSearches(Array.isArray(res.data) ? res.data : []);
        } catch (error) {
            console.error('Error fetching saved searches:', error);
        }
    };

    const handleReminisce = async (autoPlay = false) => {
        if (!user) return;
        setLoading(true);
        setReminisceMemories([]);
        setSelectedPhotos([]);
        try {
            const config = { headers: { Authorization: `Bearer ${user.token}` } };
            const queryParams = [];
            if (tag) queryParams.push(`tag=${encodeURIComponent(tag)}`);
            if (startDate) queryParams.push(`startDate=${startDate}`);
            if (endDate) queryParams.push(`endDate=${endDate}`);
            if (milestone) queryParams.push(`milestone=true`);
            const res = await axios.get('/api/memories/reminisce?' + queryParams.join('&'), config);

            if (res.data.length === 0) {
                alert("No memories found matching these criteria. Try broadening your story filters!");
            } else {
                setReminisceMemories(res.data);
                const allPhotos = res.data.flatMap(m => m.photos || []);
                setSelectedPhotos(allPhotos.slice(0, 5));

                // Also fetch AI Story Highlights
                const highlightRes = await axios.get('/api/memories/reminisce/highlights?' + queryParams.join('&'), config);
                setHighlights(highlightRes.data);

                if (autoPlay && res.data.length > 0) {
                    setReliveStory({
                        title: tag || "Story Moment",
                        memories: res.data,
                        photos: allPhotos
                    });
                }
            }
        } catch (error) {
            console.error('Error fetching reminisce:', error);
            alert('Failed to boot Story Engine.');
        } finally {
            setLoading(false);
        }
    };

    const handlePlaySavedStory = async (s) => {
        setTag(s.tag || '');
        setStartDate(s.start_date ? s.start_date.split('T')[0] : '');
        setEndDate(s.end_date ? s.end_date.split('T')[0] : '');
        setMilestone(s.is_milestone);

        // Use a slight delay to ensure state updates or pass directly to handleReminisce
        setLoading(true);
        try {
            const config = { headers: { Authorization: `Bearer ${user.token}` } };
            const queryParams = [];
            if (s.tag) queryParams.push(`tag=${encodeURIComponent(s.tag)}`);
            if (s.start_date) queryParams.push(`startDate=${s.start_date.split('T')[0]}`);
            if (s.end_date) queryParams.push(`endDate=${s.end_date.split('T')[0]}`);
            if (s.is_milestone) queryParams.push(`milestone=true`);

            const res = await axios.get('/api/memories/reminisce?' + queryParams.join('&'), config);
            if (res.data.length > 0) {
                const allPhotos = res.data.flatMap(m => m.photos || []);
                setReliveStory({
                    title: s.name,
                    memories: res.data,
                    photos: allPhotos,
                    period: s.tag ? `#${s.tag}` : "Saved Story"
                });
            } else {
                alert("No memories found for this archived story.");
            }
        } catch (err) {
            alert("Failed to relive this story.");
        } finally {
            setLoading(false);
        }
    };

    const togglePhotoSelection = useCallback((photoUrl) => {
        setSelectedPhotos(prev => prev.includes(photoUrl) ? prev.filter(p => p !== photoUrl) : [...prev, photoUrl]);
    }, []);

    const handleSaveSearch = async () => {
        if (!user || (!tag && !startDate && !endDate)) {
            alert("Please specify some filters to archive this story!");
            return;
        }
        const name = prompt("Name this Story Archive (e.g., 'Summer Trip 2024'):", tag || "New Story");
        if (!name) return;

        setIsSavingSearch(true);
        try {
            const config = { headers: { Authorization: `Bearer ${user.token}` } };
            const res = await axios.post('/api/memories/reminisce/save-search', {
                name, tag, startDate, endDate, milestone
            }, config);
            setSavedSearches(prev => [res.data, ...prev]);
            alert('Story parameters archived in your vault! ✨');
            setShowSaved(true); // Automatically switch to Vault to show the result
        } catch (error) {
            console.error('Error saving search:', error);
            alert('Failed to archive story.');
        } finally {
            setIsSavingSearch(false);
        }
    };

    const loadSavedSearch = (s) => {
        setTag(s.tag || '');
        setStartDate(s.start_date ? s.start_date.split('T')[0] : '');
        setEndDate(s.end_date ? s.end_date.split('T')[0] : '');
        setMilestone(s.is_milestone);
        alert(`Loaded: ${s.name}. Click 'Run Engine' to relive!`);
    };

    const handleDeleteSearch = async (id, e) => {
        e.stopPropagation();
        if (!confirm('Forget this saved search?')) return;
        try {
            const config = { headers: { Authorization: `Bearer ${user.token}` } };
            await axios.delete(`/api/memories/reminisce/saved-searches/${id}`, config);
            setSavedSearches(prev => prev.filter(s => s.id !== id));
        } catch (error) {
            console.error('Error deleting search:', error);
        }
    };

    const handleDeleteVideo = async (id) => {
        if (!confirm('Are you sure you want to delete this video?')) return;
        try {
            const config = { headers: { Authorization: `Bearer ${user.token}` } };
            await axios.delete(`/api/memories/reminisce/videos/${id}`, config);
            setSavedVideos(prev => prev.filter(v => v.id !== id));
        } catch (error) {
            console.error('Error deleting video:', error);
        }
    };

    return (
        <div className="py-12 max-w-6xl mx-auto px-4 relative z-0">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-center mb-12 gap-6">
                <div className="flex flex-col items-center md:items-start">
                    <h1 className="text-5xl font-black bg-clip-text text-transparent bg-gradient-to-r from-indigo-500 via-purple-500 to-fuchsia-600 mb-2">
                        Reminisce Engine
                    </h1>
                    <p className="text-slate-500 dark:text-slate-400 font-bold tracking-tight uppercase text-xs flex items-center gap-2">
                        <Sparkles size={12} className="text-violet-500" /> AI-Powered Cinematic Flashbacks
                    </p>
                </div>
                <div className="flex gap-2 p-1.5 bg-indigo-50 dark:bg-slate-800 rounded-2xl border border-indigo-100 dark:border-slate-700 shadow-sm">
                    <button onClick={() => setShowSaved(false)} className={`px-6 py-2.5 rounded-xl font-black text-sm transition-all ${!showSaved ? 'bg-white dark:bg-slate-900 text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-indigo-500'}`}>
                        Story Engine
                    </button>
                    <button onClick={() => setShowSaved(true)} className={`px-6 py-2.5 rounded-xl font-black text-sm transition-all ${showSaved ? 'bg-white dark:bg-slate-900 text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-indigo-500'}`}>
                        Story Vault
                    </button>
                </div>
            </div>

            <AnimatePresence mode="wait">
                {!showSaved ? (
                    <motion.div key="generator" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="grid grid-cols-1 lg:grid-cols-12 gap-10">
                        {/* Controls Column */}
                        <div className="lg:col-span-4 flex flex-col gap-8">
                            {/* Flashback Filter Panel */}
                            <div className="glass-panel p-8 rounded-[2.5rem] border-indigo-500/10 shadow-xl relative overflow-hidden">
                                <div className="relative z-10">
                                    <div className="flex items-center gap-3 mb-6">
                                        <div className="p-3 bg-indigo-600 text-white rounded-2xl shadow-lg shadow-indigo-600/30">
                                            <Sparkles size={24} />
                                        </div>
                                        <h2 className="text-xl font-black">Flashback Source</h2>
                                    </div>
                                    <div className="flex flex-col gap-5 text-left mb-8">
                                        <div>
                                            <label className="block text-[10px] font-black uppercase text-indigo-500 mb-2 ml-1">Specific Vibe / Tag</label>
                                            <div className="relative">
                                                <Tag className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
                                                <input type="text" value={tag} onChange={e => setTag(e.target.value)} placeholder="Travel, Family, Summer..." className="w-full pl-12 pr-4 py-4 rounded-2xl bg-slate-50 dark:bg-slate-900 border-2 border-transparent focus:border-indigo-500 outline-none font-bold transition-all" />
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
                                    <div className="flex flex-col gap-3">
                                        <button onClick={() => handleReminisce(false)} disabled={loading} className="w-full premium-gradient text-white py-5 rounded-[2rem] font-black text-xl shadow-xl shadow-indigo-600/30 flex items-center justify-center gap-3 hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-50">
                                            {loading ? <Loader2 className="animate-spin" /> : <PlayCircle />}
                                            {loading ? 'Booting Engine...' : 'Run Engine'}
                                        </button>
                                        <button onClick={handleSaveSearch} disabled={isSavingSearch} className="w-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 py-3 rounded-2xl font-black text-xs uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-indigo-50 dark:hover:bg-indigo-900/40 hover:text-indigo-600 transition-all">
                                            {isSavingSearch ? <Loader2 className="animate-spin" size={14} /> : <Tag size={14} />}
                                            Archive Story Parameters
                                        </button>
                                    </div>
                                </div>
                                <div className="absolute -bottom-10 -right-10 opacity-5 text-indigo-400 rotate-12"><Clock size={240} /></div>
                            </div>

                            {/* Saved Search Vault */}
                            {savedSearches.length > 0 && (
                                <div className="glass-panel p-6 rounded-[2rem] border border-indigo-100 dark:border-indigo-900 shadow-sm">
                                    <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-4 flex items-center gap-2">
                                        <Clock size={12} /> Saved Flashback Vault
                                    </h3>
                                    <div className="flex flex-col gap-2">
                                        {savedSearches.slice(0, 5).map(s => (
                                            <div
                                                key={s.id}
                                                onClick={() => loadSavedSearch(s)}
                                                className="group flex items-center justify-between p-3 rounded-xl hover:bg-indigo-50 dark:hover:bg-indigo-900/40 cursor-pointer transition-all border border-transparent hover:border-indigo-100 dark:hover:border-indigo-800"
                                            >
                                                <div className="flex items-center gap-3">
                                                    <div className="w-8 h-8 rounded-lg bg-indigo-100 dark:bg-indigo-900 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
                                                        <RefreshCw size={14} />
                                                    </div>
                                                    <div>
                                                        <p className="text-xs font-black line-clamp-1">{s.name}</p>
                                                        <p className="text-[9px] font-bold opacity-40 uppercase tracking-tighter">{s.tag || 'All Memories'}</p>
                                                    </div>
                                                </div>
                                                <button onClick={(e) => handleDeleteSearch(s.id, e)} className="p-2 opacity-0 group-hover:opacity-100 text-rose-400 hover:text-rose-600 transition-all">
                                                    <Trash2 size={14} />
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* AI Wonder info card */}
                            <div className="glass-panel p-6 rounded-[2rem] border border-violet-200 dark:border-violet-900/50 bg-gradient-to-br from-violet-50 to-fuchsia-50 dark:from-violet-950/30 dark:to-fuchsia-950/30">
                                <div className="flex items-center gap-3 mb-3">
                                    <div className="p-2 bg-gradient-to-br from-violet-500 to-fuchsia-500 rounded-xl text-white">
                                        <Wand2 size={18} />
                                    </div>
                                    <h3 className="font-black text-sm text-violet-700 dark:text-violet-300">AI Wonder Mode</h3>
                                </div>
                                <p className="text-xs font-medium text-violet-600 dark:text-violet-400 leading-relaxed">
                                    Click <strong>AI Wonder</strong> on any memory card and Gemini AI will analyze your photo to craft a poetic title &amp; description.
                                </p>
                            </div>


                        </div>

                        {/* Discovery Area */}
                        <div className="lg:col-span-8">
                            {reminisceMemories.length === 0 ? (
                                <div className="h-full flex flex-col items-center justify-center text-center opacity-30 py-20">
                                    <Clock size={120} strokeWidth={1} />
                                    <h2 className="text-2xl font-black mt-6 uppercase tracking-widest">Awaiting Command</h2>
                                    <p className="mt-2 font-medium">Select filters &amp; run the Flashback Engine.</p>
                                </div>
                            ) : (
                                <div className="flex flex-col gap-10">
                                    {/* AI Story Highlights */}
                                    {highlights.length > 0 && (
                                        <div className="mb-2">
                                            <h3 className="text-[10px] font-black text-violet-500 uppercase tracking-widest mb-6 flex items-center gap-2 px-4">
                                                <Star size={12} className="fill-current" /> AI Spotlight: Cluster Stories
                                            </h3>
                                            <div className="flex gap-4 overflow-x-auto pb-8 -mx-4 px-4 scrollbar-hide no-scrollbar snap-x">
                                                {highlights.map((h, i) => (
                                                    <motion.div
                                                        key={h.id}
                                                        initial={{ opacity: 0, scale: 0.9 }}
                                                        animate={{ opacity: 1, scale: 1 }}
                                                        transition={{ delay: i * 0.1 }}
                                                        onClick={() => setReliveStory(h)}
                                                        className="flex-shrink-0 w-48 aspect-[3/4] rounded-[2.5rem] overflow-hidden relative group cursor-pointer shadow-xl snap-start hover:scale-105 transition-transform duration-500"
                                                    >
                                                        <img src={h.coverImage} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" alt={h.title} />
                                                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
                                                        <div className="absolute inset-x-4 bottom-6 text-white text-left">
                                                            <h4 className="font-black text-sm mb-0.5 drop-shadow-md">{h.title}</h4>
                                                            <p className="text-[10px] font-bold opacity-70 drop-shadow-sm">{h.period}</p>
                                                        </div>

                                                    </motion.div>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    <div className="flex justify-between items-center text-slate-500 dark:text-slate-400 font-black text-xs uppercase tracking-widest px-4">
                                        <span>Discovered Moments ({reminisceMemories.length})</span>
                                        <span className="flex items-center gap-1"><Sparkles size={10} className="text-violet-400" /> Click photos → select for video</span>
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                        {reminisceMemories.map((m, idx) => (
                                            <AIMemoryCard key={m.id} m={m} idx={idx} user={user} selectedPhotos={selectedPhotos} onTogglePhoto={togglePhotoSelection} onLike={handleLikeMemory} />
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    </motion.div>
                ) : (
                    <motion.div key="saved" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="flex flex-col gap-10">
                        {savedSearches.length === 0 ? (
                            <div className="flex flex-col items-center justify-center text-center py-32 opacity-30">
                                <Sparkles size={100} strokeWidth={1} />
                                <h2 className="text-2xl font-black mt-6 uppercase tracking-widest">No Archived Stories</h2>
                                <p className="mt-2 font-medium">Archive your search parameters to relive stories instantly.</p>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                                {savedSearches.map((s, idx) => (
                                    <motion.div
                                        key={s.id}
                                        initial={{ opacity: 0, scale: 0.9 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        transition={{ delay: idx * 0.1 }}
                                        className="glass-panel p-6 rounded-[2.5rem] shadow-xl group hover:border-indigo-500/30 transition-all flex flex-col cursor-pointer"
                                        onClick={() => handlePlaySavedStory(s)}
                                    >
                                        <div className="w-full aspect-video rounded-[2rem] bg-indigo-950 flex flex-col items-center justify-center relative overflow-hidden group mb-6">
                                            <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/20 to-fuchsia-500/20" />
                                            <PlayCircle size={48} className="text-white relative z-10 group-hover:scale-110 transition-transform" />
                                            <div className="absolute bottom-4 inset-x-4 text-center z-10">
                                                <div className="px-3 py-1 bg-white/10 backdrop-blur-md rounded-full inline-block">
                                                    <p className="text-[10px] font-black text-white uppercase tracking-widest">Relive this Story</p>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="px-2">
                                            <h3 className="font-black text-xl mb-1 truncate">{s.name}</h3>
                                            <div className="flex gap-2 mb-4">
                                                {s.tag && <span className="text-[9px] font-black px-2 py-0.5 bg-indigo-50 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-400 rounded-lg uppercase">#{s.tag}</span>}
                                                <span className="text-[9px] font-black px-2 py-0.5 bg-slate-100 dark:bg-slate-800 text-slate-500 rounded-lg uppercase">{s.start_date ? 'Custom Range' : 'All Time'}</span>
                                            </div>
                                            <div className="flex justify-between items-center pt-4 border-t border-black/5 dark:border-white/5">
                                                <span className="text-[10px] font-black opacity-30 uppercase tracking-widest flex items-center gap-2"><Clock size={12} /> {new Date(s.created_at || Date.now()).toLocaleDateString()}</span>
                                                <button onClick={(e) => handleDeleteSearch(s.id, e)} className="p-3 text-rose-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-900/20 rounded-2xl transition-all">
                                                    <Trash2 size={18} />
                                                </button>
                                            </div>
                                        </div>
                                    </motion.div>
                                ))}
                            </div>
                        )}
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Relive Story Modal */}
            <AnimatePresence mode="wait">
                {reliveStory && (
                    <StoryViewer
                        story={reliveStory}
                        onClose={() => setReliveStory(null)}
                    />
                )}
            </AnimatePresence>
        </div>
    );
};

export default Reminisce;
