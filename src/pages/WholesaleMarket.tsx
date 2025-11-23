import React, { useState, useEffect } from 'react';
import { getAllProducts, getAllRetailers, getAllWholesalers, getAllCategories } from '../utils/Database';
import ProductCard from '../components/ProductCard';
import { Search, Filter, ChevronDown, X } from 'lucide-react';
import { FilteredProductInterface } from "../utils/Interfaces";
import PriceSlider from '../components/priceslider';
import useAuth from '../context/AuthContext';
import { FilterInterface, getFilteredListings, groupListingsByProduct } from '../utils/productsDB';

// --- THEME CONSTANTS FOR CONSISTENCY (Switched to Emerald) ---
const PRIMARY_COLOR = 'emerald'; // Changed from 'green'
const PRIMARY_SHADE = '600';     // Main accent color for buttons/text
const SECONDARY_SHADE = '700';   // Darker shade for active state
const PRIMARY_LIGHT_BG = '50';   // Lightest background for sections/inputs
const TEXT_DARK = '900';
const TEXT_MUTED = '500';
const BORDER_SHADE = '200';
// -----------------------------------------------------------

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
    const [maxPrice, setMaxPrice] = useState(5000);
    const [selectedRetailers, setSelectedRetailers] = useState<string[]>([]);
    const [maxDistance, setMaxDistance] = useState("");
    const [sortType, setSortType] = useState("");
    const [priceBounds, setPriceBounds] = useState({ min: 0, max: 5000 });
    const [categories, setCategories] = useState<{ category_id: string, category_name: string }[]>([]);
    const [selectedCategories, setSelectedCategories] = useState<string[]>([]);

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

    // Function to close all filter dropdowns
    const closeAllDropdowns = () => {
        setIsPriceFilterOpen(false);
        setIsSellersFilterOpen(false);
        setIsCategoriesFilterOpen(false);
    };

    const toggleDropdown = (setter: React.Dispatch<React.SetStateAction<boolean>>, current: boolean) => {
        closeAllDropdowns();
        setter(!current);
    };

    // Refactored to accept price bounds directly, or use current state for non-initial loads
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

        // --- FINAL FRONT-END SORTING FIX (unchanged) ---
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

            // Initialize price bounds only on the very first load
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

    // loadMarketplace is now the primary function to gather all filters and call loadData
    const loadMarketplace = async (initialLoad: boolean = false, currentMinPrice?: number, currentMaxPrice?: number) => {
        setLoadingProducts(true);

        let currentCoord = coord;
        if (initialLoad) {
            const newCoord = await getCurrentLocation();
            if (newCoord) {
                currentCoord = newCoord;
                setCoord(newCoord);
            } else if (user && user.location) {
                currentCoord = { lat: user.location.latitude, lng: user.location.longitude };
                setCoord(currentCoord);
            }
        }

        let baseFilter: FilterInterface = {};
        if (currentCoord) {
            baseFilter.distFrom = currentCoord;
        }

        // Use price passed in (from applyFilters) or current state price
        baseFilter.minPrice = currentMinPrice !== undefined ? currentMinPrice : minPrice;
        baseFilter.maxPrice = currentMaxPrice !== undefined ? currentMaxPrice : maxPrice;

        baseFilter.sellerIds = (selectedRetailers.length > 0) ? selectedRetailers : undefined;
        if (searchTerm !== "") baseFilter.searchTerm = searchTerm;
        if (maxDistance) baseFilter.maxDist = Number(maxDistance);
        if (selectedCategories.length > 0)
            baseFilter.categoryIds = selectedCategories;

        // Sorting logic remains the same
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

        await loadData(baseFilter);
    };

    // Renamed applyFilters to triggerMarketplaceLoad for clarity on what it does
    const triggerMarketplaceLoad = (reset: boolean = false) => {
        setLoadingProducts(true);

        let targetMinPrice = minPrice;
        let targetMaxPrice = maxPrice;

        // Handle full reset logic
        if (reset) {
            setSearchTerm("");
            targetMinPrice = priceBounds.min;
            targetMaxPrice = priceBounds.max;
            setMinPrice(targetMinPrice);
            setMaxPrice(targetMaxPrice);
            setSelectedRetailers([]);
            setMaxDistance("");
            setSortType("");
            setSelectedCategories([]);
            closeAllDropdowns(); // Close all on reset
            // Call load with reset prices
            loadMarketplace(false, targetMinPrice, targetMaxPrice);
        } else {
            // Standard load uses current state, which loadMarketplace reads
            loadMarketplace(false);
        }
    }


    // 1. Initial Load Effect
    useEffect(() => {
        if (!userLoading) {
            loadMarketplace(true);
        }
    }, [user, userLoading]);

    // 2. Debounced Effect for live inputs (Search, Price Slider, Checkboxes)
    useEffect(() => {
        if (loading || userLoading) return;

        const delayDebounceFn = setTimeout(() => {
            // This now triggers the API call for all debounced inputs
            // searchTerm, minPrice, maxPrice, selectedRetailers, selectedCategories
            triggerMarketplaceLoad(false);
        }, 500);

        return () => clearTimeout(delayDebounceFn);
        // Dependencies are the 'live' input states
    }, [searchTerm, minPrice, maxPrice, selectedRetailers, selectedCategories]);


    // 3. Immediate Effect for single-action inputs (Sort, Distance)
    useEffect(() => {
        if (!loading) {
            // These changes are intentional and don't need debounce
            // They call the API immediately
            triggerMarketplaceLoad(false);
        }
    }, [sortType, maxDistance]);
    // -----------------------------------------------------


    const toggleRetailer = (id: string) => {
        setSelectedRetailers(prev =>
            prev.includes(id) ? prev.filter(r => r !== id) : [...prev, id]
        );
    };

    // --- CLEAR FILTERS FUNCTION ---
    const clearAllFilters = () => {
        // triggerMarketplaceLoad(true) now handles all the state resets and API call
        triggerMarketplaceLoad(true);
    };

    if (loading || userLoading) return (
        <div className={`min-h-screen flex items-center justify-center bg-${PRIMARY_COLOR}-${PRIMARY_LIGHT_BG} text-${PRIMARY_COLOR}-400 font-medium animate-pulse`}>
            Loading marketplace...
        </div>
    );

    return (
        <div className={`min-h-[calc(100vh-80px)] bg-${PRIMARY_COLOR}-${PRIMARY_LIGHT_BG} flex flex-col`}>

            {/* ───────────────── MAIN CONTENT ───────────────── */}
            <main className="flex-1 p-6 sm:p-8">

                {/* Top Header */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
                    <div>
                        <h1 className={`text-3xl font-extrabold text-slate-${TEXT_DARK}`}>Wholesale Market 🛒</h1>
                        <p className={`text-slate-${TEXT_MUTED}`}>
                            Showing <span className={`font-bold text-${PRIMARY_COLOR}-${PRIMARY_SHADE}`}>{filtered.length}</span> items
                        </p>
                    </div>
                </div>

                {/* ───────────────── STICKY HORIZONTAL FILTER BAR ───────────────── */}
                <div className={`sticky top-4 bg-white p-4 rounded-2xl shadow-xl flex flex-wrap sm:flex-nowrap gap-4 items-center border border-${PRIMARY_COLOR}-${BORDER_SHADE} mb-8 z-30`}>

                    {/* Search Bar */}
                    <div className="relative w-full md:w-64 flex-shrink-5">
                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                            <Search className={`h-5 w-5 text-${PRIMARY_COLOR}-400`} />
                        </div>
                        <input
                            type="text"
                            // Focused color updated to emerald-600 ring
                            className={`block w-full pl-11 pr-4 py-2 bg-${PRIMARY_COLOR}-${PRIMARY_LIGHT_BG} border border-transparent rounded-xl text-slate-${TEXT_DARK} placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-${PRIMARY_COLOR}-${PRIMARY_SHADE} focus:border-white transition-all text-sm font-medium`}
                            placeholder="Search items..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>

                    {/* Sort By Dropdown (Select) */}
                    <div className="relative w-full md:w-48 flex-shrink-2">
                        <label htmlFor="sort" className="sr-only">Sort By</label>
                        <select
                            id="sort"
                            // Hover/focus colors updated
                            className={`w-full p-2.5 bg-${PRIMARY_COLOR}-${PRIMARY_LIGHT_BG} border border-transparent rounded-xl focus:bg-white focus:border-${PRIMARY_COLOR}-${PRIMARY_SHADE} focus:ring-2 hover:bg-${PRIMARY_COLOR}-100 focus:ring-${PRIMARY_COLOR}-100 outline-none transition-all font-medium text-slate-700 text-sm appearance-none cursor-pointer`}
                            value={sortType}
                            onChange={e => setSortType(e.target.value)}
                        >
                            <option value="">Sort: Recommended</option>
                            <option value="price_asc">Price: Low to High</option>
                            <option value="price_desc">Price: High to Low</option>
                            <option value="distance" disabled={coord ? false : true}>Nearest Distance</option>
                        </select>
                        <ChevronDown className={`absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-${TEXT_MUTED} pointer-events-none`} />
                    </div>

                    {/* Max Distance Input */}
                    <div className="relative w-full md:w-32 flex-shrink-1">
                        <label htmlFor="maxDist" className="sr-only">Max Distance (km)</label>
                        <input
                            id="maxDist"
                            type="number"
                            // Hover/focus colors updated
                            className={`w-full p-2.5 bg-${PRIMARY_COLOR}-${PRIMARY_LIGHT_BG} border border-transparent rounded-xl focus:bg-white focus:border-${PRIMARY_COLOR}-${PRIMARY_SHADE} focus:ring-2 hover:bg-${PRIMARY_COLOR}-100 focus:ring-${PRIMARY_COLOR}-100 outline-none transition-all font-medium text-slate-700 text-sm`}
                            placeholder="Max Dist (km)"
                            value={maxDistance}
                            onChange={(e) => setMaxDistance(e.target.value)}
                        />
                    </div>

                    {/* Price Range Dropdown (BUTTON) - VIBRANT ACTIVE STATE */}
                    <div className="relative flex-shrink-2">
                        <button
                            onClick={() => toggleDropdown(setIsPriceFilterOpen, isPriceFilterOpen)}
                            className={`p-2.5 font-bold rounded-xl flex items-center gap-1 transition-colors text-sm whitespace-nowrap shadow-md
                                ${isPriceFilterOpen
                                    ? `bg-${PRIMARY_COLOR}-${SECONDARY_SHADE} text-white shadow-${PRIMARY_COLOR}-400/50` // Darker shade for active/vibrant
                                    : `bg-slate-100 text-slate-700 hover:bg-${PRIMARY_COLOR}-100 hover:text-${PRIMARY_COLOR}-${SECONDARY_SHADE}`
                                }`}
                        >
                            <Filter size={16} />
                            Price Range
                            <span className="font-normal text-xs">(${minPrice} - ${maxPrice})</span>
                            <ChevronDown size={16} className={isPriceFilterOpen ? 'rotate-180' : ''} />
                        </button>

                        {/* Price Range Dropdown CONTENT */}
                        {isPriceFilterOpen && (
                            <div className={`absolute top-full mt-2 w-72 p-4 bg-white rounded-xl shadow-2xl border border-${PRIMARY_COLOR}-${BORDER_SHADE} z-40 right-0 md:right-auto`}>
                                <h3 className={`text-xs font-bold text-slate-${TEXT_MUTED} uppercase tracking-wider mb-4`}>Price Range</h3>
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
                                <div className={`flex justify-between text-xs font-medium text-slate-${TEXT_MUTED} mt-2`}>
                                    <span>Min: ${minPrice}</span>
                                    <span>Max: ${maxPrice}</span>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Sellers Dropdown (BUTTON) - VIBRANT ACTIVE STATE */}
                    <div className="relative flex-shrink-2">
                        <button
                            onClick={() => toggleDropdown(setIsSellersFilterOpen, isSellersFilterOpen)}
                            className={`p-2.5 font-bold rounded-xl flex items-center gap-1 transition-colors text-sm whitespace-nowrap shadow-md
                                ${isSellersFilterOpen
                                    ? `bg-${PRIMARY_COLOR}-${SECONDARY_SHADE} text-white shadow-${PRIMARY_COLOR}-400/50`
                                    : `bg-slate-100 text-slate-700 hover:bg-${PRIMARY_COLOR}-100 hover:text-${PRIMARY_COLOR}-${SECONDARY_SHADE}`
                                }`}
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
                            <div className={`absolute top-full mt-2 w-64 p-4 bg-white rounded-xl shadow-2xl border border-${PRIMARY_COLOR}-${BORDER_SHADE} z-40 right-0 md:right-auto`}>
                                <h3 className={`text-xs font-bold text-slate-${TEXT_MUTED} uppercase tracking-wider mb-3`}>Sellers ({retailers.length})</h3>

                                <p className={`text-xs text-slate-500 italic mb-3 p-2 bg-${PRIMARY_COLOR}-50 rounded-lg border-l-4 border-${PRIMARY_COLOR}-300`}>
                                    Deselecting all sellers will show all listings.
                                </p>

                                <div className="space-y-1 max-h-48 overflow-y-auto pr-2 custom-scrollbar">
                                    {retailers.map(r => (
                                        <label key={r.seller_id} className={`flex items-center space-x-3 p-1 rounded-lg hover:bg-${PRIMARY_COLOR}-50 cursor-pointer transition-colors group`}>
                                            <div className="relative flex items-center">
                                                <input
                                                    type="checkbox"
                                                    // Checkbox color updated to emerald-500
                                                    className={`peer h-4 w-4 cursor-pointer appearance-none rounded border border-slate-${BORDER_SHADE} checked:border-${PRIMARY_COLOR}-500 checked:bg-${PRIMARY_COLOR}-500 transition-all`}
                                                    checked={selectedRetailers.includes(r.seller_id)}
                                                    onChange={() => toggleRetailer(r.seller_id)}
                                                />
                                                <svg className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-white opacity-0 peer-checked:opacity-100" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
                                            </div>
                                            <span className={`text-sm font-medium text-slate-600 group-hover:text-${PRIMARY_COLOR}-${PRIMARY_SHADE} transition-colors`}>{r.name}</span>
                                        </label>
                                    ))}
                                    {retailers.length === 0 && <p className={`text-sm text-slate-${TEXT_MUTED} italic`}>No sellers found.</p>}
                                </div>
                            </div>
                        )}
                    </div>
                    {/* Categories Dropdown (BUTTON) - VIBRANT ACTIVE STATE */}
                    <div className="relative flex-shrink-2">
                        <button
                            onClick={() => toggleDropdown(setIsCategoriesFilterOpen, isCategoriesFilterOpen)}
                            className={`p-2.5 font-bold rounded-xl flex items-center gap-1 transition-colors text-sm whitespace-nowrap shadow-md
                                ${isCategoriesFilterOpen
                                    ? `bg-${PRIMARY_COLOR}-${SECONDARY_SHADE} text-white shadow-${PRIMARY_COLOR}-400/50`
                                    : `bg-slate-100 text-slate-700 hover:bg-${PRIMARY_COLOR}-100 hover:text-${PRIMARY_COLOR}-${SECONDARY_SHADE}`
                                }`}
                        >
                            <Filter size={16} />
                            Categories
                            <span className="font-normal text-xs">
                                {selectedCategories.length === 0 ? "(All)" : `(${selectedCategories.length} selected)`}
                            </span>
                            <ChevronDown size={16} className={isCategoriesFilterOpen ? 'rotate-180' : ''} />
                        </button>

                        {/* Categories Dropdown CONTENT */}
                        {isCategoriesFilterOpen && (
                            <div className={`absolute top-full mt-2 w-64 p-4 bg-white rounded-xl shadow-2xl border border-${PRIMARY_COLOR}-${BORDER_SHADE} z-40 right-0 md:right-auto`}>
                                <h3 className={`text-xs font-bold text-slate-${TEXT_MUTED} uppercase tracking-wider mb-3`}>
                                    Categories ({categories.length})
                                </h3>

                                <div className="space-y-1 max-h-48 overflow-y-auto pr-2 custom-scrollbar">
                                    {categories.map(c => (
                                        <label key={c.category_id} className={`flex items-center space-x-3 p-1 rounded-lg hover:bg-${PRIMARY_COLOR}-50 cursor-pointer transition-colors group`}>
                                            <div className="relative flex items-center">
                                                <input
                                                    type="checkbox"
                                                    // Checkbox color updated to emerald-500
                                                    className={`peer h-4 w-4 cursor-pointer appearance-none rounded border border-slate-${BORDER_SHADE} checked:border-${PRIMARY_COLOR}-500 checked:bg-${PRIMARY_COLOR}-500 transition-all`}
                                                    checked={selectedCategories.includes(c.category_id)}
                                                    onChange={() => toggleCategory(c.category_id)}
                                                />
                                                <svg className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-white opacity-0 peer-checked:opacity-100" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round">
                                                    <polyline points="20 6 9 17 4 12"></polyline>
                                                </svg>
                                            </div>
                                            <span className={`text-sm font-medium text-slate-600 group-hover:text-${PRIMARY_COLOR}-${PRIMARY_SHADE} transition-colors`}>
                                                {c.category_name}
                                            </span>
                                        </label>
                                    ))}
                                    {categories.length === 0 && (
                                        <p className={`text-sm text-slate-${TEXT_MUTED} italic`}>No categories found.</p>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>


                    {/* Reset Button */}
                    <button
                        onClick={clearAllFilters}
                        // Used text-slate for base color and a distinct red for hover/action to break up the green monotone
                        className={`text-xs font-bold text-slate-500 hover:text-red-500 hover:bg-red-50 p-2 rounded-lg ml-auto whitespace-nowrap flex-shrink-0 flex items-center gap-1 transition-colors`}
                    >
                        <X size={14} />
                        Reset All
                    </button>

                </div>
                {/* ───────────────── END HORIZONTAL FILTER BAR ───────────────── */}

                {/* Product Grid */}
                {loadingProducts ? (
                    <div className={`flex justify-center items-center h-64 text-${PRIMARY_COLOR}-400 font-medium animate-pulse`}>
                        Updating results...
                    </div>
                ) : filtered.length === 0 ? (
                    <div className={`flex flex-col items-center justify-center h-96 text-center bg-white rounded-[2rem] border border-${PRIMARY_COLOR}-50`}>
                        <div className={`w-20 h-20 bg-${PRIMARY_COLOR}-50 rounded-full flex items-center justify-center mb-4`}>
                            <Search className={`text-${PRIMARY_COLOR}-500`} size={32} />
                        </div>
                        <h3 className={`text-xl font-bold text-slate-${TEXT_DARK}`}>No products found</h3>
                        <p className={`text-slate-${TEXT_MUTED} mt-2 max-w-xs`}>Try adjusting your filters or search term.</p>
                        <button
                            onClick={clearAllFilters}
                            className={`mt-6 text-${PRIMARY_COLOR}-${PRIMARY_SHADE} font-bold hover:underline`}
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