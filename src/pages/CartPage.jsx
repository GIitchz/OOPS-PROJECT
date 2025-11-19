import React from 'react';
import { useCart } from '../context/CartContext';
import { Link } from 'react-router-dom';
import './CartPage.css';

function CartPage() {
    const { cartItems, totalPrice, removeFromCart, updateQuantity } = useCart();

    if (cartItems.length === 0) {
        return (
            <div className="cart-empty">
                <h1>Your Cart is Empty</h1>
                <p>Looks like you haven't added anything to your cart yet.</p>
                <Link to="/dashboard" className="cart-checkout-btn">
                    Start Shopping
                </Link>
            </div>
        );
    }

    return (
        <div className="cart-container">
            <h1>Your Shopping Cart</h1>
            <div className="cart-items-list">
                {cartItems.map(item => (
                    <div key={item.id} className="cart-item">
                        <img src={item.image_url} alt={item.name} className="cart-item-image" />
                        <div className="cart-item-details">
                            <h3>{item.name}</h3>
                            <p>${item.price.toFixed(2)}</p>
                        </div>
                        <div className="cart-item-actions">
                            <input
                                type="number"
                                value={item.quantity}
                                onChange={(e) => updateQuantity(item.id, e.target.value)}
                                min="1"
                                className="cart-item-quantity"
                            />
                            <button
                                onClick={() => removeFromCart(item.id)}
                                className="cart-item-remove-btn"
                            >
                                Remove
                            </button>
                        </div>
                    </div>
                ))}
            </div>
            <div className="cart-summary">
                <h2>Total: ${totalPrice.toFixed(2)}</h2>
                <Link to="/checkout" className="cart-checkout-btn">
                    Proceed to Checkout
                </Link>
            </div>
        </div>
    );
}

export default CartPage;