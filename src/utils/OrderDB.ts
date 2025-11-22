import { PostgrestResponse } from "@supabase/supabase-js";
import Supabase from "./Database";
import { AddressInterface, UserInterface, OnlinePaymentInterface, OrderInterface } from "./Interfaces";

/* -----------------------------
   1. Create Order (returns new order_id)
--------------------------------*/
export async function createOrder(buyer: UserInterface, payment: OnlinePaymentInterface, address: AddressInterface) {
    const { data, error } = await Supabase.rpc("checkout_json", {data:{
        uid: buyer.id,
        ...payment,
        ...address
    }})
    .select()
    .maybeSingle();

    if (error) {
        console.error("Error creating order:", error);
        return null;
    }
    console.log(data);

    return data;
}

export const getOrders = async (user: UserInterface, limit: number = 10) => {
    const { data, error } = await Supabase
    .from('orders')
    .select(`
        order_id,
        ordered_at,
        order_items (
        order_id,
        listing_id,
        name,
        price,
        quantity,
        order_status
        )
    `)
    .eq("buyer_id", user.id)
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
export const completePayment = async (total: number):Promise<OnlinePaymentInterface> => {
    console.log(`making payment of amount ${total}`);
    const payment:OnlinePaymentInterface = {
        payment_ref:null,
        payment_mode:"offline"
    };
    return payment;
}
export async function updateOrderLatLng(orderId: number | string, lat: number, lng: number) {
    const id = Number(orderId); // ensure numeric

    const { data, error } = await Supabase
        .from("orders")
        .update({ lat, lng })
        .eq("order_id", id)
        .select();

    if (error) {
        console.error("Error attaching coordinates:", error);
        return false;
    }

    return true;
}
