// src/components/StripePaymentForm.tsx
import React, { useState } from 'react';
import { PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js';

interface StripePaymentFormProps {
    onSuccess: (paymentIntentId: string) => void;
    onError: (msg: string) => void;
    amount: number;
}

export const StripePaymentForm = ({ onSuccess, onError, amount }: StripePaymentFormProps) => {
    const stripe = useStripe();
    const elements = useElements();
    const [processing, setProcessing] = useState(false);

    const handleSubmit = async (event: React.FormEvent) => {
        event.preventDefault();

        if (!stripe || !elements) return;

        setProcessing(true);

        const { error, paymentIntent } = await stripe.confirmPayment({
            elements,
            redirect: "if_required", // Prevents redirect if not needed (for simple cards)
        });

        if (error) {
            onError(error.message || "Payment failed");
            setProcessing(false);
        } else if (paymentIntent && paymentIntent.status === "succeeded") {
            onSuccess(paymentIntent.id);
            // Don't stop processing here, let the parent handle the redirect
        } else {
            onError("Payment status unknown. Please try again.");
            setProcessing(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="mt-4 p-4 border border-slate-200 rounded-2xl bg-white">
            <div className="mb-4">
                <p className="text-sm font-bold text-slate-500 mb-2">Pay ₹{amount.toFixed(2)} securely with Stripe</p>
                <PaymentElement />
            </div>
            <button
                type="submit"
                disabled={!stripe || processing}
                className="w-full py-3 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 disabled:opacity-50 transition-all"
            >
                {processing ? "Processing..." : "Pay Now"}
            </button>
        </form>
    );
};