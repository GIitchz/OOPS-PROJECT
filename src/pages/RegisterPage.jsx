import React from 'react';
import { Link } from 'react-router-dom';
import RegistrationFlow from '../components/registration/RegistrationFlow';

function RegisterPage() {
    return (
        // Changed bg-stone-50 to a subtle top-to-bottom gradient. 
        // Starts with a soft emerald tint at the top and fades to the neutral stone-50.
        <div className="min-h-screen flex flex-col justify-center py-12 sm:px-6 lg:px-8 bg-gradient-to-b from-emerald-50/50 to-stone-50">
            <div className="sm:mx-auto sm:w-full sm:max-w-md">
                <h2 className="mt-6 text-center text-3xl font-extrabold text-slate-900">
                    Create your account
                </h2>
                <p className="mt-2 text-center text-sm text-slate-600">
                    Or{' '}
                    <Link 
                        to="/login" 
                        className="font-medium text-emerald-600 hover:text-emerald-500"
                    >
                        sign in to your existing account
                    </Link>
                </p>
            </div>

            <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-lg">
                {/* Form Container remains white and centered */}
                <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10 border border-emerald-100">
                    <RegistrationFlow />
                </div>
            </div>
        </div>
    );
}

export default RegisterPage;