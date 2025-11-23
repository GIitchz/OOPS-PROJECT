import React, { useEffect, useState } from 'react';
import { Package, CheckCircle, Truck, Clock, XCircle, MapPin, ListOrdered } from 'lucide-react'; // Added ListOrdered for main icon
import { useAuth } from '../context/AuthContext';
import { getSellerOrders, updateOrderItemStatus } from '../utils/OrderDB';
import { checkStockAvailability, adjustListingStock } from '../utils/InventoryDB';

function RetailerOrders() {
    const { user } = useAuth();
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);

    const loadOrders = async () => {
        if (!user) return;
        // In a real app, you might only load 'pending' and 'delivering' status
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

        // Confirmation Check
        if (newStatus === 'completed' || newStatus === 'cancelled') {
            const confirmMessage = newStatus === 'completed'
                ? "Are you sure this order has been delivered?"
                : "Are you sure you want to cancel this order?";
            if (!window.confirm(confirmMessage)) return;
        }
        
        // ** (In a complete implementation, 'delivering' status should also trigger an inventory deduction here) **

        // Optimistic UI Update
        setOrders(prev => prev.map(o =>
            o.order_item_id === item.order_item_id ? { ...o, order_status: newStatus } : o
        ));

        // Database Update
        const { error } = await updateOrderItemStatus(item.order_item_id, newStatus);

        if (error) {
            console.error(error);
            alert("Failed to update status.");
            loadOrders();
        }
    };

    const getStatusBadge = (status) => {
        switch (status) {
            case 'completed': return <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-green-50 text-emerald-700 border border-emerald-300"><CheckCircle size={14} /> Delivered</span>;
            case 'delivering': return <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-indigo-50 text-indigo-700 border border-indigo-300"><Truck size={14} /> On the Way</span>; // Changed 'blue' to 'indigo' for better contrast/palette
            case 'cancelled': return <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-red-50 text-red-700 border border-red-300"><XCircle size={14} /> Cancelled</span>;
            default: return <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-700 border border-amber-300"><Clock size={14} /> Pending</span>; // Changed 'yellow' to 'amber'
        }
    };

    // Helper to extract address string safely
    const getAddressString = (order) => {
        const addr = order?.shipping_address;
        if (!addr) return "Address details unavailable";
        const line1 = addr.address1 || addr.address || "";
        return `${line1}, ${addr.city || ""} - ${addr.pincode || ""}`;
    };

    // Styling for the table headers and actions button has been updated for the new theme.

    return (
        // Consistent padding and background
        <div className="py-8 px-4 sm:px-6 lg:px-8 space-y-8">
            <div className="flex items-center gap-3">
                <ListOrdered size={32} className="text-emerald-600" />
                <div>
                    {/* Stronger, consistent heading style */}
                    <h1 className="text-3xl font-extrabold text-slate-900">Customer Orders</h1>
                    <p className="text-slate-500 mt-1">Manage active orders from your customers.</p>
                </div>
            </div>

            {/* Main content box: rounded-3xl, shadow-xl */}
            <div className="bg-white rounded-3xl shadow-xl shadow-slate-100/50 border border-slate-100 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                        <thead className="bg-emerald-50 text-slate-700 font-extrabold uppercase tracking-wider border-b border-slate-100">
                            <tr>
                                <th className="px-6 py-4">Order Item</th>
                                <th className="px-6 py-4">Customer & Location</th>
                                <th className="px-6 py-4">Status</th>
                                <th className="px-6 py-4 text-right">Update Status</th>
                            </tr>
                        </thead>
                        {/* Soft divide lines */}
                        <tbody className="divide-y divide-slate-100"> 
                            {loading ? (
                                <tr><td colSpan="4" className="px-6 py-10 text-center text-slate-400 font-semibold">Loading orders...</td></tr>
                            ) : orders.length === 0 ? (
                                <tr><td colSpan="4" className="px-6 py-10 text-center text-slate-400 font-semibold">No active orders found.</td></tr>
                            ) : (
                                orders.map((item) => (
                                    <tr key={item.order_item_id} className="hover:bg-emerald-50/50 transition-colors">

                                        <td className="px-6 py-4">
                                            <div className="flex flex-col">
                                                <span className="font-bold text-slate-900 text-base">{item.name}</span>
                                                <span className="text-xs text-slate-500">Qty: {item.quantity} • Item ID: {item.order_item_id}</span>
                                                <span className="text-emerald-600 font-extrabold mt-1">₹{item.price * item.quantity}</span>
                                            </div>
                                        </td>

                                        <td className="px-6 py-4">
                                            <div className="flex flex-col gap-1">
                                                <span className="font-bold text-slate-800">{item.order?.buyer?.name || "Unknown Customer"}</span>
                                                <div className="flex items-start gap-1 text-xs text-slate-500 mt-1">
                                                    <MapPin size={14} className="mt-0.5 shrink-0 text-emerald-400" /> 
                                                    <span className="truncate max-w-[200px]">{getAddressString(item.order)}</span>
                                                </div>
                                            </div>
                                        </td>

                                        <td className="px-6 py-4">
                                            {getStatusBadge(item.order_status)}
                                        </td>

                                        <td className="px-6 py-4 text-right">
                                            <select
                                                // Consistent button/input styling
                                                className="bg-white border border-slate-200 text-slate-700 text-sm font-semibold py-2 px-3 rounded-xl outline-none transition-all duration-200 focus:ring-2 focus:ring-emerald-500 cursor-pointer shadow-sm hover:border-emerald-300"
                                                value={item.order_status}
                                                onChange={(e) => handleStatusUpdate(item, e.target.value)}
                                                disabled={item.order_status === 'completed' || item.order_status === 'cancelled'}
                                            >
                                                <option value="pending">Pending</option>
                                                <option value="delivering">Ship Order</option>
                                                <option value="completed">Mark Delivered</option>
                                                <option value="cancelled">Cancel Order</option>
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

export default RetailerOrders;