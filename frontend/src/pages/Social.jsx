import { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import { Users, UserPlus, UserMinus, Check, X, Search, Loader, UserCheck, Heart, User } from 'lucide-react';
import { AuthContext } from '../context/AuthContext';

const Social = () => {
    const { user } = useContext(AuthContext);
    const [friends, setFriends] = useState([]);
    const [pendingRequests, setPendingRequests] = useState([]);
    const [sentRequests, setSentRequests] = useState([]);
    const [searchResults, setSearchResults] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [searching, setSearching] = useState(false);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('friends'); // 'friends', 'requests', 'search'
    const [requestFilter, setRequestFilter] = useState('received'); // 'received', 'sent'

    useEffect(() => {
        if (user) {
            fetchFriends();
            fetchPendingRequests();
            fetchSentRequests();
        }
    }, [user]);

    const fetchFriends = async () => {
        try {
            const config = { headers: { Authorization: `Bearer ${user.token}` } };
            const { data } = await axios.get('/api/friends', config);
            setFriends(data);
        } catch (err) {
            console.error('Error fetching friends:', err);
        } finally {
            setLoading(false);
        }
    };

    const fetchPendingRequests = async () => {
        try {
            const config = { headers: { Authorization: `Bearer ${user.token}` } };
            const { data } = await axios.get('/api/friends/pending', config);
            setPendingRequests(data);
        } catch (err) {
            console.error('Error fetching requests:', err);
        }
    };

    const fetchSentRequests = async () => {
        try {
            const config = { headers: { Authorization: `Bearer ${user.token}` } };
            const { data } = await axios.get('/api/friends/sent', config);
            setSentRequests(data);
        } catch (err) {
            console.error('Error fetching sent requests:', err);
        }
    };

    const handleSearch = async (e) => {
        const val = e.target.value;
        setSearchTerm(val);
        if (val.length < 2) {
            setSearchResults([]);
            return;
        }

        setSearching(true);
        try {
            const config = { headers: { Authorization: `Bearer ${user.token}` } };
            const { data } = await axios.get(`/api/auth/users/search?search=${encodeURIComponent(val)}`, config);
            setSearchResults(data);
        } catch (err) {
            console.error('Search failed:', err);
        } finally {
            setSearching(false);
        }
    };

    const sendRequest = async (userId) => {
        try {
            const config = { headers: { Authorization: `Bearer ${user.token}` } };
            await axios.post(`/api/friends/request/${userId}`, {}, config);
            alert('Friend request sent!');
            // Update search results to show requested
            setSearchResults(searchResults.map(u => u.id === userId ? { ...u, requested: true } : u));
        } catch (err) {
            alert(err.response?.data?.message || 'Failed to send request');
        }
    };

    const handleRequest = async (requestId, action) => {
        try {
            const config = { headers: { Authorization: `Bearer ${user.token}` } };
            await axios.post(`/api/friends/${action}/${requestId}`, {}, config);

            if (action === 'accept' || action === 'reject') {
                setPendingRequests(pendingRequests.filter(r => r.id !== requestId));
                if (action === 'accept') fetchFriends();
            } else if (action === 'cancel') {
                setSentRequests(sentRequests.filter(r => r.id !== requestId));
            }
        } catch (err) {
            console.error(`Failed to ${action} request:`, err);
        }
    };

    const getRequestsToDisplay = () => {
        return requestFilter === 'received' ? pendingRequests : sentRequests;
    };

    return (
        <div className="py-8 max-w-4xl mx-auto px-4">
            <div className="flex justify-between items-center mb-10">
                <h1 className="text-3xl font-bold flex items-center gap-3 text-indigo-600">
                    <Users size={32} /> Social Circle
                </h1>
            </div>

            {/* Tabs */}
            <div className="flex gap-4 mb-8 bg-gray-100 dark:bg-slate-800 p-1.5 rounded-2xl w-fit">
                {[
                    { id: 'friends', label: 'Friends', icon: Users, count: friends.length },
                    { id: 'requests', label: 'Requests', icon: UserCheck, count: pendingRequests.length + sentRequests.length },
                    { id: 'search', label: 'Find People', icon: Search, count: 0 }
                ].map(tab => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`px-6 py-2.5 rounded-xl font-bold transition-all flex items-center gap-2 ${activeTab === tab.id ? 'bg-white dark:bg-slate-700 shadow-md text-indigo-600' : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'}`}
                    >
                        <tab.icon size={18} />
                        {tab.label}
                        {tab.count > 0 && <span className="bg-indigo-600 text-white text-[10px] w-5 h-5 flex items-center justify-center rounded-full ml-1">{tab.count}</span>}
                    </button>
                ))}
            </div>

            <AnimatePresence mode="wait">
                <motion.div
                    key={activeTab}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="min-h-[400px]"
                >
                    {activeTab === 'friends' && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {friends.length === 0 ? (
                                <div className="col-span-full py-20 text-center opacity-50">
                                    <Users size={48} className="mx-auto mb-4" />
                                    <p>Your social circle is empty. Start finding people!</p>
                                </div>
                            ) : friends.map(friend => {
                                const displayName = friend.username || 'User';
                                return (
                                    <div key={friend.id} className="glass-panel p-4 rounded-3xl flex items-center gap-4">
                                        <div className="w-14 h-14 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 font-bold text-xl overflow-hidden">
                                            {friend.avatar_url ? (
                                                <img src={friend.avatar_url} alt={displayName} className="w-full h-full object-cover" />
                                            ) : (
                                                displayName.charAt(0).toUpperCase()
                                            )}
                                        </div>
                                        <div className="flex-1">
                                            <p className="font-bold text-lg">{displayName}</p>
                                            <p className="text-sm opacity-60">@{friend.username}</p>
                                        </div>
                                        <div className="flex gap-2">
                                            <button className="p-2.5 rounded-xl bg-gray-50 dark:bg-slate-700 text-gray-400 hover:text-indigo-600 transition-colors">
                                                <Heart size={18} />
                                            </button>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}

                    {activeTab === 'requests' && (
                        <div className="space-y-6">
                            <div className="flex justify-center gap-4 bg-gray-50 dark:bg-slate-800 p-2 rounded-2xl w-fit mx-auto border border-black/5 dark:border-white/5">
                                <button
                                    onClick={() => setRequestFilter('received')}
                                    className={`px-5 py-2 rounded-xl transition-all font-semibold ${requestFilter === 'received' ? 'bg-white dark:bg-slate-700 shadow-sm text-indigo-600' : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'}`}
                                >
                                    Requested Invitations ({pendingRequests.length})
                                </button>
                                <button
                                    onClick={() => setRequestFilter('sent')}
                                    className={`px-5 py-2 rounded-xl transition-all font-semibold ${requestFilter === 'sent' ? 'bg-white dark:bg-slate-700 shadow-sm text-indigo-600' : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'}`}
                                >
                                    Initiations Sent ({sentRequests.length})
                                </button>
                            </div>

                            <div className="space-y-4">
                                {getRequestsToDisplay().length === 0 ? (
                                    <div className="py-20 text-center opacity-50">
                                        <UserCheck size={48} className="mx-auto mb-4" />
                                        <p>No {requestFilter === 'received' ? 'pending' : 'sent'} friend requests found.</p>
                                    </div>
                                ) : getRequestsToDisplay().map(req => {
                                    const profileInfo = req.profiles;
                                    const displayName = profileInfo?.username || 'User';

                                    return (
                                        <div key={req.id} className="glass-panel p-5 rounded-[2rem] flex items-center gap-6">
                                            <div className="w-14 h-14 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-500 flex items-center justify-center text-white font-bold text-xl overflow-hidden shadow-md">
                                                {profileInfo?.avatar_url ? (
                                                    <img src={profileInfo.avatar_url} alt={displayName} className="w-full h-full object-cover" />
                                                ) : (
                                                    displayName.charAt(0).toUpperCase()
                                                )}
                                            </div>
                                            <div className="flex-1">
                                                <p className="font-bold text-lg">{displayName}</p>
                                                <p className="text-xs opacity-60">
                                                    {requestFilter === 'received' ? 'wants to join your social circle' : 'waiting for them to accept'}
                                                </p>
                                            </div>
                                            <div className="flex gap-2">
                                                {requestFilter === 'received' ? (
                                                    <>
                                                        <button
                                                            onClick={() => handleRequest(req.id, 'accept')}
                                                            className="px-5 py-2 bg-indigo-600 text-white rounded-xl font-bold flex items-center gap-2 hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-500/30 text-sm"
                                                        >
                                                            <Check size={16} /> Accept
                                                        </button>
                                                        <button
                                                            onClick={() => handleRequest(req.id, 'reject')}
                                                            className="px-5 py-2 bg-gray-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 rounded-xl font-bold flex items-center gap-2 hover:bg-gray-200 dark:hover:bg-slate-700 transition-colors text-sm"
                                                        >
                                                            <X size={16} /> Decline
                                                        </button>
                                                    </>
                                                ) : (
                                                    <button
                                                        onClick={() => handleRequest(req.id, 'cancel')}
                                                        className="px-5 py-2 bg-red-50 text-red-500 rounded-xl font-bold flex items-center gap-2 hover:bg-red-100 transition-colors text-sm"
                                                    >
                                                        <X size={16} /> Cancel Request
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}

                    {activeTab === 'search' && (
                        <div className="max-w-2xl mx-auto">
                            <div className="relative mb-8">
                                <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                                <input
                                    type="text"
                                    placeholder="Search by name or email..."
                                    value={searchTerm}
                                    onChange={handleSearch}
                                    className="w-full pl-14 pr-6 py-4 bg-white dark:bg-slate-800 border-none rounded-[1.5rem] shadow-xl outline-none focus:ring-2 focus:ring-indigo-500/50"
                                />
                                {searching && <div className="absolute right-5 top-1/2 -translate-y-1/2"><Loader className="animate-spin text-indigo-600" size={20} /></div>}
                            </div>

                            <div className="space-y-4">
                                {searchResults.map(u => {
                                    const isFriend = friends.some(f => f.id === u.id);
                                    const displayName = u.username || 'User';
                                    return (
                                        <div key={u.id} className="glass-panel p-5 rounded-[1.5rem] flex items-center gap-4">
                                            <div className="w-12 h-12 rounded-full bg-gray-100 dark:bg-slate-700 flex items-center justify-center text-indigo-600 font-bold overflow-hidden">
                                                {u.avatar_url ? (
                                                    <img src={u.avatar_url} alt={displayName} className="w-full h-full object-cover" />
                                                ) : (
                                                    displayName.charAt(0).toUpperCase()
                                                )}
                                            </div>
                                            <div className="flex-1">
                                                <p className="font-bold">{displayName}</p>
                                                <p className="text-xs opacity-60">@{u.username}</p>
                                            </div>
                                            {isFriend ? (
                                                <span className="text-xs font-bold text-green-500 flex items-center gap-1 bg-green-50 dark:bg-green-900/20 px-3 py-1.5 rounded-lg">
                                                    <UserCheck size={14} /> Friends
                                                </span>
                                            ) : u.requested ? (
                                                <span className="text-xs font-bold text-amber-500 flex items-center gap-1 bg-amber-50 dark:bg-amber-900/20 px-3 py-1.5 rounded-lg">
                                                    <Loader size={12} className="animate-spin" /> Pending
                                                </span>
                                            ) : (
                                                <button
                                                    onClick={() => sendRequest(u.id)}
                                                    className="px-4 py-2 bg-indigo-50 dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 rounded-lg text-sm font-bold flex items-center gap-2 hover:bg-indigo-600 hover:text-white transition-all"
                                                >
                                                    <UserPlus size={16} /> Add Friend
                                                </button>
                                            )}
                                        </div>
                                    );
                                })}
                                {searchTerm.length > 1 && searchResults.length === 0 && !searching && (
                                    <div className="text-center py-10 opacity-50">No users found for "{searchTerm}"</div>
                                )}
                            </div>
                        </div>
                    )}
                </motion.div>
            </AnimatePresence>
        </div>
    );
};

export default Social;
