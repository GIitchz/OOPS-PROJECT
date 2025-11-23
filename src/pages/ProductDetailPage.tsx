import React, { useEffect, useState, useMemo } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import { getProductById, getListingReviews, getAllRetailers, getAllWholesalers } from "../utils/Database";
import { useCart } from "../context/CartContext";
import { useAuth } from "../context/AuthContext";
import { ShoppingCart, Package, Store, AlertCircle, ArrowLeft, Star, User, Tag, MapPin } from "lucide-react";
import { PostgrestError } from "@supabase/supabase-js";
import { FilteredProductInterface, ListingInterface, ReviewInterface, CategoryInterface } from "../utils/Interfaces";
import { FilterInterface, getFilteredListings, groupListingsByProduct } from "../utils/productsDB";

type ListingSortOption = 'price_asc' | 'price_desc' | 'stock_desc' | 'distance_asc' | 'name_asc';

// --- CategoryTags Component (Already Consistent) ---
interface CategoryTagsProps {
    categories: CategoryInterface[];
}
const CategoryTags: React.FC<CategoryTagsProps> = ({ categories }) => {
    if (categories.length === 0) return null;
    return (
        <div className="flex flex-wrap items-center gap-2 mb-6">
            <Tag size={16} className="text-emerald-500 flex-shrink-0" />
            {categories.map((category) => (
                <span
                    key={category.category_id}
                    className="inline-block px-3 py-1 text-sm font-semibold text-emerald-800 bg-emerald-100 rounded-full border border-emerald-300"
                >
                    {category.category_name}
                </span>
            ))}
        </div>
    );
};

// --- StarRating Component (Already Consistent) ---
const StarRating = ({ rating, size = 18 }: { rating: number, size?: number }) => (
    <div className="flex items-center">
        {Array.from({ length: 5 }, (_, i) => (
            <Star
                key={i}
                size={size}
                // Amber/Yellow colors kept for rating consistency
                fill={i < rating ? "#fbbf24" : "#e5e7eb"} // Amber-400 fill
                color={i < rating ? "#fbbf24" : "#d1d5db"} // Gray-300 stroke
                className="mr-0.5 transition-colors"
            />
        ))}
    </div>
);

// --- SellerList Component (Already mostly Consistent, adding a key style fix) ---
interface SellerListProps {
    listings: ListingInterface[];
    selectedListing: ListingInterface | null;
    setSelectedListing: (listing: ListingInterface) => void;
    targetRole: string;
    currentSort: ListingSortOption;
    setSort: (sort: ListingSortOption) => void;
}

