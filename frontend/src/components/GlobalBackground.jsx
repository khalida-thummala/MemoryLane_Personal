import { motion } from 'framer-motion';
import { Heart, Star, Cloud, Moon, Sun } from 'lucide-react';

const GlobalBackground = () => {
    return (
        <div className="fixed inset-0 pointer-events-none z-[-1] overflow-hidden opacity-20 dark:opacity-10">
            {/* Top Right Sticker */}
            <motion.div
                animate={{
                    rotate: [0, 10, -10, 0],
                    y: [0, -10, 10, 0]
                }}
                transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
                className="absolute top-10 right-10 text-indigo-400"
            >
                <Star size={120} fill="currentColor" className="blur-[1px]" />
            </motion.div>

            {/* Bottom Left Sticker */}
            <motion.div
                animate={{
                    scale: [1, 1.1, 0.9, 1],
                    rotate: [0, -5, 5, 0]
                }}
                transition={{ duration: 12, repeat: Infinity, ease: "easeInOut" }}
                className="absolute bottom-20 left-10 text-rose-300"
            >
                <Heart size={150} fill="currentColor" className="blur-[1px]" />
            </motion.div>

            {/* Mid Left Sticker */}
            <motion.div
                animate={{
                    x: [0, 20, -20, 0],
                }}
                transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
                className="absolute top-[40%] left-[-30px] text-amber-200"
            >
                <Sun size={80} fill="currentColor" />
            </motion.div>

            {/* Mid Right Sticker */}
            <motion.div
                animate={{
                    x: [0, -20, 20, 0],
                }}
                transition={{ duration: 18, repeat: Infinity, ease: "linear" }}
                className="absolute top-[60%] right-[-20px] text-slate-300"
            >
                <Cloud size={100} fill="currentColor" />
            </motion.div>

            {/* Glowing Blobs */}
            <div className="absolute top-[20%] left-[30%] w-64 h-64 bg-indigo-500/20 rounded-full blur-[100px]"></div>
            <div className="absolute bottom-[30%] right-[20%] w-96 h-96 bg-purple-500/10 rounded-full blur-[120px]"></div>
        </div>
    );
};

export default GlobalBackground;
