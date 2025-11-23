import React, { useEffect, useState, useMemo } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import { getProductById, getListingReviews } from "../utils/Database";
import { useCart } from "../context/CartContext";
import { useAuth } from "../context/AuthContext";
import { ShoppingCart, Package, Store, AlertCircle, ChevronDown, ArrowLeft, Star, User } from "lucide-react"; // Added User icon
import { PostgrestError } from "@supabase/supabase-js";
import { FilteredProductInterface, ListingInterface, ReviewInterface } from "../utils/Interfaces";


function ProductDetailPage() {
    const { user } = useAuth();
    const { productId } = useParams();
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const initialListingId = searchParams.get('listingId');

    const [product, setProduct] = useState<FilteredProductInterface | null>(null);
    const [loading, setLoading] = useState(true);
    const [selectedListing, setSelectedListing] = useState<ListingInterface | null>(null);

    const [reviews, setReviews] = useState<ReviewInterface[]>([]);
    const [reviewsLoading, setReviewsLoading] = useState(false);
    const [reviewsError, setReviewsError] = useState<PostgrestError | null>(null);

    const { addToCart } = useCart();

    const targetSellerRole = user?.role === 'retailer' ? 'wholesaler' : 'retailer';

    useEffect(() => {
        const loadProduct = async () => {
            if (!productId) return;
            setLoading(true);

            const data = await getProductById(productId);

            if (data) {
                setProduct(data);

                if (data.listings.length > 0) {
                    let defaultListing: ListingInterface | undefined;

                    if (initialListingId) {
                        defaultListing = data.listings.find(
                            (l) => l.product_listings_id === initialListingId
                        );
                    }

                    if (!defaultListing) {
                        const sorted = data.listings.sort((a, b) => a.price - b.price);
                        defaultListing = sorted.find((l) => l.stock > 0) || sorted[0];
                    }

                    if (defaultListing) {
                        setSelectedListing(defaultListing);
                    }
                }
            }
            setLoading(false);
        };
        loadProduct();
    }, [productId, initialListingId]);

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
                // Filter out reviews without feedback (only ratings) for the feedback list view
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

        return {
            average: parseFloat(average.toFixed(1)),
            count: reviews.length,
        };
    }, [reviews]);

    if (loading) return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 text-rose-500 font-extrabold text-lg">
            <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-rose-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            Loading fresh details...
        </div>
    );

    if (!product || product.listings.length === 0) return (
        <div className="min-h-[calc(100vh-80px)] flex flex-col items-center justify-center bg-gray-50 p-8 text-center">
            <AlertCircle size={48} className="text-rose-500 mb-4" />
            <h2 className="text-3xl font-bold text-slate-800 mb-2">Item Unavailable</h2>
            <p className="text-slate-500 mb-6">
                {product ? (
                    user?.role === 'retailer'
                        ? "No wholesalers are currently selling this item."
                        : "This item is not currently available in retail stores."
                ) : "Product not found."}
            </p>
            <button onClick={() => navigate(-1)} className="text-rose-600 font-bold hover:underline flex items-center gap-1">
                <ArrowLeft size={16} /> Go Back
            </button>
        </div>
    );

    const isInStock = (selectedListing?.stock || 0) > 0;

    const handleSellerChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const listingId = e.target.value;
        const chosen = product.listings.find((l) => l.product_listings_id === listingId);
        if (chosen) setSelectedListing(chosen);
    };

    const handleAddToCart = () => {
        if (selectedListing) addToCart(selectedListing.product_listings_id);
    };

    const availableListings = product.listings.filter(l => l.stock > 0);
    const dropdownOptions = availableListings.length > 0 ? availableListings : product.listings;

    // Helper component for Star Rating
    const StarRating = ({ rating, size = 18 }: { rating: number, size?: number }) => (
        <div className="flex items-center">
            {Array.from({ length: 5 }, (_, i) => (
                <Star
                    key={i}
                    size={size}
                    fill={i < rating ? "#fbbf24" : "#e5e7eb"} // Amber-400 fill
                    color={i < rating ? "#fbbf24" : "#d1d5db"} // Gray-300 stroke
                    className="mr-0.5 transition-colors"
                />
            ))}
        </div>
    );

    return (
        <div className="min-h-[calc(100vh-80px)] bg-gray-50 py-10 px-4 sm:px-6 lg:px-8">
            <div className="max-w-7xl mx-auto">

                <button
                    onClick={() => navigate(-1)}
                    className="flex items-center gap-2 text-slate-600 hover:text-rose-700 font-medium mb-8 transition-colors group"
                >
                    <div className="p-2 bg-white border border-slate-200 rounded-full shadow-sm group-hover:shadow-md transition-all">
                        <ArrowLeft size={18} />
                    </div>
                    Back to Market
                </button>

                {/* --- Product Main Detail Section --- */}
                <div className="bg-white rounded-3xl shadow-2xl shadow-rose-100 overflow-hidden border border-slate-100">
                    <div className="lg:grid lg:grid-cols-2">

                        {/* Left Column: Image */}
                        <div className="relative h-96 lg:h-auto min-h-[400px] bg-gray-100/70 p-12 flex items-center justify-center">
                            <img
                                src={product.imageURL || 'https://via.placeholder.com/600'}
                                alt={product.name}
                                className="max-h-full w-auto object-contain mix-blend-multiply drop-shadow-2xl hover:scale-105 transition-transform duration-700 ease-out"
                            />
                        </div>

                        {/* Right Column: Details & Purchase */}
                        <div className="p-8 lg:p-16 flex flex-col">
                            <div className="mb-auto">
                                <h1 className="text-4xl sm:text-5xl font-black text-slate-900 mb-4 tracking-tight leading-snug">
                                    {product.name}
                                </h1>
                                <p className="text-lg text-slate-600 mb-8 leading-relaxed border-b border-slate-100 pb-8">
                                    {product.description || "Fresh, locally sourced, and ready for delivery directly to your doorstep."}
                                </p>

                                {/* Aggregate Rating & Stock Status */}
                                <div className="flex items-center flex-wrap gap-x-6 gap-y-3 mb-8">
                                    <div className="flex items-center text-2xl font-bold text-amber-500">
                                        <Star size={28} fill="currentColor" className="mr-1" />
                                        <span>{aggregateRating.average || '—'}</span>
                                        <span className="ml-2 text-base text-slate-500 font-normal">
                                            ({aggregateRating.count} Reviews)
                                        </span>
                                    </div>
                                    
                                    {isInStock ? (
                                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-green-50 text-green-700 text-sm font-bold border border-green-200">
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
                                {/* End Rating & Stock */}


                                <div className="bg-white rounded-xl p-6 mb-8 border border-rose-200 shadow-inner">
                                    <label className="flex items-center gap-2 text-base font-bold text-rose-700 mb-4">
                                        <Store size={20} className="text-rose-500" />
                                        Select a {targetSellerRole === 'wholesaler' ? 'Wholesaler' : 'Retailer'}
                                    </label>
                                    <div className="relative">
                                        <select
                                            className="appearance-none block w-full pl-4 pr-12 py-3 text-lg font-semibold text-slate-800 bg-gray-50 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-rose-500 focus:border-rose-500 transition-all cursor-pointer shadow-md hover:border-rose-400"
                                            value={selectedListing?.product_listings_id || ""}
                                            onChange={handleSellerChange}
                                        >
                                            {dropdownOptions.map((l) => (
                                                <option key={l.product_listings_id} value={l.product_listings_id}>
                                                    {l.seller?.name ?? "Unknown Seller"} — ₹{l.price}
                                                </option>
                                            ))}
                                        </select>
                                        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-rose-500">
                                            <ChevronDown size={20} strokeWidth={2.5} />
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="border-t border-slate-100 pt-8 mt-4">
                                <div className="flex items-end justify-between mb-6">
                                    <div>
                                        <p className="text-base text-slate-500 mb-1 font-medium">Your Selected Price</p>
                                        <p className="text-5xl font-extrabold text-rose-600">
                                            ₹{selectedListing?.price || "0"}
                                        </p>
                                    </div>
                                </div>

                                <div className="flex gap-4">
                                    <button
                                        className="flex-1 flex items-center justify-center gap-2 bg-rose-500 border border-transparent rounded-2xl py-4 px-8 text-xl font-extrabold text-white hover:bg-rose-600 hover:shadow-xl hover:shadow-rose-300 focus:outline-none focus:ring-4 focus:ring-offset-2 focus:ring-rose-300 disabled:opacity-50 disabled:cursor-not-allowed transition-all transform hover:scale-[1.01]"
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

                {/* --- Reviews Section --- */}
                <div className="max-w-5xl mx-auto mt-16">
                    <h2 className="text-3xl font-bold text-slate-900 mb-8 pb-3 border-b-4 border-rose-100">
                        <Star size={32} className="inline-block align-middle mr-3 text-amber-500" fill="#f59e0b" />
                        Customer Feedback
                    </h2>

                    {reviewsLoading && (
                        <p className="text-slate-500 text-center py-12 bg-white rounded-xl shadow-lg">Fetching customer reviews...</p>
                    )}

                    {reviewsError && (
                        <div className="bg-red-50 border border-red-300 p-6 rounded-xl text-red-700 text-center shadow-md">
                            <AlertCircle size={24} className="inline mr-2" />
                            **Error loading reviews:** {reviewsError.message}
                        </div>
                    )}

                    {!reviewsLoading && !reviewsError && (
                        <div className="lg:grid lg:grid-cols-12 lg:gap-10">
                            {/* Aggregate Rating Summary */}
                            <div className="lg:col-span-4 mb-8 lg:mb-0">
                                <div className="sticky top-10 p-8 bg-white rounded-3xl shadow-xl border border-amber-100 text-center h-full">
                                    <p className="text-5xl font-extrabold text-slate-900 mb-1">
                                        {aggregateRating.average} / 5
                                    </p>
                                    <StarRating rating={Math.round(aggregateRating.average)} size={30} />
                                    <p className="text-lg text-slate-600 mt-4 font-medium">
                                        Based on **{aggregateRating.count}** verified customer reviews
                                    </p>
                                    <p className="text-sm text-slate-400 mt-2">
                                        Reviews are for the selected seller listing.
                                    </p>
                                </div>
                            </div>

                            {/* Feedback List */}
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
                                                    <User size={16} className="text-rose-500 mr-2" />
                                                    **{review.buyer.name}**
                                                    <span className="ml-2 px-2 py-0.5 bg-rose-50 text-rose-600 rounded-full text-xs font-bold uppercase tracking-wider">
                                                        {review.buyer.role}
                                                    </span>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="text-slate-500 text-center py-12 bg-white rounded-2xl shadow-lg border border-slate-200">
                                        <h3 className="text-xl font-semibold mb-2">No Customer Feedback Yet!</h3>
                                        <p>Be the first to review this item from **{selectedListing?.seller?.name ?? "this seller"}**.</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </div>
                {/* END Reviews Section */}

            </div>
        </div>
    );
}

export default ProductDetailPage;