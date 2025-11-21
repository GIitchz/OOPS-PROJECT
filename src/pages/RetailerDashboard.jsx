import React from 'react';
import { DollarSign, ShoppingBag, Users, AlertTriangle, TrendingUp } from 'lucide-react';

function RetailerDashboard() {
    return (
        <div className="space-y-8">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-extrabold text-slate-900">Store Overview</h1>
                    <p className="text-slate-500 mt-2">Hello! Here's how your shop is performing today.</p>
                </div>
                <div className="text-sm font-bold text-rose-500 bg-rose-50 px-4 py-2 rounded-xl border border-rose-100">
                    📅 {new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' })}
                </div>
            </div>

            {/* Stat Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {[
                    {
                        label: 'Today\'s Sales',
                        value: '₹12,450',
                        icon: DollarSign,
                        color: 'bg-green-100 text-green-600',
                        trend: '+12% vs yesterday'
                    },
                    {
                        label: 'Pending Orders',
                        value: '8',
                        icon: ShoppingBag,
                        color: 'bg-rose-100 text-rose-600',
                        trend: '3 need attention'
                    },
                    {
                        label: 'Low Stock Items',
                        value: '5',
                        icon: AlertTriangle,
                        color: 'bg-orange-100 text-orange-600',
                        trend: 'Restock needed'
                    },
                    {
                        label: 'New Customers',
                        value: '14',
                        icon: Users,
                        color: 'bg-indigo-100 text-indigo-600',
                        trend: 'This week'
                    },
                ].map((stat, index) => (
                    <div key={index} className="bg-white p-6 rounded-[2rem] shadow-sm border border-rose-100 hover:shadow-md hover:-translate-y-1 transition-all duration-300">
                        <div className="flex items-center justify-between mb-4">
                            <div className={`p-3 rounded-2xl ${stat.color}`}>
                                <stat.icon size={24} />
                            </div>
                            {index === 0 && <TrendingUp size={20} className="text-green-500" />}
                        </div>
                        <h3 className="text-3xl font-extrabold text-slate-900">{stat.value}</h3>
                        <p className="text-slate-500 font-bold text-sm mt-1">{stat.label}</p>
                        <p className="text-xs font-medium text-slate-400 mt-3 bg-slate-50 inline-block px-2 py-1 rounded-lg">
                            {stat.trend}
                        </p>
                    </div>
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Recent Orders Panel */}
                <div className="bg-white rounded-[2rem] shadow-sm border border-rose-100 p-8">
                    <div className="flex items-center justify-between mb-6">
                        <h2 className="text-xl font-bold text-slate-900">Live Orders</h2>
                        <button className="text-sm font-bold text-rose-600 hover:text-rose-700">View All</button>
                    </div>
                    <div className="space-y-6">
                        {[
                            { id: '#2045', name: 'Rohan Gupta', items: '2 items', status: 'Packing', time: '5 mins ago' },
                            { id: '#2044', name: 'Sarah Khan', items: '5 items', status: 'Ready', time: '20 mins ago' },
                            { id: '#2043', name: 'Amit Patel', items: '1 item', status: 'Delivered', time: '1 hour ago' },
                        ].map((order, i) => (
                            <div key={i} className="flex items-center justify-between pb-4 border-b border-slate-50 last:border-0 last:pb-0">
                                <div className="flex items-center gap-4">
                                    <div className="h-10 w-10 rounded-full bg-slate-100 flex items-center justify-center font-bold text-slate-500 text-xs">
                                        {order.id}
                                    </div>
                                    <div>
                                        <p className="font-bold text-slate-800">{order.name}</p>
                                        <p className="text-xs text-slate-400">{order.items} • {order.time}</p>
                                    </div>
                                </div>
                                <span className={`text-xs font-bold px-3 py-1 rounded-full ${order.status === 'Packing' ? 'bg-blue-100 text-blue-700' :
                                        order.status === 'Ready' ? 'bg-yellow-100 text-yellow-700' :
                                            'bg-green-100 text-green-700'
                                    }`}>
                                    {order.status}
                                </span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Alerts Panel */}
                <div className="bg-rose-50 rounded-[2rem] border border-rose-100 p-8">
                    <h2 className="text-xl font-bold text-rose-900 mb-6">Alerts & Notifications</h2>
                    <div className="space-y-4">
                        <div className="bg-white p-4 rounded-2xl shadow-sm flex gap-4 items-start">
                            <AlertTriangle className="text-orange-500 shrink-0" size={20} />
                            <div>
                                <p className="text-sm font-bold text-slate-800">Low Stock Warning</p>
                                <p className="text-xs text-slate-500 mt-1">"Organic Honey 500g" is down to 2 units. Consider restocking from Wholesaler.</p>
                            </div>
                        </div>
                        <div className="bg-white p-4 rounded-2xl shadow-sm flex gap-4 items-start">
                            <ShoppingBag className="text-indigo-500 shrink-0" size={20} />
                            <div>
                                <p className="text-sm font-bold text-slate-800">New Wholesale Item</p>
                                <p className="text-xs text-slate-500 mt-1">Fresh Strawberry Crates are now available at the Wholesale Market.</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default RetailerDashboard;