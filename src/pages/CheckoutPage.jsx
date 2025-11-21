import React, { useEffect, useState } from 'react';
import { useCart } from '../context/CartContext';
import { useNavigate } from 'react-router-dom';
//import './Checkout.css';
import {
    createOrder,
    completePayment
} from "../utils/OrderDB";
import Supabase, { getUserDetails } from "../utils/Database";
import { useAuth } from '../context/AuthContext';
import { getSavedAddresses, saveAddressForUser } from "../utils/AdressDB";
import { getLatLongFromAddress } from "../utils/Geo";
import { MapPin, CreditCard, Truck, CheckCircle, AlertCircle } from 'lucide-react';
import { updateOrderLatLng } from '../utils/AdressDB';

function CheckoutPage() {
    const { cartItems, totalPrice, refreshCart } = useCart();
    const { user } = useAuth();
    const navigate = useNavigate();

    const [address1, setAddress1] = useState('');
    const [address2, setAddress2] = useState('');
    const [city, setCity] = useState('');
    const [pincode, setPincode] = useState('');
    const [country, setCountry] = useState('India');

    const [paymentMethod, setPaymentMethod] = useState('cod');
    const [savedAddresses, setSavedAddresses] = useState([]);
    const [selectedSavedAddressId, setSelectedSavedAddressId] = useState(null);
    const [saveThisAddress, setSaveThisAddress] = useState(false);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        const loadAddresses = async () => {
            if (!user) return;
            const list = await getSavedAddresses(user.id);
            setSavedAddresses(list || []);
        };
        loadAddresses();
    }, [user]);

    useEffect(() => {
        if (!selectedSavedAddressId) return;
        const addr = savedAddresses.find(a => a.address_id === selectedSavedAddressId);
        if (!addr) return;
        setAddress1(addr.address1 || '');
        setAddress2(addr.address2 || '');
        setCity(addr.city || '');
        setPincode(addr.pincode || '');
        setCountry(addr.country || '');
        setSaveThisAddress(false);
    }, [selectedSavedAddressId, savedAddresses]);

    const fetchLocationFromPincode = async () => {
        if (!pincode || pincode.trim().length < 3) return;
        try {
            const res = await fetch(`https://api.postalpincode.in/pincode/${pincode}`);
            const data = await res.json();
            if (data?.[0]?.Status === "Success") {
                const postOffice = data[0].PostOffice?.[0];
                if (postOffice) {
                    setCity(postOffice.District || city);
                    setCountry(postOffice.Country || country);
                }
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

        const coords = await getLatLongFromAddress(address1, address2, city, pincode, country);

        if (saveThisAddress && !selectedSavedAddressId) {
            try {
                await saveAddressForUser(user.id, { address1, address2, city, pincode, country }, coords);
            } catch (err) {
                console.warn('Failed to save address', err);
            }
        }

        const payment = await completePayment(totalPrice);
        if (!payment) {
            alert("Payment creation failed.");
            setLoading(false);
            return;
        }

        const address = { address1, address2, city, pincode, country };
        const order = await createOrder(user, payment, address);

        if (!order) {
            alert("Order creation failed.");
            setLoading(false);
            return;
        }

        if (coords) {
            await updateOrderLatLng(order.order_id, coords.lat, coords.lng);
        } else {
            console.warn("No coordinates found, skipping lat/lng update");
        }


        // navigate to success
        await refreshCart(user);
        navigate("/order-success", { state: { orderId: order.order_id } });
        setLoading(false);
    };

    if (!cartItems || cartItems.length === 0) {
        return (
            <div className="min-h-[80vh] flex items-center justify-center bg-rose-50">
                <div className="text-center">
                    <h2 className="text-2xl font-bold text-slate-800 mb-2">Your Cart is Empty</h2>
                    <p className="text-slate-500">Add some items before checking out.</p>
                </div>
            </div>
        );
    }

    const InputField = ({ label, ...props }) => (
        <div className="mb-4">
            <label className="block text-sm font-bold text-slate-700 mb-1.5">{label}</label>
            <input
                className="block w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-rose-500 focus:border-rose-500 outline-none transition-all font-medium text-slate-800"
                {...props}
            />
        </div>
    );

    return (
        <div className="min-h-screen bg-rose-50 py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-7xl mx-auto">
                <h1 className="text-3xl font-extrabold text-slate-900 mb-8">Secure Checkout</h1>

                <div className="lg:grid lg:grid-cols-12 lg:gap-x-12 lg:items-start">

                    {/* LEFT COLUMN: Forms */}
                    <div className="lg:col-span-7">
                        <form onSubmit={handleSubmitOrder}>

                            {/* Address Section */}
                            <div className="bg-white rounded-3xl shadow-sm border border-rose-100 p-6 sm:p-8 mb-8">
                                <div className="flex items-center gap-3 mb-6">
                                    <div className="p-2 bg-rose-100 rounded-full text-rose-600">
                                        <MapPin size={24} />
                                    </div>
                                    <h2 className="text-xl font-bold text-slate-800">Shipping Address</h2>
                                </div>

                                {/* Saved Addresses */}
                                {savedAddresses.length > 0 && (
                                    <div className="mb-6 bg-blue-50 p-4 rounded-2xl border border-blue-100">
                                        <label className="block text-sm font-bold text-blue-800 mb-2">Load Saved Address</label>
                                        <select
                                            className="block w-full px-4 py-3 bg-white border border-blue-200 rounded-xl text-slate-700 focus:ring-2 focus:ring-blue-500 outline-none"
                                            value={selectedSavedAddressId || ''}
                                            onChange={(e) => setSelectedSavedAddressId(e.target.value || null)}
                                        >
                                            <option value="">-- Select saved address --</option>
                                            {savedAddresses.map(addr => (
                                                <option key={addr.address_id} value={addr.address_id}>
                                                    {addr.address1}, {addr.city}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                )}

                                <InputField label="Address Line 1" type="text" value={address1} onChange={(e) => setAddress1(e.target.value)} required placeholder="House No, Building, Street" />
                                <InputField label="Address Line 2 (Optional)" type="text" value={address2} onChange={(e) => setAddress2(e.target.value)} placeholder="Landmark, Apartment" />

                                <div className="grid grid-cols-2 gap-4">
                                    <InputField label="Pincode" type="text" value={pincode} onChange={(e) => setPincode(e.target.value)} onBlur={fetchLocationFromPincode} required placeholder="e.g. 500032" />
                                    <InputField label="City" type="text" value={city} onChange={(e) => setCity(e.target.value)} required />
                                </div>

                                <InputField label="Country" type="text" value={country} onChange={(e) => setCountry(e.target.value)} required />

                                <label className="flex items-center gap-3 p-4 border border-slate-200 rounded-xl cursor-pointer hover:bg-slate-50 transition-colors">
                                    <input
                                        type="checkbox"
                                        className="w-5 h-5 text-rose-600 rounded focus:ring-rose-500 border-gray-300"
                                        checked={saveThisAddress}
                                        onChange={(e) => setSaveThisAddress(e.target.checked)}
                                        disabled={!!selectedSavedAddressId}
                                    />
                                    <span className={`text-sm font-bold ${selectedSavedAddressId ? 'text-slate-400' : 'text-slate-700'}`}>
                                        Save this address for next time
                                    </span>
                                </label>
                            </div>

                            {/* Payment Section */}
                            <div className="bg-white rounded-3xl shadow-sm border border-rose-100 p-6 sm:p-8 mb-8">
                                <div className="flex items-center gap-3 mb-6">
                                    <div className="p-2 bg-green-100 rounded-full text-green-600">
                                        <CreditCard size={24} />
                                    </div>
                                    <h2 className="text-xl font-bold text-slate-800">Payment Method</h2>
                                </div>

                                <div className="space-y-3">
                                    <label className={`flex items-center justify-between p-4 border rounded-2xl cursor-pointer transition-all ${paymentMethod === 'cod' ? 'border-rose-500 bg-rose-50 ring-1 ring-rose-500' : 'border-slate-200 hover:border-rose-300'}`}>
                                        <div className="flex items-center gap-3">
                                            <input
                                                type="radio"
                                                name="payment"
                                                value="cod"
                                                checked={paymentMethod === 'cod'}
                                                onChange={() => setPaymentMethod('cod')}
                                                className="w-5 h-5 text-rose-600 focus:ring-rose-500"
                                            />
                                            <div className="flex items-center gap-2">
                                                <Truck size={20} className="text-slate-500" />
                                                <span className="font-bold text-slate-700">Cash on Delivery</span>
                                            </div>
                                        </div>
                                    </label>

                                    <label className="flex items-center justify-between p-4 border border-slate-100 rounded-2xl opacity-60 cursor-not-allowed bg-slate-50">
                                        <div className="flex items-center gap-3">
                                            <input type="radio" name="payment" disabled />
                                            <span className="font-bold text-slate-500">Online Payment (Coming Soon)</span>
                                        </div>
                                        <AlertCircle size={18} className="text-slate-400" />
                                    </label>
                                </div>
                            </div>

                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full py-4 px-6 bg-rose-500 hover:bg-rose-600 text-white font-extrabold text-lg rounded-2xl shadow-lg shadow-rose-200 transition-all transform hover:-translate-y-1 disabled:opacity-70 disabled:cursor-wait flex items-center justify-center gap-2"
                            >
                                {loading ? 'Processing...' : 'Confirm Order'}
                            </button>
                        </form>
                    </div>

                    {/* RIGHT COLUMN: Order Summary */}
                    <div className="lg:col-span-5 mt-8 lg:mt-0">
                        <div className="bg-white rounded-3xl shadow-xl shadow-rose-100/50 border border-rose-100 p-6 sm:p-8 sticky top-24">
                            <h2 className="text-xl font-bold text-slate-800 mb-6 pb-4 border-b border-slate-100">Order Summary</h2>

                            <ul className="space-y-4 mb-6 max-h-96 overflow-auto pr-2 custom-scrollbar">
                                {cartItems.map((item) => (
                                    <li key={item.cart_item_id} className="flex justify-between text-sm">
                                        <span className="text-slate-600 flex-1 pr-4">
                                            <span className="font-bold text-slate-900">{item.quantity}x</span> {item.listing.productInfo.name}
                                        </span>
                                        <span className="font-bold text-slate-900 whitespace-nowrap">
                                            ₹{(item.listing.price * item.quantity).toFixed(2)}
                                        </span>
                                    </li>
                                ))}
                            </ul>

                            <div className="border-t border-slate-100 pt-4 space-y-2">
                                <div className="flex justify-between text-slate-500">
                                    <span>Subtotal</span>
                                    <span>₹{totalPrice.toFixed(2)}</span>
                                </div>
                                <div className="flex justify-between text-slate-500">
                                    <span>Delivery Fee</span>
                                    <span className="text-green-600 font-bold">Free</span>
                                </div>
                                <div className="flex justify-between text-xl font-extrabold text-slate-900 pt-4 border-t border-slate-100 mt-4">
                                    <span>Total</span>
                                    <span>₹{totalPrice.toFixed(2)}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default CheckoutPage;