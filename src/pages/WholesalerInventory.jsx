import React from 'react';
import { Plus, Edit2, Trash2, Package } from 'lucide-react';

function WholesalerInventory() {
    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-extrabold text-slate-900">Bulk Inventory</h1>
                    <p className="text-slate-500">Manage stock available for retailers.</p>
                </div>
                <button className="inline-flex items-center gap-2 bg-rose-500 text-white px-6 py-3 rounded-2xl font-bold hover:bg-rose-600 shadow-lg shadow-rose-200 transition-all hover:-translate-y-0.5">
                    <Plus size={20} />
                    Add Bulk Item
                </button>
            </div>

            <div className="bg-white border border-rose-100 rounded-[2rem] shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                        <thead className="bg-rose-50/50 text-slate-700 font-bold uppercase tracking-wider">
                            <tr>
                                <th className="px-8 py-5">Item Name</th>
                                <th className="px-6 py-5">Unit Price</th>
                                <th className="px-6 py-5">Stock Level</th>
                                <th className="px-8 py-5 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {/* Row 1 */}
                            <tr className="hover:bg-rose-50/30 transition-colors group">
                                <td className="px-8 py-5">
                                    <div className="flex items-center gap-3">
                                        <div className="p-2 bg-rose-50 rounded-xl text-rose-500">
                                            <Package size={20} />
                                        </div>
                                        <span className="font-bold text-slate-900">Premium Apples (Crate)</span>
                                    </div>
                                </td>
                                <td className="px-6 py-5 text-rose-600 font-bold">₹2,500.00</td>
                                <td className="px-6 py-5">
                                    <div className="w-32 bg-slate-100 rounded-full h-2 mb-2">
                                        <div className="bg-green-500 h-2 rounded-full" style={{ width: '80%' }}></div>
                                    </div>
                                    <span className="text-xs font-bold text-slate-400">200 Crates left</span>
                                </td>
                                <td className="px-8 py-5 text-right space-x-2">
                                    <button className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-colors">
                                        <Edit2 size={18} />
                                    </button>
                                    <button className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-colors">
                                        <Trash2 size={18} />
                                    </button>
                                </td>
                            </tr>

                            {/* Row 2 */}
                            <tr className="hover:bg-rose-50/30 transition-colors group">
                                <td className="px-8 py-5">
                                    <div className="flex items-center gap-3">
                                        <div className="p-2 bg-rose-50 rounded-xl text-rose-500">
                                            <Package size={20} />
                                        </div>
                                        <span className="font-bold text-slate-900">Basmati Rice (25kg Bag)</span>
                                    </div>
                                </td>
                                <td className="px-6 py-5 text-rose-600 font-bold">₹1,800.00</td>
                                <td className="px-6 py-5">
                                    <div className="w-32 bg-slate-100 rounded-full h-2 mb-2">
                                        <div className="bg-orange-400 h-2 rounded-full" style={{ width: '20%' }}></div>
                                    </div>
                                    <span className="text-xs font-bold text-orange-400">Low Stock (15 Bags)</span>
                                </td>
                                <td className="px-8 py-5 text-right space-x-2">
                                    <button className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-colors">
                                        <Edit2 size={18} />
                                    </button>
                                    <button className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-colors">
                                        <Trash2 size={18} />
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

export default WholesalerInventory;