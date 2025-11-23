import React, { useEffect, useState } from 'react';
import { DollarSign, ShoppingBag, Users, AlertTriangle, TrendingUp, Package, Truck, ArrowRight } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { getSellerOrders, updateOrderItemStatus } from '../utils/OrderDB';
import { getRetailerListings } from '../utils/InventoryDB';
import { useNavigate } from 'react-router-dom';

function RetailerDashboard() {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);

    const [stats, setStats] = useState({
        sales: 0,
        pending: 0,
        lowStock: 0,
        customers: 0
    });

    const [recentOrders, setRecentOrders] = useState([]);
    const [alerts, setAlerts] = useState([]);

    const fetchData = async () => {
        if (!user) return;

        try {
            const [ordersData, inventoryData] = await Promise.all([
                getSellerOrders(user.id),
                getRetailerListings(user.id)
            ]);

            // 1. Get "Start of Today" correctly
            const startOfDay = new Date();
            startOfDay.setHours(0, 0, 0, 0); // Set to 12:00:00 AM today

            let todaySales = 0;
            let pendingCount = 0;
            const recentBuyers = new Set();

            ordersData.forEach(item => {
                // Safety check: Ensure order details exist
                if (!item.order?.ordered_at) return;

                const orderDate = new Date(item.order.ordered_at);

                // CALCULATION 1: Today's Sales
                if (item.order_status !== 'cancelled') {
                    if (orderDate >= startOfDay) {
                        const itemTotal = Number(item.price) * Number(item.quantity);
                        todaySales += itemTotal;
                    }

                    // Track unique buyers
                    if (item.order.buyer?.name) {
                        recentBuyers.add(item.order.buyer.name);
                    }
                }

                // CALCULATION 2: Pending Orders count
                if (item.order_status === 'pending' || item.order_status === 'delivering') {
                    pendingCount++;
                }
            });

            // 3. Inventory Metrics
            let lowStockCount = 0;
            const newAlerts = [];

            inventoryData.forEach(item => {
                if (item.stock < 10) {
                    lowStockCount++;
                    newAlerts.push({
                        type: 'low_stock',
                        message: `Low Stock: "${item.product?.name}" (${item.stock} left)`,
                        id: item.product_listings_id
                    });
                }
            });

            if (pendingCount > 0) {
                newAlerts.unshift({
                    type: 'pending_orders',
                    message: `You have ${pendingCount} active orders to fulfill.`,
                    id: 'pending_alert'
                });
            }

            setStats({
                sales: todaySales,
                pending: pendingCount,
                lowStock: lowStockCount,
                customers: recentBuyers.size
            });

            // 4. Recent Orders
            const activeRecent = ordersData
                .filter(o => o.order_status === 'pending' || o.order_status === 'delivering')
                .sort((a, b) => new Date(b.order.ordered_at) - new Date(a.order.ordered_at)) // Sort newest first
                .slice(0, 5);

            setRecentOrders(activeRecent);
            setAlerts(newAlerts.slice(0, 5));
            setLoading(false);
        } catch (error) {
            console.error("Failed to fetch dashboard data:", error);
            setLoading(false);
            // Handle error state gracefully in UI if necessary
        }
    };

    useEffect(() => {
        fetchData();
    }, [user]);

    // Quick Action: Ship Order directly from Dashboard
    const handleQuickShip = async (itemId) => {
        if (window.confirm("Mark this item as 'Out for Delivery'?")) {
            await updateOrderItemStatus(itemId, 'delivering');
            fetchData(); // Refresh data to update list
        }
    };

    if (loading) return (
        // Consistent loading style
        <div className="p-10 text-center text-xl font-semibold text-slate-700">Loading dashboard metrics...</div>
    );

    return (
        // ✨ VIBRANCY CHANGE 1: Consistent, softer background wrapper
        <div className="min-h-screen bg-gradient-to-b from-emerald-50 to-gray-50 py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-7xl mx-auto space-y-8">

                {/* Header */}
                <header className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
                    <div>
                        <h1 className="text-3xl font-extrabold text-slate-900">Retailer Dashboard 👋</h1>
                        <p className="text-slate-500 mt-2">Hello, {user?.name || user?.email}! Here's how your shop is performing today.</p>
                    </div>
                    {/* Consistent Date Styling */}
                    <div className="text-sm font-bold text-emerald-700 bg-emerald-100/70 px-4 py-2 rounded-xl border border-emerald-200">
                        📅 {new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' })}
                    </div>
                </header>

                {/* --- */}

                {/* Stat Cards - ✨ VIBRANCY CHANGE 2: Unified card styles */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {/* Today's Sales - Primary Color (Green/Emerald) */}
                    <div className="bg-white p-6 rounded-3xl shadow-xl shadow-emerald-50/50 border border-slate-100 transition-all duration-300 hover:shadow-2xl hover:shadow-emerald-100/70 hover:scale-[1.01] transform cursor-default">
                        <div className="flex items-center justify-between mb-4">
                            <div className="p-3 rounded-xl bg-emerald-50 text-emerald-600"><DollarSign size={24} /></div>
                            <TrendingUp size={20} className="text-emerald-500" />
                        </div>
                        <h3 className="text-3xl font-extrabold text-slate-900">₹{stats.sales.toLocaleString('en-IN')}</h3>
                        <p className="text-slate-500 font-bold text-sm mt-1">Today's Sales</p>
                    </div>

                    {/* Pending Orders - Secondary (Green/Emerald) */}
                    <div className="bg-white p-6 rounded-3xl shadow-xl shadow-emerald-50/50 border border-slate-100 transition-all duration-300 hover:shadow-2xl hover:shadow-emerald-100/70 hover:scale-[1.01] transform cursor-default">
                        <div className="flex items-center justify-between mb-4">
                            <div className="p-3 rounded-xl bg-emerald-50 text-emerald-600"><ShoppingBag size={24} /></div>
                            {/* Optional: Add an indicator for high pending count */}
                        </div>
                        <h3 className="text-3xl font-extrabold text-slate-900">{stats.pending}</h3>
                        <p className="text-slate-500 font-bold text-sm mt-1">Pending Orders</p>
                    </div>

                    {/* Low Stock Items - Alert Color (Orange) */}
                    <div className="bg-white p-6 rounded-3xl shadow-xl shadow-orange-50/50 border border-slate-100 transition-all duration-300 hover:shadow-2xl hover:shadow-orange-100/70 hover:scale-[1.01] transform cursor-default">
                        <div className="flex items-center justify-between mb-4">
                            <div className="p-3 rounded-xl bg-orange-100 text-orange-600"><AlertTriangle size={24} /></div>
                        </div>
                        <h3 className="text-3xl font-extrabold text-slate-900">{stats.lowStock}</h3>
                        <p className="text-slate-500 font-bold text-sm mt-1">Low Stock Items</p>
                    </div>

                    {/* Recent Customers - Distinct Color (Indigo) */}
                    <div className="bg-white p-6 rounded-3xl shadow-xl shadow-indigo-50/50 border border-slate-100 transition-all duration-300 hover:shadow-2xl hover:shadow-indigo-100/70 hover:scale-[1.01] transform cursor-default">
                        <div className="flex items-center justify-between mb-4">
                            <div className="p-3 rounded-xl bg-indigo-100 text-indigo-600"><Users size={24} /></div>
                        </div>
                        <h3 className="text-3xl font-extrabold text-slate-900">{stats.customers}</h3>
                        <p className="text-slate-500 font-bold text-sm mt-1">Recent Customers</p>
                    </div>
                </div>

                {/* --- */}

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">

                    {/* Live Orders Panel - ✨ VIBRANCY CHANGE 3: Elevated Panel Style */}
                    <div className="bg-white rounded-3xl shadow-2xl shadow-emerald-100/70 border border-slate-100 p-8">
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-xl font-bold text-slate-900">Live Orders</h2>
                            <button onClick={() => navigate('/admin/retailer/orders')} className="text-sm font-bold text-emerald-600 hover:text-emerald-700 flex items-center gap-1 group transition-colors">
                                View All <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
                            </button>
                        </div>

                        <div className="space-y-4">
                            {recentOrders.length === 0 ? (
                                <div className="text-center py-8 text-slate-400 bg-gray-50 rounded-2xl border border-gray-100">
                                    <p className="italic font-medium">All caught up! No active orders.</p>
                                </div>
                            ) : (
                                recentOrders.map((order) => (
                                    // Item styling with consistent look and feel
                                    <div key={order.order_item_id} className="flex items-center justify-between p-4 bg-emerald-50/50 rounded-2xl border border-emerald-100 hover:bg-emerald-100 transition-colors">
                                        <div className="flex items-center gap-4">
                                            {/* ID Tag */}
                                            <div className="h-12 w-12 rounded-xl bg-white shadow-md flex items-center justify-center font-extrabold text-slate-700 text-xs">
                                                #{order.order_item_id}
                                            </div>
                                            <div>
                                                <p className="font-bold text-slate-800">{order.name}</p>
                                                <p className="text-xs text-slate-500 font-medium">
                                                    {order.quantity}x • {order.order?.buyer?.name || 'Unknown'}
                                                </p>
                                            </div>
                                        </div>

                                        {/* Quick Action Button */}
                                        {order.order_status === 'pending' ? (
                                            <button
                                                onClick={() => handleQuickShip(order.order_item_id)}
                                                // Stronger hover/color on action button
                                                className="bg-emerald-600 text-white text-xs font-bold px-4 py-2 rounded-xl hover:bg-emerald-700 transition-colors flex items-center gap-2 transform hover:scale-[1.05]"
                                            >
                                                <Truck size={14} /> Ship Now
                                            </button>
                                        ) : (
                                            <span className="bg-indigo-100 text-indigo-700 text-xs font-bold px-3 py-1 rounded-xl">
                                                Delivering
                                            </span>
                                        )}
                                    </div>
                                ))
                            )}
                        </div>
                    </div>

                    {/* Alerts Panel - ✨ VIBRANCY CHANGE 4: Subtly different background for alerts/notifications */}
                    <div className="bg-white rounded-3xl shadow-2xl shadow-gray-100/70 border border-slate-100 p-8">
                        <h2 className="text-xl font-bold text-slate-900 mb-6">Alerts & Notifications</h2>
                        <div className="space-y-4">
                            {alerts.length === 0 ? (
                                <div className="bg-emerald-50 p-4 rounded-2xl shadow-sm flex gap-4 items-center border border-emerald-100">
                                    <div className="bg-white p-3 rounded-xl text-emerald-600 shadow-sm"><Package size={18} /></div>
                                    <p className="text-sm font-bold text-slate-600">All clear! Inventory and orders look great.</p>
                                </div>
                            ) : (
                                alerts.map((alert) => (
                                    <div key={alert.id} className="bg-gray-50 p-4 rounded-2xl shadow-sm flex gap-4 items-start border border-gray-100">
                                        {/* Icon Wrapper Class for consistency */}
                                        {alert.type === 'low_stock' ? (
                                            <div className="p-3 rounded-xl bg-orange-100 text-orange-600 shadow-sm"><AlertTriangle size={18} /></div>
                                        ) : (
                                            <div className="p-3 rounded-xl bg-indigo-100 text-indigo-600 shadow-sm"><ShoppingBag size={18} /></div>
                                        )}
                                        <div>
                                            <p className="text-sm font-bold text-slate-800">
                                                {alert.type === 'low_stock' ? 'Low Stock Warning' : 'Pending Order Activity'}
                                            </p>
                                            <p className="text-xs text-slate-500 mt-1 font-medium">{alert.message}</p>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default RetailerDashboard;