import React from 'react';
import { Package, TrendingUp, Users, DollarSign } from 'lucide-react';

function WholesalerDashboard() {
    return (
        <div className="space-y-8">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-extrabold text-slate-900">Dashboard Overview</h1>
                    <p className="text-slate-500 mt-2">Welcome back! Here's what's happening with your supply chain today.</p>
                </div>
                <div className="text-sm font-bold text-rose-500 bg-rose-50 px-4 py-2 rounded-xl border border-rose-100">
                    📅 {new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' })}
                </div>
            </div>

            {/* Stat Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {[
                    { label: 'Total Revenue', value: '₹1.2L', icon: DollarSign, color: 'bg-green-100 text-green-600' },
                    { label: 'Active Orders', value: '12', icon: Package, color: 'bg-rose-100 text-rose-600' },
                    { label: 'Retail Partners', value: '24', icon: Users, color: 'bg-orange-100 text-orange-600' },
                    { label: 'Growth', value: '+18%', icon: TrendingUp, color: 'bg-blue-100 text-blue-600' },
                ].map((stat, index) => (
                    <div key={index} className="bg-white p-6 rounded-[2rem] shadow-sm border border-rose-100 hover:shadow-md hover:-translate-y-1 transition-all duration-300">
                        <div className="flex items-center justify-between mb-4">
                            <div className={`p-3 rounded-2xl ${stat.color}`}>
                                <stat.icon size={24} />
                            </div>
                            <span className="text-sm font-bold text-slate-400">Last 30 Days</span>
                        </div>
                        <h3 className="text-3xl font-extrabold text-slate-900">{stat.value}</h3>
                        <p className="text-slate-500 font-medium">{stat.label}</p>
                    </div>
                ))}
            </div>

            {/* Recent Activity Section */}
            <div className="bg-white rounded-[2rem] shadow-sm border border-rose-100 p-8">
                <h2 className="text-xl font-bold text-slate-900 mb-6">Recent Activity</h2>
                <div className="space-y-6">
                    {[
                        { text: "Order #1024 delivered to 'Sunshine Grocers'", time: "2 hours ago" },
                        { text: "New stock added: Premium Basmati Rice (50kg)", time: "5 hours ago" },
                        { text: "New retailer 'City Mart' joined your network", time: "1 day ago" },
                    ].map((item, i) => (
                        <div key={i} className="flex items-center gap-4 pb-6 border-b border-slate-50 last:border-0 last:pb-0">
                            <div className="h-3 w-3 rounded-full bg-rose-500"></div>
                            <div className="flex-1">
                                <p className="font-medium text-slate-800">{item.text}</p>
                                <p className="text-sm text-slate-400">{item.time}</p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}

export default WholesalerDashboard;