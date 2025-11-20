// src/pages/CheckoutPage.jsx
import React, { useEffect, useState } from 'react';
import { useCart } from '../context/CartContext';
import { useNavigate } from 'react-router-dom';
import './Checkout.css';
import {
    createOrder
} from "../utils/OrderDB";
import Supabase, { getUserDetails } from "../utils/Database";
import { useAuth } from '../context/AuthContext';
import { getSavedAddresses, saveAddressForUser } from "../utils/AdressDB";
import { getLatLongFromAddress } from "../utils/Geo";

function CheckoutPage() {
    const { cartItems, totalPrice, refreshCart } = useCart();
    const { user } = useAuth();
    const navigate = useNavigate();

    const [address1, setAddress1] = useState('');
    const [address2, setAddress2] = useState('');
    const [city, setCity] = useState('');
    const [pincode, setPincode] = useState('');
    const [country, setCountry] = useState('');

    const [paymentMethod, setPaymentMethod] = useState('cod');

    // saved addresses
    const [savedAddresses, setSavedAddresses] = useState([]);
    const [selectedSavedAddressId, setSelectedSavedAddressId] = useState(null);
    const [saveThisAddress, setSaveThisAddress] = useState(false);

    const [loading, setLoading] = useState(false);

    useEffect(() => {
        // load saved addresses for user if logged in
        const loadAddresses = async () => {
            if (!user) return;
            const list = await getSavedAddresses(user.id);
            setSavedAddresses(list || []);
        };

        loadAddresses();
    }, [user]);

    // when user picks a saved address, populate fields
    useEffect(() => {
        if (!selectedSavedAddressId) return;
        const addr = savedAddresses.find(a => a.address_id === selectedSavedAddressId);
        if (!addr) return;
        setAddress1(addr.address1 || '');
        setAddress2(addr.address2 || '');
        setCity(addr.city || '');
        setPincode(addr.pincode || '');
        setCountry(addr.country || '');
        // disable auto-save when picking existing address
        setSaveThisAddress(false);
    }, [selectedSavedAddressId, savedAddresses]);

    const fetchLocationFromPincode = async () => {
        if (!pincode || pincode.trim().length < 3) return; // small guard
        try {
            const res = await fetch(`https://api.postalpincode.in/pincode/${pincode}`);
            const data = await res.json();
            if (!data || data[0].Status !== "Success") {
                console.log("Invalid pincode");
                return;
            }
            const postOffice = data[0].PostOffice?.[0];
            if (postOffice) {
                setCity(postOffice.District || city);
                setCountry(postOffice.Country || country);
            }
        } catch (err) {
            console.error("Pincode lookup failed:", err);
        }
    };

    const handleSubmitOrder = async (e) => {
        e.preventDefault();
        setLoading(true);

        if (!user) {
            alert("You must be logged in.");
            setLoading(false);
            return;
        }

        // ensure there is at least one cart item
        if (!cartItems || cartItems.length === 0) {
            alert("Your cart is empty.");
            setLoading(false);
            return;
        }

        // 1) geocode the final address (try nominatim)
        const coords = await getLatLongFromAddress(address1, address2, city, pincode, country);

        // 2) optionally save address (only if user checked the box and it's not an existing saved address)
        if (saveThisAddress && !selectedSavedAddressId) {
            try {
                await saveAddressForUser(user.id, { address1, address2, city, pincode, country }, coords);
                // refresh saved address list
                const list = await getSavedAddresses(user.id);
                setSavedAddresses(list || []);
            } catch (err) {
                console.warn('Failed to save address, continuing with order', err);
            }
        }

        // 3) create payment
        //const payment = await completePayment(totalPrice);
        const payment = {
            payment_ref: null,
            mode: "offline"
        };
        if (!payment) {
            alert("Payment creation failed.");
            setLoading(false);
            return;
        }

        // 4) create order - pass address fields (if your createOrder is strict and does not accept lat/lng,
        // we will update the order coords separately below)
        const address = {
            address1,
            address2,
            city,
            pincode,
            country
        }
        const order = await createOrder(user, payment, address);
        if (!order) {
            alert("Order creation failed.");
            setLoading(false);
            return;
        }

        // // 5) attach lat/lng to order (OrderDB should expose updateOrderLatLng; if not, add it)
        // try {
        //     if (coords) {
        //         // call a helper in OrderDB (updateOrderLatLng) which you should add if missing
        //         // it's safe to call even if you don't store lat/lng in orders (it will fail quietly)
        //         try {
        //             // dynamic import so it doesn't crash if function doesn't exist
        //             const OrderDB = await import('../utils/OrderDB');
        //             if (OrderDB.updateOrderLatLng) {
        //                 await OrderDB.updateOrderLatLng(order.order_id, coords.lat, coords.lng);
        //             }
        //         } catch (err) {
        //             console.warn("Could not update order coords:", err);
        //         }
        //     }
        // } catch (err) {
        //     console.warn("Error attaching coords to order:", err);
        // }

        // navigate to success
        await refreshCart(user);
        navigate("/order-success", { state: { orderId: order.order_id } });
        setLoading(false);
    };

    if (!cartItems || cartItems.length === 0) {
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

                    {/* Saved addresses dropdown */}
                    <div className="form-group">
                        <label>Use saved address</label>
                        <select
                            value={selectedSavedAddressId || ''}
                            onChange={(e) => setSelectedSavedAddressId(e.target.value || null)}
                        >
                            <option value="">-- Use a new address --</option>
                            {savedAddresses.map(addr => (
                                <option key={addr.address_id} value={addr.address_id}>
                                    {addr.address1} {addr.address2 ? `, ${addr.address2}` : ''} — {addr.city} ({addr.pincode})
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* Address Line 1 */}
                    <div className="form-group">
                        <label>Address Line 1</label>
                        <input
                            type="text"
                            value={address1}
                            onChange={(e) => setAddress1(e.target.value)}
                            required
                        />
                    </div>

                    {/* Address Line 2 (optional) */}
                    <div className="form-group">
                        <label>Address Line 2 (Optional)</label>
                        <input
                            type="text"
                            value={address2}
                            onChange={(e) => setAddress2(e.target.value)}
                        />
                    </div>

                    {/* Pincode */}
                    <div className="form-group">
                        <label>Pincode</label>
                        <input
                            type="text"
                            value={pincode}
                            onChange={(e) => setPincode(e.target.value)}
                            onBlur={fetchLocationFromPincode}
                            required
                        />
                    </div>

                    {/* City */}
                    <div className="form-group">
                        <label>City</label>
                        <input
                            type="text"
                            value={city}
                            onChange={(e) => setCity(e.target.value)}
                            required
                        />
                    </div>

                    {/* Country */}
                    <div className="form-group">
                        <label>Country</label>
                        <input
                            type="text"
                            value={country}
                            onChange={(e) => setCountry(e.target.value)}
                            required
                        />
                    </div>

                    {/* Save this address */}
                    <div className="form-group">
                        <label>
                            <input
                                type="checkbox"
                                checked={saveThisAddress}
                                onChange={(e) => setSaveThisAddress(e.target.checked)}
                                disabled={!!selectedSavedAddressId} // no saving if user selected an existing address
                            />{' '}
                            Save this address for future orders
                        </label>
                        {selectedSavedAddressId && <p style={{ fontSize: 12, color: '#666' }}>Using saved address - saving disabled.</p>}
                    </div>

                    <h2>Payment Method</h2>
                    <div className="payment-options">
                        <label className="payment-option">
                            <input
                                type="radio"
                                value="cod"
                                checked={paymentMethod === 'cod'}
                                onChange={() => setPaymentMethod('cod')}
                            />
                            Cash on Delivery
                        </label>

                        <label className="payment-option disabled">
                            <input
                                type="radio"
                                value="online"
                                disabled
                            />
                            Online Payment (Coming Soon)
                        </label>
                    </div>

                    <button type="submit" className="place-order-btn" disabled={loading}>
                        {loading ? 'Placing order...' : 'Place Order'}
                    </button>
                </form>

                {/* ORDER SUMMARY */}
                <div className="order-summary">
                    <h2>Your Order</h2>

                    {cartItems.map((item) => {
                        const listing = item.listing;
                        const product = listing.productInfo;

                        return (
                            <div key={item.cart_item_id} className="summary-item">
                                <span>{product.name} (x{item.quantity})</span>
                                <span>₹{(listing.price * item.quantity).toFixed(2)}</span>
                            </div>
                        );
                    })}

                    <hr />

                    <div className="summary-total">
                        <strong>Total</strong>
                        <strong>₹{totalPrice.toFixed(2)}</strong>
                    </div>
                </div>

            </div>
        </div>
    );
}

export default CheckoutPage;
