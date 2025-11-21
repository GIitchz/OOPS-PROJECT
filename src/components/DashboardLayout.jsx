import React from 'react';
import { Outlet, NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Package, ShoppingBag, TrendingUp, LayoutDashboard, ArrowLeft } from 'lucide-react';

function DashboardLayout() {
    const { user } = useAuth();
    const role = user?.role;

    // Reusable Sidebar Link Component
    // Added 'end' prop to fix the highlighting issue
    const SidebarLink = ({ to, icon: Icon, label, end = false }) => (
        <NavLink
            to={to}
            end={end}
            className={({ isActive }) =>
                `flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-bold transition-colors mb-2
                ${isActive
                    ? 'bg-rose-100 text-rose-600 shadow-sm' // Active: Rose theme
                    : 'text-slate-500 hover:bg-rose-50 hover:text-rose-500' // Inactive: Slate to Rose hover
                }`
            }
        >
            <Icon size={20} />
            {label}
        </NavLink>
    );

    return (
        <div className="min-h-screen bg-rose-50 flex pt-20">

            {/* Sidebar */}
            <aside className="w-72 bg-white border-r border-rose-100 fixed h-full hidden md:block overflow-y-auto pb-20">
                <div className="p-6">
                    <h3 className="text-xs font-extrabold text-rose-400 uppercase tracking-wider mb-6 px-2">
                        {role} Menu
                    </h3>
                    <nav>
                        {role === 'retailer' && (
                            <>
                                {/* Added 'end' to the dashboard link so it un-highlights when you leave it */}
                                <SidebarLink to="" icon={LayoutDashboard} label="Overview" end />
                                <SidebarLink to="wholesale" icon={TrendingUp} label="Wholesale Market" />
                                <SidebarLink to="inventory" icon={Package} label="My Inventory" />
                                <SidebarLink to="orders" icon={ShoppingBag} label="Customer Orders" />
                            </>
                        )}

                        {role === 'wholesaler' && (
                            <>
                                <SidebarLink to="" icon={LayoutDashboard} label="Overview" end />
                                <SidebarLink to="inventory" icon={Package} label="Manage Stock" />
                                <SidebarLink to="orders" icon={ShoppingBag} label="Retailer Orders" />
                            </>
                        )}
                    </nav>
                </div>

                {/* Decorative element at bottom of sidebar */}
                <div className="absolute bottom-0 left-0 w-full p-6">
                    <div className="bg-rose-50 rounded-2xl p-4 border border-rose-100">
                        <p className="text-xs font-bold text-rose-400 mb-1">Need Help?</p>
                        <p className="text-xs text-slate-500">Contact support anytime.</p>
                    </div>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 md:ml-72 p-6 sm:p-8 lg:p-10">
                <div className="max-w-6xl mx-auto animate-fade-in">
                    <Outlet />
                </div>
            </main>
        </div>
    );
}

export default DashboardLayout;