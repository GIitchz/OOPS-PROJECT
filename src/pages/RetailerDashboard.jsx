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
            // We count it if it was ORDERED today (standard practice), and not cancelled.
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
            .slice(0, 5);

        setRecentOrders(activeRecent);
        setAlerts(newAlerts.slice(0, 5));
        setLoading(false);
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
        <div className="p-10 flex justify-center text-green-400 font-bold animate-pulse">
            Loading dashboard metrics...
        </div>
    );

    return (
        <div className="space-y-8 animate-fade-in">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-extrabold text-slate-900">Store Overview</h1>
                    <p className="text-slate-500 mt-2">Hello! Here's how your shop is performing today.</p>
                </div>
                <div className="text-sm font-bold text-green-600 bg-green-50 px-4 py-2 rounded-xl border border-green-100">
                    📅 {new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' })}
                </div>
            </div>

            {/* Stat Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="bg-white p-6 rounded-[2rem] shadow-sm border border-green-100 hover:shadow-md hover:-translate-y-1 transition-all duration-300">
                    <div className="flex items-center justify-between mb-4">
                        <div className="p-3 rounded-2xl bg-green-100 text-green-600"><DollarSign size={24} /></div>
                        <TrendingUp size={20} className="text-green-500" />
                    </div>
                    <h3 className="text-3xl font-extrabold text-slate-900">₹{stats.sales.toLocaleString('en-IN')}</h3>
                    <p className="text-slate-500 font-bold text-sm mt-1">Today's Sales</p>
                </div>

                <div className="bg-white p-6 rounded-[2rem] shadow-sm border border-green-100 hover:shadow-md hover:-translate-y-1 transition-all duration-300">
                    <div className="flex items-center justify-between mb-4">
                        <div className="p-3 rounded-2xl bg-green-50 text-green-600"><ShoppingBag size={24} /></div>
                    </div>
                    <h3 className="text-3xl font-extrabold text-slate-900">{stats.pending}</h3>
                    <p className="text-slate-500 font-bold text-sm mt-1">Pending Orders</p>
                </div>

                {/* Orange/Indigo stats kept distinct as they are alert/customer related */}
                <div className="bg-white p-6 rounded-[2rem] shadow-sm border border-green-100 hover:shadow-md hover:-translate-y-1 transition-all duration-300">
                    <div className="flex items-center justify-between mb-4">
                        <div className="p-3 rounded-2xl bg-orange-100 text-orange-600"><AlertTriangle size={24} /></div>
                    </div>
                    <h3 className="text-3xl font-extrabold text-slate-900">{stats.lowStock}</h3>
                    <p className="text-slate-500 font-bold text-sm mt-1">Low Stock Items</p>
                </div>

                <div className="bg-white p-6 rounded-[2rem] shadow-sm border border-green-100 hover:shadow-md hover:-translate-y-1 transition-all duration-300">
                    <div className="flex items-center justify-between mb-4">
                        <div className="p-3 rounded-2xl bg-indigo-100 text-indigo-600"><Users size={24} /></div>
                    </div>
                    <h3 className="text-3xl font-extrabold text-slate-900">{stats.customers}</h3>
                    <p className="text-slate-500 font-bold text-sm mt-1">Recent Customers</p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">

                {/* IMPROVED LIVE ORDERS PANEL */}
                <div className="bg-white rounded-[2rem] shadow-sm border border-green-100 p-8">
                    <div className="flex items-center justify-between mb-6">
                        <h2 className="text-xl font-bold text-slate-900">Live Orders</h2>
                        <button onClick={() => navigate('/admin/retailer/orders')} className="text-sm font-bold text-green-600 hover:text-green-700 flex items-center gap-1">
                            View All <ArrowRight size={16} />
                        </button>
                    </div>

                    <div className="space-y-4">
                        {recentOrders.length === 0 ? (
                            <div className="text-center py-8 text-slate-400">
                                <p className="italic">All caught up! No active orders.</p>
                            </div>
                        ) : (
                            recentOrders.map((order) => (
                                <div key={order.order_item_id} className="flex items-center justify-between p-4 bg-green-50/50 rounded-2xl border border-transparent hover:border-green-200 transition-colors">
                                    <div className="flex items-center gap-4">
                                        <div className="h-12 w-12 rounded-full bg-white shadow-sm flex items-center justify-center font-bold text-slate-700 text-xs">
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
                                            className="bg-slate-900 text-white text-xs font-bold px-4 py-2 rounded-xl hover:bg-green-600 transition-colors flex items-center gap-2"
                                        >
                                            <Truck size={14} /> Ship
                                        </button>
                                    ) : (
                                        <span className="bg-blue-100 text-blue-700 text-xs font-bold px-3 py-1 rounded-lg">
                                            Delivering
                                        </span>
                                    )}
                                </div>
                            ))
                        )}
                    </div>
                </div>

                {/* Alerts Panel */}
                <div className="bg-green-50 rounded-[2rem] border border-green-100 p-8">
                    <h2 className="text-xl font-bold text-green-900 mb-6">Alerts & Notifications</h2>
                    <div className="space-y-4">
                        {alerts.length === 0 ? (
                            <div className="bg-white p-4 rounded-2xl shadow-sm flex gap-4 items-center">
                                <div className="bg-green-100 p-2 rounded-full text-green-600"><Package size={18} /></div>
                                <p className="text-sm font-bold text-slate-600">All clear! Inventory and orders look good.</p>
                            </div>
                        ) : (
                            alerts.map((alert) => (
                                <div key={alert.id} className="bg-white p-4 rounded-2xl shadow-sm flex gap-4 items-start">
                                    {alert.type === 'low_stock' ? (
                                        <div className="bg-orange-100 p-2 rounded-full text-orange-600"><AlertTriangle size={18} /></div>
                                    ) : (
                                        <div className="bg-indigo-100 p-2 rounded-full text-indigo-600"><ShoppingBag size={18} /></div>
                                    )}
                                    <div>
                                        <p className="text-sm font-bold text-slate-800">
                                            {alert.type === 'low_stock' ? 'Low Stock Warning' : 'New Activity'}
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
    );
}

export default RetailerDashboard;