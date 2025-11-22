import React from "react";
import { Link, useLocation } from "react-router-dom";
import { CheckCircle, ArrowRight } from "lucide-react";
import { useAuth } from "../context/AuthContext"; // Import useAuth

function OrderSuccessPage() {
    const location = useLocation();
    const { user } = useAuth(); // Get the user to check their role
    const orderId = location.state?.orderId || null;

    // Dynamic Redirect Logic
    // If Retailer -> Go to Wholesale Market
    // If Customer -> Go to Main Dashboard
    const continuePath = user?.role === 'retailer'
        ? '/admin/retailer/wholesale'
        : '/dashboard';

    return (
        <div className="min-h-[calc(100vh-80px)] flex items-center justify-center bg-rose-50 p-4">
            <div className="bg-white p-10 sm:p-12 rounded-[2rem] shadow-2xl shadow-rose-100 max-w-md w-full text-center border border-rose-100">

                <div className="mx-auto h-24 w-24 bg-green-100 rounded-full flex items-center justify-center mb-6 animate-bounce">
                    <CheckCircle className="h-12 w-12 text-green-600" />
                </div>

                <h1 className="text-3xl font-extrabold text-slate-900 mb-3">
                    Order Placed!
                </h1>

                <p className="text-slate-500 mb-8 text-lg">
                    Your order has been confirmed and will be on its way soon.
                </p>

                {orderId && (
                    <div className="bg-slate-50 p-4 rounded-xl mb-8 border border-slate-100">
                        <p className="text-sm text-slate-500 uppercase tracking-wide font-bold mb-1">Order ID</p>
                        <p className="text-xl font-mono font-bold text-slate-800">#{orderId}</p>
                    </div>
                )}

                <Link
                    to={continuePath}
                    className="inline-flex items-center justify-center w-full px-8 py-4 border border-transparent text-lg font-bold rounded-2xl text-white bg-rose-500 hover:bg-rose-600 transition-all shadow-lg shadow-rose-200 hover:-translate-y-1"
                >
                    Continue Shopping <ArrowRight className="ml-2" size={20} />
                </Link>
            </div>
        </div>
    );
}

export default OrderSuccessPage;