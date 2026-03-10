import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Sun, Moon, LogIn, UserPlus, Menu, X, Home, Clock, Image, Map as ReminisceIcon, User, LogOut, Globe, Users, Linkedin, Github, Mail } from 'lucide-react';
import { useContext, useState, useEffect } from 'react';
import { AuthContext } from '../context/AuthContext';
import { ThemeContext } from '../context/ThemeContext';
import GlobalBackground from './GlobalBackground';
import NotificationDropdown from './NotificationDropdown';

const Layout = ({ children }) => {
    const { user, logout, loading: authLoading } = useContext(AuthContext);
    const { theme, toggleTheme } = useContext(ThemeContext);
    const navigate = useNavigate();
    const location = useLocation();
    const isHomePage = location.pathname === '/';
    const isAuthPage = location.pathname === '/login' || location.pathname === '/register';
    const [isSidebarOpen, setIsSidebarOpen] = useState(window.innerWidth >= 1024 && !isHomePage);

    // Ensure sidebar is closed on home page (landing page)
    useEffect(() => {
        if (isHomePage) {
            setIsSidebarOpen(false);
        }
    }, [isHomePage]);

    const handleLogout = async () => {
        setIsSidebarOpen(false);
        await logout();
        navigate('/', { replace: true }); // Redirect to landing page on logout
    };

    const handleLinkClick = () => {
        if (window.innerWidth < 1024 || isHomePage) {
            setIsSidebarOpen(false);
        }
    };

    const isActive = (path) => location.pathname === path;

    const navLinkClass = (path) => `
        flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 font-medium relative group
        ${isActive(path)
            ? 'bg-indigo-50 text-indigo-600 dark:bg-indigo-900/40 dark:text-indigo-400 font-bold'
            : 'hover:bg-gray-50 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400'}
    `;

    const activeIndicator = (path) => isActive(path) && (
        <span className="absolute left-0 top-1/2 -translate-y-1/2 w-1.5 h-8 bg-indigo-600 dark:bg-indigo-400 rounded-r-full shadow-[0_0_10px_rgba(79,70,229,0.5)]" />
    );

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
                    <Link to="/" onClick={handleLinkClick} className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-500 to-purple-600">
                        MemoryLane
                    </Link>
                    <button onClick={() => setIsSidebarOpen(false)} className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors">
                        <X size={24} className="text-gray-500" />
                    </button>
                </div>

                <div className="flex-1 flex flex-col gap-2 p-6 overflow-y-auto relative">
                    {authLoading ? (
                        <div className="flex items-center justify-center py-10 opacity-50">
                            <Clock className="animate-spin" />
                        </div>
                    ) : (user) ? (
                        <>
                            <div className="mb-6 px-4 py-3 bg-indigo-50 dark:bg-indigo-900/20 rounded-xl flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold text-sm shadow-md">
                                    {(user.name || user.username || user.email || 'U').charAt(0).toUpperCase()}
                                </div>
                                <div className="flex flex-col min-w-0">
                                    <span className="font-bold text-sm text-slate-800 dark:text-white truncate">
                                        {user.name || user.username || user.email?.split('@')[0] || 'My Account'}
                                    </span>
                                    <span className="text-[11px] text-slate-500 dark:text-slate-400 truncate max-w-[150px]">{user.email}</span>
                                </div>
                            </div>
                            <Link to="/timeline" onClick={handleLinkClick} className={navLinkClass('/timeline')}>
                                {activeIndicator('/timeline')}
                                <Clock size={20} /> My Timeline
                            </Link>
                            <Link to="/albums" onClick={handleLinkClick} className={navLinkClass('/albums')}>
                                {activeIndicator('/albums')}
                                <Image size={20} /> Albums
                            </Link>
                            <Link to="/shared-albums" onClick={handleLinkClick} className={navLinkClass('/shared-albums')}>
                                {activeIndicator('/shared-albums')}
                                <Users size={20} className={isActive('/shared-albums') ? 'text-indigo-600 dark:text-indigo-400' : 'text-purple-500'} /> Collab Albums
                            </Link>
                            <Link to="/reminisce" onClick={handleLinkClick} className={navLinkClass('/reminisce')}>
                                {activeIndicator('/reminisce')}
                                <ReminisceIcon size={20} /> Reminisce
                            </Link>
                            <Link to="/community" onClick={handleLinkClick} className={navLinkClass('/community')}>
                                {activeIndicator('/community')}
                                <Globe size={20} className={isActive('/community') ? 'text-indigo-600 dark:text-indigo-400' : 'text-fuchsia-500'} /> Community Stream
                            </Link>
                            <Link to="/social" onClick={handleLinkClick} className={navLinkClass('/social')}>
                                {activeIndicator('/social')}
                                <Users size={20} className={isActive('/social') ? 'text-indigo-600 dark:text-indigo-400' : 'text-emerald-500'} /> Social Circle
                            </Link>
                        </>
                    ) : (
                        <div className="text-center opacity-60 text-sm py-4 space-y-4">
                            <p>Capture the sights, sounds, and feelings of right now—forever.</p>
                        </div>
                    )}
                </div>

                <div className="p-6 border-t border-gray-100 dark:border-slate-800 flex flex-col gap-3">
                    {user ? (
                        <>
                            <Link to="/profile" onClick={handleLinkClick} className={navLinkClass('/profile')}>
                                {activeIndicator('/profile')}
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
            <div className={`flex-1 flex flex-col min-h-screen w-full transition-all duration-300 ${(isSidebarOpen && !isHomePage) ? 'lg:pl-72' : ''}`}>
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

                        {user && !isHomePage && <NotificationDropdown />}

                        <div className="flex gap-3">
                            {!user ? (
                                <>
                                    <Link to="/login" className="hidden sm:flex items-center gap-2 px-4 py-2 rounded-lg hover:bg-black/5 dark:hover:bg-white/10 transition-colors font-medium text-slate-700 dark:text-slate-300">
                                        <LogIn size={18} /> Login
                                    </Link>
                                    <Link to="/register" className="hidden sm:flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors shadow-md shadow-indigo-600/20 font-medium">
                                        <UserPlus size={18} /> Sign Up
                                    </Link>
                                </>
                            ) : (
                                <Link to="/timeline" className="hidden sm:flex items-center gap-3 px-4 py-2 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors font-bold border border-black/5 dark:border-white/5">
                                    My Dashboard
                                </Link>
                            )}
                        </div>
                    </div>
                </nav>

                {/* Main Content Area */}
                <main className={`flex-1 w-full mx-auto py-8 ${(isHomePage || isAuthPage) ? '' : 'max-w-7xl px-4 sm:px-6 lg:px-8'}`}>
                    {children}
                </main>

                {/* Footer */}
                <footer className="glass-panel mt-auto py-8 border-t border-black/5 dark:border-white/5">
                    <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-4 text-sm opacity-70">
                        <div className="flex items-center gap-2">
                            Crafted with <span className="text-red-500 mx-1 animate-pulse">❤️</span> by <span className="font-semibold text-indigo-600 dark:text-indigo-400">Khalida Thummala</span>
                        </div>

                        <div className="flex items-center gap-6">
                            <a href="https://www.linkedin.com/in/khalida-thummala/" target="_blank" rel="noopener noreferrer" className="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors" title="LinkedIn">
                                <Linkedin size={20} />
                            </a>
                            <a href="https://github.com/khalida-thummala/" target="_blank" rel="noopener noreferrer" className="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors" title="GitHub">
                                <Github size={20} />
                            </a>
                            <a href="mailto:khalidathummla38@gmail.com" className="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors" title="Gmail">
                                <Mail size={20} />
                            </a>
                        </div>

                        <div className="text-xs opacity-50">
                            &copy; {new Date().getFullYear()} MemoryLane. All rights reserved.
                        </div>
                    </div>
                </footer>
            </div>
        </div>
    );
};

export default Layout;
