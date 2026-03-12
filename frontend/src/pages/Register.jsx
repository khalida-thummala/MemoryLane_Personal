import { Link, useNavigate } from 'react-router-dom';
import { useState, useContext } from 'react';

import { AuthContext } from '../context/AuthContext';
import { Button } from '../components/ui/Button';


const Register = () => {
    const { signUp } = useContext(AuthContext);
    const navigate = useNavigate();

    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [loading, setLoading] = useState(false);



    const submitHandler = async (e) => {
        e.preventDefault();
        setError('');
        setSuccess('');
        setLoading(true);

        try {
            await signUp(name, email, password);
            setSuccess('Account created successfully! Please check your email for verification (if enabled) or proceed to login.');
            setTimeout(() => {
                navigate('/login');
            }, 3000);
        } catch (err) {
            setError(err.message || 'Registration failed');
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
