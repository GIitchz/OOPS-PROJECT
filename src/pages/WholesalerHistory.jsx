import React, { useEffect, useState } from 'react';
import { Package, CheckCircle, XCircle, MapPin, Calendar } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { getSellerOrders } from '../utils/OrderDB';

function WholesalerHistory() {
    const { user } = useAuth();
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const loadHistory = async () => {
            if (!user) return;
            const data = await getSellerOrders(user.id);

            // Filter for completed or cancelled orders
            const historyItems = data.filter(order =>
                order.order_status === 'completed' || order.order_status === 'cancelled'
            );

            setOrders(historyItems);
            setLoading(false);
        };
        loadHistory();
    }, [user]);

    const getStatusBadge = (status) => {
        if (status === 'completed') return <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-green-100 text-green-700"><CheckCircle size={14} /> Delivered</span>;
        if (status === 'cancelled') return <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-red-100 text-red-700"><XCircle size={14} /> Cancelled</span>;
        return <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-gray-100 text-gray-700">{status}</span>;
    };

    return (
        <div className="space-y-6 animate-fade-in">
            <div>
                <h1 className="text-2xl font-extrabold text-slate-900">Wholesale Sales History</h1>
                <p className="text-slate-500">Past bulk orders you have successfully fulfilled or cancelled.</p>
            </div>

            <div className="bg-white border border-green-100 rounded-[2rem] shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                        <thead className="bg-green-50 text-slate-700 font-bold uppercase tracking-wider">
                            <tr>
                                <th className="px-6 py-4">Date</th>
                                <th className="px-6 py-4">Item Details</th>
                                <th className="px-6 py-4">Buyer</th>
                                <th className="px-6 py-4 text-right">Final Status</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-green-50">
                            {loading ? (
                                <tr><td colSpan="4" className="px-6 py-10 text-center text-slate-400">Loading history...</td></tr>
                            ) : orders.length === 0 ? (
                                <tr><td colSpan="4" className="px-6 py-10 text-center text-slate-400">No order history found.</td></tr>
                            ) : (
                                orders.map((item) => (
                                    <tr key={item.order_item_id} className="hover:bg-green-50/30 transition-colors">

                                        {/* Date */}
                                        <td className="px-6 py-4 text-slate-500">
                                            <div className="flex items-center gap-2">
                                                <Calendar size={16} className="text-green-300" />
                                                {new Date(item.order?.ordered_at).toLocaleDateString()}
                                            </div>
                                            <div className="text-xs pl-6 pt-1 opacity-70">
                                                {new Date(item.order?.ordered_at).toLocaleTimeString()}
                                            </div>
                                        </td>

                                        {/* Product Info */}
                                        <td className="px-6 py-4">
                                            <div className="flex flex-col">
                                                <span className="font-bold text-slate-900">{item.name}</span>
                                                <span className="text-xs text-slate-500">Qty: {item.quantity} • Total: ₹{item.price * item.quantity}</span>
                                            </div>
                                        </td>

                                        {/* Customer (Retailer in this context) */}
                                        <td className="px-6 py-4">
                                            <div className="flex flex-col gap-1">
                                                <span className="font-bold text-slate-800">{item.order?.buyer?.name || "Unknown Retailer"}</span>
                                                <div className="flex items-center gap-1 text-xs text-slate-500">
                                                    <MapPin size={12} />
                                                    <span className="truncate max-w-[150px]">
                                                        {item.order?.shipping_address?.city || "City N/A"}
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
    );
}

export default WholesalerHistory;