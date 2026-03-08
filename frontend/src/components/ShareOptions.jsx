import { motion, AnimatePresence } from 'framer-motion';
import { X, Send, Instagram, Mail, Download, Share2 } from 'lucide-react';

const ShareOptions = ({ url, title, imageUrl, onClose, onExportOverride }) => {
    const encodedUrl = encodeURIComponent(url);
    const encodedTitle = encodeURIComponent(title || 'Check out this memory on MemoryLane!');

    const shareLinks = [
        {
            name: 'WhatsApp',
            icon: <Send size={20} />,
            color: 'bg-green-500',
            action: () => window.open(`https://api.whatsapp.com/send?text=${encodedTitle}%20${encodedUrl}`, '_blank')
        },
        {
            name: 'Instagram',
            icon: <Instagram size={20} />,
            color: 'bg-gradient-to-tr from-yellow-400 via-red-500 to-purple-600',
            action: () => {
                navigator.clipboard.writeText(url);
                alert('Link copied! You can now paste it in your Instagram story or DM. 📸');
            }
        },
        {
            name: 'Email',
            icon: <Mail size={20} />,
            color: 'bg-blue-500',
            action: () => window.open(`mailto:?subject=${encodedTitle}&body=Check out this memory: ${encodedUrl}`, '_blank')
        },
        {
            name: 'Export Image',
            icon: <Download size={20} />,
            color: 'bg-slate-800',
            action: async () => {
                if (onExportOverride) {
                    onExportOverride();
                    onClose();
                    return;
                }
                if (imageUrl) {
                    try {
                        const response = await fetch(imageUrl);
                        const blob = await response.blob();
                        const blobUrl = URL.createObjectURL(blob);

                        const link = document.createElement('a');
                        link.href = blobUrl;
                        link.download = `memory-${Date.now()}.jpg`;
                        document.body.appendChild(link);
                        link.click();
                        document.body.removeChild(link);
                        URL.revokeObjectURL(blobUrl);
                    } catch (err) {
                        console.warn('Direct download failed, attempting new tab:', err);
                        window.open(imageUrl, '_blank');
                    }
                } else {
                    alert('No image to export.');
                }
            }
        }
    ];

    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="p-6 bg-white dark:bg-slate-900 rounded-[2.5rem] shadow-2xl border border-black/5 dark:border-white/10 w-full max-w-sm mx-auto"
            onClick={(e) => e.stopPropagation()}
        >
            <div className="flex justify-between items-center mb-6">
                <h3 className="font-black text-xl flex items-center gap-2">
                    <Share2 size={24} className="text-indigo-600" />
                    Share Memory
                </h3>
                <button onClick={onClose} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors">
                    <X size={20} />
                </button>
            </div>

            <div className="grid grid-cols-2 gap-4">
                {shareLinks.map((option) => (
                    <button
                        key={option.name}
                        onClick={option.action}
                        className="flex flex-col items-center gap-3 p-4 rounded-3xl hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-all group"
                    >
                        <div className={`w-12 h-12 ${option.color} text-white rounded-2xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform`}>
                            {option.icon}
                        </div>
                        <span className="text-xs font-black uppercase tracking-widest text-slate-600 dark:text-slate-400">{option.name}</span>
                    </button>
                ))}
            </div>

            <div className="mt-6 pt-6 border-t border-black/5 dark:border-white/5">
                <p className="text-[10px] font-black uppercase text-slate-400 mb-2 ml-1">Or copy link</p>
                <div className="flex gap-2">
                    <input
                        readOnly
                        value={url}
                        className="flex-1 bg-slate-50 dark:bg-slate-800 rounded-xl px-4 py-3 text-xs font-bold outline-none border border-transparent focus:border-indigo-500"
                    />
                    <button
                        onClick={() => {
                            navigator.clipboard.writeText(url);
                            alert('Copied to clipboard!');
                        }}
                        className="px-4 py-3 bg-indigo-600 text-white rounded-xl text-xs font-black uppercase"
                    >
                        Copy
                    </button>
                </div>
            </div>
        </motion.div>
    );
};

export default ShareOptions;