const SellerList: React.FC<SellerListProps> = ({ listings, selectedListing, setSelectedListing, targetRole, currentSort, setSort }) => {

    const isDistanceAvailable = listings.some(l => typeof l.distance_from_user === 'number');

    const sortedListings = useMemo(() => {
        const listCopy = [...listings];
        listCopy.sort((a, b) => {
            const aAvailable = a.stock > 0;
            const bAvailable = b.stock > 0;

            if (aAvailable && !bAvailable) return -1;
            if (!aAvailable && bAvailable) return 1;

            switch (currentSort) {
                case 'price_asc': return a.price - b.price;
                case 'price_desc': return b.price - a.price;
                case 'stock_desc': return b.stock - a.stock;
                case 'distance_asc':
                    const aDist = a.distance_from_user ?? Infinity;
                    const bDist = b.distance_from_user ?? Infinity;
                    return aDist - bDist;
                case 'name_asc':
                    const aName = a.seller?.name || "";
                    const bName = b.seller?.name || "";
                    return aName.localeCompare(bName);
                default: return a.price - b.price;
            }
        });
        return listCopy;
    }, [listings, currentSort]);

    useEffect(() => {
        if (!isDistanceAvailable && currentSort === 'distance_asc') {
            setSort('price_asc');
        }
    }, [isDistanceAvailable, currentSort, setSort]);


    return (
        <div className="bg-white rounded-xl p-6 mb-8 border border-emerald-200 shadow-inner">
            <div className="flex justify-between items-center mb-4">
                <label className="flex items-center gap-2 text-base font-bold text-emerald-800">
                    <Store size={20} className="text-emerald-600" />
                    Select a {targetRole === 'wholesaler' ? 'Wholesaler' : 'Retailer'}
                </label>

                <div className="flex items-center gap-2 text-sm text-slate-600">
                    <label htmlFor="listing-sort" className="font-medium">Sort By:</label>
                    <select
                        id="listing-sort"
                        className="p-1.5 border border-slate-300 rounded-lg bg-white focus:ring-emerald-500 focus:border-emerald-500 text-sm font-medium transition-shadow"
                        value={currentSort}
                        onChange={(e) => setSort(e.target.value as ListingSortOption)}
                    >
                        <option value="price_asc">Price (Low to High)</option>
                        <option value="price_desc">Price (High to Low)</option>
                        <option value="stock_desc">Stock (Highest First)</option>
                        {isDistanceAvailable && (
                            <option value="distance_asc">Distance (Nearest)</option>
                        )}
                        <option value="name_asc">Seller Name (A-Z)</option>
                    </select>
                </div>
            </div>

            <div className="space-y-3 max-h-64 overflow-y-auto pr-2 custom-scrollbar">
                {sortedListings.map((l) => {
                    const isSelected = l.product_listings_id === selectedListing?.product_listings_id;
                    const isAvailable = l.stock > 0;
                    const distance = typeof l.distance_from_user === 'number'
                        ? `${l.distance_from_user.toFixed(1)} km`
                        : null;

                    return (
                        <div
                            key={l.product_listings_id}
                            className={`
                                flex items-center justify-between p-4 rounded-xl border-2 cursor-pointer transition-all duration-200
                                ${isSelected
                                    ? 'border-emerald-500 bg-emerald-50 shadow-md'
                                    : 'border-slate-200 bg-gray-50 hover:bg-gray-100 hover:border-emerald-300'
                                }
                                ${!isAvailable && 'opacity-60 grayscale-[5%] pointer-events-none'}
                            `}
                            onClick={() => isAvailable && setSelectedListing(l)}
                            title={!isAvailable ? 'Out of Stock' : ''}
                        >
                            <div className="flex-shrink-0 flex-grow mr-4 min-w-[50%]">
                                <p className="text-lg font-bold text-slate-900">
                                    {l.seller?.name ?? "Unknown Seller"}
                                </p>
                                {distance && (
                                    <div className="flex items-center text-sm text-slate-500 mt-1">
                                        <MapPin size={14} className="text-emerald-400 mr-1" />
                                        {distance}
                                    </div>
                                )}
                            </div>

                            <div className="text-right flex-shrink-0">
                                <p className="text-xl font-extrabold text-emerald-600 mb-0.5">
                                    ₹{l.price.toFixed(2)}
                                </p>
                                <span className={`text-xs font-semibold ${isAvailable ? 'text-emerald-600' : 'text-red-500'}`}>
                                    {isAvailable ? `In Stock: ${l.stock}` : 'OUT OF STOCK'}
                                </span>
                            </div>
                        </div>
                    );
                })}
            </div>
            {/* CSS style tag for scrollbar remains same */}
        </div>
    );
};

