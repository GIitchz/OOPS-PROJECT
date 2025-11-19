import React, { useState } from 'react';
import { useCart } from '../context/CartContext';
import { useNavigate } from 'react-router-dom';
import './Checkout.css';

function CheckoutPage() {
    const { cartItems, totalPrice, clearCart } = useCart();
    const [name, setName] = useState('');
    const [address, setAddress] = useState('');
    const [paymentMethod, setPaymentMethod] = useState('cod'); // cod = Cash on Delivery
    const navigate = useNavigate();

    const handleSubmitOrder = (e) => {
        e.preventDefault();

        //!!collecting data from database (check table name, fields)
        const orderData = {
            customerName: name,
            shippingAddress: address,
            paymentMethod: paymentMethod,
            items: cartItems,
            total: totalPrice,
        };

        //!!
        console.log('--- FAKE ORDER PLACED ---');
        console.log('Order Data:', orderData);
        console.log('-------------------------');

        // clear the cart
        clearCart();

        // send user to the success page
        navigate('/order-success');
    };

    if (cartItems.length === 0) {
        // Just in case a user navigates here with an empty cart
        return (
            <div className="checkout-container">
                <h2>Your Cart is Empty</h2>
                <p>You can't check out with an empty cart.</p>
            </div>
        );
    }

    return (
        <div className="checkout-container">
            <h1>Checkout</h1>
            <div className="checkout-content">
                <form className="checkout-form" onSubmit={handleSubmitOrder}>
                    <h2>Shipping Details</h2>

                    <div className="form-group">
                        <label htmlFor="name">Full Name</label>
                        <input
                            type="text"
                            id="name"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            required
                        />
                    </div>

                    <div className="form-group">
                        <label htmlFor="address">Shipping Address</label>
                        <input
                            type="text"
                            id="address"
                            value={address}
                            onChange={(e) => setAddress(e.target.value)}
                            placeholder="Street, City, Postal Code"
                            required
                        />
                    </div>

                    <h2>Payment Method</h2>
                    <div className="payment-options">
                        <div className="payment-option">
                            <input
                                type="radio"
                                id="cod"
                                name="paymentMethod"
                                value="cod"
                                checked={paymentMethod === 'cod'}
                                onChange={() => setPaymentMethod('cod')}
                            />
                            <label htmlFor="cod">Cash on Delivery (Offline)</label>
                        </div>
                        <div className="payment-option">
                            <input
                                type="radio"
                                id="online"
                                name="paymentMethod"
                                value="online"
                                checked={paymentMethod === 'online'}
                                onChange={() => setPaymentMethod('online')}
                                disabled // Online payment is not built yet
                            />
                            <label htmlFor="online" className="disabled">Online Payment (Coming Soon)</label>
                        </div>
                    </div>

                    <button type="submit" className="place-order-btn">
                        Place Order
                    </button>
                </form>

                <div className="order-summary">
                    <h2>Order Summary</h2>
                    {cartItems.map(item => (
                        <div key={item.id} className="summary-item">
                            <span>{item.name} (x{item.quantity})</span>
                            <span>${(item.price * item.quantity).toFixed(2)}</span>
                        </div>
                    ))}
                    <hr />
                    <div className="summary-total">
                        <strong>Total</strong>
                        <strong>${totalPrice.toFixed(2)}</strong>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default CheckoutPage;