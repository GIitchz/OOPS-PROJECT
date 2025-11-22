export type UserInterface = {
    id: string,
    name: string,
    email: string,
    location: {
        latitude: number,
        longitude: number
    } | null,
    role: 'customer' | 'retailer' | 'wholesaler'
};

export type UserDataInterface = {
    user_id: string,
    name: string,
    latitude: number | null,
    longitude: number | null,
    role: 'customer' | 'retailer' | 'wholesaler'
};

export type ListingInterface = {
    product_listings_id: string;
    price: number;
    stock: number;
    seller_id: string;
    seller: {
        name: string;
        user_role?: 'customer' | 'retailer' | 'wholesaler';
    };
    productInfo: {
        name: string;
        image_url: string | null;
        description: string | null;
    };
    distance_from_user?: number;
};

export type ProductListingInterface = ListingInterface;

export type CartItemInterface = {
    cart_item_id: number,
    quantity: number,
    listing: ListingInterface
}

export type OrderInterface = {
    order_id: number;
    ordered_at: string;
    order_items: OrderItemInterface[]
}

export type OrderItemInterface = {
    order_id: number;
    order_item_id: number; // Make sure this exists
    listing_id: string;
    name: string;
    price: number;
    quantity: number;
    order_status: "pending" | "delivering" | "completed" | "cancelled";
    rating?: number;
    feedback?: string;
}

export type PaymentInterface = {
    amount: number;
    is_offline: boolean;
    payment_id: string;
    ref_no: string | null;
    user_id: string | null;
}

export interface AddressInterface {
    formatted_address: string;
    lat: number;
    lng: number;
}

export interface SavedAddressInterface extends AddressInterface {
    address_id: string;
    user_id: string;
}

export type OnlinePaymentInterface = {
    payment_ref: string | null;
    payment_mode: "offline";
}

export interface FilteredListingsInterface {
    product_id: string;
    product_name: string;
    product_description: string | null;
    product_image_url: string | null;
    category_ids: string[];
    relevance_score: number;
    listing_id: string;
    price: number;
    stock: number;
    distance_km: number;
    seller_id: string;
    seller_name: string;
    seller_role: 'customer' | 'retailer' | 'wholesaler';
}

export interface FilteredProductInterface {
    id: string;
    name: string;
    description: string | null;
    imageURL: string | null;
    categoryIDs: string[];
    relevance: number;
    minDist: number;
    minPrice: number;
    maxPrice: number;
    avgPrice: number;
    listings: ListingInterface[];
    lowest_price: number | null;
}