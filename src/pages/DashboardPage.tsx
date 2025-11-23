import React, { useState, useEffect } from "react";
import { getAllRetailers, getAllWholesalers, getAllCategories } from "../utils/Database";
import ProductCard from "../components/ProductCard";
import PriceSlider from "../components/priceslider";
import { Check, Filter, Search } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { FilterInterface, getFilteredListings, groupListingsByProduct } from "../utils/productsDB";
import { FilteredProductInterface } from "../utils/Interfaces";

// Match the structure returned by getAllRetailers/Wholesalers in Database.tsx
interface Seller {
    seller_id: string;
    name: string;
    user_role: string;
}

export default function DashboardPage() {
    const { user, loading: userLoading } = useAuth();

    const [products, setProducts] = useState<FilteredProductInterface[]>([]);
    const [filtered, setFiltered] = useState<FilteredProductInterface[]>([]);
    const [retailers, setRetailers] = useState<Seller[]>([]);
    const [loading, setLoading] = useState(true);
    const [loadingProducts, setLoadingProducts] = useState(true);

    // Filters
    const [searchTerm, setSearchTerm] = useState("");
    const [minPrice, setMinPrice] = useState(0);
    const [maxPrice, setMaxPrice] = useState(0);
    const [selectedRetailers, setSelectedRetailers] = useState<string[]>([]);
    const [maxDistance, setMaxDistance] = useState("");
    const [sortType, setSortType] = useState("");
    const [priceBounds, setPriceBounds] = useState({ min: 0, max: 5000 });
    const [categories, setCategories] = useState<{ category_id: string, category_name: string }[]>([]);
    const [selectedCategories, setSelectedCategories] = useState<string[]>([]);


    const [coord, setCoord] = useState<{ lat: number, lng: number } | null>(null);

    const getCurrentLocation = async (): Promise<{ lat: number, lng: number } | null> => {
        return new Promise((resolve) => {
            if (navigator.geolocation) {
                navigator.geolocation.getCurrentPosition(
                    (position) => {
                        const { latitude: lat, longitude: lng } = position.coords;
                        resolve({ lat, lng });
                    },
                    (error) => {
                        console.error("Error getting location: ", error);
                        resolve(null);
                    }
                );
            } else {
                console.error("Geolocation not supported");
                resolve(null);
            }
        });
    };

    const loadData = async (filter: FilterInterface) => {
        const allowedRole = user ? (user.role === "retailer" ? "wholesaler" : "retailer") : "retailer";

        // Fetch sellers based on role
        const rawSellers = (allowedRole === "retailer") ? await getAllRetailers() : await getAllWholesalers();

        // Cast to our local interface to ensure TS knows the structure
        const sellerData = rawSellers as Seller[];

        // Filter sellers list to only show the relevant role
        setRetailers(
            sellerData.filter(s => s.user_role === allowedRole)
        );

        if (!filter.sellerIds || filter.sellerIds.length === 0) {
            filter.sellerIds = sellerData.map(i => i.seller_id);
        }
        // Fetch categories
        const rawCategories = await getAllCategories();
        setCategories(rawCategories);

        const listings = await getFilteredListings(filter);

        if (!listings) {
            setLoading(false);
            setLoadingProducts(false);
            return;
        }

        const productData = groupListingsByProduct(listings);
        let cleaned = productData;

        // --- FINAL FRONT-END SORTING FIX ---
        // Apply final sort to the grouped products array based on the filter settings
        if (filter.orderBy === 'price') {
            const isAsc = filter.priceAsc ?? true; // Default to true if undefined

            cleaned.sort((a, b) => {
                const priceA = a.lowest_price ?? Infinity;
                const priceB = b.lowest_price ?? Infinity;

                if (isAsc) {
                    return priceA - priceB; // Low to High
                } else {
                    return priceB - priceA; // High to Low
                }
            });
        }
        // -----------------------------------

        // Compute price bounds safely
        const allPrices = cleaned.flatMap(p => p.listings.map(l => l.price));

        if (allPrices.length > 0) {
            const minP = Math.min(...allPrices);
            const maxP = Math.max(...allPrices);

            // Only update bounds if they are the default value
            if (priceBounds.max === 5000 && priceBounds.min === 0) {
                setPriceBounds({ min: minP, max: maxP });
                setMinPrice(minP);
                setMaxPrice(maxP);
            }
        }

        setProducts(cleaned);
        setFiltered(cleaned);

        setLoading(false);
        setLoadingProducts(false);
    };

    const loadMarketplace = async (initialLoad: boolean = false) => {
        setLoadingProducts(true);

        let currentCoord = null;

        // 1. Try to get real-time geolocation
        const newCoord = await getCurrentLocation();
        if (newCoord) {
            currentCoord = newCoord;
            setCoord(newCoord);
        } else if (user && user.location) {
            // 2. Fallback to user's saved location
            currentCoord = { lat: user.location.latitude, lng: user.location.longitude };
            setCoord(currentCoord);
        }

        // 3. Prepare the base filter
        let baseFilter: FilterInterface = {};

        // Apply coordinates if found (needed for proximity filtering in RPC)
        if (currentCoord) {
            baseFilter.distFrom = currentCoord;
        }

        // Apply filters based on current state (only set price on initial load to avoid resetting user's selection)
        if (!initialLoad) {
            baseFilter.minPrice = minPrice;
            baseFilter.maxPrice = maxPrice;
            baseFilter.sellerIds = (selectedRetailers.length > 0) ? selectedRetailers : undefined;
            if (selectedCategories.length > 0)
                baseFilter.categoryIds = selectedCategories;

            if (searchTerm !== "") baseFilter.searchTerm = searchTerm;
            if (maxDistance) baseFilter.maxDist = Number(maxDistance);

            // --- FIXED SORTING LOGIC ---
            if (sortType === 'price_asc') {
                baseFilter.orderBy = 'price';
                baseFilter.priceAsc = true;
            } else if (sortType === 'price_desc') {
                baseFilter.orderBy = 'price';
                baseFilter.priceAsc = false;
            } else {
                baseFilter.orderBy = 'relevance'; // Default or recommended
            }
            // ---------------------------
        }


        // Load all data with the best filter available (even if no location is present)
        await loadData(baseFilter);
    };


    useEffect(() => {
        if (!userLoading) {
            // Initial load of the marketplace using the robust function
            loadMarketplace(true);
        }
    }, [user, userLoading]);

    // --- LIVE SEARCH EFFECT ---
    useEffect(() => {
        const delayDebounceFn = setTimeout(() => {
            if (!loading) applyFilters(false);
        }, 500);

        return () => clearTimeout(delayDebounceFn);
    }, [searchTerm]);

    const toggleRetailer = (id: string) => {
        setSelectedRetailers(prev =>
            prev.includes(id) ? prev.filter(r => r !== id) : [...prev, id]
        );
    };

    //─ APPLY FILTERS ─────────────────────────────────────────────
    const applyFilters = (reset: boolean = false) => {
        const minP = reset ? priceBounds.min : Number(minPrice);
        const maxP = reset ? priceBounds.max : Number(maxPrice);
        const distanceLimit = maxDistance ? Number(maxDistance) : undefined;
        const sellerIds = reset ? retailers.map(i => i.seller_id) : (selectedRetailers.length > 0) ? selectedRetailers : retailers.map(i => i.seller_id);
        const categoryIds = reset ? categories.map(c => c.category_id) : (selectedCategories.length > 0) ? selectedCategories : categories.map(c => c.category_id);

        setLoadingProducts(true);

        let filter: FilterInterface = {
            minPrice: minP,
            maxPrice: maxP,
            sellerIds: sellerIds,
            categoryIds: selectedCategories.length > 0 ? selectedCategories : undefined,
        };

        if (searchTerm !== "") {
            filter.searchTerm = searchTerm;
        }
        if (distanceLimit) {
            filter.maxDist = distanceLimit;
        }

        // Use existing coord, or null if none is set
        if (coord) {
            filter.distFrom = coord;
        }

        // --- FIXED SORTING LOGIC ---
        const currentSortType = reset ? "" : sortType;
        if (currentSortType === 'price_asc') {
            filter.orderBy = 'price';
            filter.priceAsc = true;
        } else if (currentSortType === 'price_desc') {
            filter.orderBy = 'price';
            filter.priceAsc = false;
        } else if (currentSortType === 'distance') {
            filter.orderBy = 'distance';
        } else {
            filter.orderBy = 'relevance'; // Default
        }
        // ---------------------------

        loadData(filter);
    };

    // --- CLEAR FILTERS FUNCTION ---
    const clearAllFilters = () => {
        setSearchTerm("");
        setMinPrice(priceBounds.min);
        setMaxPrice(priceBounds.max);
        setSelectedRetailers([]);
        setMaxDistance("");
        setSortType("");
        setSelectedCategories([]);

        // Reset with default filter values
        applyFilters(true);
    };

    if (loading) return (
        <div className="min-h-screen flex items-center justify-center bg-green-50 text-green-400 font-medium animate-pulse">
            Loading marketplace...
        </div>
    );

    return (
        <div className="min-h-[calc(100vh-80px)] bg-green-50 flex flex-col md:flex-row">

            {/* ───────────────── LEFT SIDEBAR ───────────────── */}
            <aside className="w-full md:w-72 bg-white border-r border-green-100 p-6 md:sticky md:top-20 md:h-[calc(100vh-80px)] overflow-y-auto custom-scrollbar z-40">

                <div className="flex items-center justify-between mb-8">
                    <div className="flex items-center gap-2">
                        <Filter className="text-green-500" size={20} />
                        <h2 className="text-xl font-extrabold text-slate-900">Filters</h2>
                    </div>
                    <button
                        onClick={clearAllFilters}
                        className="text-xs font-bold text-green-500 hover:text-green-700"
                    >
                        Reset
                    </button>
                </div>

                {/* PRICE */}
                <div className="mb-8">
                    <div className="flex justify-between items-center mb-2">
                        <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Price Range</h3>
                    </div>
                    <div className="px-1">
                        <PriceSlider
                            min={priceBounds.min}
                            max={priceBounds.max}
                            value={[minPrice, maxPrice]}
                            onChange={(vals: number[]) => {
                                setMinPrice(vals[0]);
                                setMaxPrice(vals[1]);
                            }}
                        />
                    </div>
                </div>

                {/* RETAILERS */}
                <div className="mb-8">
                    <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Sellers</h3>
                    <div className="space-y-1 max-h-48 overflow-y-auto pr-2 custom-scrollbar">
                        {retailers.map(r => (
                            <label key={r.seller_id} className="flex items-center space-x-3 p-2 rounded-xl hover:bg-green-50 cursor-pointer transition-colors group">
                                <div className="relative flex items-center">
                                    <input
                                        type="checkbox"
                                        className="peer h-5 w-5 cursor-pointer appearance-none rounded-md border-2 border-slate-200 checked:border-green-500 checked:bg-green-500 transition-all"
                                        checked={selectedRetailers.includes(r.seller_id)}
                                        onChange={() => toggleRetailer(r.seller_id)}
                                    />
                                    <Check className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-white opacity-0 peer-checked:opacity-100" size={12} strokeWidth={4} />
                                </div>
                                <span className="text-sm font-medium text-slate-600 group-hover:text-green-600 transition-colors">{r.name}</span>
                            </label>
                        ))}
                        {retailers.length === 0 && <p className="text-sm text-slate-400 italic">No sellers found.</p>}
                    </div>
                </div>
                {/* CATEGORIES */}
                <div className="mb-8">
                    <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Categories</h3>
                    <div className="space-y-1 max-h-48 overflow-y-auto pr-2 custom-scrollbar">
                        {categories.map(c => (
                            <label key={c.category_id} className="flex items-center space-x-3 p-2 rounded-xl hover:bg-green-50 cursor-pointer transition-colors group">
                                <div className="relative flex items-center">
                                    <input
                                        type="checkbox"
                                        className="peer h-5 w-5 cursor-pointer appearance-none rounded-md border-2 border-slate-200 checked:border-green-500 checked:bg-green-500 transition-all"
                                        checked={selectedCategories.includes(c.category_id)}
                                        onChange={() =>
                                            setSelectedCategories(prev =>
                                                prev.includes(c.category_id)
                                                    ? prev.filter(id => id !== c.category_id)
                                                    : [...prev, c.category_id]
                                            )
                                        }
                                    />
                                    <Check className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-white opacity-0 peer-checked:opacity-100" size={12} strokeWidth={4} />
                                </div>
                                <span className="text-sm font-medium text-slate-600 group-hover:text-green-600 transition-colors">
                                    {c.category_name}
                                </span>
                            </label>
                        ))}
                        {categories.length === 0 && <p className="text-sm text-slate-400 italic">No categories found.</p>}
                    </div>
                </div>

                {/* DISTANCE & SORT */}
                <div className="grid grid-cols-1 gap-4 mb-8">
                    <div>
                        <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Max Dist (km)</label>
                        <input
                            type="number"
                            className="w-full p-3 bg-slate-50 border border-transparent rounded-xl focus:bg-white focus:border-green-500 focus:ring-2 focus:ring-green-100 outline-none transition-all font-medium text-slate-700"
                            placeholder="Any"
                            value={maxDistance}
                            onChange={(e) => setMaxDistance(e.target.value)}
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Sort By</label>
                        <div className="relative">
                            <select
                                className="w-full p-3 bg-slate-50 border border-transparent rounded-xl focus:bg-white focus:border-green-500 focus:ring-2 focus:ring-green-100 outline-none transition-all font-medium text-slate-700 text-sm appearance-none cursor-pointer"
                                value={sortType}
                                onChange={e => setSortType(e.target.value)}
                            >
                                <option value="">Recommended</option>
                                <option value="price_asc">Price: Low to High</option>
                                <option value="price_desc">Price: High to Low</option>
                                <option value="distance" disabled={coord ? false : true}>Nearest Distance</option>
                            </select>
                        </div>
                    </div>
                </div>

                <button
                    className="w-full py-3 bg-slate-900 text-white rounded-2xl font-bold shadow-lg hover:bg-green-500 hover:shadow-green-200 hover:-translate-y-0.5 transition-all duration-300"
                    onClick={() => applyFilters(false)}
                >
                    Apply Filters
                </button>
            </aside>

            {/* ───────────────── MAIN CONTENT ───────────────── */}
            <main className="flex-1 p-6 sm:p-8">

                {/* Top Header with Live Search */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                    <div>
                        <h1 className="text-3xl font-extrabold text-slate-900">Marketplace</h1>
                        <p className="text-slate-500">
                            Showing <span className="font-bold text-green-500">{filtered.length}</span> items
                        </p>
                    </div>

                    <div className="relative w-full md:w-96">
                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                            <Search className="h-5 w-5 text-green-400" />
                        </div>
                        <input
                            type="text"
                            className="block w-full pl-11 pr-4 py-3 bg-white border border-green-100 rounded-2xl text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent shadow-sm transition-all"
                            placeholder="Search for items..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                </div>

                {/* Product Grid */}
                {loadingProducts ? (
                    <div className="flex justify-center items-center h-64 text-green-400 font-medium animate-pulse">
                        Updating results...
                    </div>
                ) : filtered.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-96 text-center bg-white rounded-[2rem] border border-green-50">
                        <div className="w-20 h-20 bg-green-50 rounded-full flex items-center justify-center mb-4">
                            <Search className="text-green-300" size={32} />
                        </div>
                        <h3 className="text-xl font-bold text-slate-900">No products found</h3>
                        <p className="text-slate-500 mt-2 max-w-xs">Try adjusting your filters or search term.</p>
                        <button
                            onClick={clearAllFilters}
                            className="mt-6 text-green-600 font-bold hover:underline"
                        >
                            Clear all filters
                        </button>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 2xl:grid-cols-4 gap-6">
                        {filtered.map(product => (
                            <div key={product.id} className="h-full">
                                <ProductCard product={product} displayDist={true} />
                            </div>
                        ))}
                    </div>
                )}
            </main>
        </div>
    );
}