function ProductDetailPage() {
    const { user, loading:userLoading } = useAuth();
    const { productId } = useParams();
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const initialListingId = searchParams.get('listingId');

    const [product, setProduct] = useState<FilteredProductInterface | null>(null);
    const [loading, setLoading] = useState(true);
    const [selectedListing, setSelectedListing] = useState<ListingInterface | null>(null);

    const [listingSort, setListingSort] = useState<ListingSortOption>('price_asc');

    const [reviews, setReviews] = useState<ReviewInterface[]>([]);
    const [reviewsLoading, setReviewsLoading] = useState(false);
    const [reviewsError, setReviewsError] = useState<PostgrestError | null>(null);

    const { addToCart } = useCart();
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

    const loadProduct = async () => {
        setLoading(true);
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

        baseFilter.productId = productId;
        const data = await getFilteredListings(baseFilter);
        const cleaned = data.filter((i)=>!user || i.seller_id!=user.id);
        if (data) {
            const prod = groupListingsByProduct(cleaned)[0];
            setProduct(prod);
            if (prod.listings.length > 0) {
                let defaultListing: ListingInterface | undefined;
                if (initialListingId) {
                    defaultListing = prod.listings.find(
                        (l) => l.product_listings_id === initialListingId
                    );
                }
                if (!defaultListing) {
                    const stockedListings = prod.listings.filter(l => l.stock > 0);
                    const sorted = stockedListings.length > 0
                        ? stockedListings.sort((a, b) => a.price - b.price)
                        : prod.listings.sort((a, b) => a.price - b.price);

                    defaultListing = sorted[0];
                }
                if (defaultListing) {
                    setSelectedListing(defaultListing);
                }
            }
        }
        setLoading(false);
    }

    const targetSellerRole = user?.role === 'retailer' ? 'wholesaler' : 'retailer';

    useEffect(() => {
        if(userLoading) return;
        loadProduct();
    }, [productId, user, initialListingId, userLoading]);

    useEffect(() => {
        const loadReviews = async () => {
            if (!selectedListing) {
                setReviews([]);
                return;
            }
            setReviewsLoading(true);
            setReviewsError(null);
            const { data, error } = await getListingReviews(selectedListing.product_listings_id);
            if (error) {
                setReviewsError(error);
                setReviews([]);
            } else {
                const feedbacksOnly = data.filter(r => r.feedback && r.feedback.trim() !== "");
                setReviews(feedbacksOnly);
            }
            setReviewsLoading(false);
        };
        loadReviews();
    }, [selectedListing]);

    const aggregateRating = useMemo(() => {
        if (reviews.length === 0) return { average: 0, count: 0 };
        const totalRating = reviews.reduce((sum, review) => sum + review.rating, 0);
        const average = totalRating / reviews.length;
        return { average: parseFloat(average.toFixed(1)), count: reviews.length };
    }, [reviews]);

    if (loading) return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 text-emerald-500 font-extrabold text-lg">
            <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-emerald-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            Loading fresh details...
        </div>
    );

    if (!product || product.listings.length === 0) return (
        <div className="min-h-[calc(100vh-80px)] flex flex-col items-center justify-center bg-gray-50 p-8 text-center">
            <AlertCircle size={48} className="text-emerald-500 mb-4" />
            <h2 className="text-3xl font-bold text-slate-800 mb-2">Item Unavailable</h2>
            <p className="text-slate-500 mb-6">Product not found.</p>
            <button onClick={() => navigate(-1)} className="text-emerald-600 font-bold hover:underline flex items-center gap-1">
                <ArrowLeft size={16} /> Go Back
            </button>
        </div>
    );

    const isInStock = (selectedListing?.stock || 0) > 0;

    const handleAddToCart = () => {
        if (selectedListing) addToCart(selectedListing.product_listings_id);
    };

    return (
        <div className="min-h-[calc(100vh-80px)] bg-gray-50 py-10 px-4 sm:px-6 lg:px-8">
            <div className="max-w-7xl mx-auto">

                <button
                    onClick={() => navigate(-1)}
                    // Back Button Hover: Changed for consistency (now uses group-hover to change button color)
                    className="flex items-center gap-2 text-slate-600 hover:text-emerald-700 font-medium mb-8 transition-colors group"
                >
                    <div className="p-2 bg-white border border-slate-200 rounded-full shadow-sm group-hover:shadow-md transition-all group-hover:text-emerald-600">
                        <ArrowLeft size={18} />
                    </div>
                    Back to Market
                </button>

                <div className="bg-white rounded-3xl shadow-2xl shadow-emerald-100 overflow-hidden border border-slate-100">
                    <div className="lg:grid lg:grid-cols-2">
                        <div className="relative h-96 lg:h-auto min-h-[400px] bg-gray-100/70 p-12 flex items-center justify-center">
                            <img
                                src={product.imageURL || 'https://via.placeholder.com/600'}
                                alt={product.name}
                                className="max-h-full w-auto object-contain mix-blend-multiply drop-shadow-2xl hover:scale-105 transition-transform duration-700 ease-out"
                            />
                        </div>

                        <div className="p-8 lg:p-16 flex flex-col">
                            <div className="mb-auto">
                                <h1 className="text-4xl sm:text-5xl font-black text-slate-900 mb-4 tracking-tight leading-snug">
                                    {product.name}
                                </h1>

                                <CategoryTags categories={product.categories} />

                                <p className="text-lg text-slate-600 mb-8 leading-relaxed border-b border-slate-100 pb-8">
                                    {product.description || "Fresh, locally sourced, and ready for delivery."}
                                </p>

                                <div className="flex items-center flex-wrap gap-x-6 gap-y-3 mb-8">
                                    <div className="flex items-center text-2xl font-bold text-amber-500">
                                        <Star size={28} fill="currentColor" className="mr-1" />
                                        <span>{aggregateRating.average || '—'}</span>
                                        <span className="ml-2 text-base text-slate-500 font-normal">
                                            ({aggregateRating.count} Reviews)
                                        </span>
                                    </div>

                                    {isInStock ? (
                                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 text-sm font-bold border border-emerald-200">
                                            <Package size={16} /> In Stock
                                        </span>
                                    ) : (
                                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-red-50 text-red-700 text-sm font-bold border border-red-200">
                                            <AlertCircle size={16} /> Out of Stock
                                        </span>
                                    )}
                                    {selectedListing && (
                                        <span className="text-sm text-slate-400">
                                            ({selectedListing.stock} units available)
                                        </span>
                                    )}
                                </div>

                                {product.listings.length > 0 ? (
                                    <SellerList
                                        listings={product.listings}
                                        selectedListing={selectedListing}
                                        setSelectedListing={setSelectedListing}
                                        targetRole={targetSellerRole}
                                        currentSort={listingSort}
                                        setSort={setListingSort}
                                    />
                                ) : (
                                    <div className="p-6 bg-red-50 border border-red-200 rounded-xl text-red-700 font-medium">
                                        <AlertCircle size={20} className="inline mr-2" />
                                        No listings available for this product.
                                    </div>
                                )}
                            </div>

                            <div className="border-t border-slate-100 pt-8 mt-4">
                                <div className="flex items-end justify-between mb-6">
                                    <div>
                                        <p className="text-base text-slate-500 mb-1 font-medium">Your Selected Price</p>
                                        <p className="text-5xl font-extrabold text-emerald-600">
                                            ₹{selectedListing?.price.toFixed(2) || "0.00"}
                                        </p>
                                    </div>
                                </div>

                                <div className="flex gap-4">
                                    <button
                                        // Changed bg-green-600, hover:bg-green-700, hover:shadow-green-200, focus:ring-green-300 to emerald-X00
                                        className="flex-1 flex items-center justify-center gap-2 bg-emerald-500 border border-transparent rounded-2xl py-4 px-8 text-xl font-extrabold text-white hover:bg-emerald-600 hover:shadow-xl hover:shadow-emerald-200 focus:outline-none focus:ring-4 focus:ring-offset-2 focus:ring-emerald-300 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-700 ease-out transform hover:scale-[1.01]"
                                        disabled={!isInStock}
                                        onClick={handleAddToCart}
                                    >
                                        <ShoppingCart size={24} />
                                        Add to Cart
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="max-w-5xl mx-auto mt-16">
                    <h2 className="text-3xl font-bold text-slate-900 mb-8 pb-3 border-b-4 border-emerald-100">
                        <Star size={32} className="inline-block align-middle mr-3 text-amber-500" fill="#f59e0b" />
                        Customer Feedback
                    </h2>

                    {reviewsLoading && (
                        <p className="text-slate-500 text-center py-12 bg-white rounded-xl shadow-lg">Fetching customer reviews...</p>
                    )}

                    {!reviewsLoading && !reviewsError && (
                        <div className="lg:grid lg:grid-cols-12 lg:gap-10">
                            <div className="lg:col-span-4 mb-8 lg:mb-0">
                                <div className="sticky top-10 p-8 bg-white rounded-3xl shadow-xl border border-amber-100 text-center h-full">
                                    <p className="text-5xl font-extrabold text-slate-900 mb-1">
                                        {aggregateRating.average} / 5
                                    </p>
                                    <StarRating rating={Math.round(aggregateRating.average)} size={30} />
                                    <p className="text-lg text-slate-600 mt-4 font-medium">
                                        Based on <span className="font-bold">{aggregateRating.count}</span> verified customer reviews
                                    </p>
                                </div>
                            </div>

                            <div className="lg:col-span-8">
                                {reviews.length > 0 ? (
                                    <div className="space-y-6">
                                        {reviews.map((review, index) => (
                                            <div key={index} className="bg-white p-6 rounded-2xl shadow-lg hover:shadow-xl transition-shadow border border-slate-100">
                                                <div className="flex items-center justify-between mb-4 pb-2 border-b border-slate-50">
                                                    <StarRating rating={review.rating} size={20} />
                                                    <p className="text-xs text-slate-400 font-medium">
                                                        Reviewed on {new Date(review.orderedAt).toLocaleDateString()}
                                                    </p>
                                                </div>
                                                <p className="text-lg text-slate-800 mb-4 italic leading-relaxed">
                                                    "{review.feedback}"
                                                </p>
                                                <div className="flex items-center text-sm font-semibold text-slate-600 border-t border-slate-50 pt-3 mt-3">
                                                    <User size={16} className="text-emerald-500 mr-2" />
                                                    <span className="font-bold">{review.buyer.name}</span>
                                                    <span className="ml-2 px-2 py-0.5 bg-emerald-50 text-emerald-600 rounded-full text-xs font-bold uppercase tracking-wider">
                                                        {review.buyer.role}
                                                    </span>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="text-slate-500 text-center py-12 bg-white rounded-2xl shadow-lg border border-slate-200">
                                        <h3 className="text-xl font-semibold mb-2">No Customer Feedback Yet!</h3>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

export default ProductDetailPage;