import { useState, useEffect, useRef } from 'react';
import { Bell, UserPlus, Check, X, Clock, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';

const NotificationDropdown = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [notifications, setNotifications] = useState([]);
    const dropdownRef = useRef(null);

    const fetchNotifications = async () => {
        try {
            const res = await axios.get('/api/friends/notifications');
            setNotifications(res.data);
        } catch (error) {
            console.error('Error fetching notifications:', error);
        }
    };

    useEffect(() => {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        fetchNotifications();
        const interval = setInterval(fetchNotifications, 30000); // Poll every 30s
        return () => clearInterval(interval);
    }, []);

    const markAsRead = async (id) => {
        try {
            await axios.put(`/api/friends/notifications/${id}`);
            setNotifications(notifications.map(n => n.id === id ? { ...n, is_read: true } : n));
        } catch (error) {
            console.error('Error marking notification as read:', error);
        }
    };

    const unreadCount = notifications.filter(n => !n.is_read).length;

    // Close when clicking outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    return (
        <div className="relative" ref={dropdownRef}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="p-2.5 rounded-2xl hover:bg-black/5 dark:hover:bg-white/10 transition-all relative group"
            >
                <Bell size={22} className={`${unreadCount > 0 ? 'text-indigo-600 dark:text-indigo-400 animate-pulse' : 'text-slate-500'}`} />
                {unreadCount > 0 && (
                    <span className="absolute top-2 right-2 flex h-3 w-3">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-3 w-3 bg-rose-500"></span>
                    </span>
                )}
            </button>

            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: 10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 10, scale: 0.95 }}
                        className="absolute right-0 mt-4 w-80 md:w-96 glass-panel rounded-3xl shadow-2xl border border-black/5 dark:border-white/10 overflow-hidden z-[200]"
                    >
                        <div className="p-6 border-b border-black/5 dark:border-white/10 bg-indigo-50/50 dark:bg-slate-800/50">
                            <h3 className="font-black text-xl flex items-center gap-2">
                                <Sparkles size={18} className="text-indigo-600" />
                                Notifications
                            </h3>
                        </div>

                        <div className="max-h-[400px] overflow-y-auto custom-scrollbar">
                            {notifications.length === 0 ? (
                                <div className="p-12 text-center opacity-40">
                                    <Bell className="mx-auto mb-4" size={40} />
                                    <p className="font-bold text-sm">Quiet as a graveyard...</p>
                                </div>
                            ) : (
                                <div className="divide-y divide-black/5 dark:divide-white/5">
                                    {notifications.map((n) => (
                                        <div
                                            key={n.id}
                                            className={`p-5 transition-colors flex gap-4 ${n.is_read ? 'opacity-80' : 'bg-indigo-50/30 dark:bg-indigo-900/10'}`}
                                            onClick={() => markAsRead(n.id)}
                                        >
                                            <div className="h-12 w-12 rounded-2xl bg-indigo-100 dark:bg-slate-800 flex items-center justify-center flex-shrink-0 text-indigo-600">
                                                {n.type === 'friend_request' ? <UserPlus size={24} /> : <Check size={24} />}
                                            </div>
                                            <div className="flex-1">
                                                <p className={`text-sm leading-snug mb-2 ${n.is_read ? 'text-slate-600 dark:text-slate-400' : 'text-slate-900 dark:text-white font-bold'}`}>
                                                    {n.content}
                                                </p>
                                                <span className="text-[10px] font-black uppercase text-slate-400 flex items-center gap-1">
                                                    <Clock size={10} /> {new Date(n.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                </span>
                                            </div>
                                            {!n.is_read && (
                                                <div className="h-2 w-2 rounded-full bg-indigo-600 mt-2"></div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        <div className="p-4 text-center border-t border-black/5 dark:border-white/10 bg-slate-50 dark:bg-slate-900/50">
                            <button
                                onClick={() => setNotifications(notifications.map(n => ({ ...n, is_read: true })))}
                                className="text-xs font-black text-indigo-600 uppercase tracking-widest hover:underline"
                            >
                                Mark all as read
                            </button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default NotificationDropdown;
