import React from 'react';
import { Outlet, NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Package, ShoppingBag, TrendingUp, LayoutDashboard, HelpCircle, Clock, MessageSquare } from 'lucide-react';

function DashboardLayout() {
    const { user } = useAuth();
    const role = user?.role;

    const SidebarLink = ({ to, icon: Icon, label, end = false }) => (
        <NavLink
            to={to}
            end={end}
            className={({ isActive }) =>
                `flex items-center gap-3 px-5 py-3.5 rounded-2xl text-sm font-bold transition-all duration-200 group
                ${isActive
                    ? 'bg-rose-50 text-rose-600 shadow-sm border border-rose-100'
                    : 'text-slate-500 hover:bg-white hover:text-rose-500 hover:shadow-sm hover:border-slate-100 border border-transparent'
                }`
            }
        >
            {({ isActive }) => (
                <>
                    <Icon
                        size={20}
                        className={isActive ? "text-rose-600" : "text-slate-400 group-hover:text-rose-500"}
                    />
                    {label}
                </>
            )}
        </NavLink>
    );

    return (
        <div className="min-h-screen bg-rose-50 flex flex-col md:flex-row pt-20">

            {/* Sidebar */}
            <aside className="w-full md:w-72 bg-white/50 backdrop-blur-xl border-r border-rose-100 md:h-[calc(100vh-80px)] sticky top-20 hidden md:flex flex-col justify-between px-6 pb-6 pt-0 overflow-y-auto custom-scrollbar">

                {/* Top Section: Navigation */}
                <div>
                    <h3 className="text-xs font-extrabold text-rose-400 uppercase tracking-wider mb-4 px-2 mt-4">
                        {role} Menu
                    </h3>
                    <nav className="space-y-1">
                        {role === 'retailer' && (
                            <>
                                <SidebarLink to="" icon={LayoutDashboard} label="Overview" end />
                                <SidebarLink to="wholesale" icon={TrendingUp} label="Wholesale Market" />
                                <SidebarLink to="inventory" icon={Package} label="My Inventory" />
                                <SidebarLink to="orders" icon={ShoppingBag} label="Live Orders" />
                                <SidebarLink to="history" icon={Clock} label="Sales History" />
                                <SidebarLink to="feedbacks" icon={MessageSquare} label="Feedbacks" />
                            </>
                        )}

                        {role === 'wholesaler' && (
                            <>
                                <SidebarLink to="" icon={LayoutDashboard} label="Overview" end />
                                <SidebarLink to="inventory" icon={Package} label="Manage Stock" />
                                <SidebarLink to="orders" icon={ShoppingBag} label="Retailer Orders" />
                                <SidebarLink to="history" icon={Clock} label="Sales History" />
                            </>
                        )}
                    </nav>
                </div>

                {/* Bottom Section: Support Card */}
                <div className="mt-6">
                    <div className="bg-gradient-to-br from-rose-100 to-white p-5 rounded-[2rem] border border-rose-100 shadow-sm">
                        <div className="flex items-center gap-3 mb-2">
                            <div className="p-2 bg-white rounded-full shadow-sm text-rose-500">
                                <HelpCircle size={18} />
                            </div>
                            <p className="text-sm font-bold text-slate-800">Need Help?</p>
                        </div>
                        <p className="text-xs text-slate-500 leading-relaxed mb-3">
                            Contact our support team for assistance with orders or inventory.
                        </p>
                        <button className="w-full py-2 bg-white text-rose-600 text-xs font-bold rounded-xl border border-rose-100 hover:bg-rose-50 transition-colors">
                            Contact Support
                        </button>
                    </div>
                </div>
            </aside>

            {/* Main Content Area */}
            <main className="flex-1 p-6 sm:p-8 lg:p-10 overflow-x-hidden">
                <div className="max-w-6xl mx-auto animate-fade-in">
                    <Outlet />
                </div>
            </main>
        </div>
    );
}

export default DashboardLayout;