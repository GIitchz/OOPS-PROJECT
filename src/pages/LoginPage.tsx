import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Supabase from '../utils/Database';
import './Login.css';

function LoginPage() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const navigate = useNavigate();

    // handle Email/Password Login
    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setError('');

        const { data, error } = await Supabase.auth.signInWithPassword({
            email: email,
            password: password,
        });

        if (error) {
            console.error('Login failed:', error.message);
            setError(error.message);
        } else {
            console.log('Login successful:', data);
            navigate('/'); // send user to homepage on success
        }
    };

    // handle Google Login
    const handleGoogleLogin = async () => {
        const { error } = await Supabase.auth.signInWithOAuth({
            provider: 'google',
            options: { redirectTo: "http://localhost:5173/" }
        });
        if (error) {
            console.error('Google Sign in failed:', error);
        }
    };

    return (
        <div className="login-container">
            <form className="login-form" onSubmit={handleSubmit}>
                <h2>Welcome Back!</h2>

                {error && <p className="error-message">{error}</p>}

                <div className="form-group">
                    <label htmlFor="email">Email Address</label>
                    <input
                        type="email"
                        id="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                    />
                </div>

                <div className="form-group">
                    <label htmlFor="password">Password</label>
                    <input
                        type="password"
                        id="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                    />
                </div>

                <button type="submit" className="submit-btn">
                    Login
                </button>

                <p style={{ textAlign: 'center', margin: '1rem 0' }}>or</p>

                <button
                    type="button"
                    className="submit-btn google"
                    onClick={handleGoogleLogin}
                    style={{ backgroundColor: '#db4437' }}
                >
                    Continue with Google
                </button>

                <p className="register-link">
                    New to Live MART? <Link to="/register">Create an account</Link>
                </p>
            </form>
        </div>
    );
}

export default LoginPage;