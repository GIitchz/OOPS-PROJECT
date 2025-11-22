import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { getProductById } from "../utils/Database";
import { useCart } from "../context/CartContext";
import { useAuth } from "../context/AuthContext";
import { ShoppingCart, Package, Store, AlertCircle, ChevronDown, ArrowLeft } from "lucide-react";
// Ensure these interfaces are correctly exported from your utils/Interfaces.tsx
import { ListingInterface } from "../utils/Interfaces";

// Local interface to handle the full product object with listings
interface FullProduct {
    id: string;
    name: string;
    description: string | null;
    image_url: string | null;
    listings: ListingInterface[];
    lowest_price: number | null;
}

function ProductDetailPage() {
    const { user } = useAuth();
    const { productId } = useParams();
    const navigate = useNavigate();

    const [product, setProduct] = useState<FullProduct | null>(null);
    const [loading, setLoading] = useState(true);
    const [selectedListing, setSelectedListing] = useState<ListingInterface | null>(null);

    const { addToCart } = useCart();

    // Determine who we want to buy from
    const targetSellerRole = user?.role === 'retailer' ? 'wholesaler' : 'retailer';

    useEffect(() => {
        const loadProduct = async () => {
            if (!productId) return;

            // Cast the response to our FullProduct type (or handle raw data)
            const data: any = await getProductById(productId);

            if (data) {
                // 1. Filter listings based on our role
                const relevantListings = (data.listings || []).filter((l: any) => {
                    const role = l.seller?.user_role?.toLowerCase();
                    return role === targetSellerRole;
                });

                // 2. Update data with filtered listings
                const filteredProduct = {
                    ...data,
                    listings: relevantListings
                };

                setProduct(filteredProduct);

                if (relevantListings.length > 0) {
                    const sorted = [...relevantListings].sort((a: any, b: any) => a.price - b.price);
                    const bestOption = sorted.find((l: any) => l.stock > 0) || sorted[0];
                    setSelectedListing(bestOption);
                }
            }
            setLoading(false);
        };
        loadProduct();
    }, [productId, user]);

    if (loading) return (
        <div className="min-h-screen flex items-center justify-center bg-rose-50 text-rose-500 font-bold animate-pulse">
            Loading fresh details...
        </div>
    );

    if (!product) return (
        <div className="min-h-screen flex items-center justify-center bg-rose-50 text-slate-500">
            Product not found.
        </div>
    );

    // Check if we found any sellers matching our criteria
    if (product.listings.length === 0) {
        return (
            <div className="min-h-[calc(100vh-80px)] flex flex-col items-center justify-center bg-rose-50 p-8 text-center">
                <h2 className="text-2xl font-bold text-slate-800 mb-2">No Sellers Found</h2>
                <p className="text-slate-500 mb-6">
                    {user?.role === 'retailer'
                        ? "No wholesalers are currently selling this item."
                        : "This item is not currently available in retail stores."}
                </p>
                <button onClick={() => navigate(-1)} className="text-rose-600 font-bold hover:underline">Go Back</button>
            </div>
        );
    }

    const isInStock = (selectedListing?.stock || 0) > 0;

    const handleSellerChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const listingId = e.target.value;
        const chosen = product.listings.find((l) => l.product_listings_id === listingId);
        if (chosen) setSelectedListing(chosen);
    };

    const handleAddToCart = () => {
        // Pass the full listing object to addToCart, not just the ID
        if (selectedListing) addToCart(selectedListing);
    };

    const availableListings = product.listings.filter(l => l.stock > 0);
    const dropdownOptions = availableListings.length > 0 ? availableListings : product.listings;

    return (
        <div className="min-h-[calc(100vh-80px)] bg-rose-50 py-8 px-4 sm:px-6 lg:px-8">
            <div className="max-w-6xl mx-auto">

                <button
                    onClick={() => navigate(-1)}
                    className="flex items-center gap-2 text-slate-500 hover:text-rose-600 font-bold mb-6 transition-colors group"
                >
                    <div className="p-2 bg-white rounded-full shadow-sm group-hover:shadow-md transition-all">
                        <ArrowLeft size={18} />
                    </div>
                    Back to Market
                </button>

                <div className="bg-white rounded-[2rem] shadow-xl shadow-rose-100 overflow-hidden border border-rose-100">
                    <div className="lg:grid lg:grid-cols-2 lg:gap-12">

                        {/* Left Column: Image */}
                        <div className="relative h-96 lg:h-full min-h-[400px] bg-rose-50/50 p-8 flex items-center justify-center">
                            <img
                                src={product.image_url || 'https://via.placeholder.com/500'}
                                alt={product.name}
                                className="max-h-full w-auto object-contain mix-blend-multiply drop-shadow-xl hover:scale-105 transition-transform duration-500"
                            />
                        </div>

                        {/* Right Column: Details */}
                        <div className="p-8 lg:p-12 flex flex-col">
                            <div className="mb-auto">
                                <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 mb-4">
                                    {product.name}
                                </h1>
                                <p className="text-lg text-slate-600 mb-8 leading-relaxed">
                                    {product.description || "Fresh, locally sourced, and ready for delivery directly to your doorstep."}
                                </p>

                                <div className="flex items-center gap-2 mb-8">
                                    {isInStock ? (
                                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-green-100 text-green-700 text-sm font-bold">
                                            <Package size={16} /> In Stock
                                        </span>
                                    ) : (
                                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-red-100 text-red-700 text-sm font-bold">
                                            <AlertCircle size={16} /> Out of Stock
                                        </span>
                                    )}
                                    {selectedListing && (
                                        <span className="text-sm text-slate-400">
                                            ({selectedListing.stock} units available)
                                        </span>
                                    )}
                                </div>

                                <div className="bg-slate-50 rounded-2xl p-6 mb-8 border border-slate-100">
                                    <label className="flex items-center gap-2 text-sm font-bold text-slate-700 mb-3">
                                        <Store size={18} className="text-rose-500" />
                                        Select a {targetSellerRole === 'wholesaler' ? 'Wholesaler' : 'Seller'}
                                    </label>
                                    <div className="relative">
                                        <select
                                            className="appearance-none block w-full pl-4 pr-12 py-4 text-base font-medium text-slate-700 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-rose-500 focus:border-rose-500 transition-all cursor-pointer shadow-sm hover:border-rose-300"
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
                                        <p className="text-sm text-slate-500 mb-1">Total Price</p>
                                        <p className="text-4xl font-extrabold text-slate-900">
                                            ₹{selectedListing?.price || "0"}
                                        </p>
                                    </div>
                                </div>

                                <div className="flex gap-4">
                                    <button
                                        className="flex-1 flex items-center justify-center gap-2 bg-rose-500 border border-transparent rounded-2xl py-4 px-8 text-lg font-bold text-white hover:bg-rose-600 hover:shadow-lg hover:shadow-rose-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-rose-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                                        disabled={!isInStock}
                                        onClick={handleAddToCart}
                                    >
                                        <ShoppingCart size={20} />
                                        Add to Cart
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default ProductDetailPage;