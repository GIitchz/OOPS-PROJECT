// utils/productsDB.ts

import Supabase from "./Database";
import { FilteredListingsInterface, FilteredProductInterface, ListingInterface } from "./Interfaces";

export interface FilterInterface {
    searchTerm?: string;
    distFrom?: { lat: number, lng: number };
    productId?: string;
    minPrice?: number;
    maxPrice?: number;
    maxDist?: number;
    categoryIds?: string[];
    sellerIds?: string[];
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
        order_by_param: filters.orderBy,
        price_asc_param: filters.priceAsc,
        limit_param: filters.limit,
    };

    const { data, error } = await Supabase.rpc('get_filtered_products', rpcArgs);

    if (error) {
        console.error("Error getting filtered products from RPC:", error);
        return null;
    } else {
        return data as FilteredListingsInterface[];
    }
}

export function groupListingsByProduct(listings: FilteredListingsInterface[]): FilteredProductInterface[] {

    const productMap = new Map<string, {
        // Removed Omit complexity to avoid type errors
        data: any,
        listings: ListingInterface[],
        minDistance: number,
        minPrice: number,
        maxPrice: number,
    }>();

    for (const item of listings) {
        const {
            product_id, product_name, product_description, product_image_url, category_ids, relevance_score,
            listing_id, price, stock, distance_km,
            seller_id, seller_name, seller_role
        } = item;

        const listing: ListingInterface = {
            product_listings_id: listing_id,
            price,
            stock,
            seller_id,
            distance_from_user: distance_km,
            seller: {
                name: seller_name,
                location: null,
                user_role: seller_role,
            },
            productInfo: {
                name: product_name,
                description: product_description,
                image_url: product_image_url
            }
        };

        if (productMap.has(product_id)) {
            const existing = productMap.get(product_id)!;
            existing.listings.push(listing);
            existing.data.total_price += price;
            existing.data.count += 1;
            existing.minDistance = Math.min(existing.minDistance, distance_km);
            existing.minPrice = Math.min(existing.minPrice, price);
            existing.maxPrice = Math.max(existing.maxPrice, price);

        } else {
            productMap.set(product_id, {
                data: {
                    id: product_id,
                    name: product_name,
                    description: product_description,
                    imageURL: product_image_url,
                    categoryIDs: category_ids || [],
                    relevance: relevance_score,
                    total_price: price,
                    count: 1,
                },
                listings: [listing],
                minDistance: distance_km,
                minPrice: price,
                maxPrice: price,
            });
        }
    }

    return Array.from(productMap.values()).map(grouped => {
        const { data, listings, minDistance, minPrice, maxPrice } = grouped;

        return {
            id: data.id,
            name: data.name,
            description: data.description,
            imageURL: data.imageURL,
            categoryIDs: data.categoryIDs,
            relevance: data.relevance,
            minDist: minDistance,
            minPrice: minPrice,
            avgPrice: data.total_price / data.count,
            maxPrice: maxPrice,
            lowest_price: minPrice,
            listings: listings,
        };
    });
}