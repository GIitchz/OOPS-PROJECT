import { useState } from "react";
import { updateName as updateNameDB, updatePassword as updatePasswordDB } from "../utils/Database";
import { useAuth } from "../context/AuthContext";
import { User, Lock, ArrowLeft, CheckCircle, AlertTriangle, Loader2 } from "lucide-react";
import { useNavigate } from "react-router-dom";

export const ProfileSettingsPage = () => {
  const { user, reload } = useAuth();
  const navigate = useNavigate();

  const [newName, setNewName] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");

  // UI State for feedback
  const [isSubmittingName, setIsSubmittingName] = useState(false);
  const [nameStatus, setNameStatus] = useState<'success' | 'error' | null>(null);
  const [isSubmittingPassword, setIsSubmittingPassword] = useState(false);
  const [passwordStatus, setPasswordStatus] = useState<'success' | 'error' | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);

  const updateName = async () => {
    if (!newName.trim()) return;

    setNameStatus(null);
    setIsSubmittingName(true);

    try {
      // Assuming updateNameDB handles Firebase/DB interaction
      await updateNameDB(user!, newName.trim());
      await reload(); // Update auth context immediately
      setNewName("");
      setNameStatus('success');
    } catch (error) {
      console.error("Name update failed:", error);
      setNameStatus('error');
    } finally {
      setIsSubmittingName(false);
      setTimeout(() => setNameStatus(null), 5000); // Clear status after 5s
    }
  }

  const updatePassword = async () => {
    if (!currentPassword || !newPassword) {
      setPasswordError("Both current and new password fields are required.");
      return;
    }

    setPasswordStatus(null);
    setPasswordError(null);
    setIsSubmittingPassword(true);

    try {
      await updatePasswordDB(user!, newPassword);
      setCurrentPassword("");
      setNewPassword("");
      setPasswordStatus('success');
    } catch (error: any) {
      console.error("Password update failed:", error);
      setPasswordStatus('error');
      // Set a user-friendly error message
      setPasswordError(error.message || "Failed to change password. Please ensure your current password is correct.");
    } finally {
      setIsSubmittingPassword(false);
      setTimeout(() => setPasswordStatus(null), 5000); // Clear status after 5s
    }
  }

  const StatusMessage = ({ status, message }: { status: 'success' | 'error', message: string }) => {
    if (!status) return null;

    const isSuccess = status === 'success';
    const bgColor = isSuccess ? 'bg-emerald-50' : 'bg-red-50';
    const textColor = isSuccess ? 'text-emerald-700' : 'text-red-700';
    const Icon = isSuccess ? CheckCircle : AlertTriangle;

    return (
      <div className={`p-4 rounded-xl border ${bgColor} ${textColor} flex items-center gap-3 font-semibold transition-opacity duration-300`}>
        <Icon size={20} className={isSuccess ? 'text-emerald-500' : 'text-red-500'} />
        <p>{message}</p>
      </div>
    );
  };

  return (
    <div className="space-y-8 animate-fade-in">
      {/* BACK BUTTON */}
      <button
        onClick={() => navigate('/profile')}
        className="flex items-center gap-2 text-slate-600 hover:text-emerald-700 font-semibold transition-colors group"
      >
        <ArrowLeft size={18} className="group-hover:-translate-x-1 transition-transform" />
        Back to Profile
      </button>

      <div>
        <h2 className="text-3xl font-extrabold text-slate-900">Account Settings</h2>
        <p className="text-slate-600">Manage your profile visibility and security credentials.</p>
      </div>

      {/* --- NAME UPDATE --- */}
      <div className="bg-white rounded-[2rem] shadow-xl border border-slate-100 p-8">
        <div className="flex items-center gap-4 mb-6 border-b border-slate-100 pb-4">
          <div className="p-3 bg-emerald-100 rounded-xl text-emerald-600 border border-emerald-200 shadow-sm">
            <User size={24} />
          </div>
          <h3 className="text-xl font-bold text-slate-900">Public Profile</h3>
        </div>

        <div className="space-y-5">
          <StatusMessage 
            status={nameStatus} 
            message={nameStatus === 'success' ? "Display name successfully updated!" : "Failed to update name."} 
          />
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-2">Display Name</label>
            <input
              type="text"
              placeholder={user?.name || "Enter your name"}
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100 outline-none transition-all font-medium placeholder:text-slate-400"
            />
          </div>
          <button
            onClick={updateName}
            disabled={!newName.trim() || isSubmittingName}
            className="px-8 py-3 bg-slate-900 text-white rounded-xl font-bold shadow-lg shadow-slate-300 hover:bg-emerald-600 hover:shadow-emerald-300 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center gap-2"
          >
            {isSubmittingName && <Loader2 size={20} className="animate-spin" />}
            {isSubmittingName ? "Saving..." : "Save Name"}
          </button>
        </div>
      </div>

      {/* --- PASSWORD UPDATE --- */}
      <div className="bg-white rounded-[2rem] shadow-xl border border-slate-100 p-8">
        <div className="flex items-center gap-4 mb-6 border-b border-slate-100 pb-4">
          <div className="p-3 bg-emerald-100 rounded-xl text-emerald-600 border border-emerald-200 shadow-sm">
            <Lock size={24} />
          </div>
          <h3 className="text-xl font-bold text-slate-900">Security</h3>
        </div>

        <div className="space-y-5">
          <StatusMessage 
            status={passwordStatus} 
            message={passwordStatus === 'success' ? "Password successfully changed!" : (passwordError || "Failed to update password.")} 
          />
          
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-2">Current Password</label>
            <input
              type="password"
              placeholder="Enter current password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100 outline-none transition-all font-medium placeholder:text-slate-400"
            />
          </div>
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-2">New Password</label>
            <input
              type="password"
              placeholder="Enter new password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100 outline-none transition-all font-medium placeholder:text-slate-400"
            />
          </div>

          <button
            onClick={updatePassword}
            disabled={isSubmittingPassword}
            className="px-8 py-3 bg-slate-900 text-white rounded-xl font-bold shadow-lg shadow-slate-300 hover:bg-emerald-600 hover:shadow-emerald-300 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {isSubmittingPassword && <Loader2 size={20} className="animate-spin" />}
            {isSubmittingPassword ? "Changing..." : "Change Password"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProfileSettingsPage;