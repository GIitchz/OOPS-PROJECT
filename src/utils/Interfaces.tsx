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
        role: 'customer'|'retailer'|'wholesaler';
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

export type OrderInterface = {
    order_id: number,
    ordered_at: string,
    order_items: OrderItemInterface[]
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
    lat: number|null;
    lng: number|null;
    address_id: string|null;
}

export type OnlinePaymentInterface = {
    payment_ref: string|null;
    payment_mode: "offline";
}

export type UserRole = 'customer' | 'retailer' | 'wholesaler';

// 1. Updated Seller Interface
export type SellerInterface = {
    id: string;
    name: string;
    role: UserRole;
}

// 2. Updated FilteredListings Interface (Flat data from RPC)
export type FilteredListingsInterface = {
    listing_id: string;
    price: number;
    stock: number;
    seller_id: string;
    seller_name: string;
    seller_role: UserRole;
    distance_km: number;
    relevance_score: number;
    product_id: string;
    product_name: string;
    product_description: string;
    product_image_url: string;
    category_ids: string[];
}

// 3. Updated ProductListing Interface (Nested data after conversion)
export type ProductListingInterface = {
    listing_id: string;
    price: number;
    stock: number;
    distance: number;
    seller: SellerInterface;
}

// 4. FilteredProduct Interface remains the same (as it groups the listings)
export type FilteredProductInterface = {
    id: string;
    name: string;
    description: string;
    imageURL: string;
    categoryIDs: string[];
    relevance: number;
    minDist: number;
    minPrice: number;
    avgPrice: number;
    maxPrice: number;
    listings: ProductListingInterface[];
}