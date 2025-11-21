import React from 'react';
import { CheckCircle, Clock, Truck } from 'lucide-react';

function WholesalerOrders() {
    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-extrabold text-slate-900">Retailer Orders</h1>
                <p className="text-slate-500">Manage fulfillment requests from your retail partners.</p>
            </div>

            <div className="bg-white border border-rose-100 rounded-[2rem] shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                        <thead className="bg-rose-50/50 text-slate-700 font-bold uppercase tracking-wider">
                            <tr>
                                <th className="px-8 py-5">Order ID</th>
                                <th className="px-6 py-5">Retailer</th>
                                <th className="px-6 py-5">Items</th>
                                <th className="px-6 py-5">Status</th>
                                <th className="px-8 py-5 text-right">Action</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {/* Order 1 */}
                            <tr className="hover:bg-rose-50/30 transition-colors">
                                <td className="px-8 py-5 font-mono font-bold text-slate-600">#PO-8832</td>
                                <td className="px-6 py-5 font-bold text-slate-900">Fresh Mart Ltd.</td>
                                <td className="px-6 py-5 text-slate-600">10x Rice Bags</td>
                                <td className="px-6 py-5">
                                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-rose-100 text-rose-700">
                                        <Clock size={14} /> New Request
                                    </span>
                                </td>
                                <td className="px-8 py-5 text-right">
                                    <button className="inline-flex items-center gap-2 text-xs font-bold bg-slate-900 text-white px-4 py-2 rounded-xl hover:bg-rose-600 transition-all shadow-lg shadow-slate-200 hover:shadow-rose-200">
                                        <Truck size={14} /> Ship Order
                                    </button>
                                </td>
                            </tr>

                            {/* Order 2 */}
                            <tr className="hover:bg-rose-50/30 transition-colors">
                                <td className="px-8 py-5 font-mono font-bold text-slate-600">#PO-8831</td>
                                <td className="px-6 py-5 font-bold text-slate-900">Green Grocers</td>
                                <td className="px-6 py-5 text-slate-600">50x Apple Crates</td>
                                <td className="px-6 py-5">
                                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-green-100 text-green-700">
                                        <CheckCircle size={14} /> Fulfilled
                                    </span>
                                </td>
                                <td className="px-8 py-5 text-right">
                                    <button className="text-xs font-bold text-slate-400 px-4 py-2 cursor-not-allowed" disabled>
                                        View Details
                                    </button>
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}

export default WholesalerOrders;