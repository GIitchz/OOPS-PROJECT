import React, { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { CheckCircle, Truck, ShoppingCart, Loader2, DollarSign, List, MapPin } from 'lucide-react';
import { getOrders } from "../utils/OrderDB";
import useAuth from "../context/AuthContext";
import { OrderInterface } from "../utils/Interfaces";

function OrderSuccessPage() {
    const { user } = useAuth();
    const [searchParams] = useSearchParams();
    const [orderData, setOrderData] = useState<OrderInterface | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    // Utility for consistent currency formatting
    const formatIndianRupee = (amount: string) => {
        const num = parseFloat(amount);
        if (isNaN(num)) return amount;
        return new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: 'INR',
            minimumFractionDigits: 2,
        }).format(num);
    };

    useEffect(() => {
        setIsLoading(true);
        // Assuming the latest order is the one just completed
        getOrders(user).then(
            (data) => {
                // Find the latest order (assuming data is sorted or the latest is at index 0)
                setOrderData(data[0]); 
                setIsLoading(false);
            }
        ).catch(() => {
            setIsLoading(false);
            // Handle error state if necessary
        });
    }, [user]);

    if (isLoading) {
        return (
            // ✨ Background change for consistency
            <div className="min-h-[calc(100vh-80px)] flex items-center justify-center bg-gray-50/70">
                <div className="flex flex-col items-center p-12 bg-white rounded-3xl shadow-2xl shadow-emerald-200/50">
                    <Loader2 className="w-12 h-12 text-emerald-600 animate-spin mb-4" />
                    <h2 className="text-2xl font-semibold text-slate-800">Confirming Your Order...</h2>
                    <p className="text-slate-500 mt-2">Please wait, we are retrieving your payment and order details.</p>
                </div>
            </div>
        );
    }

    // Success Screen
    return (
        // ✨ Background change for consistency
        <div className="min-h-[calc(100vh-80px)] flex flex-col items-center justify-center bg-gray-50/70 p-4">

            {/* ✨ Increased shadow strength and emerald color for pop */}
            <div className="w-full max-w-3xl bg-white p-6 sm:p-12 rounded-3xl shadow-2xl shadow-emerald-300/80 transition-all duration-500 transform scale-100 border border-slate-100">

                {/* Header */}
                <div className="text-center mb-10">
                    {/* ✨ Larger icon and stronger animation */}
                    <CheckCircle className="w-20 h-20 text-emerald-600 mx-auto mb-5 animate-pulse" /> 
                    <h1 className="text-4xl font-extrabold tracking-tight text-slate-900 mb-2">
                        Order Confirmed!
                    </h1>
                    <p className="text-xl text-slate-600">
                        Thank you for shopping with <span className="font-extrabold text-emerald-600">The Grove</span>.
                    </p>
                </div>

                {/* Confirmation Details Card */}
                {/* ✨ Deeper background and border, clearer styling */}
                <div className="bg-emerald-50 p-6 rounded-2xl border border-emerald-300 mb-8 shadow-inner">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-y-4 gap-x-12 text-slate-700">
                        {/* Updated to use the correct icons */}
                        <DetailItem title="Order ID" value={`${orderData?.order_id}`} icon={List} />
                        <DetailItem 
                            title="Total Paid" 
                            value={formatIndianRupee(`${orderData?.payment?.amount}` || "0")} 
                            isBold 
                            icon={DollarSign} 
                        />
                        <DetailItem title="Payment Method" value={orderData?.payment?.mode === 'offline' ? 'Cash on Delivery' : 'Online Payment'} icon={DollarSign} />
                        <DetailItem title="Status" value={orderData?.order_items[0].order_status} icon={Truck} />
                    </div>
                </div>

                {/* Shipping & Next Steps */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">

                    {/* Shipping Address Panel */}
                    {/* ✨ Stronger shadow for distinction */}
                    <div className="p-6 bg-white border border-slate-200 rounded-2xl shadow-lg shadow-slate-100">
                        <h3 className="text-xl font-bold text-slate-800 mb-3 flex items-center">
                            {/* ✨ Stronger color for icon */}
                            <MapPin className="w-6 h-6 mr-2 text-emerald-600" />
                            Shipping To
                        </h3>
                        <p className="text-slate-700 leading-relaxed font-semibold">
                            {orderData?.formatted_address}
                        </p>
                    </div>

                    {/* Action Panel */}
                    {/* ✨ Deeper background for action section */}
                    <div className="p-6 bg-emerald-50 border border-emerald-200 rounded-2xl shadow-lg shadow-emerald-100">
                        <h3 className="text-xl font-bold text-slate-800 mb-4 flex items-center">
                            {/* ✨ Stronger color for icon */}
                            <ShoppingCart className="w-6 h-6 mr-2 text-emerald-700" />
                            What's Next?
                        </h3>
                        <div className="flex flex-col space-y-4">
                            {/* ✨ Primary CTA with stronger hover effect */}
                            <Link
                                to={`/profile/orders`}
                                className="w-full text-center px-4 py-3 border border-transparent text-lg font-extrabold rounded-xl text-white bg-emerald-600 hover:bg-emerald-700 transition-all shadow-lg hover:shadow-xl transform duration-300"
                            >
                                View Order Details
                            </Link>
                            {/* ✨ Secondary CTA with better border/hover contrast */}
                            <Link
                                to={(user?.role === 'customer') ? "/dashboard" : "/admin/retailer/wholesale"}
                                className="w-full text-center px-4 py-3 border-2 border-emerald-300 text-lg font-extrabold rounded-xl text-emerald-600 bg-white hover:bg-emerald-50 hover:border-emerald-500 transition-all duration-300"
                            >
                                Continue Shopping
                            </Link>
                        </div>
                    </div>
                </div>

                {/* Footer Reference */}
                <p className="text-center text-xs text-slate-400 mt-8">
                    Reference: Order ID {orderData?.order_id} | User Ref {user?.id}
                </p>

            </div>
        </div>
    );
}

// Helper component
const DetailItem = ({ title, value, isBold = false, icon: Icon }: { title: string, value: string | undefined, isBold?: boolean, icon: React.ElementType }) => (
    // ✨ Enhanced styling for detail row
    <div className="flex justify-between items-center py-2 border-b border-emerald-200 last:border-b-0">
        <span className="text-sm font-medium text-slate-600 flex items-center gap-2">
            <Icon className="w-4 h-4 text-emerald-500" />
            {title}
        </span>
        <span className={`text-right text-base ${isBold ? 'font-extrabold text-emerald-800' : 'font-semibold text-slate-700'}`}>
            {value}
        </span>
    </div>
);

export default OrderSuccessPage;