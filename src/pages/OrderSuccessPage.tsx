import React, { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { CheckCircle, Truck, ShoppingCart, Loader2 } from 'lucide-react';
import { getOrders } from "../utils/OrderDB";
import useAuth from "../context/AuthContext";
import { OrderInterface } from "../utils/Interfaces";

function OrderSuccessPage() {
    const { user } = useAuth();
    const [searchParams] = useSearchParams();
    const [orderData, setOrderData] = useState<OrderInterface | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        setIsLoading(true);
        getOrders(user).then(
            (data) => {
                setOrderData(data[0]);
                setIsLoading(false);
            }
        )
    }, []);

    if (isLoading) {
        return (
            <div className="min-h-[calc(100vh-80px)] flex items-center justify-center bg-green-50/50">
                <div className="flex flex-col items-center p-12 bg-white rounded-3xl shadow-2xl shadow-green-200/50">
                    <Loader2 className="w-12 h-12 text-green-500 animate-spin mb-4" />
                    <h2 className="text-2xl font-semibold text-slate-800">Confirming Your Order...</h2>
                    <p className="text-slate-500 mt-2">Please wait, we are retrieving your payment and order details.</p>
                </div>
            </div>
        );
    }

    // Success Screen
    return (
        <div className="min-h-[calc(100vh-80px)] flex flex-col items-center justify-center bg-green-50/50 p-4">

            <div className="w-full max-w-3xl bg-white p-6 sm:p-12 rounded-3xl shadow-2xl shadow-green-300/60 transition-all duration-500 transform scale-100">

                {/* Header */}
                <div className="text-center mb-10">
                    <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4 animate-bounce" />
                    <h1 className="text-4xl font-extrabold tracking-tight text-slate-900 mb-2">
                        Order Confirmed!
                    </h1>
                    <p className="text-xl text-slate-600">
                        Thank you for shopping with <span className="font-semibold text-green-600">The Grove</span>.
                    </p>
                </div>

                {/* Confirmation Details Card */}
                <div className="bg-green-50 p-6 rounded-2xl border border-green-200 mb-8">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-y-4 gap-x-8 text-slate-700">
                        <DetailItem title="Order ID" value={orderData?.order_id} icon={Truck} />
                        <DetailItem title="Total Paid" value={`₹${orderData?.payment?.amount}`} isBold icon={Truck} />
                        <DetailItem title="Payment Method" value={orderData?.payment?.mode} icon={Truck} />
                        <DetailItem title="Estimated Delivery" value={"Soon"} icon={Truck} />
                    </div>
                </div>

                {/* Shipping & Next Steps */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">

                    {/* Shipping Address Panel */}
                    <div className="p-6 bg-white border border-slate-200 rounded-2xl shadow-sm">
                        <h3 className="text-xl font-bold text-slate-800 mb-3 flex items-center">
                            <Truck className="w-5 h-5 mr-2 text-orange-500" />
                            Shipping To
                        </h3>
                        <p className="text-slate-600 leading-relaxed font-semibold">
                            {orderData?.formatted_address}
                        </p>
                    </div>

                    {/* Action Panel */}
                    <div className="p-6 bg-green-50 border border-green-200 rounded-2xl shadow-sm">
                        <h3 className="text-xl font-bold text-slate-800 mb-4 flex items-center">
                            <ShoppingCart className="w-5 h-5 mr-2 text-green-600" />
                            What's Next?
                        </h3>
                        <div className="flex flex-col space-y-3">
                            <Link
                                to={`/profile/orders`}
                                className="w-full text-center px-4 py-3 border border-transparent text-sm font-semibold rounded-xl text-white bg-green-600 hover:bg-green-700 transition-all shadow-md"
                            >
                                View Order Details
                            </Link>
                            <Link
                                to={(user?.role == 'customer') ? "/dashboard" : "/admin/retailer/wholesale"}
                                className="w-full text-center px-4 py-3 border-2 border-green-200 text-sm font-semibold rounded-xl text-green-600 bg-white hover:bg-green-50 transition-all"
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
const DetailItem = ({ title, value, isBold = false, icon: Icon }) => (
    <div className="flex justify-between items-center pb-2 border-b border-green-100 last:border-b-0">
        <span className="text-sm font-medium text-slate-500 flex items-center">
            {title}
        </span>
        <span className={`text-right text-base ${isBold ? 'font-extrabold text-slate-900' : 'font-semibold'}`}>
            {value}
        </span>
    </div>
);

export default OrderSuccessPage;