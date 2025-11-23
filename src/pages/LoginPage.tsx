import React, { useState, useContext, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AuthContext, useAuth } from '../context/AuthContext';
import Supabase from '../utils/Database';

const ROLE_LANDING_PATHS: { [key: string]: string } = {
    customer: '/dashboard',
    retailer: '/admin/retailer',
    wholesaler: '/admin/wholesaler',
};

function LoginPage() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState<string>('');

    const { setLoading, setSession, stopLoading } = useContext(AuthContext);
    const { user, loading } = useAuth();
    const navigate = useNavigate();

    useEffect(() => {
        if (!loading && user) {
            const redirectPath = ROLE_LANDING_PATHS[user.role] || '/dashboard';
            navigate(redirectPath, { replace: true });
        }
    }, [user, loading, navigate]);

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setError('');
        setLoading();

        const { data, error } = await Supabase.auth.signInWithPassword({
            email,
            password,
        });

        if (error) {
            console.error("Login failed: ", error);
            setError(error.message || 'Login failed. Check email or password.');
            stopLoading();
        } else if (data.session) {
            setSession(data.session);
        }
    };

    const handle3rdPartyLogin = () => {
        const fetchUserData = async () => {
            const { error } = await Supabase.auth.signInWithOAuth({
                provider: "google",
                options: { redirectTo: "http://localhost:5173/" }
            });
            if (error) {
                console.error("Sign in failed: ", error);
                setError(error.message || 'Google sign-in failed.');
            }
        }
        fetchUserData();
    }

    if (loading || user) {
        return (
            // Updated loading state background and text color to emerald
            <div className="min-h-screen flex items-center justify-center bg-emerald-50">
                <div className="text-emerald-600 font-semibold">Redirecting...</div>
            </div>
        );
    }

    // Updated input focus rings to emerald
    const inputClass = "appearance-none block w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm placeholder-slate-400 focus:outline-none focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm";

    return (
        // Applied the subtle gradient background
        <div className="min-h-screen flex flex-col justify-center py-12 sm:px-6 lg:px-8 bg-gradient-to-b from-emerald-50/50 to-stone-50">
            <div className="sm:mx-auto sm:w-full sm:max-w-md">
                <h2 className="mt-6 text-center text-3xl font-extrabold text-slate-900">
                    Welcome Back
                </h2>
                <p className="mt-2 text-center text-sm text-slate-600">
                    New to The Grove?{' '}
                    <Link 
                        to="/register" 
                        // Updated link colors to emerald
                        className="font-medium text-emerald-600 hover:text-emerald-500"
                    >
                        Create an account
                    </Link>
                </p>
            </div>

            <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
                {/* Updated container border to emerald */}
                <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10 border border-emerald-100">
                    <form className="space-y-6" onSubmit={handleSubmit}>
                        {error && (
                            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded relative" role="alert">
                                <span className="block sm:inline">{error}</span>
                            </div>
                        )}

                        <div>
                            <label htmlFor="email" className="block text-sm font-medium text-slate-700">Email Address</label>
                            <div className="mt-1">
                                <input
                                    id="email"
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    required
                                    className={inputClass}
                                />
                            </div>
                        </div>

                        <div>
                            <label htmlFor="password" className="block text-sm font-medium text-slate-700">Password</label>
                            <div className="mt-1">
                                <input
                                    id="password"
                                    type="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    required
                                    className={inputClass}
                                />
                            </div>
                        </div>

                        <div>
                            <button 
                                type="submit" 
                                // Updated button colors and focus ring to emerald
                                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-emerald-600 hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500"
                            >
                                Sign In
                            </button>
                        </div>
                    </form>

                    <div className="mt-6">
                        <div className="relative">
                            <div className="absolute inset-0 flex items-center">
                                <div className="w-full border-t border-slate-300" />
                            </div>
                            <div className="relative flex justify-center text-sm">
                                <span className="px-2 bg-white text-slate-500">Or continue with</span>
                            </div>
                        </div>

                        <div className="mt-6">
                            <button
                                onClick={handle3rdPartyLogin}
                                className="w-full flex justify-center py-2 px-4 border border-slate-300 rounded-md shadow-sm text-sm font-medium text-slate-700 bg-white hover:bg-slate-50"
                            >
                                <img className="h-5 w-5 mr-2" src="https://www.svgrepo.com/show/475656/google-color.svg" alt="Google" />
                                Google
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default LoginPage;