import React from 'react';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { Link, useNavigate } from 'react-router-dom';
import { Trash2, ArrowRight, ShoppingBag, ArrowLeft, Minus, Plus } from 'lucide-react';

function CartPage() {
    const { cartItems, totalPrice, removeFromCart, updateQuantity, clearCart } = useCart();
    const { user } = useAuth();
    const navigate = useNavigate();

    const shoppingPath = user?.role === 'retailer' ? '/admin/retailer/wholesale' : '/dashboard';

    if (cartItems.length === 0) {
        return (
            <div className="min-h-[calc(100vh-80px)] flex flex-col items-center justify-center bg-green-50 p-4 text-center">
                <div className="bg-white p-12 rounded-3xl shadow-xl shadow-green-100 max-w-md w-full border border-green-100">
                    <div className="bg-green-100 w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-6">
                        <ShoppingBag size={40} className="text-green-500" />
                    </div>
                    <h1 className="text-2xl font-bold text-slate-800 mb-2">Your cart is empty</h1>
                    <p className="text-slate-500 mb-8">Looks like you haven't added any items yet!</p>

                    <Link
                        to={shoppingPath}
                        className="inline-flex items-center justify-center px-8 py-3 border border-transparent text-base font-bold rounded-2xl text-white bg-green-600 hover:bg-green-700 transition-all shadow-lg shadow-green-200"
                    >
                        Start Shopping
                    </Link>
                </div>
            </div>
        );
    }

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

    return (
        <div className="min-h-screen bg-green-50 py-8 px-4 sm:px-6 lg:px-8">
            <div className="max-w-5xl mx-auto">

                <button
                    onClick={() => navigate(shoppingPath)}
                    className="flex items-center gap-2 text-slate-500 hover:text-green-600 font-bold mb-6 transition-colors group"
                >
                    <ArrowLeft size={18} className="group-hover:-translate-x-1 transition-transform" />
                    Continue Shopping
                </button>

                <h1 className="text-3xl font-extrabold text-slate-900 mb-8">Shopping Cart</h1>

                <div className="lg:grid lg:grid-cols-12 lg:gap-x-8">

                    {/* Left Column: Cart Items */}
                    <div className="lg:col-span-8">
                        <div className="bg-white rounded-3xl shadow-sm border border-green-100 overflow-hidden mb-8">
                            <ul className="divide-y divide-slate-100">
                                {cartItems.map(item => {
                                    const listing = item.listing;
                                    const product = listing.productInfo;
                                    const isWholesale = listing.seller?.user_role === 'wholesaler';
                                    const step = isWholesale ? 50 : 1;
                                    const minQty = isWholesale ? 50 : 1;
                                    const productDetailLink = `/product/${listing.productInfo.product_id}?listingId=${listing.product_listings_id}`;

                                    return (
                                        <li key={item.cart_item_id} className="p-6 sm:p-8 hover:bg-green-50/30 transition-colors">
                                            <div className="flex items-start">
                                                <div className="h-24 w-24 flex-shrink-0 overflow-hidden rounded-xl border border-slate-200 bg-white">
                                                    <img
                                                        src={product.image_url || 'https://via.placeholder.com/300'}
                                                        alt={product.name}
                                                        className="h-full w-full object-cover object-center"
                                                    />
                                                </div>

                                                <div className="ml-4 flex-1 flex flex-col sm:flex-row sm:items-center sm:justify-between">
                                                    <div className="flex-1">
                                                        <h3 className="text-lg font-bold text-slate-900 line-clamp-2">
                                                            <Link to={productDetailLink} className="hover:text-green-600 transition-colors">
                                                                {product.name}
                                                            </Link>
                                                        </h3>
                                                        <p className="mt-1 text-sm text-slate-500">
                                                            Sold by <span className="font-semibold">{listing.seller.name}</span>
                                                        </p>
                                                        {isWholesale && (
                                                            <span className="inline-block mt-1 px-2 py-0.5 bg-indigo-100 text-indigo-700 text-xs font-bold rounded-md">
                                                                Bulk Item (Min {minQty})
                                                            </span>
                                                        )}
                                                        <p className="mt-2 text-lg font-bold text-green-600">
                                                            ₹{listing.price.toFixed(2)} / unit
                                                        </p>
                                                    </div>

                                                    <div className="mt-4 sm:mt-0 sm:ml-10 flex flex-col items-end gap-3">
                                                        <div className="flex items-center border border-slate-200 rounded-xl overflow-hidden shadow-sm bg-white">
                                                            <button
                                                                onClick={() => handleQtyChange(item, -1)}
                                                                className="p-2 text-slate-600 hover:bg-slate-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                                                disabled={item.quantity <= minQty}
                                                            >
                                                                <Minus size={16} />
                                                            </button>

                                                            <input
                                                                type="number"
                                                                min={minQty}
                                                                step={step}
                                                                value={item.quantity}
                                                                onChange={(e) => {
                                                                    const val = parseInt(e.target.value);
                                                                    if (!isNaN(val)) updateQuantity(item, val);
                                                                }}
                                                                onBlur={(e) => {
                                                                    let val = parseInt(e.target.value);
                                                                    if (val < minQty) val = minQty;
                                                                    else if (isWholesale) val = Math.round(val / step) * step;
                                                                    updateQuantity(item, val || minQty);
                                                                }}
                                                                className="w-16 p-2 text-center border-x border-slate-200 focus:ring-0 bg-transparent font-bold text-slate-900 outline-none"
                                                            />

                                                            <button
                                                                onClick={() => handleQtyChange(item, 1)}
                                                                className="p-2 text-slate-600 hover:bg-slate-100 transition-colors"
                                                            >
                                                                <Plus size={16} />
                                                            </button>
                                                        </div>

                                                        <button
                                                            onClick={() => removeFromCart(item)}
                                                            className="flex items-center gap-1 text-xs font-bold text-slate-400 hover:text-red-500 hover:bg-red-50 px-2 py-1 rounded-lg transition-colors"
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
                                className="text-sm font-bold text-slate-500 hover:text-red-500 hover:underline transition-colors flex items-center gap-1 mx-auto sm:mx-0"
                            >
                                <Trash2 size={16} /> Clear All Items
                            </button>
                        </div>
                    </div>

                    {/* Right Column: Order Summary */}
                    <div className="lg:col-span-4 sticky top-24 h-fit">
                        <div className="bg-white rounded-3xl shadow-xl shadow-green-100/50 border border-green-100 p-6 sm:p-8">
                            <h2 className="text-xl font-bold text-slate-800 mb-6 pb-4 border-b border-slate-100">Cart Summary</h2>

                            <div className="space-y-3">
                                <div className="flex justify-between text-slate-500 text-sm">
                                    <span>Subtotal ({cartItems.length} items)</span>
                                    <span>₹{totalPrice.toFixed(2)}</span>
                                </div>
                                <div className="flex justify-between text-slate-500 text-sm">
                                    <span>Delivery Fee</span>
                                    <span className="text-green-600 font-bold">Free</span>
                                </div>
                                <div className="flex justify-between text-2xl font-extrabold text-slate-900 pt-4 border-t border-slate-100 mt-4">
                                    <span>Total</span>
                                    <span>₹{totalPrice.toFixed(2)}</span>
                                </div>
                            </div>

                            <Link
                                to="/checkout"
                                className="mt-8 w-full flex items-center justify-center px-8 py-4 border border-transparent text-lg font-bold rounded-2xl text-white bg-green-600 hover:bg-green-700 transition-all shadow-lg shadow-green-200 hover:-translate-y-0.5"
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