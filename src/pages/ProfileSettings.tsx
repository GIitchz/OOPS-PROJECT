import { useState } from "react";
import { updateName as updateNameDB, updatePassword as updatePasswordDB } from "../utils/Database";
import { useAuth } from "../context/AuthContext";

export const ProfileSettingsPage = () => {
    const { user, reload } = useAuth();

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
    <div className="min-h-screen bg-rose-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl mx-auto">
        <div className="bg-white rounded-3xl shadow-xl shadow-rose-100 overflow-hidden mb-6">
          <div className="px-8 py-6">
            <h2 className="text-3xl font-extrabold text-slate-900 mb-6">Edit Profile</h2>

            {/* --- NAME UPDATE --- */}
            <div className="p-6 bg-slate-100 rounded-2xl shadow-sm hover:shadow-md border border-slate-200 transition-all mb-6">
              <h3 className="text-xl font-semibold text-slate-800 mb-4">Update Name</h3>
              <input
                type="text"
                placeholder="Enter new name"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                className="w-full p-3 mb-4 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-rose-500 focus:border-rose-500"
              />
              <button
                onClick={updateName}
                className="w-full p-3 bg-rose-500 text-white rounded-xl font-semibold hover:bg-rose-600 transition-all"
              >
                Save Name
              </button>
            </div>

            {/* --- PASSWORD UPDATE --- */}
            <div className="p-6 bg-slate-100 rounded-2xl shadow-sm hover:shadow-md border border-slate-200 transition-all">
              <h3 className="text-xl font-semibold text-slate-800 mb-4">Change Password</h3>
              <input
                type="password"
                placeholder="Current Password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                className="w-full p-3 mb-4 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-rose-500 focus:border-rose-500"
              />
              <input
                type="password"
                placeholder="New Password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-full p-3 mb-4 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-rose-500 focus:border-rose-500"
              />
              <button
                onClick={updatePassword}
                className="w-full p-3 bg-rose-500 text-white rounded-xl font-semibold hover:bg-rose-600 transition-all"
              >
                Change Password
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfileSettingsPage;