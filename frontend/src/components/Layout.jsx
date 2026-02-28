import { Link, useNavigate } from 'react-router-dom';
import { Sun, Moon, LogIn, UserPlus, Menu, X, Home, Clock, Image, Map as ReminisceIcon, User, LogOut, Globe, Users } from 'lucide-react';
import { useContext, useState } from 'react';
import { AuthContext } from '../context/AuthContext';
import { ThemeContext } from '../context/ThemeContext';
import GlobalBackground from './GlobalBackground';
import NotificationDropdown from './NotificationDropdown';

const Layout = ({ children }) => {
    const { user, logout, loading: authLoading } = useContext(AuthContext);
    const { theme, toggleTheme } = useContext(ThemeContext);
    const navigate = useNavigate();
    const [isSidebarOpen, setIsSidebarOpen] = useState(window.innerWidth >= 1024);

    const handleLogout = () => {
        logout();
        if (window.innerWidth < 1024) setIsSidebarOpen(false);
        navigate('/'); // Redirect to landing page on logout
    };

    const handleLinkClick = () => {
        if (window.innerWidth < 1024) {
            setIsSidebarOpen(false);
        }
    };

    return (
        <div className="min-h-screen flex relative">
            <GlobalBackground />
            {/* Sidebar Overlay */}
            {isSidebarOpen && (
                <div
                    className="fixed inset-0 bg-black/50 z-[60] backdrop-blur-sm transition-opacity lg:hidden"
                    onClick={() => setIsSidebarOpen(false)}
                />
            )}

            {/* Left Sidebar Drawer */}
            <aside className={`fixed top-0 left-0 h-full w-72 bg-white dark:bg-slate-900 border-r border-gray-200 dark:border-slate-800 shadow-2xl z-[70] transform transition-transform duration-300 ease-in-out flex flex-col ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
                <div className="p-6 flex items-center justify-between border-b border-gray-100 dark:border-slate-800">
                    <span className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-500 to-purple-600">
                        MemoryLane
                    </span>
                    <button onClick={() => setIsSidebarOpen(false)} className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors">
                        <X size={24} className="text-gray-500" />
                    </button>
                </div>

                <div className="flex-1 flex flex-col gap-2 p-6 overflow-y-auto">
                    {authLoading ? (
                        <div className="flex items-center justify-center py-10 opacity-50">
                            <Clock className="animate-spin" />
                        </div>
                    ) : user ? (
                        <>
                            <div className="mb-6 px-4 py-3 bg-indigo-50 dark:bg-indigo-900/20 rounded-xl flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full bg-indigo-200 dark:bg-indigo-800 flex items-center justify-center text-indigo-700 dark:text-indigo-300 font-bold">
                                    {user.name ? user.name.charAt(0).toUpperCase() : 'U'}
                                </div>
                                <div className="flex flex-col">
                                    <span className="font-semibold text-sm">{user.name || 'User Profile'}</span>
                                    <span className="text-xs opacity-70 truncate max-w-[120px]">{user.email}</span>
                                </div>
                            </div>
                            <Link to="/timeline" onClick={handleLinkClick} className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-indigo-50 hover:text-indigo-600 dark:hover:bg-slate-800 transition-colors font-medium">
                                <Clock size={20} /> Timeline
                            </Link>
                            <Link to="/albums" onClick={handleLinkClick} className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-indigo-50 hover:text-indigo-600 dark:hover:bg-slate-800 transition-colors font-medium">
                                <Image size={20} /> Albums
                            </Link>
                            <Link to="/shared-albums" onClick={handleLinkClick} className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-indigo-50 hover:text-purple-600 dark:hover:bg-slate-800 transition-colors font-medium">
                                <Users size={20} className="text-purple-500" /> Collab Albums
                            </Link>
                            <Link to="/reminisce" onClick={handleLinkClick} className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-indigo-50 hover:text-indigo-600 dark:hover:bg-slate-800 transition-colors font-medium">
                                <ReminisceIcon size={20} /> Reminisce
                            </Link>
                            <Link to="/community" onClick={handleLinkClick} className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-indigo-50 hover:text-indigo-600 dark:hover:bg-slate-800 transition-colors font-medium">
                                <Globe size={20} className="text-fuchsia-500" /> Community Stream
                            </Link>
                            <Link to="/social" onClick={handleLinkClick} className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-indigo-50 hover:text-indigo-600 dark:hover:bg-slate-800 transition-colors font-medium">
                                <Users size={20} className="text-emerald-500" /> Social Circle
                            </Link>
                        </>
                    ) : (
                        <div className="text-center opacity-60 text-sm py-4">
                            Please login to access your memories.
                        </div>
                    )}
                </div>

                <div className="p-6 border-t border-gray-100 dark:border-slate-800 flex flex-col gap-3">
                    {user ? (
                        <>
                            <Link to="/profile" onClick={handleLinkClick} className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors font-medium">
                                <User size={20} /> Profile Settings
                            </Link>
                            <button onClick={handleLogout} className="flex flex-row items-center gap-3 w-full text-left px-4 py-3 text-red-500 rounded-xl hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors font-medium">
                                <LogOut size={20} /> Logout
                            </button>
                        </>
                    ) : (
                        <>
                            <Link to="/login" onClick={handleLinkClick} className="flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-gray-100 dark:bg-slate-800 hover:bg-gray-200 dark:hover:bg-slate-700 transition-colors font-medium">
                                <LogIn size={20} /> Login
                            </Link>
                            <Link to="/register" onClick={handleLinkClick} className="flex items-center justify-center gap-2 px-4 py-3 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-colors shadow-md shadow-indigo-600/20 font-medium">
                                <UserPlus size={20} /> Sign Up
                            </Link>
                        </>
                    )}
                </div>
            </aside>

            {/* Main Wrapper */}
            <div className={`flex-1 flex flex-col min-h-screen w-full transition-all duration-300 ${isSidebarOpen ? 'lg:pl-72' : ''}`}>
                {/* Navigation Bar */}
                <nav className="glass-panel sticky top-0 z-50 px-6 py-4 border-b border-black/5 dark:border-white/5 flex justify-between items-center shadow-sm">
                    <div className="flex items-center gap-4">
                        <button
                            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                            className="p-2 -ml-2 rounded-lg hover:bg-black/5 dark:hover:bg-white/10 transition-colors"
                            aria-label="Toggle Sidebar Menu"
                        >
                            <Menu size={24} className="text-indigo-600 dark:text-indigo-400" />
                        </button>
                        <Link to="/" className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-500 to-purple-600 hidden sm:block">
                            MemoryLane
                        </Link>
                    </div>

                    <div className="flex items-center gap-4 border-black/5 dark:border-white/5">
                        <button
                            onClick={toggleTheme}
                            className="p-2 rounded-full hover:bg-black/5 dark:hover:bg-white/10 transition-colors"
                            aria-label="Toggle Dark Mode"
                        >
                            {theme === 'dark' ? <Sun size={20} className="text-yellow-400" /> : <Moon size={20} className="text-slate-700" />}
                        </button>

                        {user && <NotificationDropdown />}

                        <div className="flex gap-3">
                            {!user && (
                                <>
                                    <Link to="/login" className="hidden sm:flex items-center gap-2 px-4 py-2 rounded-lg hover:bg-black/5 dark:hover:bg-white/10 transition-colors font-medium">
                                        <LogIn size={18} /> Login
                                    </Link>
                                    <Link to="/register" className="hidden sm:flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors shadow-md shadow-indigo-600/20 font-medium">
                                        <UserPlus size={18} /> Sign Up
                                    </Link>
                                </>
                            )}
                        </div>
                    </div>
                </nav>

                {/* Main Content Area */}
                <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                    {children}
                </main>

                {/* Footer */}
                <footer className="glass-panel mt-auto py-8 border-t border-black/5 dark:border-white/5">
                    <div className="max-w-7xl mx-auto px-4 text-center text-sm opacity-70">
                        &copy; {new Date().getFullYear()} MemoryLane Personal. Preserving memories securely.
                    </div>
                </footer>
            </div>
        </div>
    );
};

export default Layout;
