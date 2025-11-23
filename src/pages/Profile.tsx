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

    if (loading) return <div className="p-10 text-center text-xl font-semibold text-slate-700">Loading profile data...</div>;

    const dashboardPath = user?.role === 'retailer'
        ? '/admin/retailer'
        : user?.role === 'wholesaler'
            ? '/admin/wholesaler'
            : '/dashboard';

    return (
        // ✨ VIBRANCY CHANGE 1: Consistent, softer background
        <div className="min-h-screen bg-gradient-to-b from-emerald-50 to-gray-50 py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-2xl mx-auto">

                <button
                    onClick={() => navigate(dashboardPath)}
                    // ✨ Stronger hover/color on back button
                    className="flex items-center gap-2 text-slate-600 hover:text-emerald-700 font-semibold mb-6 transition-colors group"
                >
                    <ArrowLeft size={18} className="group-hover:-translate-x-1 transition-transform" />
                    Back to Dashboard
                </button>

                {/* ✨ VIBRANCY CHANGE 2: Stronger shadow and overall lift */}
                <div className="bg-white rounded-3xl shadow-2xl shadow-emerald-100/70 border border-slate-100 overflow-hidden mb-6">
                    {/* Retained gradient, maybe slightly deeper */}
                    <div className="bg-gradient-to-r from-emerald-500 to-green-600 h-32"></div>
                    <div className="px-8 pb-8">
                        <div className="relative -mt-12 mb-4">
                            {/* ✨ VIBRANCY CHANGE 3: Interactive User Icon */}
                            <div className="inline-flex items-center justify-center h-24 w-24 rounded-2xl bg-white shadow-lg border-4 border-white text-emerald-600 transition-all duration-300 hover:scale-[1.05] hover:shadow-xl cursor-default">
                                <User size={48} />
                            </div>
                        </div>
                        <h1 className="text-3xl font-extrabold text-slate-900">
                            {user?.name || user?.email}
                        </h1>
                        {/* ✨ Stronger color for role */}
                        <p className="text-emerald-600 font-extrabold uppercase tracking-widest text-sm mt-1">
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

    // ✨ VIBRANCY CHANGE 4: Unified Button Class for pop and interaction
    const ActionButtonClass = "flex items-center gap-4 p-6 bg-white rounded-2xl shadow-md border border-slate-100 hover:shadow-lg hover:border-emerald-300 transition-all duration-200 text-left group w-full transform hover:-translate-y-0.5 focus:ring-2 focus:ring-emerald-300";

    // ✨ VIBRANCY CHANGE 5: Unified Icon Wrapper Class for color transition
    const IconWrapperClass = "p-3 rounded-xl transition-all duration-300 transform group-hover:scale-110";

    return (
        <>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

                {role !== 'wholesaler' && (
                    <button
                        onClick={() => navigate('/cart')}
                        className={ActionButtonClass}
                    >
                        <div className={`${IconWrapperClass} bg-emerald-100 text-emerald-600 group-hover:bg-emerald-600 group-hover:text-white`}>
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
                        className={ActionButtonClass}
                    >
                        {/* Custom color for Orders for distinction */}
                        <div className={`${IconWrapperClass} bg-indigo-100 text-indigo-600 group-hover:bg-indigo-600 group-hover:text-white`}>
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
                    className={ActionButtonClass}
                >
                    <div className={`${IconWrapperClass} bg-emerald-100 text-emerald-600 group-hover:bg-emerald-600 group-hover:text-white`}>
                        <MapPin size={24} />
                    </div>
                    <div>
                        <h3 className="font-bold text-slate-800">Your Addresses</h3>
                        <p className="text-sm text-slate-500">Manage your saved addresses</p>
                    </div>
                </button>

                <button
                    onClick={() => navigate('/profile/settings')}
                    className={ActionButtonClass}
                >
                    {/* Neutral color for Settings */}
                    <div className={`${IconWrapperClass} bg-slate-100 text-slate-600 group-hover:bg-slate-800 group-hover:text-white`}>
                        <Settings size={24} />
                    </div>
                    <div>
                        <h3 className="font-bold text-slate-800">Settings</h3>
                        <p className="text-sm text-slate-500">Update your profile settings</p>
                    </div>
                </button>

                <button
                    onClick={handleLogout}
                    // Custom class for danger action (Log Out)
                    className="flex items-center gap-4 p-6 bg-white rounded-2xl shadow-md border border-slate-100 hover:shadow-lg hover:border-red-400 transition-all duration-200 text-left group w-full transform hover:-translate-y-0.5 focus:ring-2 focus:ring-red-400"
                >
                    {/* Red color for Log Out */}
                    <div className={`${IconWrapperClass} bg-red-100 text-red-600 group-hover:bg-red-600 group-hover:text-white`}>
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