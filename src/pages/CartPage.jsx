import React from 'react';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { Link, useNavigate } from 'react-router-dom';
import { Trash2, ArrowRight, ShoppingBag, ArrowLeft, Minus, Plus } from 'lucide-react';

function CartPage() {
    const { cartItems, totalPrice, removeFromCart, updateQuantity, clearCart } = useCart();
    const { user } = useAuth();
    const navigate = useNavigate();

    // Utility for consistent currency formatting
    const formatIndianRupee = (amount) => {
        return new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: 'INR',
            minimumFractionDigits: 2,
        }).format(amount);
    };

    const shoppingPath = user?.role === 'retailer' ? '/admin/retailer/wholesale' : '/dashboard';

    const handleQtyChange = (item, delta) => {
        const isWholesale = item.listing.seller?.user_role === 'wholesaler';
        const step = isWholesale ? 50 : 1;
        const minQty = isWholesale ? 50 : 1;

        let newQty = item.quantity + (delta * step);

        if (newQty < minQty) {
            newQty = minQty;
        }

        updateQuantity(item, newQty);
    };
    
    // Quantity handlers to ensure input integrity
    const handleQuantityInput = (item, e) => {
        const val = parseInt(e.target.value);
        if (!isNaN(val)) updateQuantity(item, val);
    };

    const handleQuantityBlur = (item, e) => {
        let val = parseInt(e.target.value);
        const isWholesale = item.listing.seller?.user_role === 'wholesaler';
        const step = isWholesale ? 50 : 1;
        const minQty = isWholesale ? 50 : 1;

        if (isNaN(val)) {
            val = item.quantity;
        }
        if (val < minQty) {
            val = minQty;
        }
        if (isWholesale) {
            val = Math.round(val / step) * step;
            val = Math.max(minQty, val); 
        }

        updateQuantity(item, val);
    };
    // End Quantity Handlers

    // The new button class applied to main actions
    const primaryButtonClass = "flex-1 flex items-center justify-center gap-2 bg-emerald-500 border border-transparent rounded-2xl py-4 px-8 text-xl font-extrabold text-white hover:bg-emerald-600 hover:shadow-xl hover:shadow-emerald-200 focus:outline-none focus:ring-4 focus:ring-offset-2 focus:ring-emerald-300 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-700 ease-out transform hover:scale-[1.01]";
    
    // Updated class for quantity buttons
    const qtyButtonClass = "p-2 text-slate-600 hover:bg-emerald-50 hover:text-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-300 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200";

    if (cartItems.length === 0) {
        return (
            // ✨ VIBRANCY CHANGE 1: Lighter background for subtle contrast
            <div className="min-h-[calc(100vh-80px)] flex flex-col items-center justify-center bg-gray-100/50 p-4 text-center">
                {/* ✨ VIBRANCY CHANGE 2: Softer shadow for lift */}
                <div className="bg-white p-12 rounded-3xl shadow-xl shadow-emerald-100 max-w-md w-full border border-slate-100">
                    <div className="bg-emerald-50 w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-6">
                        {/* ✨ VIBRANCY CHANGE 3: Icon color matching theme */}
                        <ShoppingBag size={40} className="text-emerald-600" />
                    </div>
                    <h1 className="text-2xl font-bold text-slate-800 mb-2">Your cart is empty</h1>
                    <p className="text-slate-500 mb-8">Looks like you haven't added any items yet!</p>

                    <Link
                        to={shoppingPath}
                        className={primaryButtonClass}
                    >
                        Start Shopping
                    </Link>
                </div>
            </div>
        );
    }

    return (
        // ✨ VIBRANCY CHANGE 1: Lighter background for subtle contrast
        <div className="min-h-screen bg-gray-100/50 py-8 px-4 sm:px-6 lg:px-8">
            <div className="max-w-5xl mx-auto">

                <button
                    onClick={() => navigate(shoppingPath)}
                    // ✨ VIBRANCY CHANGE 4: Stronger emerald hover on secondary action
                    className="flex items-center gap-2 text-slate-600 hover:text-emerald-700 font-semibold mb-6 transition-colors group"
                >
                    <ArrowLeft size={18} className="group-hover:-translate-x-1 transition-transform" />
                    Continue Shopping
                </button>

                <h1 className="text-3xl font-extrabold text-slate-900 mb-8">Shopping Cart</h1>

                <div className="lg:grid lg:grid-cols-12 lg:gap-x-8">

                    {/* Left Column: Cart Items */}
                    <div className="lg:col-span-8">
                        {/* ✨ VIBRANCY CHANGE 2: Enhanced shadow and border */}
                        <div className="bg-white rounded-3xl shadow-2xl shadow-emerald-100/70 border border-slate-100 overflow-hidden mb-8">
                            {/* ✨ VIBRANCY CHANGE 5: Thicker, slightly lighter divider */}
                            <ul className="divide-y divide-slate-100 border-t border-slate-100">
                                {cartItems.map(item => {
                                    const listing = item.listing;
                                    const product = listing.productInfo;
                                    const isWholesale = listing.seller?.user_role === 'wholesaler';
                                    const step = isWholesale ? 50 : 1;
                                    const minQty = isWholesale ? 50 : 1;
                                    const productDetailLink = `/product/${listing.productInfo.product_id}?listingId=${listing.product_listings_id}`;

                                    return (
                                        <li key={item.cart_item_id} className="p-6 sm:p-8 hover:bg-emerald-50/30 transition-colors duration-300">
                                            <div className="flex items-start">
                                                
                                                <div className="h-24 w-24 flex-shrink-0 overflow-hidden rounded-xl border border-slate-300 bg-white">
                                                    <img
                                                        src={product.image_url || 'https://via.placeholder.com/300'}
                                                        alt={product.name}
                                                        className="h-full w-full object-cover object-center"
                                                    />
                                                </div>

                                                <div className="ml-4 flex-1 flex flex-col sm:flex-row sm:items-center sm:justify-between">
                                                    <div className="flex-1">
                                                        <h3 className="text-lg font-bold text-slate-900 line-clamp-2">
                                                            <Link to={productDetailLink} className="hover:text-emerald-600 transition-colors">
                                                                {product.name}
                                                            </Link>
                                                        </h3>
                                                        
                                                        <p className="mt-1 text-sm text-slate-600">
                                                            Sold by <span className="font-semibold text-slate-800">{listing.seller.name}</span>
                                                        </p>
                                                        {isWholesale && (
                                                            // ✨ Added shadow for pop
                                                            <span className="inline-block mt-1 px-2 py-0.5 bg-indigo-100 text-indigo-700 text-xs font-bold rounded-md shadow-sm">
                                                                Bulk Item (Min {minQty})
                                                            </span>
                                                        )}
                                                        {/* ✨ VIBRANCY CHANGE 6: Price pop */}
                                                        <p className="mt-2 text-xl font-extrabold text-emerald-700">
                                                            {formatIndianRupee(listing.price)} / unit
                                                        </p>
                                                    </div>

                                                    <div className="mt-4 sm:mt-0 sm:ml-10 flex flex-col items-end gap-3">
                                                        <div className="flex items-center border border-slate-300 rounded-xl overflow-hidden shadow-md bg-white">
                                                            
                                                            <button
                                                                onClick={() => handleQtyChange(item, -1)}
                                                                className={qtyButtonClass}
                                                                disabled={item.quantity <= minQty}
                                                            >
                                                                <Minus size={16} />
                                                            </button>

                                                            <input
                                                                type="number"
                                                                min={minQty}
                                                                step={step}
                                                                value={item.quantity}
                                                                onChange={(e) => handleQuantityInput(item, e)}
                                                                onBlur={(e) => handleQuantityBlur(item, e)}
                                                                className="w-16 p-2 text-center border-x border-slate-300 focus:ring-0 bg-transparent font-bold text-slate-900 outline-none
                                                                    [appearance:textfield] 
                                                                    [&::-webkit-inner-spin-button]:appearance-none 
                                                                    [&::-webkit-outer-spin-button]:appearance-none"
                                                            />

                                                            <button
                                                                onClick={() => handleQtyChange(item, 1)}
                                                                className={qtyButtonClass}
                                                            >
                                                                <Plus size={16} />
                                                            </button>
                                                        </div>

                                                        <button
                                                            onClick={() => removeFromCart(item)}
                                                            // Danger action button styling (Red) - kept consistent
                                                            className="flex items-center gap-1 text-xs font-bold text-red-500 hover:text-red-700 hover:bg-red-50 px-2 py-1 rounded-lg transition-colors"
                                                        >
                                                            <Trash2 size={14} /> Remove
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                        </li>
                                    );
                                })}
                            </ul>
                        </div>

                        <div className="text-center sm:text-left mb-8">
                            <button
                                onClick={() => {
                                    if (window.confirm("Are you sure you want to clear your cart?")) {
                                        clearCart();
                                    }
                                }}
                                // Danger action styling (Red)
                                className="text-sm font-bold text-slate-500 hover:text-red-600 hover:underline transition-colors flex items-center gap-1 mx-auto sm:mx-0"
                            >
                                <Trash2 size={16} /> Clear All Items
                            </button>
                        </div>
                    </div>

                    {/* Right Column: Order Summary */}
                    <div className="lg:col-span-4 sticky top-24 h-fit">
                        {/* ✨ VIBRANCY CHANGE 2: Enhanced shadow and border */}
                        <div className="bg-white rounded-3xl shadow-2xl shadow-emerald-100/70 border border-slate-100 p-6 sm:p-8">
                            <h2 className="text-xl font-bold text-slate-800 mb-6 pb-4 border-b border-slate-200">Cart Summary</h2>

                            <div className="space-y-3">
                                <div className="flex justify-between text-slate-600 text-base"> 
                                    <span>Subtotal ({cartItems.length} items)</span>
                                    <span>{formatIndianRupee(totalPrice)}</span>
                                </div>
                                <div className="flex justify-between text-slate-600 text-base">
                                    <span>Delivery Fee</span>
                                    {/* ✨ VIBRANCY CHANGE 7: Highlight free status */}
                                    <span className="text-emerald-700 font-extrabold">FREE</span>
                                </div>
                                <div className="flex justify-between text-2xl font-extrabold text-slate-900 pt-4 border-t border-slate-200 mt-4">
                                    <span>Total</span>
                                    {/* ✨ VIBRANCY CHANGE 6: Total price pop */}
                                    <span className="text-emerald-700">{formatIndianRupee(totalPrice)}</span>
                                </div>
                            </div>

                            <Link
                                to="/checkout"
                                className={`mt-8 w-full ${primaryButtonClass}`}
                            >
                                Proceed to Checkout
                                <ArrowRight className="ml-2" size={20} />
                            </Link>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default CartPage;