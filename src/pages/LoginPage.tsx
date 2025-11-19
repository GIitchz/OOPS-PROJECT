import React, { useState, useContext } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import './Login.css';
import TextDivider from '../components/TextDivider';
import { AuthContext } from '../context/AuthContext';

import Supabase from '../utils/Database';


function LoginPage() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const { setLoading, setSession } = useContext(AuthContext);
    const nav = useNavigate();
    
    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const {data, error} = await Supabase.auth.signInWithPassword({email:email, password:password});
        if(error){
            console.error("login failed: ",error);
        } else {
            setLoading();
            setSession(data.session);
            nav('/');
        }
    };
    
    const handle3rdPartyLogin = (e: React.MouseEvent<HTMLButtonElement, MouseEvent>) => {
        const fetchUserData = async () => {
            const {data, error} = await Supabase.auth.signInWithOAuth({provider:"google", options:{redirectTo:"http://localhost:5173/"}});
            if(error) {console.error("Sign in failed: ",error);}
        }
        fetchUserData();
    }
    
    return (
        <div className="login-container">
            <form className="login-form" onSubmit={handleSubmit}>
                <h2>Welcome Back!</h2>

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

                <div className="navigation">
                    <button type="submit" className="submit-btn">Login</button>
                </div>

                <TextDivider text='or' textColor='#000' lineColor='#000' lineThickness={0.5}/>
                <div className="navigation OAuth">
                    <button type="button" className="next google" onClick={handle3rdPartyLogin}>Continue with Google</button>
                </div>
            </form>
            <p className="register-link">
                New to Live MART? <Link to="/register">Create an account</Link>
            </p>
        </div>
    );
}

export default LoginPage;