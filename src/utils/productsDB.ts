// utils/productsDB.ts

import Supabase from "./Database";
import { CategoryInterface, FilteredListingsInterface, FilteredProductInterface, ListingInterface } from "./Interfaces";

export interface FilterInterface {
    searchTerm?: string;
    distFrom?: { lat: number, lng: number };
    productId?: string;
    minPrice?: number;
    maxPrice?: number;
    maxDist?: number;
    categoryIds?: string[];
    sellerIds?: string[];
    blacklistSellerIds?: string[];
    orderBy?: 'relevance' | 'price' | 'distance';
    priceAsc?: boolean;
    limit?: number;
}

export async function getFilteredListings(filters: FilterInterface) {
    const rpcArgs = {
        search_term: filters.searchTerm,
        target_lat: filters.distFrom?.lat ?? undefined,
        target_long: filters.distFrom?.lng ?? undefined,
        product_id_param: filters.productId,
        min_price_param: filters.minPrice,
        max_price_param: filters.maxPrice,
        max_distance_param: filters.maxDist,
        category_ids_param: filters.categoryIds,
        seller_ids_param: filters.sellerIds,
        blacklist_seller_ids_param: filters.blacklistSellerIds,
        order_by_param: filters.orderBy,
        price_asc_param: filters.priceAsc,
        limit_param: filters.limit
    };

    const { data, error } = await Supabase.rpc('get_filtered_products', rpcArgs);

    if (error) {
        console.error("Error getting filtered products from RPC:", error);
        return null;
    } else {
        return data as FilteredListingsInterface[];
    }
}

// 1. Define the internal structure for accumulation
// This replaces the unsafe 'data: any'
interface ProductAccumulator {
    id: string;
    name: string;
    description: string | null;
    imageURL: string | null;
    categoryIDs: string[];
    relevance: number;
    total_price: number; // Used to calculate avgPrice later
    count: number;       // Used to calculate avgPrice later
}

// 2. Define the exact shape of the value stored in the Map
interface GroupedProductData {
    productData: ProductAccumulator,
    listings: ListingInterface[],
    minDistance: number,
    minPrice: number,
    maxPrice: number,
    categories: CategoryInterface[] // Full category info array
}


export function groupListingsByProduct(
    listings: FilteredListingsInterface[]
): FilteredProductInterface[] {

    // Use the type-safe interface for the Map value
    const productMap = new Map<string, GroupedProductData>();

    for (const item of listings) {
        const {
            product_id, product_name, product_description, product_image_url, category_ids, relevance_score,
            listing_id, price, stock, distance_km,
            seller_id, seller_name, seller_role, categories
        } = item;

        // 1. Construct the ListingInterface object
        // NOTE: The ListingInterface needs to be strictly compatible with the destination fields.
        const listing: ListingInterface = {
            product_listings_id: listing_id,
            price,
            stock,
            seller_id,
            distance_from_user: distance_km,
            seller: {
                name: seller_name,
                // The provided ListingInterface uses 'user_role?:' but FilteredListingsInterface uses 'seller_role'
                // We use 'user_role' to match the ListingInterface structure.
                user_role: seller_role, 
            },
            productInfo: {
                product_id: product_id,
                name: product_name,
                description: product_description,
                image_url: product_image_url
                // NOTE: ListingInterface's productInfo does not include 'categories' or 'categoryIDs',
                // but the FilteredProductInterface uses 'categories' from the main listing.
            }
        };

        if (productMap.has(product_id)) {
            // 2. Update existing product group
            const existing = productMap.get(product_id)!;
            existing.listings.push(listing);
            // Access properties on the new 'productData' field
            existing.productData.total_price += price;
            existing.productData.count += 1;
            existing.minDistance = Math.min(existing.minDistance, distance_km);
            existing.minPrice = Math.min(existing.minPrice, price);
            existing.maxPrice = Math.max(existing.maxPrice, price);
            // Assuming categories is the same for all listings of this product_id, 
            // but we can update it if the source array is valid.
            existing.categories = categories; 
        } else {
            // 3. Create a new product group
            productMap.set(product_id, {
                productData: { // Replaced 'data' with 'productData' and defined its structure
                    id: product_id,
                    name: product_name,
                    description: product_description,
                    imageURL: product_image_url,
                    categoryIDs: category_ids || [],
                    relevance: relevance_score,
                    total_price: price, // Start accumulator
                    count: 1,           // Start count
                },
                listings: [listing],
                minDistance: distance_km,
                minPrice: price,
                maxPrice: price,
                categories: categories
            });
        }
    }

    // 4. Transform the Map values into the final FilteredProductInterface array
    return Array.from(productMap.values()).map(grouped => {
        const { productData, listings, minDistance, minPrice, maxPrice, categories } = grouped;

        return {
            id: productData.id,
            name: productData.name,
            description: productData.description,
            imageURL: productData.imageURL,
            categoryIDs: productData.categoryIDs,
            relevance: productData.relevance,
            minDist: minDistance,
            minPrice: minPrice,
            maxPrice: maxPrice,
            // Calculate avgPrice from accumulated total and count
            avgPrice: productData.total_price / productData.count,
            categories: categories, // Ensure categories are included
            listings: listings,
            // Maps to minPrice, matching the original logic but typed as number | null
            lowest_price: minPrice, 
        };
    });
}