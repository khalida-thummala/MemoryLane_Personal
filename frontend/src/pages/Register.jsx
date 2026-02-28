import { Link, useNavigate } from 'react-router-dom';
import { useState, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import { GoogleLogin } from '@react-oauth/google';
import { jwtDecode } from 'jwt-decode';
import { authService } from '../services/api';
import { Button } from '../components/ui/Button';
import axios from 'axios';

const Register = () => {
    const { login } = useContext(AuthContext);
    const navigate = useNavigate();

    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [loading, setLoading] = useState(false);

    const handleGoogleSuccess = async (credentialResponse) => {
        try {
            const decoded = jwtDecode(credentialResponse.credential);

            // Using the same endpoint as login, which creates the user if they don't exist
            const { data } = await axios.post('/api/auth/google', {
                email: decoded.email,
                name: decoded.name,
                picture: decoded.picture
            });

            login(data);
            navigate('/timeline');
        } catch (err) {
            console.error(err);
            setError('Google sign up failed. Please try again.');
        }
    };

    const submitHandler = async (e) => {
        e.preventDefault();
        setError('');
        setSuccess('');
        setLoading(true);

        try {
            await authService.register({ name, email, password });
            setSuccess('Account created successfully! Redirecting to login...');
            setTimeout(() => {
                navigate('/login');
            }, 2000);
        } catch (err) {
            setError(err.response?.data?.message || 'Registration failed');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex flex-col items-center justify-center min-h-[60vh]">
            <div className="glass-panel p-8 rounded-2xl w-full max-w-md">
                <h2 className="text-2xl font-bold mb-6 text-center text-indigo-600">Start Your Journey</h2>

                {error && <div className="mb-4 text-red-500 text-sm text-center font-medium bg-red-500/10 py-2 rounded-lg">{error}</div>}
                {success && <div className="mb-4 text-green-600 text-sm text-center font-medium bg-green-500/10 py-2 rounded-lg">{success}</div>}

                <div className="flex justify-center mb-6">
                    <GoogleLogin
                        onSuccess={handleGoogleSuccess}
                        onError={() => setError('Google Sign Up Failed')}
                        text="signup_with"
                    />
                </div>

                <div className="relative mb-6">
                    <div className="absolute inset-0 flex items-center">
                        <div className="w-full border-t border-gray-300 dark:border-gray-700"></div>
                    </div>
                    <div className="relative flex justify-center text-sm">
                        <span className="px-2 bg-transparent text-gray-500 glass-panel rounded-full">Or continue with email</span>
                    </div>
                </div>

                <form onSubmit={submitHandler} className="flex flex-col gap-4">
                    <div>
                        <label className="block text-sm font-medium mb-1 opacity-80">Full Name</label>
                        <input
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            className="w-full px-4 py-2 rounded-xl bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
                            placeholder="John Doe"
                            required
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-1 opacity-80">Email</label>
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="w-full px-4 py-2 rounded-xl bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
                            placeholder="you@example.com"
                            required
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-1 opacity-80">Password</label>
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="w-full px-4 py-2 rounded-xl bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
                            placeholder="••••••••"
                            required
                            minLength="6"
                        />
                    </div>
                    <Button disabled={loading} type="submit" className="w-full mt-4">
                        {loading ? 'Creating Account...' : 'Create Account'}
                    </Button>
                </form>
                <p className="mt-6 text-center text-sm opacity-70">
                    Already have an account? <Link to="/login" className="text-indigo-600 font-medium hover:underline">Sign In</Link>
                </p>
            </div>
        </div>
    );
};

export default Register;
