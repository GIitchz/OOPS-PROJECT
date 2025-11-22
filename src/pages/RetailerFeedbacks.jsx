// src/pages/RetailerFeedbacks.jsx
import React, { useEffect, useState } from 'react';
import { MessageSquare, Star, User, Calendar } from 'lucide-react'; 
import { useAuth } from '../context/AuthContext';
import { getRetailerFeedbacks } from '../utils/FeedbackDB'; // 👈 IMPORT THIS

function RetailerFeedbacks() {
    const { user } = useAuth();
    const [feedbacks, setFeedbacks] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const loadFeedbacks = async () => {
            if (!user) return;
            
            // 👇 CALL THE REAL DATABASE FUNCTION
            const data = await getRetailerFeedbacks(user.id);
            
            // Map the raw Supabase data to your UI structure
            const formattedData = data.map(item => ({
                id: item.order_item_id,
                customer_name: item.order?.buyer?.name || "Anonymous",
                rating: item.rating || 0,
                comment: item.feedback,
                date: item.order?.ordered_at,
                item_name: item.name
            }));

            setFeedbacks(formattedData);
            setLoading(false);
        };
        loadFeedbacks();
    }, [user]);

    const renderStars = (rating) => {
        return (
            <div className="flex text-yellow-400">
                {[...Array(5)].map((_, i) => (
                    <Star key={i} size={14} fill={i < rating ? "currentColor" : "none"} strokeWidth={i < rating ? 0 : 2} className={i < rating ? "" : "text-slate-300"} />
                ))}
            </div>
        );
    };

    return (
        <div className="space-y-6 animate-fade-in">
            <div>
                <h1 className="text-2xl font-extrabold text-slate-900">Feedbacks</h1>
                <p className="text-slate-500">See what your customers are saying about your products.</p>
            </div>

            <div className="bg-white border border-rose-100 rounded-[2rem] shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                        <thead className="bg-rose-50/50 text-slate-700 font-bold uppercase tracking-wider">
                            <tr>
                                <th className="px-6 py-4">Date</th>
                                <th className="px-6 py-4">Customer</th>
                                <th className="px-6 py-4">Product</th>
                                <th className="px-6 py-4">Rating & Review</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-rose-50">
                            {loading ? (
                                <tr><td colSpan="4" className="px-6 py-10 text-center text-slate-400">Loading feedbacks...</td></tr>
                            ) : feedbacks.length === 0 ? (
                                <tr><td colSpan="4" className="px-6 py-10 text-center text-slate-400">No feedbacks received yet.</td></tr>
                            ) : (
                                feedbacks.map((item) => (
                                    <tr key={item.id} className="hover:bg-rose-50/30 transition-colors">
                                        <td className="px-6 py-4 text-slate-500">
                                            <div className="flex items-center gap-2">
                                                <Calendar size={16} className="text-rose-300" />
                                                {new Date(item.date).toLocaleDateString()}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-2">
                                                <div className="p-1.5 bg-slate-100 rounded-full text-slate-500">
                                                    <User size={14} />
                                                </div>
                                                <span className="font-bold text-slate-800">{item.customer_name}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="font-bold text-slate-900">{item.item_name}</span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex flex-col gap-1">
                                                {renderStars(item.rating)}
                                                <p className="text-slate-600 text-xs mt-1 italic">"{item.comment}"</p>
                                            </div>
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

export default RetailerFeedbacks;