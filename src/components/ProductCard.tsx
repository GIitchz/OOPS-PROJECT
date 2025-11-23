import React from "react";
import { useCart } from "../context/CartContext";
import { Link } from "react-router-dom";
import { ShoppingCart } from 'lucide-react';
import { FilteredProductInterface, ListingInterface, ProductListingInterface } from "../utils/Interfaces";

function ProductCard({ product, displayDist }: { product: FilteredProductInterface, displayDist: boolean }) {
    const { name, imageURL, listings } = product;
    const { addToCart } = useCart();

    // --- Find the actual listing that matches the displayed lowest price ---
    const minPriceListing =
        listings
            ?.filter(l => Number(l.stock) > 0)
            ?.sort((a, b) => a.price - b.price)[0] || null;

    const minDistListing =
        listings
            ?.filter(l => Number(l.stock) > 0)
            ?.sort((a, b) => a.distance_from_user - b.distance_from_user)[0] || null;

    const handleAddToCart = (listing: ProductListingInterface) => {
        addToCart(listing.product_listings_id);
    };


    return (
        <Link to={`/product/${product.id}`} className="group block h-full">
            <div className="bg-white rounded-3xl shadow-[0_2px_15px_-3px_rgba(0,0,0,0.07)] hover:shadow-[0_8px_25px_-5px_rgba(0,0,0,0.1)] border border-slate-100 overflow-hidden transition-all duration-300 flex flex-col h-full hover:-translate-y-1">
                {/* Image Area */}
                <div className="relative h-56 overflow-hidden bg-green-50 p-4">
                    <img
                        src={imageURL || 'https://via.placeholder.com/300'}
                        alt={name}
                        className="w-full h-full object-contain mix-blend-multiply group-hover:scale-105 transition-transform duration-500"
                    />
                </div>

                {/* Content */}
                <div className="p-5 flex flex-col flex-grow">
                    {/* Product Name */}
                    <h3 className="text-xl font-bold text-slate-900">{name}</h3>

                    {/* First Row: Minimum Price + Add to Cart */}
                    <div className="flex flex-col space-y-2 mt-2">
                        {minPriceListing ? (
                            <div className="flex items-center justify-between">
                                <div className="flex items-center">
                                    <span className="text-2xl font-semibold text-slate-900">
                                        ₹{minPriceListing.price.toFixed(2)}
                                    </span>
                                    <span className="ml-2 text-xs text-slate-500">(min)</span>
                                </div>
                                <button
                                    onClick={(e) => { e.preventDefault(); handleAddToCart(minPriceListing) }}
                                    disabled={!minPriceListing}
                                    className="p-3 rounded-2xl bg-slate-100 text-slate-600 hover:bg-green-500 hover:text-white hover:shadow-lg hover:shadow-green-200 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300"
                                    title="Add Cheapest to Cart"
                                >
                                    <ShoppingCart size={20} strokeWidth={2.5} />
                                </button>
                            </div>
                        ) : (
                            <span className="text-sm font-bold text-red-400 bg-red-50 px-3 py-1 rounded-full">
                                Sold Out
                            </span>
                        )}
                    </div>

                    {/* Second Row: Minimum Distance + Add to Cart */}
                    {displayDist && minDistListing && minDistListing.distance_from_user ? (
                        <div className="mt-4 flex flex-col space-y-2">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center">
                                    <span className="text-sm font-medium text-slate-600">
                                        {minDistListing.distance_from_user.toFixed(2)} km
                                    </span>
                                    <span className="ml-2 text-xs text-slate-500">(closest)</span>
                                </div>
                                <button
                                    onClick={(e) => { e.preventDefault(); handleAddToCart(minDistListing) }}
                                    disabled={!minDistListing}
                                    className="p-3 rounded-2xl bg-slate-100 text-slate-600 hover:bg-green-500 hover:text-white hover:shadow-lg hover:shadow-green-200 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300"
                                    title="Add Closest to Cart"
                                >
                                    <ShoppingCart size={20} strokeWidth={2.5} />
                                </button>
                            </div>
                        </div>
                    ) : null}
                </div>
            </div>
        </Link>
    );
}

export default ProductCard;