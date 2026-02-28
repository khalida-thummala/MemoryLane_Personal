import { useParams } from 'react-router-dom';
import { Calendar, MapPin, Tag } from 'lucide-react';

const MemoryDetail = () => {
    const { id } = useParams();

    return (
        <div className="py-8 max-w-4xl mx-auto">
            <div className="glass-panel p-8 rounded-2xl">
                <h1 className="text-4xl font-bold mb-4">Sample Memory Title</h1>

                <div className="flex flex-wrap gap-4 text-sm opacity-70 mb-8 border-b border-black/10 dark:border-white/10 pb-6">
                    <span className="flex items-center gap-1.5 bg-black/5 dark:bg-white/5 px-3 py-1.5 rounded-full"><Calendar size={16} /> Jan 1, 2026</span>
                    <span className="flex items-center gap-1.5 bg-black/5 dark:bg-white/5 px-3 py-1.5 rounded-full"><MapPin size={16} /> New York City</span>
                </div>

                <p className="text-lg leading-relaxed mb-10 opacity-90">
                    This is a detailed description of a memory. It captures the essence, the feelings, and the profound events that occurred on this special day.
                </p>

                <div className="grid grid-cols-2 gap-4 mb-8">
                    <div className="aspect-video bg-black/5 dark:bg-white/5 rounded-xl flex items-center justify-center">Image Placeholder</div>
                    <div className="aspect-video bg-black/5 dark:bg-white/5 rounded-xl flex items-center justify-center">Image Placeholder</div>
                </div>

                <div className="flex gap-2 mb-4">
                    <span className="flex items-center gap-1 text-xs bg-primary/10 text-primary px-2.5 py-1 rounded-full font-medium">
                        <Tag size={12} /> Vacation
                    </span>
                    <span className="flex items-center gap-1 text-xs bg-primary/10 text-primary px-2.5 py-1 rounded-full font-medium">
                        <Tag size={12} /> Family
                    </span>
                </div>
            </div>
        </div>
    );
};

export default MemoryDetail;
