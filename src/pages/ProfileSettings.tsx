import { useState } from "react";
import { updateName as updateNameDB, updatePassword as updatePasswordDB } from "../utils/Database";
import { useAuth } from "../context/AuthContext";
import { User, Lock, ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";

export const ProfileSettingsPage = () => {
  const { user, reload } = useAuth();
  const navigate = useNavigate();

  const [newName, setNewName] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");

  const updateName = async () => {
    await updateNameDB(user!, newName);
    await reload();
    setNewName("");
  }

  const updatePassword = async () => {
    await updatePasswordDB(user!, newPassword);
    setCurrentPassword("");
    setNewPassword("");
  }

  return (
    <div className="space-y-8 animate-fade-in">
      {/* BACK BUTTON */}
      <button
        onClick={() => navigate('/profile')}
        className="flex items-center gap-2 text-slate-500 hover:text-green-600 font-bold transition-colors group"
      >
        <ArrowLeft size={18} className="group-hover:-translate-x-1 transition-transform" />
        Back to Profile
      </button>

      <div>
        <h2 className="text-2xl font-extrabold text-slate-900">Account Settings</h2>
        <p className="text-slate-500">Update your personal information.</p>
      </div>

      {/* --- NAME UPDATE --- */}
      <div className="bg-white rounded-[2rem] shadow-sm border border-green-100 p-8">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 bg-green-50 rounded-xl text-green-600">
            <User size={20} />
          </div>
          <h3 className="text-lg font-bold text-slate-800">Public Profile</h3>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-2">Display Name</label>
            <input
              type="text"
              placeholder={user?.name || "Enter your name"}
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              className="w-full p-4 bg-green-50 border border-transparent rounded-xl focus:bg-white focus:border-green-500 focus:ring-2 focus:ring-green-200 outline-none transition-all font-medium"
            />
          </div>
          <button
            onClick={updateName}
            disabled={!newName}
            className="px-6 py-3 bg-slate-900 text-white rounded-xl font-bold hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          >
            Save Name
          </button>
        </div>
      </div>

      {/* --- PASSWORD UPDATE --- */}
      <div className="bg-white rounded-[2rem] shadow-sm border border-green-100 p-8">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 bg-green-50 rounded-xl text-green-600">
            <Lock size={20} />
          </div>
          <h3 className="text-lg font-bold text-slate-800">Security</h3>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-2">Current Password</label>
            <input
              type="password"
              placeholder="Enter current password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              className="w-full p-4 bg-green-50 border border-transparent rounded-xl focus:bg-white focus:border-green-500 focus:ring-2 focus:ring-green-200 outline-none transition-all font-medium"
            />
          </div>
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-2">New Password</label>
            <input
              type="password"
              placeholder="Enter new password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="w-full p-4 bg-green-50 border border-transparent rounded-xl focus:bg-white focus:border-green-500 focus:ring-2 focus:ring-green-200 outline-none transition-all font-medium"
            />
          </div>

          <button
            onClick={updatePassword}
            className="px-6 py-3 bg-slate-900 text-white rounded-xl font-bold hover:bg-green-600 transition-all"
          >
            Change Password
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProfileSettingsPage;