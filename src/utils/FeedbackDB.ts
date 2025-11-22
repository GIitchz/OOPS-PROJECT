// src/utils/FeedbackDB.ts
import Supabase from "./Database";

// 1. Fetch Feedbacks for a Retailer (Used in RetailerFeedbacks page)
export async function getRetailerFeedbacks(retailerId: string) {
    // Get all listing IDs belonging to this retailer
    const { data: listings, error: listError } = await Supabase
        .from('product_listings')
        .select('product_listings_id')
        .eq('seller_id', retailerId);

    if (listError || !listings.length) return [];

    const myListingIds = listings.map((l: any) => l.product_listings_id);

    // Fetch order items for these listings that have feedback
    const { data, error } = await Supabase
        .from('order_items')
        .select(`
            order_item_id,
            name,
            rating,
            feedback,
            order:orders!order_items_order_id_fkey (
                ordered_at,
                buyer:users!orders_buyer_id_fkey (
                    name
                )
            )
        `)
        .in('listing_id', myListingIds)
        .not('feedback', 'is', null)
        .order('order_item_id', { ascending: false });

    if (error) {
        console.error("Error fetching feedbacks:", error);
        return [];
    }

    return data;
}

// 2. Submit Customer Feedback (Used in ProfileOrders page)
export async function submitCustomerFeedback(orderItemId: number, rating: number, feedback: string) {
    const { data, error } = await Supabase
        .from('order_items')
        .update({ 
            rating: rating,
            feedback: feedback
        })
        .eq('order_item_id', orderItemId)
        .select();

    return { data, error };
}