// pages/RetailerOrders.jsx

import React, { useEffect, useState } from 'react';
import { Package, CheckCircle, Truck, Clock, XCircle, MapPin } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { getSellerOrders, updateOrderItemStatus } from '../utils/OrderDB';
import { checkStockAvailability, adjustListingStock } from '../utils/InventoryDB';

function RetailerOrders() {
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

        // --- 1. STOCK CHECK LOGIC ---
        if (newStatus === 'delivering' && item.order_status === 'pending') {
            const listingId = item.listing_id || item.listing?.product_listings_id;

            if (!listingId) {
                console.error("Missing listing ID for stock check", item);
                alert("Error: Could not identify listing to update stock.");
                return;
            }

            const isAvailable = await checkStockAvailability(listingId, item.quantity);

            if (!isAvailable) {
                alert(`❌ INSUFFICIENT STOCK!\n\nOrder requires: ${item.quantity} units.\nYou do not have enough stock.\n\nPlease restock from the Wholesale Market first.`);
                return;
            }
        }

        // 2. Confirmation Check
        if (newStatus === 'completed' || newStatus === 'cancelled') {
            const confirmMessage = newStatus === 'completed'
                ? "Are you sure this order has been delivered?"
                : "Are you sure you want to cancel this order?";
            if (!window.confirm(confirmMessage)) return;
        }

        // 3. Optimistic UI Update
        setOrders(prev => prev.map(o =>
            o.order_item_id === item.order_item_id ? { ...o, order_status: newStatus } : o
        ));

        // 4. Database Update
        const { error } = await updateOrderItemStatus(item.order_item_id, newStatus);

        if (error) {
            console.error(error);
            alert("Failed to update status.");
            loadOrders();
        }
    };

    const getStatusBadge = (status) => {
        switch (status) {
            case 'completed': return <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-green-100 text-green-700"><CheckCircle size={14} /> Delivered</span>;
            case 'delivering': return <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-100 text-blue-700"><Truck size={14} /> On the Way</span>;
            case 'cancelled': return <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-red-100 text-red-700"><XCircle size={14} /> Cancelled</span>;
            default: return <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-yellow-100 text-yellow-700"><Clock size={14} /> Pending</span>;
        }
    };

    // Helper to extract address string safely
    const getAddressString = (order) => {
        const addr = order?.shipping_address;
        if (!addr) return "Address details hidden";
        // Handle potential column naming differences (address1 vs address)
        const line1 = addr.address1 || addr.address || "";
        return `${line1}, ${addr.city || ""} - ${addr.pincode || ""}`;
    };

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-extrabold text-slate-900">Customer Orders</h1>
                <p className="text-slate-500">Manage active orders. Shipping an item will deduct it from your inventory.</p>
            </div>

            <div className="bg-white border border-rose-100 rounded-[2rem] shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                        <thead className="bg-rose-50/50 text-slate-700 font-bold uppercase tracking-wider">
                            <tr>
                                <th className="px-6 py-4">Order Item</th>
                                <th className="px-6 py-4">Customer & Location</th>
                                <th className="px-6 py-4">Status</th>
                                <th className="px-6 py-4 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-rose-50">
                            {loading ? (
                                <tr><td colSpan="4" className="px-6 py-10 text-center text-slate-400">Loading orders...</td></tr>
                            ) : orders.length === 0 ? (
                                <tr><td colSpan="4" className="px-6 py-10 text-center text-slate-400">No pending orders found.</td></tr>
                            ) : (
                                orders.map((item) => (
                                    <tr key={item.order_item_id} className="hover:bg-rose-50/30 transition-colors">

                                        <td className="px-6 py-4">
                                            <div className="flex flex-col">
                                                <span className="font-bold text-slate-900 text-base">{item.name}</span>
                                                <span className="text-xs text-slate-500">Qty: {item.quantity} • Order #{item.order?.order_id ?? 'N/A'}</span>
                                                <span className="text-rose-600 font-bold mt-1">₹{item.price * item.quantity}</span>
                                            </div>
                                        </td>

                                        <td className="px-6 py-4">
                                            <div className="flex flex-col gap-1">
                                                <span className="font-bold text-slate-800">{item.order?.buyer?.name || "Unknown Customer"}</span>
                                                <div className="flex items-start gap-1 text-xs text-slate-500">
                                                    <MapPin size={14} className="mt-0.5 shrink-0" />
                                                    <span className="truncate max-w-[200px]">
                                                        {getAddressString(item.order)}
                                                    </span>
                                                </div>
                                            </div>
                                        </td>

                                        <td className="px-6 py-4">
                                            {getStatusBadge(item.order_status)}
                                        </td>

                                        <td className="px-6 py-4 text-right">
                                            <select
                                                className="bg-white border border-rose-200 text-slate-700 text-xs font-bold py-2 px-3 rounded-xl outline-none focus:ring-2 focus:ring-rose-500 cursor-pointer shadow-sm"
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