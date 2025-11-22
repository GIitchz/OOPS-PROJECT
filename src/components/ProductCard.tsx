import React from "react";
import { useCart } from "../context/CartContext";
import { Link } from "react-router-dom";
import { ShoppingCart, MapPin } from 'lucide-react'; // Added MapPin
import { ListingInterface } from "../utils/Interfaces";

// Updated Props Interface
interface ProductCardProps {
    product: any;
    displayDist?: boolean; // Now optional, defaults to false if not provided
}

function ProductCard({ product, displayDist = false }: ProductCardProps) {
    const { name, image_url, listings, lowest_price } = product;
    const { addToCart } = useCart();

    // Find the best listing (Cheapest In-Stock)
    const bestListing =
        listings
            ?.filter((l: any) => Number(l.stock) > 0)
            ?.sort((a: any, b: any) => a.price - b.price)[0] || null;

    const handleAddToCart = (e: React.MouseEvent) => {
        e.preventDefault();

        if (!bestListing) {
            console.error("No valid listing found");
            return;
        }

        const listingForCart: ListingInterface = {
            product_listings_id: bestListing.product_listings_id,
            price: bestListing.price,
            stock: bestListing.stock,
            seller_id: bestListing.seller_id,
            seller: {
                name: bestListing.seller?.name || "Unknown",
                location: bestListing.seller?.location,
                user_role: bestListing.seller?.user_role
            },
            productInfo: {
                name: product.name,
                image_url: product.image_url,
                description: product.description
            }
        };

        addToCart(listingForCart);
    };

    return (
        <Link to={`/product/${product.id || product.product_id}`} className="group block h-full">
            <div className="bg-white rounded-3xl shadow-[0_2px_15px_-3px_rgba(0,0,0,0.07)] hover:shadow-[0_8px_25px_-5px_rgba(0,0,0,0.1)] border border-slate-100 overflow-hidden transition-all duration-300 flex flex-col h-full hover:-translate-y-1">

                <div className="relative h-56 overflow-hidden bg-rose-50 p-4">
                    <img
                        src={image_url || 'https://via.placeholder.com/300'}
                        alt={name}
                        className="w-full h-full object-contain mix-blend-multiply group-hover:scale-105 transition-transform duration-500"
                    />

                    {/* DISTANCE BADGE */}
                    {/* Only show if enabled AND if the listing has distance data */}
                    {displayDist && bestListing?.distance_from_user !== undefined && (
                        <div className="absolute top-3 right-3 bg-white/90 backdrop-blur-sm px-2 py-1 rounded-lg shadow-sm flex items-center gap-1 text-xs font-bold text-slate-600">
                            <MapPin size={12} className="text-rose-500" />
                            {bestListing.distance_from_user.toFixed(1)} km
                        </div>
                    )}
                </div>

                <div className="p-5 flex flex-col flex-grow">
                    <h3 className="text-lg font-bold text-slate-800 mb-1 line-clamp-2 group-hover:text-rose-600 transition-colors">
                        {name}
                    </h3>

                    <div className="mt-auto pt-4 flex items-center justify-between">
                        <div className="flex flex-col">
                            {lowest_price ? (
                                <span className="text-2xl font-extrabold text-slate-900">
                                    ₹{lowest_price.toFixed(2)}
                                </span>
                            ) : (
                                <span className="text-sm font-bold text-rose-400 bg-rose-50 px-3 py-1 rounded-full">
                                    Sold Out
                                </span>
                            )}
                        </div>

                        <button
                            onClick={handleAddToCart}
                            disabled={!bestListing}
                            className="p-3 rounded-2xl bg-slate-100 text-slate-600 hover:bg-rose-500 hover:text-white hover:shadow-lg hover:shadow-rose-200 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300"
                            title="Add to Cart"
                        >
                            <ShoppingCart size={20} strokeWidth={2.5} />
                        </button>
                    </div>
                </div>
            </div>
        </Link>
    );
}

export default ProductCard;