import React, { useEffect, useState, useRef } from "react";
import { Link, useLocation, useSearchParams } from "react-router-dom";
import { CheckCircle, ArrowRight, AlertCircle } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { updateOrderPaymentRef } from "../utils/OrderDB";

function OrderSuccessPage() {
    const location = useLocation();
    const [searchParams] = useSearchParams();
    const { user } = useAuth();
    
    const [status, setStatus] = useState("initializing"); 
    const [errorMsg, setErrorMsg] = useState("");
    const processedRef = useRef(false); // Prevent double-execution in Strict Mode

    const orderId = location.state?.orderId || searchParams.get("order_id");
    const sessionId = searchParams.get("session_id");

    useEffect(() => {
        if (processedRef.current) return; 

        const handlePaymentUpdate = async () => {
            if (sessionId && orderId) {
                processedRef.current = true;
                setStatus("updating");
                
                console.log(`Updating Order #${orderId} with Ref: ${sessionId}`);
                
                // Convert orderId to number just in case
                const { error } = await updateOrderPaymentRef(Number(orderId), sessionId);

                if (error) {
                    console.error("Payment Update Failed:", error);
                    setStatus("error");
                    setErrorMsg(error.message || "Database update failed");
                } else {
                    console.log("Payment Update Success!");
                    setStatus("confirmed");
                    // Only clean URL if successful
                    window.history.replaceState({}, document.title, window.location.pathname);
                }
            } else if (orderId) {
                // COD Case
                setStatus("confirmed");
            }
        };

        handlePaymentUpdate();
    }, [sessionId, orderId]);

    const continuePath = user?.role === 'retailer' ? '/admin/retailer/wholesale' : '/dashboard';

    return (
        <div className="min-h-[calc(100vh-80px)] flex items-center justify-center bg-rose-50 p-4">
            <div className="bg-white p-10 sm:p-12 rounded-[2rem] shadow-2xl shadow-rose-100 max-w-md w-full text-center border border-rose-100">

                {status === 'error' ? (
                    <div className="mx-auto h-24 w-24 bg-red-100 rounded-full flex items-center justify-center mb-6">
                        <AlertCircle className="h-12 w-12 text-red-600" />
                    </div>
                ) : (
                    <div className="mx-auto h-24 w-24 bg-green-100 rounded-full flex items-center justify-center mb-6 animate-bounce">
                        <CheckCircle className="h-12 w-12 text-green-600" />
                    </div>
                )}

                <h1 className="text-3xl font-extrabold text-slate-900 mb-3">
                    {status === 'error' ? "Payment Recorded, But..." : "Order Placed!"}
                </h1>

                <div className="text-slate-500 mb-8 text-lg min-h-[3rem]">
                    {status === "updating" && "Verifying payment with bank..."}
                    {status === "confirmed" && "Your order has been confirmed and will be on its way soon."}
                    {status === "error" && (
                        <span className="text-red-500 text-sm">
                            Payment succeeded on Stripe, but we couldn't update your receipt.<br/>
                            Error: {errorMsg}
                        </span>
                    )}
                </div>

                {orderId && (
                    <div className="bg-slate-50 p-4 rounded-xl mb-8 border border-slate-100 text-left">
                        <p className="text-xs text-slate-400 uppercase tracking-wide font-bold mb-1">Receipt Details</p>
                        <div className="flex justify-between items-center">
                            <span className="text-sm font-bold text-slate-700">Order ID</span>
                            <span className="font-mono font-bold text-slate-900">#{orderId}</span>
                        </div>
                        {sessionId && (
                            <div className="flex justify-between items-center mt-1">
                                <span className="text-sm font-bold text-slate-700">Ref</span>
                                <span className="text-xs font-mono text-slate-500 truncate max-w-[150px]" title={sessionId}>
                                    {sessionId}
                                </span>
                            </div>
                        )}
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