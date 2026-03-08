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

        const checkSession = async () => {
            try {
                // Get the current session status from Supabase
                const { data: { session }, error } = await supabase.auth.getSession();

                if (session && !error) {
                    // Also fetch the profile row to get username / full_name
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
                } else {
                    const saved = localStorage.getItem('userInfo');
                    if (!saved) setUser(null);
                }
            } catch (err) {
                console.error("Session check error:", err);
            } finally {
                setLoading(false);
            }
        };

        checkSession();

        // Listen for auth state changes globally
        const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
            if (session) {
                // Fetch profile on every auth state change too
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
            } else if (event === 'SIGNED_OUT') {
                setUser(null);
                localStorage.removeItem('userInfo');
            }
        });

        return () => subscription.unsubscribe();
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
