// src/pages/CheckoutPage.tsx
import React, { useEffect, useState, useMemo } from 'react';
import { useCart } from '../context/CartContext';
import { useNavigate } from 'react-router-dom';
// 👇 Note: 'initiateStripeCheckout' is imported now
import { createOrder, completePayment, initiateStripeCheckout } from "../utils/OrderDB";
import { useAuth } from '../context/AuthContext';
import { getSavedAddresses, saveAddressForUser } from "../utils/AdressDB";
import { MapPin, CreditCard, Truck, AlertCircle, ArrowLeft, Plus, X, ExternalLink } from 'lucide-react';
import { SavedAddressInterface } from '../utils/Interfaces';
import { GeoPickerMap, LocationInterface, StaticLocationMap } from '../components/GeoPickerMap';

// NOTE: We removed 'loadStripe' and 'Elements' because we are redirecting to the hosted page.

interface SelectedAddress extends LocationInterface {
    address_id?: string | null;
    formatted_address: string;
}

type MapMode = 'picker' | 'viewer' | null;
const MAP_HEIGHT = 'max-h-[350px]';

function CheckoutPage() {
    const { cartItems, totalPrice, refreshCart } = useCart();
    const { user } = useAuth();
    const navigate = useNavigate();

    const [selectedLocation, setSelectedLocation] = useState<SelectedAddress | null>(null);
    const [savedAddresses, setSavedAddresses] = useState<SavedAddressInterface[]>([]);
    const [selectedSavedAddressId, setSelectedSavedAddressId] = useState<string | null>(null);
    const [activeMapMode, setActiveMapMode] = useState<MapMode>(null);

    const [paymentMethod, setPaymentMethod] = useState<'cod' | 'online'>('cod');
    const [loading, setLoading] = useState(false);

    // --- Load Addresses ---
    useEffect(() => {
        const loadAddresses = async () => {
            if (!user) return;
            const list = await getSavedAddresses(user);
            setSavedAddresses(list || []);
            if (list && list.length > 0) setSelectedSavedAddressId(list[0].address_id!);
        };
        loadAddresses();
    }, [user]);

    // --- Sync Selected Address ---
    useEffect(() => {
        if (!selectedSavedAddressId || savedAddresses.length === 0) {
            if (selectedSavedAddressId === null) setSelectedLocation(null);
            return;
        }
        const addr = savedAddresses.find(a => a.address_id === selectedSavedAddressId);
        if (!addr) return;
        setSelectedLocation({
            address_id: addr.address_id,
            lat: addr.lat,
            lng: addr.lng,
            formatted_address: addr.formatted_address
        });
    }, [selectedSavedAddressId, savedAddresses]);

    const handleLocationPicked = (location: LocationInterface) => {
        setActiveMapMode(null);
        const f = async () => {
            let addressID: string | undefined = undefined;
            if (user) {
                try {
                    const savedAddr = await saveAddressForUser(user, location);
                    addressID = savedAddr?.address_id;
                    const list = await getSavedAddresses(user);
                    setSavedAddresses(list || []);
                    setSelectedSavedAddressId(addressID || null);
                } catch (err) { console.warn('Failed to save address', err); }
            }
            setSelectedLocation({ ...location, address_id: addressID });
        };
        f();
    };

    // --- MAIN ORDER HANDLER ---
    // ... inside CheckoutPage component ...

    // src/pages/CheckoutPage.tsx

    // ... inside the component ...

    const handlePlaceOrder = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user) return alert("Please log in.");
        if (!selectedLocation) return alert("Please select a shipping location.");

        setLoading(true);

        // 1. Prepare Payment Object
        // 👇 FIX: Send "PENDING" instead of null. 
        // This satisfies the database rule so it allows us to create the order.
        const initialRef = paymentMethod === 'online' ? "PENDING" : null;
        const payment = await completePayment(totalPrice, paymentMethod, initialRef);
        
        const addressData = {
            formatted_address: selectedLocation.formatted_address,
            lat: selectedLocation.lat,
            lng: selectedLocation.lng,
            address_id: selectedLocation.address_id || null
        };

        // 2. Create Order in Database
        const { data: order, error } = await createOrder(user, payment, addressData);

        if (error || !order) {
            // Handle specific DB errors
            if (error?.code === '23514') { 
                alert("⚠️ Order Failed: Out of Stock.");
            } else if (error?.code === 'P0001') {
                // This catches the error you are seeing
                alert(`Database Error: ${error.message}`); 
            } else {
                alert(`Order creation failed: ${error?.message || "Unknown error"}`);
            }
            setLoading(false);
            return;
        }

        // 3. Handle Payment Flow
        if (paymentMethod === 'cod') {
            await refreshCart(user);
            navigate("/order-success", { state: { orderId: order.order_id } });
            setLoading(false);
        } else {
            // Online: Redirect to Stripe
            const { url, error: stripeError } = await initiateStripeCheckout(totalPrice, order.order_id);
            
            if (stripeError || !url) {
                alert(`Payment Gateway Error: ${stripeError}`);
                setLoading(false);
            } else {
                window.location.href = url; 
            }
        }
    };

    // Helper Component for Map Card
    const CurrentAddressCard = useMemo(() => {
        if (!selectedLocation) return null;
        return (
            <div className={`p-4 rounded-2xl border transition-all ${selectedLocation.address_id ? 'border-blue-300 bg-blue-50' : 'border-rose-300 bg-rose-50'}`}>
                <div className="flex items-start justify-between">
                    <div className='flex-1 pr-4'>
                        <p className="font-bold text-slate-800 mb-1">{selectedLocation.address_id ? 'Saved Address' : 'Temporary Address'}</p>
                        <p className="text-sm text-slate-600">{selectedLocation.formatted_address}</p>
                    </div>
                    <button type="button" onClick={() => setActiveMapMode('picker')} className="text-sm text-rose-600 font-bold hover:text-rose-700 transition-colors py-1 px-3 bg-white rounded-lg border border-rose-200">Change</button>
                </div>
                <div className={`${MAP_HEIGHT} mt-4 rounded-xl overflow-hidden shadow-md border border-slate-100`}>
                    <StaticLocationMap location={selectedLocation} />
                </div>
            </div>
        )
    }, [selectedLocation]);

    if (!cartItems || cartItems.length === 0) {
        return <div className="min-h-[80vh] flex items-center justify-center bg-rose-50"><div className="text-center"><h2 className="text-2xl font-bold text-slate-800 mb-2">Your Cart is Empty</h2></div></div>;
    }

    return (
        <div className="min-h-screen bg-rose-50 py-8 px-4 sm:px-6 lg:px-8">
            <div className="max-w-7xl mx-auto">
                <button onClick={() => navigate('/cart')} className="flex items-center gap-2 text-slate-500 hover:text-rose-600 font-bold mb-6 transition-colors group">
                    <ArrowLeft size={18} className="group-hover:-translate-x-1 transition-transform" /> Back to Cart
                </button>

                <h1 className="text-3xl font-extrabold text-slate-900 mb-8">Secure Checkout</h1>

                <div className="lg:grid lg:grid-cols-12 lg:gap-x-12 lg:items-start">
                    <div className="lg:col-span-7">
                        {/* Address Section */}
                        <div className="bg-white rounded-3xl shadow-sm border border-rose-100 p-6 sm:p-8 mb-8">
                            <div className="flex items-center gap-3 mb-6">
                                <div className="p-2 bg-rose-100 rounded-full text-rose-600"><MapPin size={24} /></div>
                                <h2 className="text-xl font-bold text-slate-800">Shipping Location</h2>
                            </div>
                            <div className="mb-6 bg-blue-50 p-4 rounded-2xl border border-blue-100">
                                <label className="block text-sm font-bold text-blue-800 mb-2">Load Saved Address</label>
                                <select className="block w-full px-4 py-3 bg-white border border-blue-200 rounded-xl text-slate-700 outline-none" value={selectedSavedAddressId || ''} onChange={(e) => { setSelectedSavedAddressId(e.target.value || null); setActiveMapMode(null); }}>
                                    <option value="">-- Select saved address or add new --</option>
                                    {savedAddresses.map(addr => (<option key={addr.address_id} value={addr.address_id!}>{addr.formatted_address}</option>))}
                                </select>
                            </div>
                            {selectedLocation && activeMapMode !== 'picker' && <div className='mb-6'>{CurrentAddressCard}</div>}
                            {!selectedLocation && activeMapMode !== 'picker' && (
                                <button type='button' onClick={() => setActiveMapMode('picker')} className="w-full py-5 border-2 border-dashed border-rose-200 rounded-2xl text-rose-500 hover:bg-rose-50 transition-colors flex flex-col items-center justify-center gap-1">
                                    <Plus size={24} /> <p className="font-bold text-sm">Select Location on Map</p>
                                </button>
                            )}
                            {activeMapMode === 'picker' && (
                                <div className="border border-slate-200 rounded-2xl overflow-hidden p-4">
                                    <div className="flex justify-between items-center mb-4">
                                        <h3 className="text-md font-bold text-slate-800">Pick Location</h3>
                                        <button type='button' onClick={() => setActiveMapMode(null)} className="p-2 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-full"><X size={20} /></button>
                                    </div>
                                    <GeoPickerMap onLocationPicked={handleLocationPicked} submitText="Use This Location" successText="Location Selected" />
                                </div>
                            )}
                        </div>

                        {/* Payment Section */}
                        <div className="bg-white rounded-3xl shadow-sm border border-rose-100 p-6 sm:p-8 mb-8">
                            <div className="flex items-center gap-3 mb-6">
                                <div className="p-2 bg-green-100 rounded-full text-green-600"><CreditCard size={24} /></div>
                                <h2 className="text-xl font-bold text-slate-800">Payment Method</h2>
                            </div>

                            <div className="space-y-3">
                                <label className={`flex items-center justify-between p-4 border rounded-2xl cursor-pointer transition-all ${paymentMethod === 'cod' ? 'border-rose-500 bg-rose-50 ring-1 ring-rose-500' : 'border-slate-200 hover:border-rose-300'}`}>
                                    <div className="flex items-center gap-3">
                                        <input type="radio" name="payment" value="cod" checked={paymentMethod === 'cod'} onChange={() => setPaymentMethod('cod')} className="w-5 h-5 text-rose-600 focus:ring-rose-500" />
                                        <div className="flex items-center gap-2">
                                            <Truck size={20} className="text-slate-500" />
                                            <span className="font-bold text-slate-700">Cash on Delivery</span>
                                        </div>
                                    </div>
                                </label>

                                <label className={`flex items-center justify-between p-4 border rounded-2xl cursor-pointer transition-all ${paymentMethod === 'online' ? 'border-indigo-500 bg-indigo-50 ring-1 ring-indigo-500' : 'border-slate-200 hover:border-indigo-300'}`}>
                                    <div className="flex items-center gap-3">
                                        <input type="radio" name="payment" value="online" checked={paymentMethod === 'online'} onChange={() => setPaymentMethod('online')} className="w-5 h-5 text-indigo-600 focus:ring-indigo-500" />
                                        <div className="flex items-center gap-2">
                                            <CreditCard size={20} className="text-slate-500" />
                                            <span className="font-bold text-slate-700">Online Payment (Stripe)</span>
                                        </div>
                                    </div>
                                </label>
                            </div>
                        </div>

                        {/* UNIFIED SUBMIT BUTTON */}
                        <button
                            onClick={handlePlaceOrder}
                            disabled={loading || !selectedLocation || activeMapMode === 'picker'}
                            className={`w-full py-4 px-6 text-white font-extrabold text-lg rounded-2xl shadow-lg transition-all hover:-translate-y-1 disabled:opacity-70 disabled:cursor-wait flex items-center justify-center gap-2
                                ${paymentMethod === 'online' 
                                    ? 'bg-indigo-600 hover:bg-indigo-700 shadow-indigo-200' 
                                    : 'bg-rose-500 hover:bg-rose-600 shadow-rose-200'
                                }`}
                        >
                            {loading ? 'Processing...' : (
                                paymentMethod === 'online' 
                                    ? `Proceed to Pay ₹${totalPrice.toFixed(2)}` 
                                    : `Confirm Order for ₹${totalPrice.toFixed(2)}`
                            )}
                            {paymentMethod === 'online' && !loading && <ExternalLink size={20} />}
                        </button>
                    </div>

                    {/* Order Summary (Right Column) - Unchanged */}
                    <div className="lg:col-span-5 mt-8 lg:mt-0">
                        <div className="bg-white rounded-3xl shadow-xl shadow-rose-100/50 border border-rose-100 p-6 sm:p-8 sticky top-24">
                            <h2 className="text-xl font-bold text-slate-800 mb-6 pb-4 border-b border-slate-100">Order Summary</h2>
                            <ul className="space-y-4 mb-6 max-h-96 overflow-auto pr-2 custom-scrollbar">
                                {cartItems.map((item) => (
                                    <li key={item.cart_item_id} className="flex justify-between text-sm">
                                        <span className="text-slate-600 flex-1 pr-4"><span className="font-bold text-slate-900">{item.quantity}x</span> {item.listing.productInfo.name}</span>
                                        <span className="font-bold text-slate-900 whitespace-nowrap">₹{(item.listing.price * item.quantity).toFixed(2)}</span>
                                    </li>
                                ))}
                            </ul>
                            <div className="border-t border-slate-100 pt-4 space-y-2">
                                <div className="flex justify-between text-slate-500"><span>Subtotal</span><span>₹{totalPrice.toFixed(2)}</span></div>
                                <div className="flex justify-between text-slate-500"><span>Delivery Fee</span><span className="text-green-600 font-bold">Free</span></div>
                                <div className="flex justify-between text-xl font-extrabold text-slate-900 pt-4 border-t border-slate-100 mt-4"><span>Total</span><span>₹{totalPrice.toFixed(2)}</span></div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default CheckoutPage;