import React from 'react';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { Link } from 'react-router-dom';
import './CartPage.css';

function CartPage() {
    const { cartItems, totalPrice, removeFromCart, updateQuantity,clearCart } = useCart();
    const { user } = useAuth(); // Get user for role check
    //console.log(cartItems);
    // Determine the correct landing spot based on role
    const shoppingPath = user?.role === 'retailer' ? '/admin/retailer/wholesale' : '/dashboard';

    if (cartItems.length === 0) {
        return (
            <div className="cart-container cart-empty">
                <h1>Your Cart is Empty</h1>
                <p>Looks like you haven't added anything to your cart yet.</p>

                {/* Redirects based on role */}
                <Link to={shoppingPath} className="cart-checkout-btn">
                    Start Shopping
                </Link>
            </div>
        );
    }

    return (
        <div className="cart-container">
            <h1>Your Shopping Cart</h1>

            <div className="cart-items-list">
                {cartItems.map(item => {
                    const listing = item.listing;
                    const product = listing.productInfo;
                    console.log("Listing:",listing);
                    return (
                        <div key={item.cart_item_id} className="cart-item">

                            {/* PRODUCT IMAGE */}
                            <img
                                src={product.image_url}
                                alt={product.name}
                                className="cart-item-image"
                            />

                            {/* PRODUCT DETAILS */}
                            <div className="cart-item-details">
                                <h3>{product.name}</h3>
                                <p>₹{listing.price}</p>

                                {/* Seller Name */}
                                <p className="cart-seller">
                                    Sold by: {listing.seller.name}
                                </p>
                            </div>

                            {/* ACTIONS */}
                            <div className="cart-item-actions">
                                <input
                                    type="number"
                                    min="1"
                                    value={item.quantity}
                                    onChange={(e) =>
                                        updateQuantity(item, e.target.value)
                                    }
                                    className="cart-item-quantity"
                                />

                                <button
                                    onClick={() => removeFromCart(item)}
                                    className="cart-item-remove-btn"
                                >
                                    Remove
                                </button>
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* SUMMARY */}
            <div className="cart-summary">
                <h2>Total: ₹{totalPrice.toFixed(2)}</h2>

                <div className="cart-summary-buttons">
                    {/* ✔ Clear Cart Button */}
                    <button
                        className="cart-clear-btn"
                        onClick={() => {
                            if (window.confirm("Are you sure you want to clear your cart?")) {
                                clearCart();
                            }
                        }}
                    >
                        Clear Cart
                    </button>

                    <Link to="/checkout" className="cart-checkout-btn">
                        Proceed to Checkout
                    </Link>
                </div>
            </div>
        </div>
    );
}

export default CartPage;
