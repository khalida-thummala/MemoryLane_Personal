import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import axios from 'axios';
import { Clock, Calendar, MapPin, Loader2, Star, ArrowLeft } from 'lucide-react';
import { motion } from 'framer-motion';
import { getMediaUrl } from '../utils/mediaUtils';

const PublicMemory = () => {
    const { id } = useParams();
    const [memory, setMemory] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchMemory = async () => {
            try {
                // Public endpoint needs no auth headers
                const res = await axios.get(`/api/memories/public/${id}`);
                setMemory(res.data);
            } catch (err) {
                setError(err.response?.data?.message || 'Memory not found or is private.');
            } finally {
                setLoading(false);
            }
        };

        fetchMemory();
    }, [id]);

    if (loading) {
        return (
            <div className="flex justify-center items-center h-screen bg-slate-50 dark:bg-slate-900">
                <Loader2 size={40} className="text-indigo-600 animate-spin" />
            </div>
        );
    }

    if (error || !memory) {
        return (
            <div className="flex flex-col justify-center items-center h-screen bg-slate-50 dark:bg-slate-900 px-4 text-center">
                <div className="w-24 h-24 bg-red-100 rounded-full flex items-center justify-center mb-6 text-red-500">
                    <Clock size={40} />
                </div>
                <h1 className="text-3xl font-bold text-slate-800 dark:text-white mb-4">Memory Unavailable</h1>
                <p className="text-lg text-slate-600 dark:text-slate-400 max-w-md">{error}</p>
                <Link to="/" className="mt-8 px-6 py-3 bg-indigo-600 text-white rounded-xl font-medium shadow-lg hover:bg-indigo-700 transition-colors">
                    Go to MemoryLane
                </Link>
            </div>
        );
    }

    let displayDate = 'Unknown Date';
    if (memory.date) {
        try { displayDate = new Date(memory.date).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' }); } catch (_) { console.error('Date error:', _); }
    }

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-900 py-12 px-4 md:px-0">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="max-w-3xl mx-auto bg-white dark:bg-slate-800 rounded-[2rem] shadow-2xl overflow-hidden border border-gray-100 dark:border-slate-700"
            >
                {/* Header Strip */}
                <div className="bg-indigo-600 px-8 py-6 text-white flex justify-between items-center">
                    <div className="flex items-center gap-2 font-bold text-xl tracking-wide">
                        <Clock className="text-indigo-200" /> MemoryLane
                    </div>
                    {memory.user && <span className="opacity-80 text-sm font-medium">Shared by {memory.user.name}</span>}
                </div>

                <div className="p-8 md:p-12">
                    <div className="flex items-start justify-between mb-6">
                        <h1 className="text-4xl md:text-5xl font-extrabold text-slate-900 dark:text-white leading-tight">
                            {memory.title}
                        </h1>
                        {memory.milestone && (
                            <div className="hidden md:flex items-center gap-1.5 bg-amber-100 text-amber-600 px-4 py-2 rounded-full font-bold shadow-sm border border-amber-200">
                                <Star size={18} fill="currentColor" /> Milestone
                            </div>
                        )}
                    </div>

                    <div className="flex flex-wrap gap-5 text-sm md:text-base font-medium text-slate-500 dark:text-slate-400 mb-8 border-b border-gray-100 dark:border-slate-700 pb-8">
                        <span className="flex items-center gap-2"><Calendar size={18} className="text-indigo-500" /> {displayDate}</span>
                        {memory.locationName && <span className="flex items-center gap-2"><MapPin size={18} className="text-rose-500" /> {memory.locationName}</span>}
                    </div>

                    {memory.photos && memory.photos.length > 0 && (
                        <div className={`grid gap-3 mb-10 ${memory.photos.length === 1 ? 'grid-cols-1' : memory.photos.length === 2 ? 'grid-cols-2' : 'grid-cols-2 md:grid-cols-3'} rounded-2xl overflow-hidden shadow-inner bg-slate-100 dark:bg-slate-900 p-3`}>
                            {memory.photos.map((photo, i) => (
                                <img key={i} src={getMediaUrl(photo)} alt="Memory" className={`w-full object-cover rounded-xl ${memory.photos.length === 1 ? 'h-96' : 'h-48'}`} />
                            ))}
                        </div>
                    )}

                    <div className="prose prose-lg dark:prose-invert max-w-none text-slate-700 dark:text-slate-300 leading-relaxed whitespace-pre-line text-lg">
                        {memory.description}
                    </div>

                    {((memory.videos && memory.videos.length > 0) || (memory.voiceNotes && memory.voiceNotes.length > 0)) && (
                        <div className="mt-10 border-t border-gray-100 dark:border-slate-700 pt-8">
                            <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-4">Media Preserved</h3>
                            <div className="flex flex-col gap-4">
                                {memory.videos?.map((v, i) => <video key={i} src={getMediaUrl(v)} controls className="w-full rounded-2xl shadow-md" />)}
                                {memory.voiceNotes?.map((v, i) => <audio key={i} src={getMediaUrl(v)} controls className="w-full h-14 bg-indigo-50 dark:bg-indigo-900/20 rounded-full px-4" />)}
                            </div>
                        </div>
                    )}
                </div>
            </motion.div>

            <div className="text-center mt-12 mb-4">
                <Link to="/" className="inline-flex items-center gap-2 font-medium text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 transition-colors">
                    <ArrowLeft size={18} /> Create your own MemoryLane
                </Link>
            </div>
        </div>
    );
};

export default PublicMemory;
