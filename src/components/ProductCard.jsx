import React from "react";
import { useCart } from "../context/CartContext";
import { Link } from "react-router-dom";
import { ShoppingCart } from 'lucide-react';

function ProductCard({ product }) {
    const { name, image_url, listings, lowest_price } = product;
    const { addToCart } = useCart();
    //console.log("Listings for product:", product.listings);

    // --- Find the actual listing that matches the displayed lowest price ---
    const bestListing =
        listings
            ?.filter(l => Number(l.stock) > 0)
            ?.sort((a, b) => a.price - b.price)[0] || null;

    const handleAddToCart = (e) => {
        e.preventDefault();

        const bestListing = product.listings
            .filter(l => l.stock > 0)
            .sort((a, b) => a.price - b.price)[0];

        if (!bestListing) {
            console.error("No valid listing found");
            return;
        }

        addToCart({
            product_listings_id: bestListing.product_listings_id,
            product_id: product.product_id,                      
            seller_id: bestListing.seller_id,
            price: bestListing.price,
            name: product.name,
            image_url: product.image_url,
        });
    };


    return (
        <Link to={`/product/${product.id}`} className="group block h-full">
            <div className="bg-white rounded-3xl shadow-[0_2px_15px_-3px_rgba(0,0,0,0.07)] hover:shadow-[0_8px_25px_-5px_rgba(0,0,0,0.1)] border border-slate-100 overflow-hidden transition-all duration-300 flex flex-col h-full hover:-translate-y-1">

                {/* Image Area */}
                <div className="relative h-56 overflow-hidden bg-rose-50 p-4">
                    <img
                        src={image_url || 'https://via.placeholder.com/300'}
                        alt={name}
                        className="w-full h-full object-contain mix-blend-multiply group-hover:scale-105 transition-transform duration-500"
                    />
                </div>

                {/* Content */}
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
