import React from 'react';
import { MailCheck } from 'lucide-react';

const Step3 = () => {
    return (
        <div className="text-center py-8">
            {/* Icon Container: Changed bg-green-100 to bg-emerald-100 */}
            <div className="mx-auto flex items-center justify-center h-20 w-20 rounded-full bg-emerald-100 mb-6 animate-bounce">
                {/* Icon Color: Changed text-green-600 to text-emerald-600 */}
                <MailCheck className="h-10 w-10 text-emerald-600" />
            </div>

            <h2 className="text-2xl font-extrabold text-slate-900 mb-2">
                Verification Sent!
            </h2>

            <p className="text-slate-600 mb-8 px-8">
                We've sent a link to your email address. Please click it to verify your account and get started!
            </p>

            <div className="bg-slate-50 rounded-xl p-4 text-sm text-slate-500">
                <p>Check your spam folder if you don't see it within a few minutes.</p>
            </div>
        </div>
    );
}

export default Step3;