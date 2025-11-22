import React, { useContext } from "react";
import { Route, Routes, useNavigate } from "react-router-dom";
import useAuth from '../context/AuthContext';
import { User, LogOut, ShoppingCart, Settings, MapPin, ClipboardList, ArrowLeft } from 'lucide-react';
import ProfileAddressesPage from "./ProfileAddresses";
import ProfileOrdersPage from "./ProfileOrders";
import ProfileSettingsPage from "./ProfileSettings";

function ProfilePage() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  if (loading) return <div className="p-10 text-center">Loading...</div>;

  // Determine correct dashboard path based on role
  const dashboardPath = user?.role === 'retailer'
    ? '/admin/retailer'
    : user?.role === 'wholesaler'
      ? '/admin/wholesaler'
      : '/dashboard';

  return (
    <div className="min-h-screen bg-rose-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl mx-auto">

        {/* BACK TO DASHBOARD BUTTON */}
        <button
          onClick={() => navigate(dashboardPath)}
          className="flex items-center gap-2 text-slate-500 hover:text-rose-600 font-bold mb-6 transition-colors group"
        >
          <ArrowLeft size={18} className="group-hover:-translate-x-1 transition-transform" />
          Back to Dashboard
        </button>

        {/* Profile Header Card */}
        <div className="bg-white rounded-3xl shadow-xl shadow-rose-100 overflow-hidden mb-6">
          <div className="bg-gradient-to-r from-rose-400 to-orange-400 h-32"></div>
          <div className="px-8 pb-8">
            <div className="relative -mt-12 mb-4">
              <div className="inline-flex items-center justify-center h-24 w-24 rounded-2xl bg-white shadow-sm border-4 border-white text-rose-500">
                <User size={48} />
              </div>
            </div>
            <h1 className="text-2xl font-extrabold text-slate-900">
              {user?.name || user?.email}
            </h1>
            <p className="text-slate-500 font-medium uppercase tracking-wide text-sm mt-1">
              {user?.role} Account
            </p>
          </div>
        </div>

        <Routes>
          <Route path="" element={<ActionGrid />} />
          <Route path="addresses" element={<ProfileAddressesPage />} />
          <Route path="orders" element={<ProfileOrdersPage />} />
          <Route path="settings" element={<ProfileSettingsPage />} />
        </Routes>

      </div>
    </div>
  );
}

const ActionGrid = () => {
  const { user, logout } = useAuth(); // Destructure user here to check role
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate("/");
  };

  // DYNAMIC LABEL LOGIC
  const ordersLabel = user?.role === 'retailer' ? "Wholesale Purchases" : "My Orders";
  const ordersSubtext = user?.role === 'retailer' ? "Track inventory you bought" : "View past orders";

  return (
    <>
      {/* Actions Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

        {/* Your Cart Button */}
        <button
          onClick={() => navigate('/cart')}
          className="flex items-center gap-4 p-6 bg-white rounded-2xl shadow-sm border border-rose-100 hover:shadow-md hover:border-rose-200 transition-all text-left group"
        >
          <div className="p-3 bg-rose-100 text-rose-600 rounded-xl group-hover:bg-rose-500 group-hover:text-white transition-colors">
            <ShoppingCart size={24} />
          </div>
          <div>
            <h3 className="font-bold text-slate-800">Your Cart</h3>
            <p className="text-sm text-slate-500">View pending items</p>
          </div>
        </button>

        {/* Profile Orders Button */}
        <button
          onClick={() => navigate('/profile/orders')}
          className="flex items-center gap-4 p-6 bg-white rounded-2xl shadow-sm border border-rose-100 hover:shadow-md hover:border-rose-200 transition-all text-left group"
        >
          <div className="p-3 bg-slate-100 text-slate-600 rounded-xl group-hover:bg-slate-800 group-hover:text-white transition-colors">
            <ClipboardList size={24} />
          </div>
          <div>
            {/* Dynamic Labels */}
            <h3 className="font-bold text-slate-800">{ordersLabel}</h3>
            <p className="text-sm text-slate-500">{ordersSubtext}</p>
          </div>
        </button>

        {/* Profile Addresses Button */}
        <button
          onClick={() => navigate('/profile/addresses')}
          className="flex items-center gap-4 p-6 bg-white rounded-2xl shadow-sm border border-rose-100 hover:shadow-md hover:border-rose-200 transition-all text-left group"
        >
          <div className="p-3 bg-rose-100 text-rose-600 rounded-xl group-hover:bg-rose-500 group-hover:text-white transition-colors">
            <MapPin size={24} />
          </div>
          <div>
            <h3 className="font-bold text-slate-800">Your Addresses</h3>
            <p className="text-sm text-slate-500">Manage your saved addresses</p>
          </div>
        </button>

        {/* Profile Settings Button */}
        <button
          onClick={() => navigate('/profile/settings')}
          className="flex items-center gap-4 p-6 bg-white rounded-2xl shadow-sm border border-rose-100 hover:shadow-md hover:border-rose-200 transition-all text-left group"
        >
          <div className="p-3 bg-slate-100 text-slate-600 rounded-xl group-hover:bg-slate-800 group-hover:text-white transition-colors">
            <Settings size={24} />
          </div>
          <div>
            <h3 className="font-bold text-slate-800">Settings</h3>
            <p className="text-sm text-slate-500">Update your profile settings</p>
          </div>
        </button>

        {/* Sign Out Button */}
        <button
          onClick={handleLogout}
          className="flex items-center gap-4 p-6 bg-white rounded-2xl shadow-sm border border-rose-100 hover:shadow-md hover:border-rose-200 transition-all text-left group"
        >
          <div className="p-3 bg-slate-100 text-slate-600 rounded-xl group-hover:bg-slate-800 group-hover:text-white transition-colors">
            <LogOut size={24} />
          </div>
          <div>
            <h3 className="font-bold text-slate-800">Sign Out</h3>
            <p className="text-sm text-slate-500">Log out of your account</p>
          </div>
        </button>

      </div>
    </>
  );
}

export default ProfilePage;