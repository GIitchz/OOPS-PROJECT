import Supabase from "./Database";
import { AddressInterface, UserInterface, OnlinePaymentInterface } from "./Interfaces";

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
