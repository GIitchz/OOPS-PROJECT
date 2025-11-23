import React, { useEffect, useState } from 'react';
import { Package, CheckCircle, XCircle, MapPin, Calendar, ClipboardList } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { getSellerOrders } from '../utils/OrderDB';

function RetailerHistory() {
    const { user } = useAuth();
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const loadHistory = async () => {
            if (!user) return;
            const data = await getSellerOrders(user.id);
            // Only show completed or cancelled items
            const historyItems = data.filter(order =>
                order.order_status === 'completed' || order.order_status === 'cancelled'
            ).sort((a, b) => new Date(b.order?.ordered_at) - new Date(a.order?.ordered_at)); // Sort newest first

            setOrders(historyItems);
            setLoading(false);
        };
        loadHistory();
    }, [user]);

    // Updated badge style for thematic consistency
    const getStatusBadge = (status) => {
        if (status === 'completed') return <span className="inline-flex items-center gap-1 px-3 py-1 rounded-xl text-xs font-extrabold bg-emerald-100 text-emerald-700"><CheckCircle size={14} /> Delivered</span>;
        if (status === 'cancelled') return <span className="inline-flex items-center gap-1 px-3 py-1 rounded-xl text-xs font-extrabold bg-red-100 text-red-700"><XCircle size={14} /> Cancelled</span>;
        // Fallback for any other status (though filtered out)
        return <span className="inline-flex items-center gap-1 px-3 py-1 rounded-xl text-xs font-extrabold bg-gray-100 text-gray-700">{status}</span>;
    };

    if (loading) return (
        // Consistent loading style
        <div className="p-10 text-center text-xl font-semibold text-slate-700">Loading history...</div>
    );

    return (
        // ✨ VIBRANCY CHANGE 1: Outer container matching dashboard style
        <div className="min-h-full py-6 px-4 sm:px-6 lg:px-8">
            <div className="max-w-7xl mx-auto space-y-8">
                <div>
                    <h1 className="text-3xl font-extrabold text-slate-900">Sales History <ClipboardList className="inline-block align-text-bottom text-emerald-500" size={32} /></h1>
                    <p className="text-slate-500 mt-2">Past orders you have successfully fulfilled or cancelled.</p>
                </div>

                {/* ✨ VIBRANCY CHANGE 2: Elevated table card style */}
                <div className="bg-white rounded-3xl shadow-2xl shadow-emerald-100/70 border border-slate-100 overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="min-w-full text-left text-sm">
                            {/* ✨ VIBRANCY CHANGE 3: Thematic table header */}
                            <thead className="bg-emerald-50 text-emerald-800 font-bold uppercase tracking-wider text-xs">
                                <tr>
                                    <th className="px-6 py-4">Date & Time</th>
                                    <th className="px-6 py-4">Item Details</th>
                                    <th className="px-6 py-4">Customer & Location</th>
                                    <th className="px-6 py-4 text-right">Final Status</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {orders.length === 0 ? (
                                    <tr>
                                        <td colSpan="4" className="px-6 py-10 text-center text-slate-400 font-medium italic">
                                            No completed or cancelled order history found.
                                        </td>
                                    </tr>
                                ) : (
                                    orders.map((item) => (
                                        <tr key={item.order_item_id} className="hover:bg-emerald-50/50 transition-colors">

                                            {/* Date */}
                                            <td className="px-6 py-4 text-slate-500">
                                                <div className="flex items-center gap-2 font-medium text-slate-700">
                                                    <Calendar size={16} className="text-emerald-500" />
                                                    {new Date(item.order?.ordered_at).toLocaleDateString()}
                                                </div>
                                                <div className="text-xs pl-6 pt-1 text-slate-400 font-normal">
                                                    {new Date(item.order?.ordered_at).toLocaleTimeString()}
                                                </div>
                                            </td>

                                            {/* Product Info */}
                                            <td className="px-6 py-4">
                                                <div className="flex flex-col">
                                                    <span className="font-extrabold text-slate-900">{item.name}</span>
                                                    <span className="text-xs text-slate-500 font-medium mt-0.5">
                                                        Qty: {item.quantity} • Total: <span className="font-extrabold text-emerald-600">₹{Number(item.price) * Number(item.quantity)}</span>
                                                    </span>
                                                </div>
                                            </td>

                                            {/* Customer */}
                                            <td className="px-6 py-4">
                                                <div className="flex flex-col gap-1">
                                                    <span className="font-semibold text-slate-800">{item.order?.buyer?.name || "Unknown Customer"}</span>
                                                    <div className="flex items-center gap-1 text-xs text-slate-500 font-medium">
                                                        <MapPin size={12} className="text-emerald-400" />
                                                        <span className="truncate max-w-[150px]">
                                                            {item.order?.formatted_address || "City N/A"}
                                                        </span>
                                                    </div>
                                                </div>
                                            </td>

                                            {/* Status */}
                                            <td className="px-6 py-4 text-right">
                                                {getStatusBadge(item.order_status)}
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default RetailerHistory;