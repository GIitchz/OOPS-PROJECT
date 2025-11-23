import React, { useEffect, useState } from 'react';
import { CheckCircle, Clock, Truck, XCircle, MapPin } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { getSellerOrders, updateOrderItemStatus } from '../utils/OrderDB';
import { checkStockAvailability, adjustListingStock } from '../utils/InventoryDB';

function WholesalerOrders() {
    const { user } = useAuth();
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);

    const loadOrders = async () => {
        if (!user) return;
        const data = await getSellerOrders(user.id);
        const activeOrders = data.filter(order =>
            order.order_status !== 'completed' && order.order_status !== 'cancelled'
        );
        setOrders(activeOrders);
        setLoading(false);
    };

    useEffect(() => {
        loadOrders();
    }, [user]);

    const handleStatusUpdate = async (item, newStatus) => {

        // Confirmation
        if (newStatus === 'completed' || newStatus === 'cancelled') {
            if (!window.confirm("Are you sure you want to finalize this order?")) return;
        }

        // Update UI
        setOrders(prev => prev.map(o =>
            o.order_item_id === item.order_item_id ? { ...o, order_status: newStatus } : o
        ));

        // Update DB
        const { error } = await updateOrderItemStatus(item.order_item_id, newStatus);
        if (error) {
            alert("Failed to update status.");
            loadOrders();
        }
    };

    const getStatusBadge = (status) => {
        switch (status) {
            case 'completed': return <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-green-100 text-green-700"><CheckCircle size={14} /> Delivered</span>;
            case 'delivering': return <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-100 text-blue-700"><Truck size={14} /> Shipping</span>;
            case 'cancelled': return <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-red-100 text-red-700"><XCircle size={14} /> Cancelled</span>;
            default: return <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-yellow-100 text-yellow-700"><Clock size={14} /> New Request</span>;
        }
    };

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-extrabold text-slate-900">Retailer Orders</h1>
                <p className="text-slate-500">Manage fulfillment requests from your retail partners.</p>
            </div>

            <div className="bg-white border border-green-100 rounded-[2rem] shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                        <thead className="bg-green-50 text-slate-700 font-bold uppercase tracking-wider">
                            <tr>
                                <th className="px-8 py-5">Order Details</th>
                                <th className="px-6 py-5">Retailer Info</th>
                                <th className="px-6 py-5">Status</th>
                                <th className="px-8 py-5 text-right">Action</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {loading ? (
                                <tr><td colSpan="4" className="px-8 py-10 text-center text-slate-400">Loading orders...</td></tr>
                            ) : orders.length === 0 ? (
                                <tr><td colSpan="4" className="px-8 py-10 text-center text-slate-400">No pending orders.</td></tr>
                            ) : (
                                orders.map((item) => (
                                    <tr key={item.order_item_id} className="hover:bg-green-50/30 transition-colors">
                                        <td className="px-8 py-5">
                                            <div className="flex flex-col">
                                                <span className="font-bold text-slate-900 text-base">{item.name}</span>
                                                <span className="text-xs text-slate-500">Qty: {item.quantity} • Total: ₹{item.price * item.quantity}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-5">
                                            <div className="flex flex-col gap-1">
                                                <span className="font-bold text-slate-800">{item.order?.buyer?.name || "Unknown Retailer"}</span>
                                                <div className="flex items-start gap-1 text-xs text-slate-500">
                                                    <MapPin size={14} className="mt-0.5 shrink-0" />
                                                    <span>{item.order ? `${item.order.city}, ${item.order.pincode}` : "N/A"}</span>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-5">{getStatusBadge(item.order_status)}</td>
                                        <td className="px-8 py-5 text-right">
                                            <select
                                                className="bg-white border border-green-200 text-slate-700 text-xs font-bold py-2 px-3 rounded-xl outline-none focus:ring-2 focus:ring-green-500 cursor-pointer"
                                                value={item.order_status}
                                                onChange={(e) => handleStatusUpdate(item, e.target.value)}
                                            >
                                                <option value="pending">Pending</option>
                                                <option value="delivering">Ship Order</option>
                                                <option value="completed">Complete</option>
                                                <option value="cancelled">Cancel</option>
                                            </select>
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

export default WholesalerOrders;