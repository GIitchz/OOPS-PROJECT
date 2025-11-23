import React, { useEffect, useState } from 'react';
import Step1 from './RegistrationStep1';
import Step2 from './RegistrationStep2';
import Step3 from './RegistrationStep3';
import Supabase from '../../utils/Database';
import { useNavigate } from 'react-router-dom';
import { AlertTriangle } from 'lucide-react';

const RegistrationFlow = () => {
  const [step, setStep] = useState(1);
  const [OAuthSignup, setOAuthSignup] = useState(false);
  const [error, setError] = useState<string>('');

  interface formDataInterface {
    email: string, password: string, role: "Customer" | "Retailer" | "Wholesaler", name: string, latitude: number | null, longitude: number | null
  }

  const [formData, setFormData] = useState<formDataInterface>({
    email: '',
    password: '',
    role: 'Customer',
    name: '',
    latitude: null,
    longitude: null
  });

  const nav = useNavigate();

  useEffect(() => {
    const getUserData = async () => {
      const { data: { session } } = await Supabase.auth.getSession();
      if (session) {
        const { data } = await Supabase.from("users").select().match({ user_id: session.user.id }).maybeSingle();
        if (data) {
          // ISSUE HERE: If 'data' exists, the user is registered. 
          // The app should navigate to the dashboard, not the profile page.
          // This behavior might be causing unexpected redirects if the browser history is confusing the router.
          nav('/');
        }
        else {
          // Scenario: User signed in via Google but hasn't completed Step 2 (role/location)
          setOAuthSignup(true);
          setStep(2);
          setFormData(prev => ({ ...prev, name: session.user.user_metadata.name || '' }));
        }
      }
    };
    getUserData();
  }, [step, nav]);

  const handleNextStep = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError('');
    setStep(step + 1);
  };

  const handlePreviousStep = () => {
    setError('');
    setStep(step - 1);
  };

  // Updated interface for handleFormDataChange to handle number/null types
  const handleFormDataChange = (data: { [key: string]: string | number | null }) => {
    setFormData(prev => ({ ...prev, ...data }));
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError('');

    if (!OAuthSignup) {
      const { error: signUpError } = await Supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: { data: { ...formData, role: formData.role.toLowerCase() } }
      });

      if (signUpError) {
        console.error("Sign up failed: ", signUpError);
        setError(signUpError.message || 'Registration failed. Please try a different email.');
      }
      else {
        setStep(step + 1);

        const { error: otpError } = await Supabase.auth.signInWithOtp({
          email: formData.email,
          options: { emailRedirectTo: 'http://localhost:5173' }
        });

        if (otpError) {
          console.error("OTP sending failed: ", otpError);
        } else {
          console.log('User created, verification email sent.');
        }
      }
    }
    else {
      const { error: updateError } = await Supabase.auth.updateUser({ data: { ...formData, role: formData.role.toLowerCase() } });

      if (updateError) {
        console.error(updateError);
        setError(updateError.message || 'Error saving user details.');
      }
      else {
        nav('/');
      }
    }
  }

  return (
    <div>
      {/* Progress Bar */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-3 px-1">
          <span className={`text-sm font-bold ${step >= 1 ? 'text-green-600' : 'text-slate-300'}`}>Account</span>
          <span className={`text-sm font-bold ${step >= 2 ? 'text-green-600' : 'text-slate-300'}`}>Details</span>
          <span className={`text-sm font-bold ${step >= 3 ? 'text-green-600' : 'text-slate-300'}`}>Verify</span>
        </div>
        <div className="h-3 bg-slate-100 rounded-full overflow-hidden">
          <div
            className="h-full bg-green-500 transition-all duration-500 ease-out"
            style={{ width: `${(step / 3) * 100}%` }}
          ></div>
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="mb-6 bg-red-50 border border-red-200 rounded-xl p-5 flex items-start gap-3">
          <AlertTriangle className="text-red-500 shrink-0" size={24} />
          <p className="text-base text-red-600 font-medium">{error}</p>
        </div>
      )}

      {/* Steps (unchanged props) */}
      {step === 1 && <Step1 onNext={handleNextStep} onChange={handleFormDataChange} initialFormData={formData} />}
      {step === 2 && <Step2 onNext={handleSubmit} onPrev={handlePreviousStep} onChange={handleFormDataChange} initialFormData={formData} />}
      {step === 3 && <Step3 />}
    </div>
  );
};

export default RegistrationFlow;