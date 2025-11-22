import Supabase from "./Database";

// 1. Fetch all listings for the logged-in retailer
export async function getRetailerListings(userId: string) {
    const { data, error } = await Supabase
        .from('product_listings')
        .select(`
            product_listings_id,
            price,
            stock,
            product:products (
                product_id,
                name,
                image_url,
                description
            )
        `)
        .eq('seller_id', userId);

    if (error) {
        console.error("Error fetching listings:", error);
        return [];
    }
    return data;
}

// 2. Search the Master Product Database
export async function searchMasterProducts(query: string) {
    const { data, error } = await Supabase
        .from('products')
        .select('*')
        .ilike('name', `%${query}%`)
        .limit(5);

    if (error) return [];
    return data;
}

// 3. Create a Listing for an EXISTING Product
// Note: Inputs typed as string | number to be flexible with form inputs
export async function createListingForExisting(userId: string, productId: string, price: string | number, stock: string | number) {
    const { data, error } = await Supabase
        .from('product_listings')
        .insert([{
            seller_id: userId,
            product_id: productId,
            price: Number(price),
            stock: Number(stock)
        }])
        .select()
        .single();

    return { data, error };
}

// 4. Create a NEW Product AND a Listing
// 'productData' typed as 'any' or a specific interface to allow flexibility
export async function createNewProductAndListing(userId: string, productData: any, price: string | number, stock: string | number) {
    // A. Insert Product
    const { data: product, error: prodError } = await Supabase
        .from('products')
        .insert([{
            name: productData.name,
            description: productData.description,
            image_url: productData.image_url
        }])
        .select()
        .single();

    if (prodError) return { error: prodError };

    // B. Insert Listing linked to that new Product
    const { data: listing, error: listError } = await Supabase
        .from('product_listings')
        .insert([{
            seller_id: userId,
            product_id: product.product_id,
            price: Number(price),
            stock: Number(stock)
        }])
        .select()
        .single();

    return { data: listing, error: listError };
}

// 5. Update an existing listing
export async function updateListing(listingId: string, updates: any) {
    const { data, error } = await Supabase
        .from('product_listings')
        .update(updates)
        .eq('product_listings_id', listingId)
        .select();

    return { data, error };
}

// 6. Delete a listing
export async function deleteListing(listingId: string) {
    const { error, count } = await Supabase
        .from('product_listings')
        .delete({ count: 'exact' })
        .eq('product_listings_id', listingId);

    return { error, count };
}

// 7. Adjust Stock
export async function adjustListingStock(listingId: string, adjustment: number) {
    const { data: current, error: fetchError } = await Supabase
        .from('product_listings')
        .select('stock')
        .eq('product_listings_id', listingId)
        .single();

    if (fetchError) return { error: fetchError };

    const newStock = current.stock + adjustment;

    const { data, error } = await Supabase
        .from('product_listings')
        .update({ stock: Math.max(0, newStock) })
        .eq('product_listings_id', listingId)
        .select();

    return { data, error };
}

// 8. Check if stock is sufficient
export async function checkStockAvailability(listingId: string, requiredQty: number) {
    const { data, error } = await Supabase
        .from('product_listings')
        .select('stock')
        .eq('product_listings_id', listingId)
        .single();

    if (error || !data) {
        console.error("Stock check failed:", error);
        return false;
    }

    return data.stock >= requiredQty;
}