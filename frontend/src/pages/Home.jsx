import { motion } from 'framer-motion';
import { Sparkles, MapPin, Video, Play, Music, Lock, Heart, ChevronRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { useContext, useEffect } from 'react';
import { AuthContext } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

const FeatureCard = ({ icon: Icon, title, description, delay }) => (
    <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.5, delay }}
    >
        <Card className="h-full hover:-translate-y-2 transition-transform duration-300 border-none">
            <CardHeader>
                <div className="w-12 h-12 bg-indigo-500/10 rounded-xl flex items-center justify-center mb-2">
                    <Icon className="text-indigo-600 w-6 h-6" />
                </div>
                <CardTitle className="text-xl font-semibold">{title}</CardTitle>
            </CardHeader>
            <CardContent>
                <p className="text-sm opacity-75 leading-relaxed">{description}</p>
            </CardContent>
        </Card>
    </motion.div>
);

const Home = () => {
    const { user, loading } = useContext(AuthContext);
    const navigate = useNavigate();

    useEffect(() => {
        if (!loading && user) {
            navigate('/timeline', { replace: true });
        }
    }, [user, loading, navigate]);

    return (
        <div className="flex flex-col gap-24 overflow-hidden">
            {/* Hero Section */}
            <section className="relative pt-20 pb-32 flex flex-col items-center text-center">
                <div className="absolute inset-0 bg-gradient-to-b from-indigo-500/5 to-transparent pointer-events-none rounded-3xl" />

                {/* Floating Stickers / Emojis */}
                <motion.div animate={{ y: [0, -20, 0], rotate: [0, 10, -10, 0] }} transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }} className="absolute top-20 left-10 md:left-32 text-6xl drop-shadow-2xl">📸</motion.div>
                <motion.div animate={{ y: [0, 20, 0], rotate: [0, -15, 10, 0] }} transition={{ duration: 6, repeat: Infinity, ease: "easeInOut", delay: 1 }} className="absolute top-40 right-10 md:right-32 text-6xl drop-shadow-2xl">✈️</motion.div>
                <motion.div animate={{ scale: [1, 1.1, 1], rotate: [0, 5, -5, 0] }} transition={{ duration: 4, repeat: Infinity, ease: "easeInOut", delay: 2 }} className="absolute bottom-32 left-20 md:left-48 text-6xl drop-shadow-2xl opacity-80">💭</motion.div>
                <motion.div animate={{ y: [0, -15, 0], rotate: [0, 20, -10, 0] }} transition={{ duration: 5.5, repeat: Infinity, ease: "easeInOut", delay: 0.5 }} className="absolute bottom-20 right-20 md:right-48 text-6xl drop-shadow-2xl opacity-90">💖</motion.div>


                <motion.h1
                    className="text-5xl md:text-7xl font-extrabold tracking-tight mb-6 max-w-4xl relative z-10"
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.7, delay: 0.2 }}
                >
                    Relive Your Life's <br className="hidden md:block" />
                    <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-fuchsia-500">
                        Most Precious Moments
                    </span>
                </motion.h1>

                <motion.p
                    className="text-lg md:text-xl max-w-2xl opacity-80 mb-10 relative z-10"
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.7, delay: 0.4 }}
                >
                    Capture photos, videos, voice notes, and locations. Organize them into beautiful albums, explore your timeline, and let AI recreate your memories into stunning video montages.
                </motion.p>

                <motion.div
                    className="flex flex-col sm:flex-row gap-4 relative z-10"
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.7, delay: 0.6 }}
                >
                    <Link to={user ? "/timeline" : "/register"}>
                        <Button size="lg" className="gap-2 px-10 font-bold">
                            Start Your Journey <ChevronRight size={20} />
                        </Button>
                    </Link>
                </motion.div>
            </section>

            {/* Beautiful Quote Section */}
            <section className="py-16 flex justify-center px-4 relative">
                {/* Floating Quote Stickers */}
                <motion.div animate={{ y: [0, 15, 0], rotate: [0, 15, 0] }} transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }} className="absolute top-10 left-4 md:left-1/4 text-5xl drop-shadow-xl opacity-80 z-0">✨</motion.div>
                <motion.div animate={{ y: [0, -15, 0], rotate: [0, -10, 0] }} transition={{ duration: 6, repeat: Infinity, ease: "easeInOut", delay: 1 }} className="absolute bottom-5 right-4 md:right-1/4 text-5xl drop-shadow-xl opacity-80 z-0">📖</motion.div>
                <motion.div animate={{ scale: [1, 1.2, 1] }} transition={{ duration: 4, repeat: Infinity, ease: "easeInOut", delay: 2 }} className="absolute top-1/2 left-8 text-4xl drop-shadow-lg opacity-60 z-0 hidden md:block">🌟</motion.div>
                <motion.div animate={{ rotate: [0, 360] }} transition={{ duration: 20, repeat: Infinity, ease: "linear" }} className="absolute top-1/2 right-12 text-4xl drop-shadow-lg opacity-60 z-0 hidden md:block">⏳</motion.div>

                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.8 }}
                    className="w-full max-w-4xl relative z-10"
                >
                    <Card className="p-8 md:p-14 rounded-[2.5rem] border-indigo-500/20 shadow-2xl shadow-indigo-500/10 overflow-hidden relative">
                        <div className="absolute -top-10 -right-10 p-8 opacity-5 text-indigo-500 pointer-events-none">
                            <Sparkles size={200} />
                        </div>
                        <p className="text-3xl md:text-5xl font-serif italic text-center leading-relaxed opacity-90 mb-8 bg-clip-text text-transparent bg-gradient-to-br from-indigo-400 to-purple-600">
                            "Memory is the diary that we all carry about with us."
                        </p>
                        <p className="text-center font-bold opacity-70 text-lg md:text-xl uppercase tracking-[0.3em] text-indigo-500">
                            — Oscar Wilde
                        </p>
                    </Card>
                </motion.div>
            </section>

            {/* Features Grid */}
            <section className="pb-24">
                <div className="text-center mb-16">
                    <h2 className="text-3xl font-bold mb-4">Everything You Need To Remember</h2>
                    <p className="opacity-70 max-w-2xl mx-auto">Built with privacy and elegance in mind. A comprehensive toolset to document your life.</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    <FeatureCard
                        icon={MapPin}
                        title="Interactive Memory Map"
                        description="Visualize your journey across the globe. See where you were when you captured that perfect sunset or met your best friend."
                        delay={0.1}
                    />
                    <FeatureCard
                        icon={Video}
                        title="AI Recap Videos"
                        description="Our AI intelligently curates your photos and videos into emotional, cinematic recap montages tailored for you."
                        delay={0.2}
                    />
                    <FeatureCard
                        icon={Music}
                        title="Voice Notes & Audio"
                        description="Sometimes a picture isn't enough. Record voice memos to capture the atmosphere, thoughts, and feelings of the moment."
                        delay={0.3}
                    />
                    <FeatureCard
                        icon={Lock}
                        title="End-to-End Privacy"
                        description="Your memories are yours alone. Enterprise-grade encryption and secure access roles for collaborative albums."
                        delay={0.4}
                    />
                    <FeatureCard
                        icon={Heart}
                        title="Milestone Tracking"
                        description="Highlight major life events. Our smart reminder system nudges you on anniversaries so you can relive the joy."
                        delay={0.5}
                    />
                    <FeatureCard
                        icon={Play}
                        title="Reminisce Engine"
                        description="Feeling nostalgic? Hit 'Reminisce' to get a randomized, weighted selection of past memories to make you smile."
                        delay={0.6}
                    />
                </div>
            </section>
        </div>
    );
};

export default Home;
