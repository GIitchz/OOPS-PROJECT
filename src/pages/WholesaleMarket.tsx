import React, { useState, useEffect } from 'react';
import { getAllProducts, getAllRetailers, getAllWholesalers, getAllCategories } from '../utils/Database';
import ProductCard from '../components/ProductCard';
import { Search, Filter, ChevronDown } from 'lucide-react';
import { FilteredProductInterface } from "../utils/Interfaces";
import PriceSlider from '../components/priceslider';
import useAuth from '../context/AuthContext';
import { FilterInterface, getFilteredListings, groupListingsByProduct } from '../utils/productsDB';

// NOTE: This page currently relies on local filtering/sorting after fetching ALL products.
// For correct functionality, we should either re-architect this to use `getFilteredListings` RPC,
// or apply local sorting/filtering accurately. Since the page fetches *all* products and then filters 
// for wholesaler listings, we will add the sorting logic locally to the filtered products array.

interface Seller {
    seller_id: string;
    name: string;
    user_role: string;
}

function WholesaleMarket() {
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

    // NEW STATE FOR PRICE DEBOUNCE
    const [debouncedPriceRange, setDebouncedPriceRange] = useState([0, 0]);
    // ---------------------------------

    // NEW STATES FOR DROPDOWN VISIBILITY
    const [isPriceFilterOpen, setIsPriceFilterOpen] = useState(false);
    const [isSellersFilterOpen, setIsSellersFilterOpen] = useState(false);
    const [isCategoriesFilterOpen, setIsCategoriesFilterOpen] = useState(false);
    // ---------------------------------

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
    const toggleCategory = (id: string) => {
        setSelectedCategories(prev =>
            prev.includes(id) ? prev.filter(c => c !== id) : [...prev, id]
        );
    };

    const loadData = async (filter: FilterInterface) => {
        const allowedRole = user ? (user.role === "retailer" ? "wholesaler" : "retailer") : "retailer";

        const rawSellers = (allowedRole === "retailer") ? await getAllRetailers() : await getAllWholesalers();
        const sellerData = rawSellers as Seller[];
        setRetailers(
            sellerData.filter(s => s.user_role === allowedRole)
        );

        if (!filter.sellerIds || filter.sellerIds.length === 0) {
            filter.sellerIds = sellerData.map(i => i.seller_id);
        }
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
        if (filter.orderBy === 'price') {
            const isAsc = filter.priceAsc ?? true;

            cleaned.sort((a, b) => {
                const priceA = a.lowest_price ?? Infinity;
                const priceB = b.lowest_price ?? Infinity;

                if (isAsc) {
                    return priceA - priceB;
                } else {
                    return priceB - priceA;
                }
            });
        }
        // -----------------------------------

        const allPrices = cleaned.flatMap(p => p.listings.map(l => l.price));

        if (allPrices.length > 0) {
            const minP = Math.min(...allPrices);
            const maxP = Math.max(...allPrices);

            if (priceBounds.max === 5000 && priceBounds.min === 0) {
                setPriceBounds({ min: minP, max: maxP });
                setMinPrice(minP);
                setMaxPrice(maxP);
                setDebouncedPriceRange([minP, maxP]); // Initialize debounced state
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
        const newCoord = await getCurrentLocation();
        if (newCoord) {
            currentCoord = newCoord;
            setCoord(newCoord);
        } else if (user && user.location) {
            currentCoord = { lat: user.location.latitude, lng: user.location.longitude };
            setCoord(currentCoord);
        }

        let baseFilter: FilterInterface = {};
        if (currentCoord) {
            baseFilter.distFrom = currentCoord;
        }

        if (!initialLoad) {
            // !!! USE DEBOUNCED VALUES FOR API CALL !!!
            baseFilter.minPrice = debouncedPriceRange[0];
            baseFilter.maxPrice = debouncedPriceRange[1];
            // !!! --------------------------------- !!!

            baseFilter.sellerIds = (selectedRetailers.length > 0) ? selectedRetailers : undefined;
            if (searchTerm !== "") baseFilter.searchTerm = searchTerm;
            if (maxDistance) baseFilter.maxDist = Number(maxDistance);
            if (selectedCategories.length > 0)
                baseFilter.categoryIds = selectedCategories;
            if (sortType === 'price_asc') {
                baseFilter.orderBy = 'price';
                baseFilter.priceAsc = true;
            } else if (sortType === 'price_desc') {
                baseFilter.orderBy = 'price';
                baseFilter.priceAsc = false;
            } else if (sortType === 'distance') {
                baseFilter.orderBy = 'distance';
            } else {
                baseFilter.orderBy = 'relevance';
            }
        }

        await loadData(baseFilter);
    };

    useEffect(() => {
        if (!userLoading) {
            loadMarketplace(true);
        }
    }, [user, userLoading]);

    // --- LIVE SEARCH EFFECT (Debounced) ---
    useEffect(() => {
        const delayDebounceFn = setTimeout(() => {
            if (!loading) applyFilters(false);
        }, 500);

        return () => clearTimeout(delayDebounceFn);
    }, [searchTerm]);


    // ───────────────── NEW DEBOUNCE EFFECT FOR PRICE SLIDER ─────────────────
    useEffect(() => {
        if (loading) return;

        const delayDebounceFn = setTimeout(() => {
            // Update the debounced state, which triggers the API call in the next useEffect
            setDebouncedPriceRange([minPrice, maxPrice]);
        }, 500); // 500ms debounce delay

        // Cleanup function to clear the timeout if minPrice/maxPrice change again
        return () => clearTimeout(delayDebounceFn);
    }, [minPrice, maxPrice]);


    // --- LIVE FILTER EFFECTS (Triggers on state change) ---

    // Effect 1: Triggers when the debounced price range or selected sellers change
    useEffect(() => {
        if (!loading) {
            // debouncedPriceRange updates only after the user stops sliding.
            applyFilters(false);
        }
    }, [debouncedPriceRange, selectedRetailers]);


    // Effect 2: Trigger filter update when sort type or max distance changes
    useEffect(() => {
        if (!loading) {
            applyFilters(false);
        }
    }, [sortType, maxDistance]);
    // -----------------------------------------------------


    const toggleRetailer = (id: string) => {
        setSelectedRetailers(prev =>
            prev.includes(id) ? prev.filter(r => r !== id) : [...prev, id]
        );
    };

    //─ APPLY FILTERS ─────────────────────────────────────────────
    const applyFilters = (reset: boolean = false) => {
        // !!! USE DEBOUNCED VALUES for the API call unless resetting !!!
        const minP = reset ? priceBounds.min : debouncedPriceRange[0];
        const maxP = reset ? priceBounds.max : debouncedPriceRange[1];
        // !!! --------------------------------- !!!

        const distanceLimit = maxDistance ? Number(maxDistance) : undefined;

        const sellerIds = reset
            ? retailers.map(i => i.seller_id)
            : (selectedRetailers.length > 0)
                ? selectedRetailers
                : retailers.map(i => i.seller_id);

        setLoadingProducts(true);
        const categoryIds = reset ? categories.map(c => c.category_id) : (selectedCategories.length > 0) ? selectedCategories : categories.map(c => c.category_id);

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

        if (coord) {
            filter.distFrom = coord;
        }

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
            filter.orderBy = 'relevance';
        }

        loadData(filter);
    };

    // --- CLEAR FILTERS FUNCTION ---
    const clearAllFilters = () => {
        setSearchTerm("");
        setMinPrice(priceBounds.min);
        setMaxPrice(priceBounds.max);
        setDebouncedPriceRange([priceBounds.min, priceBounds.max]); // Reset debounced state too
        setSelectedRetailers([]);
        setMaxDistance("");
        setSortType("");
        setSelectedCategories([]);

        applyFilters(true);
    };

    if (loading) return (
        <div className="min-h-screen flex items-center justify-center bg-green-50 text-green-400 font-medium animate-pulse">
            Loading marketplace...
        </div>
    );

    return (
        <div className="min-h-[calc(100vh-80px)] bg-green-50 flex flex-col">

            {/* ───────────────── MAIN CONTENT ───────────────── */}
            <main className="flex-1 p-6 sm:p-8">

                {/* Top Header */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
                    <div>
                        <h1 className="text-3xl font-extrabold text-slate-900">Wholesale Market</h1>
                        <p className="text-slate-500">
                            Showing <span className="font-bold text-green-500">{filtered.length}</span> items
                        </p>
                    </div>
                </div>

                {/* ───────────────── STICKY HORIZONTAL FILTER BAR ───────────────── */}
                {/* FIX: Change top-[80px] to top-2 or top-0 */}
                <div className="sticky top-2 bg-white p-4 rounded-2xl shadow-md flex flex-nowrap overflow-x-auto no-scrollbar gap-4 items-center border border-green-100 mb-8 z-30">

                    {/* Search Bar */}
                    <div className="relative w-full md:w-64">
                        <div className="absolute inset-y-0 left-0 pl-4  items-center pointer-events-none">
                            <Search className="h-5 w-5 text-green-400" />
                        </div>
                        <input
                            type="text"
                            className="block w-full pl-11 pr-4 py-2 bg-green-50 border border-transparent rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all text-sm font-medium"
                            placeholder="Search items..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>

                    {/* Sort By Dropdown */}
                    <div className="relative w-full md:w-48">
                        <label htmlFor="sort" className="sr-only">Sort By</label>
                        <select
                            id="sort"
                            className="w-full p-2.5 bg-green-50 border border-transparent rounded-xl focus:bg-white focus:border-green-500 focus:ring-2 focus:ring-green-100 outline-none transition-all font-medium text-slate-700 text-sm appearance-none cursor-pointer"
                            value={sortType}
                            onChange={e => setSortType(e.target.value)}
                        >
                            <option value="">Sort: Recommended</option>
                            <option value="price_asc">Price: Low to High</option>
                            <option value="price_desc">Price: High to Low</option>
                            <option value="distance" disabled={coord ? false : true}>Nearest Distance</option>
                        </select>
                    </div>

                    {/* Max Distance Input */}
                    <div className="relative w-full md:w-32">
                        <label htmlFor="maxDist" className="sr-only">Max Distance (km)</label>
                        <input
                            id="maxDist"
                            type="number"
                            className="w-full p-2.5 bg-green-50 border border-transparent rounded-xl focus:bg-white focus:border-green-500 focus:ring-2 focus:ring-green-100 outline-none transition-all font-medium text-slate-700 text-sm"
                            placeholder="Max Dist (km)"
                            value={maxDistance}
                            onChange={(e) => setMaxDistance(e.target.value)}
                        />
                    </div>

                    {/* Price Range Dropdown */}
                    <div className="relative">
                        <button
                            // Close other dropdown when opening this one
                            onClick={() => { setIsPriceFilterOpen(prev => !prev); if (!isPriceFilterOpen) { setIsSellersFilterOpen(false); } }}
                            className={`p-2.5 font-bold rounded-xl flex items-center gap-1 transition-colors text-sm whitespace-nowrap ${isPriceFilterOpen ? 'bg-green-600 text-white' : 'bg-green-50 text-green-700 hover:bg-green-100'}`}
                        >
                            <Filter size={16} />
                            Price Range
                            <span className="font-normal text-xs">(${minPrice} - ${maxPrice})</span>
                            <ChevronDown size={16} className={isPriceFilterOpen ? 'rotate-180' : ''} />
                        </button>

                        {/* Price Range Dropdown CONTENT */}
                        {isPriceFilterOpen && (
                            <div className="absolute top-full mt-2 w-72 p-4 bg-white rounded-xl shadow-xl border border-green-100 z-40">
                                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4">Price Range</h3>
                                <div className="px-1">
                                    <PriceSlider
                                        min={priceBounds.min}
                                        max={priceBounds.max}
                                        value={[minPrice, maxPrice]}
                                        // This updates the minPrice/maxPrice states immediately (live drag feedback)
                                        onChange={(vals: number[]) => {
                                            setMinPrice(vals[0]);
                                            setMaxPrice(vals[1]);
                                        }}
                                    />
                                </div>
                                <div className="flex justify-between text-xs font-medium text-slate-500 mt-2">
                                    <span>Min: ${minPrice}</span>
                                    <span>Max: ${maxPrice}</span>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Sellers Dropdown */}
                    <div className="relative">
                        <button
                            // Close other dropdown when opening this one
                            onClick={() => { setIsSellersFilterOpen(prev => !prev); if (!isSellersFilterOpen) { setIsPriceFilterOpen(false) } }}
                            className={`p-2.5 font-bold rounded-xl flex items-center gap-1 transition-colors text-sm whitespace-nowrap ${isSellersFilterOpen ? 'bg-green-600 text-white' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'}`}
                        >
                            <Filter size={16} />
                            Sellers
                            <span className="font-normal text-xs">
                                ({selectedRetailers.length === 0 ? 'All' : `${selectedRetailers.length} selected`})
                            </span>
                            <ChevronDown size={16} className={isSellersFilterOpen ? 'rotate-180' : ''} />
                        </button>

                        {/* Sellers Dropdown CONTENT */}
                        {isSellersFilterOpen && (
                            <div className="absolute top-full mt-2 w-64 p-4 bg-white rounded-xl shadow-xl border border-green-100 z-40">
                                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Sellers ({retailers.length})</h3>

                                <p className="text-xs text-slate-500 italic mb-3 p-1 bg-green-50 rounded-lg border-l-4 border-green-300">
                                    Deselecting all sellers will show all listings.
                                </p>

                                <div className="space-y-1 max-h-48 overflow-y-auto pr-2 custom-scrollbar">
                                    {retailers.map(r => (
                                        <label key={r.seller_id} className="flex items-center space-x-3 p-1 rounded-lg hover:bg-green-50 cursor-pointer transition-colors group">
                                            <div className="relative flex items-center">
                                                <input
                                                    type="checkbox"
                                                    className="peer h-4 w-4 cursor-pointer appearance-none rounded border border-slate-200 checked:border-green-500 checked:bg-green-500 transition-all"
                                                    checked={selectedRetailers.includes(r.seller_id)}
                                                    onChange={() => toggleRetailer(r.seller_id)}
                                                />
                                                <svg className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-white opacity-0 peer-checked:opacity-100" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
                                            </div>
                                            <span className="text-sm font-medium text-slate-600 group-hover:text-green-600 transition-colors">{r.name}</span>
                                        </label>
                                    ))}
                                    {retailers.length === 0 && <p className="text-sm text-slate-400 italic">No sellers found.</p>}
                                </div>
                            </div>
                        )}
                    </div>
                    {/* Categories Dropdown */}
                    <div className="relative">
                        <button
                            onClick={() => {
                                setIsCategoriesFilterOpen(prev => !prev);
                                if (!isCategoriesFilterOpen) {
                                    setIsPriceFilterOpen(false);
                                    setIsSellersFilterOpen(false);
                                }
                            }}
                            className={`p-2.5 font-bold rounded-xl flex items-center gap-1 transition-colors text-sm whitespace-nowrap ${isCategoriesFilterOpen ? 'bg-green-600 text-white' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                                }`}
                        >
                            <Filter size={16} />
                            Categories
                            <span className="font-normal text-xs">
                                {selectedCategories.length === 0 ? "(All)" : `(${selectedCategories.length} selected)`}
                            </span>
                            <ChevronDown size={16} className={isCategoriesFilterOpen ? 'rotate-180' : ''} />
                        </button>

                        {isCategoriesFilterOpen && (
                            <div className="absolute top-full mt-2 w-64 p-4 bg-white rounded-xl shadow-xl border border-green-100 z-40">
                                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">
                                    Categories ({categories.length})
                                </h3>

                                <div className="space-y-1 max-h-48 overflow-y-auto pr-2 custom-scrollbar">
                                    {categories.map(c => (
                                        <label key={c.category_id} className="flex items-center space-x-3 p-1 rounded-lg hover:bg-green-50 cursor-pointer transition-colors group">
                                            <div className="relative flex items-center">
                                                <input
                                                    type="checkbox"
                                                    className="peer h-4 w-4 cursor-pointer appearance-none rounded border border-slate-200 checked:border-green-500 checked:bg-green-500 transition-all"
                                                    checked={selectedCategories.includes(c.category_id)}
                                                    onChange={() => toggleCategory(c.category_id)}
                                                />
                                                <svg className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-white opacity-0 peer-checked:opacity-100" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round">
                                                    <polyline points="20 6 9 17 4 12"></polyline>
                                                </svg>
                                            </div>
                                            <span className="text-sm font-medium text-slate-600 group-hover:text-green-600 transition-colors">
                                                {c.category_name}
                                            </span>
                                        </label>
                                    ))}
                                    {categories.length === 0 && (
                                        <p className="text-sm text-slate-400 italic">No categories found.</p>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>


                    {/* Reset Button */}
                    <button
                        onClick={clearAllFilters}
                        className="text-xs font-bold text-slate-500 hover:text-green-700 ml-auto whitespace-nowrap"
                    >
                        Reset All
                    </button>

                </div>
                {/* ───────────────── END HORIZONTAL FILTER BAR ───────────────── */}

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
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
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

export default WholesaleMarket;