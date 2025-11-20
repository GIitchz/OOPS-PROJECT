export type UserInterface = {
    id: string,
    name: string,
    email: string,
    location:{
        latitude: number,
        longitude: number
    }|null,
    role: 'customer'|'retailer'|'wholesaler'
};

export type UserDataInterface = { //for raw get_user_data return
    user_id: string,
    name: string,
    latitude: number|null,
    longitude: number|null,
    role: 'customer'|'retailer'|'wholesaler'
};

export type ListingInterface = {
    product_listings_id: string;
    price: number;
    stock: number;
    seller_id: string;
    seller: {
        name: string;
        location: unknown;
    };
    productInfo: {
        name: string;
        image_url: string | null;
        description: string | null;
    }
};

export type CartItemInterface = {
    cart_item_id: number,
    quantity: number,
    listing: ListingInterface
}

export type OrderItemInterface = {
    order_id: number;
    listing_id: string;
    name: string;
    price: number;
    quantity: number;
    order_status: "pending" | "delivering" | "completed" | "cancelled";
}

export type PaymentInterface = {
    amount: number;
    is_offline: boolean;
    payment_id: string;
    ref_no: string | null;
    user_id: string | null;
}

export type AddressInterface = {
    address1: string;
    address2: string|null;
    city: string;
    pincode: string;
    country: string;
    lat: number;
    long: number;
    address_id: string|null;
}

export type OnlinePaymentInterface = {
    payment_ref: string|null;
    payment_mode: "offline";
}