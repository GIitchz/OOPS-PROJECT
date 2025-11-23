// src/utils/OrderDB.ts
import Supabase from "./Database";
import { AddressInterface, UserInterface, OnlinePaymentInterface, OrderInterface } from "./Interfaces";

/* ----------------------------------------------------------
   1. Initiate Stripe Checkout (Calls your Node.js Server)
-----------------------------------------------------------*/
export async function initiateStripeCheckout(amount: number, userId: string) {
    try {
        const amountInPaise = Math.round(amount * 100); 

        const response = await fetch("http://localhost:5000/create-checkout-session", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ 
                amount: amountInPaise,
                userId: userId
            }),
        });

        if (!response.ok) {
            const err = await response.json();
            throw new Error(err.error || "Failed to connect to payment server");
        }

        const data = await response.json();
        return { url: data.url, error: null };

    } catch (error: any) {
        console.error("Stripe connection error:", error);
        return { url: null, error: error.message || "Network Error" };
    }
}

/* ----------------------------------------------------------
   2. Create Order (Returns { data, error })
-----------------------------------------------------------*/
export async function createOrder(buyer: UserInterface, payment: OnlinePaymentInterface, address: AddressInterface) {
    const { data, error } = await Supabase.rpc("checkout_json", {
        data: {
            uid: buyer.id,
            ...payment,
            ...address
        }
    })
    .select()
    .maybeSingle();

    if (error) {
        console.error("Error creating order:", error);
        return { data: null, error }; 
    }
    
    return { data, error: null };
}

/* -----------------------------
   2. Get Orders (Customer History)
--------------------------------*/
export const getOrders = async (user: UserInterface, limit: number = 10): Promise<OrderInterface[]> => {
    const { data, error } = await Supabase
        .from('orders')
        .select(`
        order_id,
        ordered_at,
        formatted_address,
        lat,
        lng,
        order_items (
            order_id,
            listing: product_listings (
                product_listings_id,
                price,
                stock,
                seller_id,
                seller: users (
                    name,
                    user_role
                ),
                productInfo: products (
                    product_id,
                    name,
                    image_url,
                    description
                )
            ),
            order_item_id,
            name,
            price,
            quantity,
            order_status,
            rating,
            feedback
        ),
        payment: payments (
            payment_id,
            ref,
            amount,
            is_offline,
            user_id,
            mode
        )
    `)
        .eq("buyer_id", user.id)
        .order('ordered_at', { ascending: false })
        .limit(limit);

    if (error) {
        console.error("Error fetching orders:", error);
        return [];
    }

    return data;
}

/* -----------------------------
   3. Make Payment
--------------------------------*/
// Define the interface for the payment result you expect back
interface PaymentResult {
    payment_ref: string | null;
    payment_mode: 'online';
    status: 'succeeded' | 'failed';
    error: string | null;
}

export const completePayment = async (total: number, userId: string): Promise<PaymentResult> => {
    // 1. Initiate Stripe Checkout to get the URL
    // You MUST pass the current user's ID or a unique order reference
    // so your success page knows what to report back.
    const userRef = "UNIQUE_USER_OR_CART_ID"; // Replace with actual user/cart identifier
    const { url, error } = await initiateStripeCheckout(total, userId); 

    if (error || !url) {
        return {
            payment_ref: null,
            payment_mode: 'online',
            status: 'failed',
            error: error || 'Failed to initiate Stripe Checkout session'
        };
    }

    return new Promise((resolve) => {
        // 2. Open Stripe Checkout in a new window
        const stripeWindow = window.open(url, '_blank', 'width=800,height=600'); 
        
        if (!stripeWindow) {
            resolve({
                payment_ref: null,
                payment_mode: 'online',
                status: 'failed',
                error: 'Failed to open the payment window. Check popup blockers.'
            });
            return;
        }

        // 3. Listen for a message from the newly opened window
        const messageListener = (event: MessageEvent) => {
            // Ensure the message comes from a trusted origin (your own domain)
            if (event.origin !== window.location.origin) {
                return; 
            }

            const { type, status, sessionId, error, userId:userRef } = event.data;

            // Only process messages relevant to the payment flow
            if (type === "stripePaymentResult" && userId===userRef) {
                window.removeEventListener("message", messageListener); // Stop listening

                if (status === "succeeded" && sessionId) {
                    // Payment successful, resolve the Promise
                    resolve({
                        payment_ref: sessionId, // Use session ID as the initial reference
                        payment_mode: 'online',
                        status: 'succeeded',
                        error: null
                    });
                } else {
                    // Payment failed or cancelled, resolve the Promise with failure
                    resolve({
                        payment_ref: sessionId || null,
                        payment_mode: 'online',
                        status: 'failed',
                        error: error || "Payment failed or was cancelled."
                    });
                }
            }
        };

        window.addEventListener("message", messageListener);
    });
};



/* ----------------------------------------------------------
   4. Get Seller Orders
-----------------------------------------------------------*/
export async function getSellerOrders(sellerId: string) {
    const { data: myLi, error: liError } = await Supabase
        .from('product_listings')
        .select('product_listings_id')
        .eq('seller_id', sellerId);

    if (liError || !myLi || myLi.length === 0) return [];

    const myListingIds = myLi.map(l => l.product_listings_id);

    const { data, error } = await Supabase
        .from('order_items')
        .select(`*, order:orders!order_items_order_id_fkey (order_id, ordered_at, shipping_address:saved_addresses!orders_address_id_fkey (*), buyer:users!orders_buyer_id_fkey (name))`)
        .in('listing_id', myListingIds)
        .order('order_item_id', { ascending: false });

    if (error) return [];
    return data;
}

/* ----------------------------------------------------------
   5. Update Item Status
-----------------------------------------------------------*/
export async function updateOrderItemStatus(itemId: number, newStatus: string) {
    const { error } = await Supabase.from('order_items').update({ order_status: "pending"}).eq('order_item_id', itemId);
    return { error };
}


// Fetch payment status from your backend by passing the session ID
const fetchPaymentStatus = async (sessionId: string) => {
    try {
        const response = await fetch("http://localhost:5000/get-payment-info", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({ session_id: sessionId }),  // Send session_id to backend
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || "Failed to fetch payment status");
        }

        const data = await response.json();

        // Check the payment status and return the result
        if (data.status === 'succeeded') {
            return 'succeeded';  // Payment was successful
        } else if (data.status === 'requires_payment_method' || data.status === 'failed') {
            return 'failed';  // Payment failed or requires a different method
        }

        // Return an intermediate state or undefined
        return 'pending';  // In case the payment is still in process (unlikely with Checkout)
        
    } catch (error) {
        console.error("Error fetching payment status:", error);
        throw new Error(error.message || "Error fetching payment status");
    }
};
