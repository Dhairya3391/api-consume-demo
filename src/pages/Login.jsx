import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import ThemeToggle from '../components/ThemeToggle';

export default function Login() {
    const [email, setEmail] = useState('MRF@darshan.ac.in');
    const [password, setPassword] = useState('123');
    const [error, setError] = useState('');
    const { login } = useAuth();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);
        try {
            const success = await login(email, password);
            if (success) {
                navigate('/dashboard');
            } else {
                setError('Login failed. Please check credentials.');
            }
        } catch (err) {
            setError('Login failed. Server error or invalid credentials.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center p-4">
            <div className="absolute top-4 right-4">
                <ThemeToggle />
            </div>
            <div className="w-full max-w-sm bg-white dark:bg-slate-900 p-8 rounded-lg shadow-sm border border-slate-200 dark:border-slate-800">
                <h1 className="text-2xl font-bold mb-6 text-center text-slate-900 dark:text-white">Login</h1>

                {error && (
                    <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-sm rounded border border-red-100 dark:border-red-800">
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Email</label>
                        <input
                            type="email"
                            className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded focus:outline-none focus:ring-2 focus:ring-slate-400 dark:bg-slate-950 dark:text-white"
                            placeholder="email@example.com"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Password</label>
                        <input
                            type="password"
                            className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded focus:outline-none focus:ring-2 focus:ring-slate-400 dark:bg-slate-950 dark:text-white"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                        />
                    </div>
                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 py-2 rounded hover:bg-slate-800 dark:hover:bg-slate-200 transition-colors disabled:opacity-50 font-semibold"
                    >
                        {loading ? 'Processing...' : 'Sign In'}
                    </button>
                </form>

                <div className="mt-6 text-center text-xs text-slate-500 dark:text-slate-400">
                    Use <code className="bg-slate-100 dark:bg-slate-800 px-1 rounded">MRF@darshan.ac.in</code> / <code className="bg-slate-100 dark:bg-slate-800 px-1 rounded">123</code>
                </div>
            </div>
        </div>
    );
}
