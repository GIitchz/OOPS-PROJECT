import Supabase from "./Database";
import { AddressInterface, UserInterface, OnlinePaymentInterface, OrderInterface } from "./Interfaces";

/* -----------------------------
   1. Create Order (returns new order_id)
--------------------------------*/
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
        return null;
    }
    return data;
}

/* -----------------------------
   2. Get Orders (Customer History)
--------------------------------*/
export const getOrders = async (user: UserInterface, limit: number = 10) => {
    const { data, error } = await Supabase
        .from('orders')
        .select(`
        order_id,
        ordered_at,
        order_items (
            order_id,
            listing_id,
            order_item_id,
            name,
            price,
            quantity,
            order_status,
            rating,
            feedback
        )
    `)
        .eq("buyer_id", user.id)
        .order('ordered_at', { ascending: false })
        .limit(limit);

    if (error) {
        console.error("Error fetching orders:", error);
        return [];
    }

    return data as OrderInterface[] ?? [];
}

/* -----------------------------
   3. Make Payment
--------------------------------*/
export const completePayment = async (total: number): Promise<OnlinePaymentInterface> => {
    console.log(`making payment of amount ${total}`);
    const payment: OnlinePaymentInterface = {
        payment_ref: null,
        payment_mode: "offline"
    };
    return payment;
}

export async function updateOrderLatLng(orderId: number | string, lat: number, lng: number) {
    const id = Number(orderId);

    const { data, error } = await Supabase
        .from("orders")
        .update({ lat, lng })
        .eq("order_id", id)
        .select();

    if (error) {
        console.error("Error updating order coordinates:", error);
    }
    return data;
}

/* -----------------------------
   4. Get Orders for a Seller (SPLIT QUERY METHOD)
--------------------------------*/
export async function getSellerOrders(sellerId: string) {
    // Step 1: Get IDs of listings owned by this seller
    const { data: myLi, error: liError } = await Supabase
        .from('product_listings')
        .select('product_listings_id')
        .eq('seller_id', sellerId);

    if (liError || !myLi) {
        console.error("Error fetching seller listings:", liError);
        return [];
    }

    const myListingIds = myLi.map(l => l.product_listings_id);

    if (myListingIds.length === 0) {
        return [];
    }

    // Step 2: Fetch Order Items using specific aliases and * to avoid column name errors
    const { data, error } = await Supabase
        .from('order_items')
        .select(`
            *,
            order:orders!order_items_order_id_fkey (
                order_id,
                ordered_at,
                shipping_address:saved_addresses!orders_address_id_fkey (
                    *
                ),
                buyer:users!orders_buyer_id_fkey (
                    name
                )
            )
        `)
        .in('listing_id', myListingIds)
        .order('order_item_id', { ascending: false });

    if (error) {
        console.error("Error fetching seller orders:", error);
        return [];
    }
    return data;
}

/* -----------------------------
   5. Update Status of an Item
--------------------------------*/
export async function updateOrderItemStatus(
    itemId: number,
    newStatus: "pending" | "delivering" | "completed" | "cancelled"
) {
    const { error } = await Supabase
        .from('order_items')
        .update({ order_status: newStatus })
        .eq('order_item_id', itemId);

    return { error };
}