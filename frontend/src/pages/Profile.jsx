import { LogOut, Settings, User, Download, Shield, X, Check, Loader } from 'lucide-react';
import { useContext, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { AuthContext } from '../context/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';

const Profile = () => {
    const { user, logout, updateUser } = useContext(AuthContext);
    const navigate = useNavigate();
    const [exporting, setExporting] = useState(false);

    const handleProfileLogout = async () => {
        await logout();
        navigate('/', { replace: true });
    };

    // Modals
    const [isSettingsOpen, setIsSettingsOpen] = useState(false);
    const [isPrivacyOpen, setIsPrivacyOpen] = useState(false);

    // Form states
    const [newUsername, setNewUsername] = useState(user?.name || '');
    const [isUpdatingProfile, setIsUpdatingProfile] = useState(false);

    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);
    const [passwordError, setPasswordError] = useState('');

    const handleExport = async () => {
        if (!user) return;
        setExporting(true);
        try {
            const config = {
                headers: { Authorization: `Bearer ${user.token}` },
                responseType: 'blob'
            };
            const response = await axios.get('/api/export/zip', config);

            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', 'memorylane_export.zip');
            document.body.appendChild(link);
            link.click();
            link.remove();
        } catch (error) {
            console.error('Export failed:', error);
            alert('Failed to export data. Please try again later.');
        } finally {
            setExporting(false);
        }
    };

    const handleUpdateProfile = async (e) => {
        e.preventDefault();
        if (!newUsername.trim()) return;

        setIsUpdatingProfile(true);
        try {
            const config = { headers: { Authorization: `Bearer ${user.token}` } };
            // Send both provided fields as username and full_name to satisfy display priorities
            const { data } = await axios.put('/api/auth/profile', {
                username: newUsername,
                full_name: newUsername
            }, config);

            // Re-map the response to the context structure
            if (updateUser) {
                updateUser({
                    ...user,
                    ...data,
                    name: data.full_name || data.username || newUsername
                });
            }

            alert('Profile updated successfully!');
            setIsSettingsOpen(false);
        } catch (error) {
            console.error('Update failed:', error);
            alert(error.response?.data?.message || 'Failed to update profile.');
        } finally {
            setIsUpdatingProfile(false);
        }
    };

    const handleUpdatePassword = async (e) => {
        e.preventDefault();
        setPasswordError('');

        if (newPassword !== confirmPassword) {
            return setPasswordError('Passwords do not match');
        }
        if (newPassword.length < 6) {
            return setPasswordError('Password must be at least 6 characters');
        }

        setIsUpdatingPassword(true);
        try {
            const config = { headers: { Authorization: `Bearer ${user.token}` } };
            await axios.put('/api/auth/password', { newPassword }, config);

            alert('Password updated successfully!');
            setIsPrivacyOpen(false);
            setNewPassword('');
            setConfirmPassword('');
        } catch (error) {
            console.error('Password update failed:', error);
            setPasswordError(error.response?.data?.message || 'Failed to update password.');
        } finally {
            setIsUpdatingPassword(false);
        }
    };

    return (
        <div className="py-12 max-w-3xl mx-auto w-full relative">

            {/* Gentle Floating Stickers */}
            <motion.div animate={{ y: [0, -10, 0], rotate: [0, 5, 0] }} transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }} className="absolute top-10 right-10 text-5xl drop-shadow-lg opacity-80 z-0 hidden md:block">👑</motion.div>
            <motion.div animate={{ y: [0, 10, 0], rotate: [0, -5, 0] }} transition={{ duration: 5, repeat: Infinity, ease: "easeInOut", delay: 1 }} className="absolute bottom-20 left-4 text-5xl drop-shadow-lg opacity-80 z-0 hidden md:block">🔒</motion.div>


            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5 }}
                className="glass-panel p-8 md:p-12 rounded-3xl text-center shadow-xl shadow-indigo-500/10 border-indigo-500/20 relative z-10"
            >
                <div className="absolute top-0 right-0 w-full h-32 bg-gradient-to-br from-indigo-500/10 to-fuchsia-500/10 rounded-t-3xl border-b border-indigo-500/10"></div>

                <div className="w-28 h-28 bg-white dark:bg-slate-800 border-4 border-indigo-500/30 rounded-full mx-auto flex items-center justify-center mb-6 shadow-xl relative z-20">
                    <User className="text-indigo-600 w-14 h-14" />
                </div>

                <h1 className="text-3xl font-bold mb-2 text-indigo-600 dark:text-indigo-400 capitalize">{user?.name || "Explorer"}</h1>
                <p className="opacity-70 mb-8 font-medium">{user?.email || "No email provided"}</p>

                <div className="grid gap-4 mb-8 text-left max-w-xl mx-auto">
                    <div onClick={() => { setNewUsername(user?.name || ''); setIsSettingsOpen(true); }} className="glass-panel p-5 rounded-2xl flex items-center justify-between cursor-pointer hover:border-indigo-500/50 transition-all group">
                        <span className="font-semibold flex items-center gap-3 text-lg"><Settings className="text-gray-400 group-hover:text-indigo-500 transition-colors" size={24} /> Account Settings</span>
                        <span className="text-xs font-bold px-3 py-1 bg-gray-100 dark:bg-slate-800 rounded-full opacity-50">Manage</span>
                    </div>
                    <div onClick={() => setIsPrivacyOpen(true)} className="glass-panel p-5 rounded-2xl flex items-center justify-between cursor-pointer hover:border-indigo-500/50 transition-all group">
                        <span className="font-semibold flex items-center gap-3 text-lg"><Shield className="text-gray-400 group-hover:text-indigo-500 transition-colors" size={24} /> Privacy & Security</span>
                        <span className="text-xs font-bold px-3 py-1 bg-gray-100 dark:bg-slate-800 rounded-full opacity-50">Secure</span>
                    </div>
                    <div onClick={handleExport} className={`glass-panel p-5 rounded-2xl flex items-center justify-between cursor-pointer hover:border-indigo-500/50 transition-all group ${exporting ? 'opacity-50 pointer-events-none' : ''}`}>
                        <span className="font-semibold flex items-center gap-3 text-lg"><Download className="text-gray-400 group-hover:text-indigo-500 transition-colors" size={24} /> {exporting ? 'Exporting...' : 'Export Data (.ZIP)'}</span>
                        <span className="text-xs font-bold px-3 py-1 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 rounded-full">New</span>
                    </div>

                    <div className="w-full h-px bg-gray-200 dark:bg-slate-800 my-4"></div>

                    <button onClick={handleProfileLogout} className="w-full p-5 rounded-2xl flex items-center justify-center cursor-pointer bg-red-500/10 hover:bg-red-500/20 text-red-500 transition-all group border border-transparent hover:border-red-500/30">
                        <span className="font-bold flex items-center gap-3 text-lg"><LogOut className="group-hover:-translate-x-1 transition-transform" size={24} /> Logout Securely</span>
                    </button>
                </div>
            </motion.div>

            {/* Account Settings Modal */}
            <AnimatePresence>
                {isSettingsOpen && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                        <motion.div
                            initial={{ scale: 0.9, y: 20, opacity: 0 }}
                            animate={{ scale: 1, y: 0, opacity: 1 }}
                            exit={{ scale: 0.9, y: 20, opacity: 0 }}
                            className="bg-white dark:bg-slate-900 rounded-3xl w-full max-w-md p-6 shadow-2xl relative"
                        >
                            <button
                                onClick={() => setIsSettingsOpen(false)}
                                className="absolute top-4 right-4 p-2 rounded-full hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors"
                            >
                                <X size={20} className="text-slate-500" />
                            </button>
                            <h2 className="text-2xl font-bold mb-6 text-indigo-600 dark:text-indigo-400">Account Settings</h2>

                            <form onSubmit={handleUpdateProfile} className="flex flex-col gap-4 text-left">
                                <div>
                                    <label className="block text-sm font-medium mb-1 opacity-80">Username / Display Name</label>
                                    <input
                                        type="text"
                                        value={newUsername}
                                        onChange={(e) => setNewUsername(e.target.value)}
                                        className="w-full px-4 py-3 rounded-xl bg-gray-50 dark:bg-slate-800 border-none focus:ring-2 focus:ring-indigo-500/50 outline-none"
                                        placeholder="Enter your name"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium mb-1 opacity-80">Email</label>
                                    <input
                                        type="email"
                                        value={user?.email || ''}
                                        disabled
                                        className="w-full px-4 py-3 rounded-xl bg-gray-100 dark:bg-slate-800/50 border-none outline-none opacity-60 cursor-not-allowed"
                                    />
                                    <p className="text-xs mt-1 opacity-50">Email cannot be changed directly.</p>
                                </div>
                                <button
                                    type="submit"
                                    disabled={isUpdatingProfile}
                                    className="mt-4 w-full py-3 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-600/30 font-bold flex items-center justify-center gap-2"
                                >
                                    {isUpdatingProfile ? <><Loader className="animate-spin" size={20} /> Updating...</> : 'Save Changes'}
                                </button>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* Privacy & Security Modal */}
            <AnimatePresence>
                {isPrivacyOpen && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                        <motion.div
                            initial={{ scale: 0.9, y: 20, opacity: 0 }}
                            animate={{ scale: 1, y: 0, opacity: 1 }}
                            exit={{ scale: 0.9, y: 20, opacity: 0 }}
                            className="bg-white dark:bg-slate-900 rounded-3xl w-full max-w-md p-6 shadow-2xl relative"
                        >
                            <button
                                onClick={() => { setIsPrivacyOpen(false); setNewPassword(''); setConfirmPassword(''); setPasswordError(''); }}
                                className="absolute top-4 right-4 p-2 rounded-full hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors"
                            >
                                <X size={20} className="text-slate-500" />
                            </button>
                            <h2 className="text-2xl font-bold mb-6 text-indigo-600 dark:text-indigo-400">Privacy & Security</h2>

                            <form onSubmit={handleUpdatePassword} className="flex flex-col gap-4 text-left">
                                <div>
                                    <label className="block text-sm font-medium mb-1 opacity-80">New Password</label>
                                    <input
                                        type="password"
                                        value={newPassword}
                                        onChange={(e) => setNewPassword(e.target.value)}
                                        className="w-full px-4 py-3 rounded-xl bg-gray-50 dark:bg-slate-800 border-none focus:ring-2 focus:ring-indigo-500/50 outline-none"
                                        placeholder="••••••••"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium mb-1 opacity-80">Confirm New Password</label>
                                    <input
                                        type="password"
                                        value={confirmPassword}
                                        onChange={(e) => setConfirmPassword(e.target.value)}
                                        className="w-full px-4 py-3 rounded-xl bg-gray-50 dark:bg-slate-800 border-none focus:ring-2 focus:ring-indigo-500/50 outline-none"
                                        placeholder="••••••••"
                                        required
                                    />
                                </div>
                                {passwordError && <p className="text-red-500 text-sm">{passwordError}</p>}
                                <button
                                    type="submit"
                                    disabled={isUpdatingPassword}
                                    className="mt-4 w-full py-3 bg-gray-900 dark:bg-white text-white dark:text-slate-900 rounded-xl hover:bg-black dark:hover:bg-gray-100 transition-colors shadow-lg font-bold flex items-center justify-center gap-2"
                                >
                                    {isUpdatingPassword ? <><Loader className="animate-spin" size={20} /> Updating...</> : 'Update Password'}
                                </button>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default Profile;
