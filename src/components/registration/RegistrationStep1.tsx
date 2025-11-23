import React, { useState, ChangeEvent } from 'react';
import Supabase from '../../utils/Database';
import TextDivider from '../TextDivider';

interface Step1Props {
    onNext: (e: React.FormEvent<HTMLFormElement>) => void;
    onChange: (data: { [key: string]: string }) => void;
    initialFormData: { email: string, password: string };
}

const Step1 = ({ onNext, onChange, initialFormData }: Step1Props) => {
    const [formData, setFormData] = useState(initialFormData);

    const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData({ ...formData, [name]: value });
        onChange({ [name]: value });
    };

    const handle3rdPartyLogin = (e: React.MouseEvent<HTMLButtonElement, MouseEvent>) => {
        const fetchUserData = async () => {
            const { error } = await Supabase.auth.signInWithOAuth({
                provider: "google",
                options: { redirectTo: "http://localhost:5173/register" }
            });
            if (error) console.error("Sign in failed: ", error);
        }
        fetchUserData();
    }

    // Input class helper
    const inputClass = "appearance-none block w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm placeholder-slate-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm";

    return (
        <form className="space-y-6" onSubmit={onNext}>
            <div>
                <label htmlFor="email" className="block text-sm font-medium text-slate-700">Email Address</label>
                <div className="mt-1">
                    <input
                        id="email"
                        type="email"
                        name="email"
                        value={formData.email}
                        onChange={handleChange}
                        required
                        className={inputClass}
                    />
                </div>
            </div>

            <div>
                <label htmlFor="password" className="block text-sm font-medium text-slate-700">Password</label>
                <div className="mt-1">
                    <input
                        type="password"
                        id="password"
                        name="password"
                        value={formData.password}
                        onChange={handleChange}
                        required
                        minLength={6}
                        className={inputClass}
                    />
                </div>
            </div>

            <div>
                <button type="submit" className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500">
                    Get Started
                </button>
            </div>

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
                        type="button"
                        onClick={handle3rdPartyLogin}
                        className="w-full flex justify-center py-2 px-4 border border-slate-300 rounded-md shadow-sm text-sm font-medium text-slate-700 bg-white hover:bg-slate-50"
                    >
                        <img className="h-5 w-5 mr-2" src="https://www.svgrepo.com/show/475656/google-color.svg" alt="Google" />
                        Google
                    </button>
                </div>
            </div>
        </form>
    );
};

export default Step1;