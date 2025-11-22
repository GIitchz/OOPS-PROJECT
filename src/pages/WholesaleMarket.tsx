import React, { useState, useEffect } from 'react';
import { getAllProducts, getAllWholesalers } from '../utils/Database';
import ProductCard from '../components/ProductCard';
import { Search, Filter } from 'lucide-react';
import { FilteredProductInterface } from "../utils/Interfaces";

// NOTE: This page currently relies on local filtering/sorting after fetching ALL products.
// For correct functionality, we should either re-architect this to use `getFilteredListings` RPC,
// or apply local sorting/filtering accurately. Since the page fetches *all* products and then filters 
// for wholesaler listings, we will add the sorting logic locally to the filtered products array.

function WholesaleMarket() {
    const [products, setProducts] = useState<FilteredProductInterface[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    // Add sorting state for Wholesale Market
    const [sortType, setSortType] = useState("");

    useEffect(() => {
        const loadMarket = async () => {
            try {
                const [allProducts, allWholesalers] = await Promise.all([
                    getAllProducts(),
                    getAllWholesalers()
                ]);

                if (!allProducts || !allWholesalers) return;

                const wholesalerIds = (allWholesalers as any[]).map(w => w.seller_id);

                const wholesaleOnlyProducts = (allProducts as any[]).map(product => {
                    const wholesaleListings = (product.listings || []).filter((l: any) =>
                        wholesalerIds.includes(l.seller_id)
                    );

                    const lowestPrice = wholesaleListings.length > 0
                        ? Math.min(...wholesaleListings.map((l: any) => l.price))
                        : null;

                    return {
                        ...product,
                        listings: wholesaleListings,
                        lowest_price: lowestPrice,
                        imageURL: product.image_url,
                        categoryIDs: []
                    };
                })
                    .filter(p => p.listings.length > 0);

                setProducts(wholesaleOnlyProducts as FilteredProductInterface[]);

            } catch (error) {
                console.error("Failed to load wholesale market:", error);
            } finally {
                setLoading(false);
            }
        };

        loadMarket();
    }, []);

    // 1. Apply Search Filter
    let filteredProducts = products.filter(product =>
        product.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    // 2. Apply Local Sort Filter (FIXED)
    if (sortType === 'price_asc') {
        filteredProducts = filteredProducts.sort((a, b) => (a.lowest_price || 0) - (b.lowest_price || 0));
    } else if (sortType === 'price_desc') {
        filteredProducts = filteredProducts.sort((a, b) => (b.lowest_price || 0) - (a.lowest_price || 0));
    }


    return (
        <div className="space-y-8">

            {/* Header with Search and Sort */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-extrabold text-slate-900">Wholesale Market</h1>
                    <p className="text-slate-500 mt-2">Bulk buying prices from verified suppliers.</p>
                </div>

                <div className="flex flex-col sm:flex-row gap-4 w-full md:w-auto">
                    {/* Search Input */}
                    <div className="relative w-full sm:w-64">
                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                            <Search className="h-5 w-5 text-rose-400" />
                        </div>
                        <input
                            type="text"
                            className="block w-full pl-11 pr-4 py-3 bg-white border border-rose-100 rounded-2xl text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-rose-500 focus:border-transparent shadow-sm transition-all"
                            placeholder="Search wholesale items..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>

                    {/* Sort Dropdown - WIDTH INCREASED FOR BETTER VISIBILITY */}
                    <div className="relative w-full sm:w-52"> {/* Increased sm:w-40 to sm:w-52 */}
                        <select
                            className="w-full p-3 bg-white border border-rose-100 rounded-2xl focus:ring-2 focus:ring-rose-500 focus:border-rose-500 outline-none transition-all font-medium text-slate-700 text-sm appearance-none cursor-pointer pr-10"
                            value={sortType}
                            onChange={e => setSortType(e.target.value)}
                        >
                            <option value="">Recommended</option>
                            <option value="price_asc">Price: Low to High</option>
                            <option value="price_desc">Price: High to Low</option>
                        </select>
                        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-slate-400">
                            <Filter size={18} />
                        </div>
                    </div>
                </div>
            </div>

            {loading ? (
                <div className="text-center py-20 text-rose-400 font-medium animate-pulse">Loading wholesale catalog...</div>
            ) : (
                <>
                    {filteredProducts.length === 0 ? (
                        <div className="text-center py-20 bg-white rounded-[2rem] border border-rose-100">
                            <div className="bg-rose-50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                                <Filter className="text-rose-500" size={24} />
                            </div>
                            <p className="text-slate-500 text-lg font-bold">No wholesale items found.</p>
                            <p className="text-slate-400 text-sm mt-2">Try adjusting your search or check back later for new stock.</p>
                            {searchTerm && (
                                <button
                                    onClick={() => setSearchTerm('')}
                                    className="mt-4 text-rose-600 font-bold hover:underline"
                                >
                                    Clear Search
                                </button>
                            )}
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                            {filteredProducts.map((product) => (
                                // FIXED: key uses unique ID, prop passed inside component
                                <div key={product.id || product.id} className="h-full">
                                    <ProductCard product={product} displayDist={true} />
                                </div>
                            ))}
                        </div>
                    )}
                </>
            )}
        </div>
    );
}

export default WholesaleMarket;