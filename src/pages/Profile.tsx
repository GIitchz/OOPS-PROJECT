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

  const dashboardPath = user?.role === 'retailer'
    ? '/admin/retailer'
    : user?.role === 'wholesaler'
      ? '/admin/wholesaler'
      : '/dashboard';

  return (
    <div className="min-h-screen bg-green-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl mx-auto">

        <button
          onClick={() => navigate(dashboardPath)}
          className="flex items-center gap-2 text-slate-500 hover:text-green-600 font-bold mb-6 transition-colors group"
        >
          <ArrowLeft size={18} className="group-hover:-translate-x-1 transition-transform" />
          Back to Dashboard
        </button>

        <div className="bg-white rounded-3xl shadow-xl shadow-green-100 overflow-hidden mb-6">
          <div className="bg-gradient-to-r from-green-400 to-emerald-500 h-32"></div>
          <div className="px-8 pb-8">
            <div className="relative -mt-12 mb-4">
              <div className="inline-flex items-center justify-center h-24 w-24 rounded-2xl bg-white shadow-sm border-4 border-white text-green-500">
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
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const role = user?.role;

  const handleLogout = async () => {
    await logout();
    navigate("/");
  };

  const ordersLabel = role === 'retailer' ? "Wholesale Purchases" : "My Orders";
  const ordersSubtext = role === 'retailer' ? "Track inventory you bought" : "View past orders";

  return (
    <>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

        {role !== 'wholesaler' && (
          <button
            onClick={() => navigate('/cart')}
            className="flex items-center gap-4 p-6 bg-white rounded-2xl shadow-sm border border-green-100 hover:shadow-md hover:border-green-200 transition-all text-left group"
          >
            <div className="p-3 bg-green-100 text-green-600 rounded-xl group-hover:bg-green-500 group-hover:text-white transition-colors">
              <ShoppingCart size={24} />
            </div>
            <div>
              <h3 className="font-bold text-slate-800">Your Cart</h3>
              <p className="text-sm text-slate-500">View pending items</p>
            </div>
          </button>
        )}

        {role !== 'wholesaler' && (
          <button
            onClick={() => navigate('/profile/orders')}
            className="flex items-center gap-4 p-6 bg-white rounded-2xl shadow-sm border border-green-100 hover:shadow-md hover:border-green-200 transition-all text-left group"
          >
            <div className="p-3 bg-slate-100 text-slate-600 rounded-xl group-hover:bg-slate-800 group-hover:text-white transition-colors">
              <ClipboardList size={24} />
            </div>
            <div>
              <h3 className="font-bold text-slate-800">{ordersLabel}</h3>
              <p className="text-sm text-slate-500">{ordersSubtext}</p>
            </div>
          </button>
        )}

        <button
          onClick={() => navigate('/profile/addresses')}
          className="flex items-center gap-4 p-6 bg-white rounded-2xl shadow-sm border border-green-100 hover:shadow-md hover:border-green-200 transition-all text-left group"
        >
          <div className="p-3 bg-green-100 text-green-600 rounded-xl group-hover:bg-green-500 group-hover:text-white transition-colors">
            <MapPin size={24} />
          </div>
          <div>
            <h3 className="font-bold text-slate-800">Your Addresses</h3>
            <p className="text-sm text-slate-500">Manage your saved addresses</p>
          </div>
        </button>

        <button
          onClick={() => navigate('/profile/settings')}
          className="flex items-center gap-4 p-6 bg-white rounded-2xl shadow-sm border border-green-100 hover:shadow-md hover:border-green-200 transition-all text-left group"
        >
          <div className="p-3 bg-slate-100 text-slate-600 rounded-xl group-hover:bg-slate-800 group-hover:text-white transition-colors">
            <Settings size={24} />
          </div>
          <div>
            <h3 className="font-bold text-slate-800">Settings</h3>
            <p className="text-sm text-slate-500">Update your profile settings</p>
          </div>
        </button>

        <button
          onClick={handleLogout}
          className="flex items-center gap-4 p-6 bg-white rounded-2xl shadow-sm border border-green-100 hover:shadow-md hover:border-green-200 transition-all text-left group"
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