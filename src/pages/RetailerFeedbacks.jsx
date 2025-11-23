import React, { useEffect, useState } from 'react';
import { MessageSquare, Star, User, Calendar } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { getRetailerFeedbacks } from '../utils/FeedbackDB';

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
                // Ensure date is a valid date string/object for formatting
                date: item.order?.ordered_at,
                item_name: item.name
            }));
            
            // Sort by date descending
            formattedData.sort((a, b) => new Date(b.date) - new Date(a.date));

            setFeedbacks(formattedData);
            setLoading(false);
        };
        loadFeedbacks();
    }, [user]);

    const renderStars = (rating) => {
        return (
            // Consistent star color - yellow-500
            <div className="flex text-yellow-500">
                {[...Array(5)].map((_, i) => (
                    <Star 
                        key={i} 
                        size={16} // Slightly larger stars
                        fill={i < rating ? "currentColor" : "none"} 
                        strokeWidth={i < rating ? 0 : 2} 
                        className={i < rating ? "text-yellow-500" : "text-slate-300"} 
                    />
                ))}
            </div>
        );
    };

    if (loading) return (
        <div className="p-10 text-center text-xl font-semibold text-slate-700">Loading feedbacks...</div>
    );

    return (
        // ✨ VIBRANCY CHANGE 1: Outer container matching dashboard style
        <div className="min-h-full py-6 px-4 sm:px-6 lg:px-8">
            <div className="max-w-7xl mx-auto space-y-8">
                <div>
                    <h1 className="text-3xl font-extrabold text-slate-900">{user.role==="retailer"?"Customer":"Retailer"} Feedback</h1>
                    <p className="text-slate-500 mt-2">See what your {user.role==="retailer"?"customers":"retailers"} are saying about your products and service.</p>
                </div>

                {/* ✨ VIBRANCY CHANGE 2: Elevated table card style */}
                <div className="bg-white rounded-3xl shadow-2xl shadow-emerald-100/70 border border-slate-100 overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="min-w-full text-left text-sm">
                            {/* ✨ VIBRANCY CHANGE 3: Thematic table header */}
                            <thead className="bg-emerald-50 text-emerald-800 font-bold uppercase tracking-wider text-xs">
                                <tr>
                                    <th className="px-6 py-4">Date</th>
                                    <th className="px-6 py-4">Customer</th>
                                    <th className="px-6 py-4">Product</th>
                                    <th className="px-6 py-4">Rating & Review</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {feedbacks.length === 0 ? (
                                    <tr>
                                        <td colSpan="4" className="px-6 py-10 text-center text-slate-400 font-medium italic">
                                            No feedbacks received yet
                                        </td>
                                    </tr>
                                ) : (
                                    feedbacks.map((item) => (
                                        <tr key={item.id} className="hover:bg-emerald-50/50 transition-colors">
                                            {/* Date Column */}
                                            <td className="px-6 py-4 text-slate-500">
                                                <div className="flex items-center gap-2 font-medium">
                                                    <Calendar size={16} className="text-emerald-500" />
                                                    {new Date(item.date).toLocaleDateString()}
                                                </div>
                                            </td>
                                            
                                            {/* Customer Column */}
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-3">
                                                    {/* Thematic Icon Wrapper */}
                                                    <div className="p-2 bg-emerald-100/70 rounded-full text-emerald-600">
                                                        <User size={14} />
                                                    </div>
                                                    <span className="font-semibold text-slate-800">{item.customer_name}</span>
                                                </div>
                                            </td>
                                            
                                            {/* Product Column */}
                                            <td className="px-6 py-4">
                                                <span className="font-semibold text-slate-900">{item.item_name}</span>
                                            </td>
                                            
                                            {/* Rating & Review Column */}
                                            <td className="px-6 py-4">
                                                <div className="flex flex-col gap-1">
                                                    {renderStars(item.rating)}
                                                    <p className="text-slate-600 text-sm mt-1">
                                                        <span className="text-emerald-500 font-bold italic">"{item.comment}"</span>
                                                    </p>
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
        </div>
    );
}

export default RetailerFeedbacks;