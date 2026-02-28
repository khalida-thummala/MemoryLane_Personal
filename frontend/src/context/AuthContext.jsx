import { createContext, useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { supabase } from '../services/supabase';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    // Initialize user from localStorage to prevent redirect on refresh
    const [user, setUser] = useState(() => {
        const saved = localStorage.getItem('userInfo');
        return saved ? JSON.parse(saved) : null;
    });
    const [loading, setLoading] = useState(true);
    const checkAttempted = useRef(false);

    useEffect(() => {
        if (checkAttempted.current) return;
        checkAttempted.current = true;

        const checkSession = async () => {
            try {
                // Get the current session status from Supabase
                const { data: { session }, error } = await supabase.auth.getSession();

                if (session) {
                    const userData = {
                        id: session.user.id,
                        email: session.user.email,
                        token: session.access_token,
                        name: session.user.user_metadata?.full_name || session.user.user_metadata?.name || '',
                        avatar: session.user.user_metadata?.avatar_url || ''
                    };
                    setUser(userData);
                    localStorage.setItem('userInfo', JSON.stringify(userData));
                } else {
                    // Only clear if we explicitly have no session and our local info is invalid
                    // But if getSession fails for network reasons, we keep local info for a moment
                    if (!error) {
                        const saved = localStorage.getItem('userInfo');
                        if (!saved) setUser(null);
                    }
                }
            } catch (err) {
                console.error("Session check error:", err);
            } finally {
                // Give it a tiny bit of time to stabilize
                setTimeout(() => setLoading(false), 300);
            }
        };

        checkSession();

        const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
            if (session) {
                const userData = {
                    id: session.user.id,
                    email: session.user.email,
                    token: session.access_token,
                    name: session.user.user_metadata?.full_name || session.user.user_metadata?.name || '',
                    avatar: session.user.user_metadata?.avatar_url || ''
                };
                setUser(userData);
                localStorage.setItem('userInfo', JSON.stringify(userData));
            } else if (event === 'SIGNED_OUT') {
                setUser(null);
                localStorage.removeItem('userInfo');
            }
        });

        return () => subscription.unsubscribe();
    }, []);

    useEffect(() => {
        const requestInterceptor = axios.interceptors.request.use(
            (config) => {
                const userInfo = JSON.parse(localStorage.getItem('userInfo'));
                if (userInfo?.token) {
                    config.headers['Authorization'] = `Bearer ${userInfo.token}`;
                }
                return config;
            },
            (error) => Promise.reject(error)
        );

        return () => {
            axios.interceptors.request.eject(requestInterceptor);
        };
    }, []);

    const login = (userData) => {
        setUser(userData);
        localStorage.setItem('userInfo', JSON.stringify(userData));
    };

    const logout = async () => {
        try {
            await supabase.auth.signOut();
        } catch (e) { console.error("Sign out error", e); }
        setUser(null);
        localStorage.removeItem('userInfo');
    };

    const updateUser = (newUserData) => {
        setUser(newUserData);
        localStorage.setItem('userInfo', JSON.stringify(newUserData));
    };

    return (
        <AuthContext.Provider value={{ user, login, logout, loading, updateUser }}>
            {children}
        </AuthContext.Provider>
    );
};
