import { Link, useNavigate } from 'react-router-dom';
import { useContext, useState } from 'react';
import { AuthContext } from '../context/AuthContext';
import { Button } from '../components/ui/Button';
import { supabase } from '../services/supabase';
import { LogIn, Mail, Lock } from 'lucide-react';

const Login = () => {
    const { login } = useContext(AuthContext);
    const navigate = useNavigate();

    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);



    const handleStandardSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            const { data, error: authError } = await supabase.auth.signInWithPassword({ email, password });
            if (authError) throw authError;

            // Build user object consistent with AuthContext shape
            const userData = {
                id: data.user.id,
                email: data.user.email,
                token: data.session.access_token,
                name: data.user.user_metadata?.full_name || data.user.user_metadata?.name || '',
                avatar: data.user.user_metadata?.avatar_url || ''
            };
            login(userData);
            navigate('/');
        } catch (err) {
            setError(err.message || 'Login failed. Please check your credentials.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex flex-col items-center justify-center min-h-[80vh] px-4">
            <div className="glass-panel p-10 rounded-[2.5rem] w-full max-w-md shadow-2xl border-indigo-500/10 relative overflow-hidden">
                <div className="relative z-10">
                    <div className="flex justify-center mb-8">
                        <div className="p-4 bg-indigo-600 text-white rounded-[1.5rem] shadow-xl shadow-indigo-600/30">
                            <LogIn size={32} />
                        </div>
                    </div>

                    <h2 className="text-3xl font-black mb-2 text-center">Welcome Back</h2>
                    <p className="text-center text-slate-500 font-medium mb-8">Continue your journey down memory lane</p>

                    {error && (
                        <div className="mb-6 p-4 bg-rose-500/10 border border-rose-500/20 text-rose-500 text-sm font-bold text-center rounded-2xl">
                            {error}
                        </div>
                    )}



                    <form onSubmit={handleStandardSubmit} className="flex flex-col gap-5">
                        <div className="relative">
                            <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
                            <input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="w-full pl-12 pr-4 py-4 rounded-2xl bg-slate-50 dark:bg-slate-900 border-none outline-none focus:ring-2 focus:ring-indigo-500/50 font-bold transition-all"
                                placeholder="you@example.com"
                                required
                            />
                        </div>
                        <div className="relative">
                            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
                            <input
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="w-full pl-12 pr-4 py-4 rounded-2xl bg-slate-50 dark:bg-slate-900 border-none outline-none focus:ring-2 focus:ring-indigo-500/50 font-bold transition-all"
                                placeholder="••••••••"
                                required
                            />
                        </div>
                        <Button disabled={loading} type="submit" className="w-full py-4 rounded-2xl font-black text-lg mt-2 premium-gradient shadow-xl shadow-indigo-600/20">
                            {loading ? 'Authenticating...' : 'Sign In'}
                        </Button>
                    </form>

                    <p className="mt-8 text-center text-sm font-bold text-slate-500">
                        New here? <Link to="/register" className="text-indigo-600 hover:underline">Create an account</Link>
                    </p>
                </div>

                {/* Decorative blob */}
                <div className="absolute -top-24 -right-24 w-48 h-48 bg-indigo-500/10 blur-3xl rounded-full"></div>
                <div className="absolute -bottom-24 -left-24 w-48 h-48 bg-fuchsia-500/10 blur-3xl rounded-full"></div>
            </div>
        </div>
    );
};

export default Login;
