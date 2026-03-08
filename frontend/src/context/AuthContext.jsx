/* eslint-disable react-refresh/only-export-components */
import { createContext, useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { supabase } from '../services/supabase';

export const AuthContext = createContext();

/**
 * AuthProvider component - Manages Supabase authentication state
 */
export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(() => {
        const saved = localStorage.getItem('userInfo');
        return saved ? JSON.parse(saved) : null;
    });
    const [loading, setLoading] = useState(true);
    const checkAttempted = useRef(false);

    useEffect(() => {
        if (checkAttempted.current) return;
        checkAttempted.current = true;

        // Safety timeout to ensure loading doesn't stay true forever (e.g., if Supabase hangs)
        const safetyTimeout = setTimeout(() => {
            setLoading(false);
        }, 5000);

        const checkSession = async () => {
            try {
                if (!supabase) {
                    setLoading(false);
                    return;
                }

                // Get the current session status from Supabase
                const { data: { session }, error } = await supabase.auth.getSession();

                if (session && !error) {
                    try {
                        const { data: profile } = await supabase
                            .from('profiles')
                            .select('username, full_name, avatar_url')
                            .eq('id', session.user.id)
                            .single();

                        const userData = {
                            id: session.user.id,
                            email: session.user.email,
                            token: session.access_token,
                            name: profile?.full_name || profile?.username || session.user.user_metadata?.full_name || session.user.user_metadata?.name || '',
                            username: profile?.username || '',
                            avatar: profile?.avatar_url || session.user.user_metadata?.avatar_url || ''
                        };
                        setUser(userData);
                        localStorage.setItem('userInfo', JSON.stringify(userData));
                    } catch (profileError) {
                        console.error("Profile fetch error:", profileError);
                        const userData = {
                            id: session.user.id,
                            email: session.user.email,
                            token: session.access_token,
                            name: session.user.user_metadata?.full_name || session.user.user_metadata?.name || '',
                            username: '',
                            avatar: session.user.user_metadata?.avatar_url || ''
                        };
                        setUser(userData);
                    }
                } else {
                    // Supabase says no session - clear everything
                    setUser(null);
                    localStorage.removeItem('userInfo');
                }
            } catch (err) {
                console.error("Session check error:", err);
                // On error, we should probably not assume logged in
                setUser(null);
                localStorage.removeItem('userInfo');
            } finally {
                setLoading(false);
                clearTimeout(safetyTimeout);
            }
        };

        checkSession();

        // Listen for auth state changes globally
        const { data: authListener } = supabase?.auth?.onAuthStateChange(async (event, session) => {
            if (session) {
                // Fetch profile on every auth state change too
                try {
                    const { data: profile } = await supabase
                        .from('profiles')
                        .select('username, full_name, avatar_url')
                        .eq('id', session.user.id)
                        .single();

                    const userData = {
                        id: session.user.id,
                        email: session.user.email,
                        token: session.access_token,
                        name: profile?.full_name || profile?.username || session.user.user_metadata?.full_name || session.user.user_metadata?.name || '',
                        username: profile?.username || '',
                        avatar: profile?.avatar_url || session.user.user_metadata?.avatar_url || ''
                    };
                    setUser(userData);
                    localStorage.setItem('userInfo', JSON.stringify(userData));
                } catch (profErr) {
                    const userData = {
                        id: session.user.id,
                        email: session.user.email,
                        token: session.access_token,
                        name: session.user.user_metadata?.full_name || session.user.user_metadata?.name || '',
                        username: '',
                        avatar: session.user.user_metadata?.avatar_url || ''
                    };
                    setUser(userData);
                }
            } else {
                // No session - clear local state
                setUser(null);
                localStorage.removeItem('userInfo');
            }
        });

        return () => {
            authListener?.subscription?.unsubscribe();
            clearTimeout(safetyTimeout);
        };
    }, []);

    useEffect(() => {
        // Interceptor for Axios to add the Supabase JWT to every request automatically
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
