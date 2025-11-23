import React, { useEffect, useState } from 'react';
import { DollarSign, ShoppingBag, Users, AlertTriangle, TrendingUp, Package, Truck, ArrowRight } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { getSellerOrders, updateOrderItemStatus } from '../utils/OrderDB';
import { getRetailerListings } from '../utils/InventoryDB';
import { useNavigate } from 'react-router-dom';

function WholesalerDashboard() {
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

    useEffect(() => {
        const fetchData = async () => {
            if (!user) return;

            const [ordersData, inventoryData] = await Promise.all([
                getSellerOrders(user.id),
                getRetailerListings(user.id)
            ]);

            const startOfDay = new Date();
            startOfDay.setHours(0, 0, 0, 0);

            let todaySales = 0;
            let pendingCount = 0;
            const recentBuyers = new Set();
            let lowStockCount = 0;

            ordersData.forEach(item => {
                if (item.order_status !== 'cancelled') {
                    if (new Date(item.order?.ordered_at) >= startOfDay) {
                        todaySales += (item.price * item.quantity);
                    }
                    if (item.order.buyer?.name) recentBuyers.add(item.order.buyer.name);
                }
                if (item.order_status === 'pending' || item.order_status === 'delivering') {
                    pendingCount++;
                }
            });

            inventoryData.forEach(item => {
                if (item.stock < 50) lowStockCount++; // Higher threshold for bulk
            });

            setStats({
                sales: todaySales,
                pending: pendingCount,
                lowStock: lowStockCount,
                customers: recentBuyers.size
            });

            setRecentOrders(ordersData.filter(o => o.order_status === 'pending' || o.order_status === 'delivering').slice(0, 5));
            setLoading(false);
        };

        fetchData();
    }, [user]);

    if (loading) return <div className="p-10 text-center text-green-400 font-bold animate-pulse">Loading dashboard...</div>;

    return (
        <div className="space-y-8 animate-fade-in">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-extrabold text-slate-900">Wholesale Overview</h1>
                    <p className="text-slate-500 mt-2">Track your bulk supply chain performance.</p>
                </div>
            </div>

            {/* Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="bg-white p-6 rounded-[2rem] shadow-sm border border-green-100 hover:shadow-md transition-all">
                    <div className="flex items-center justify-between mb-4">
                        <div className="p-3 rounded-2xl bg-green-100 text-green-600"><DollarSign size={24} /></div>
                    </div>
                    <h3 className="text-3xl font-extrabold text-slate-900">₹{stats.sales.toLocaleString('en-IN')}</h3>
                    <p className="text-slate-500 font-bold text-sm mt-1">Today's Revenue</p>
                </div>
                <div className="bg-white p-6 rounded-[2rem] shadow-sm border border-green-100 hover:shadow-md transition-all">
                    <div className="flex items-center justify-between mb-4">
                        <div className="p-3 rounded-2xl bg-green-50 text-green-600"><ShoppingBag size={24} /></div>
                    </div>
                    <h3 className="text-3xl font-extrabold text-slate-900">{stats.pending}</h3>
                    <p className="text-slate-500 font-bold text-sm mt-1">Pending Shipments</p>
                </div>
                <div className="bg-white p-6 rounded-[2rem] shadow-sm border border-green-100 hover:shadow-md transition-all">
                    <div className="flex items-center justify-between mb-4">
                        <div className="p-3 rounded-2xl bg-orange-100 text-orange-600"><AlertTriangle size={24} /></div>
                    </div>
                    <h3 className="text-3xl font-extrabold text-slate-900">{stats.lowStock}</h3>
                    <p className="text-slate-500 font-bold text-sm mt-1">Low Bulk Stock</p>
                </div>
                <div className="bg-white p-6 rounded-[2rem] shadow-sm border border-green-100 hover:shadow-md transition-all">
                    <div className="flex items-center justify-between mb-4">
                        <div className="p-3 rounded-2xl bg-indigo-100 text-indigo-600"><Users size={24} /></div>
                    </div>
                    <h3 className="text-3xl font-extrabold text-slate-900">{stats.customers}</h3>
                    <p className="text-slate-500 font-bold text-sm mt-1">Active Retailers</p>
                </div>
            </div>

            {/* Live Orders */}
            <div className="bg-white rounded-[2rem] shadow-sm border border-green-100 p-8">
                <div className="flex items-center justify-between mb-6">
                    <h2 className="text-xl font-bold text-slate-900">Live Orders</h2>
                    <button onClick={() => navigate('/admin/wholesaler/orders')} className="text-sm font-bold text-green-600 hover:text-green-700 flex items-center gap-1">View All <ArrowRight size={16} /></button>
                </div>
                <div className="space-y-4">
                    {recentOrders.map((order) => (
                        <div key={order.order_item_id} className="flex items-center justify-between p-4 bg-green-50/50 rounded-2xl border border-transparent hover:border-green-200 transition-colors">
                            <div className="flex items-center gap-4">
                                <div className="h-12 w-12 rounded-full bg-white shadow-sm flex items-center justify-center font-bold text-slate-700 text-xs">#{order.order_item_id}</div>
                                <div>
                                    <p className="font-bold text-slate-800">{order.name}</p>
                                    <p className="text-xs text-slate-500 font-medium">{order.quantity} units • {order.order?.buyer?.name || 'Unknown'}</p>
                                </div>
                            </div>
                            <span className="bg-blue-100 text-blue-700 text-xs font-bold px-3 py-1 rounded-lg">{order.order_status}</span>
                        </div>
                    ))}
                    {recentOrders.length === 0 && <p className="text-center text-slate-400 italic py-4">No pending orders.</p>}
                </div>
            </div>
        </div>
    );
}

export default WholesalerDashboard;