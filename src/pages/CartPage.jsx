import React from 'react';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { Link, useNavigate } from 'react-router-dom';
import { Trash2, ArrowRight, ShoppingBag, ArrowLeft } from 'lucide-react';

function CartPage() {
    const { cartItems, totalPrice, removeFromCart, updateQuantity, clearCart } = useCart();
    const { user } = useAuth();
    const navigate = useNavigate();

    const shoppingPath = user?.role === 'retailer' ? '/admin/retailer/wholesale' : '/dashboard';

    if (cartItems.length === 0) {
        return (
            <div className="min-h-[calc(100vh-80px)] flex flex-col items-center justify-center bg-rose-50 p-4 text-center">
                <div className="bg-white p-12 rounded-3xl shadow-xl shadow-rose-100 max-w-md w-full">
                    <div className="bg-rose-100 w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-6">
                        <ShoppingBag size={40} className="text-rose-500" />
                    </div>
                    <h1 className="text-2xl font-bold text-slate-800 mb-2">Your cart is empty</h1>
                    <p className="text-slate-500 mb-8">Looks like you haven't added any items yet!</p>

                    <Link
                        to={shoppingPath}
                        className="inline-flex items-center justify-center px-8 py-3 border border-transparent text-base font-bold rounded-2xl text-white bg-rose-500 hover:bg-rose-600 transition-all shadow-lg shadow-rose-200"
                    >
                        Start Shopping
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-rose-50 py-8 px-4 sm:px-6 lg:px-8">
            <div className="max-w-5xl mx-auto">

                <button
                    onClick={() => navigate(shoppingPath)}
                    className="flex items-center gap-2 text-slate-500 hover:text-rose-600 font-bold mb-6 transition-colors group"
                >
                    <ArrowLeft size={18} className="group-hover:-translate-x-1 transition-transform" />
                    Continue Shopping
                </button>

                <h1 className="text-3xl font-extrabold text-slate-900 mb-8">Shopping Cart</h1>

                <div className="bg-white rounded-3xl shadow-sm border border-rose-100 overflow-hidden mb-8">
                    <ul className="divide-y divide-slate-100">
                        {cartItems.map(item => {
                            const listing = item.listing;
                            const product = listing.productInfo;

                            // CHECK: Is this a Wholesale Item?
                            const isWholesale = listing.seller?.user_role === 'wholesaler';
                            const step = isWholesale ? 50 : 1;
                            const minQty = isWholesale ? 50 : 1;

                            return (
                                <li key={item.cart_item_id} className="p-6 sm:p-8 hover:bg-rose-50/30 transition-colors">
                                    <div className="flex items-center">
                                        <div className="h-24 w-24 flex-shrink-0 overflow-hidden rounded-xl border border-slate-200">
                                            <img
                                                src={product.image_url || 'https://via.placeholder.com/100'}
                                                alt={product.name}
                                                className="h-full w-full object-cover object-center"
                                            />
                                        </div>

                                        <div className="ml-6 flex-1 flex flex-col sm:flex-row sm:items-center sm:justify-between">
                                            <div className="flex-1">
                                                <div className="flex justify-between">
                                                    <h3 className="text-lg font-bold text-slate-900">
                                                        <Link to={`/product/${listing.product_id}`}>{product.name}</Link>
                                                    </h3>
                                                </div>
                                                <p className="mt-1 text-sm text-slate-500">Sold by {listing.seller.name}</p>
                                                {isWholesale && (
                                                    <span className="inline-block mt-1 px-2 py-0.5 bg-indigo-100 text-indigo-700 text-xs font-bold rounded-md">
                                                        Bulk Item (Min 50)
                                                    </span>
                                                )}
                                                <p className="mt-2 text-lg font-bold text-rose-600">₹{listing.price}</p>
                                            </div>

                                            <div className="mt-4 sm:mt-0 sm:ml-10 flex items-center gap-6">
                                                <div className="flex items-center border border-slate-200 rounded-xl overflow-hidden">
                                                    <input
                                                        type="number"
                                                        min={minQty}
                                                        step={step}
                                                        value={item.quantity}
                                                        onChange={(e) => {
                                                            const val = parseInt(e.target.value);
                                                            // Only update if valid number
                                                            if (!isNaN(val)) updateQuantity(item, val);
                                                        }}
                                                        onBlur={(e) => {
                                                            // Snap to nearest 50 if wholesaler
                                                            let val = parseInt(e.target.value);
                                                            if (isWholesale) {
                                                                if (val < 50) val = 50;
                                                                else val = Math.round(val / 50) * 50;
                                                                updateQuantity(item, val);
                                                            }
                                                        }}
                                                        className="w-20 p-2 text-center border-none focus:ring-0 bg-transparent font-medium text-slate-900"
                                                    />
                                                </div>

                                                <button
                                                    onClick={() => removeFromCart(item)}
                                                    className="text-slate-400 hover:text-red-500 transition-colors p-2 hover:bg-red-50 rounded-lg"
                                                >
                                                    <Trash2 size={20} />
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </li>
                            );
                        })}
                    </ul>
                </div>

                {/* Summary Section */}
                <div className="bg-white rounded-3xl shadow-lg shadow-rose-100 border border-rose-100 p-8">
                    <div className="flex flex-col sm:flex-row justify-between items-center gap-6">
                        <button
                            onClick={() => {
                                if (window.confirm("Are you sure you want to clear your cart?")) {
                                    clearCart();
                                }
                            }}
                            className="text-sm font-bold text-slate-500 hover:text-red-500 transition-colors"
                        >
                            Clear Cart
                        </button>

                        <div className="text-right flex flex-col sm:items-end">
                            <p className="text-sm text-slate-500 mb-1">Subtotal</p>
                            <p className="text-4xl font-extrabold text-slate-900 mb-6">
                                ₹{totalPrice.toFixed(2)}
                            </p>
                            <Link
                                to="/checkout"
                                className="inline-flex items-center justify-center px-8 py-4 border border-transparent text-lg font-bold rounded-2xl text-white bg-rose-500 hover:bg-rose-600 transition-all shadow-lg shadow-rose-200 w-full sm:w-auto"
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