import React, { useEffect, useState, useMemo } from 'react';
import { useCart } from '../context/CartContext';
import { useNavigate } from 'react-router-dom';
import { createOrder, completePayment } from "../utils/OrderDB";
import { useAuth } from '../context/AuthContext';
import { getSavedAddresses, saveAddressForUser } from "../utils/AdressDB";
import { MapPin, CreditCard, Truck, ArrowLeft, Plus, X, ExternalLink } from 'lucide-react';
import { SavedAddressInterface } from '../utils/Interfaces';
import { GeoPickerMap, LocationInterface, StaticLocationMap } from '../components/GeoPickerMap';

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

    // Utility for consistent currency formatting
    const formatIndianRupee = (amount: number) => {
        return new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: 'INR',
            minimumFractionDigits: 2,
        }).format(amount);
    };

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

    const handlePlaceOrder = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user) return alert("Please log in.");
        if (!selectedLocation) return alert("Please select a shipping location.");

        setLoading(true);

        const payment = await completePayment(totalPrice, user.id, paymentMethod); // Passed userId

        if (payment.error || (paymentMethod === 'online' && !payment.payment_ref)) {
            alert("Payment failed or was cancelled.");
            setLoading(false);
            return;
        }

        const addressData = {
            formatted_address: selectedLocation.formatted_address,
            lat: selectedLocation.lat,
            lng: selectedLocation.lng,
            address_id: selectedLocation.address_id || null
        };

        const { data: order, error } = await createOrder(user, payment, addressData);

        if (error || !order) {
            if (error?.code === '23514') {
                alert("⚠️ Order Failed: Out of Stock.");
            } else {
                alert(`Order creation failed: ${error?.message || "Unknown error"}`);
            }
            setLoading(false);
            return;
        }

        setLoading(false);
        refreshCart();
        navigate("/order-success");
    };

    // Helper Component for Map Card
    const CurrentAddressCard = useMemo(() => {
        if (!selectedLocation) return null;
        // ✨ Enhanced styling for address card based on type
        return (
            <div className={`p-4 rounded-2xl border transition-all duration-300 shadow-md ${selectedLocation.address_id ? 'border-blue-400 bg-blue-50 shadow-blue-100' : 'border-emerald-400 bg-emerald-50 shadow-emerald-100'}`}>
                <div className="flex items-start justify-between">
                    <div className='flex-1 pr-4'>
                        <p className={`font-extrabold mb-1 ${selectedLocation.address_id ? 'text-blue-800' : 'text-emerald-800'}`}>{selectedLocation.address_id ? 'Saved Address' : 'Temporary Address'}</p>
                        <p className="text-sm text-slate-700">{selectedLocation.formatted_address}</p>
                    </div>
                    {/* ✨ Enhanced Change button */}
                    <button type="button" onClick={() => setActiveMapMode('picker')} className="text-sm text-emerald-600 font-bold hover:text-white transition-all py-1 px-3 bg-white hover:bg-emerald-600 rounded-lg border border-emerald-200 hover:border-emerald-600 shadow-sm">Change</button>
                </div>
                <div className={`${MAP_HEIGHT} mt-4 rounded-xl overflow-hidden shadow-lg border border-slate-100`}>
                    <StaticLocationMap location={selectedLocation} />
                </div>
            </div>
        )
    }, [selectedLocation]);

    if (!cartItems || cartItems.length === 0) {
        // ✨ Improved empty state styling
        return <div className="min-h-[80vh] flex items-center justify-center bg-gray-50/70">
            <div className="bg-white p-10 rounded-3xl shadow-xl shadow-emerald-100 border border-slate-100 text-center max-w-sm">
                <h2 className="text-2xl font-bold text-slate-800 mb-2">Your Cart is Empty</h2>
                <p className="text-slate-500">Go back to add items before checking out.</p>
                <button onClick={() => navigate('/dashboard')} className="mt-4 text-emerald-600 font-bold hover:text-emerald-700 transition-colors">Go to Shopping</button>
            </div>
        </div>;
    }

    return (
        // ✨ VIBRANCY CHANGE 1: Lighter background
        <div className="min-h-screen bg-gray-50/70 py-8 px-4 sm:px-6 lg:px-8">
            <div className="max-w-7xl mx-auto">
                {/* ✨ VIBRANCY CHANGE 2: Stronger hover on back button */}
                <button onClick={() => navigate('/cart')} className="flex items-center gap-2 text-slate-600 hover:text-emerald-700 font-semibold mb-6 transition-colors group">
                    <ArrowLeft size={18} className="group-hover:-translate-x-1 transition-transform" /> Back to Cart
                </button>

                <h1 className="text-3xl font-extrabold text-slate-900 mb-8">Secure Checkout</h1>

                <div className="lg:grid lg:grid-cols-12 lg:gap-x-12 lg:items-start">
                    <div className="lg:col-span-7">
                        {/* Address Section */}
                        {/* ✨ VIBRANCY CHANGE 3: Enhanced shadow/border on containers */}
                        <div className="bg-white rounded-3xl shadow-2xl shadow-emerald-100/70 border border-slate-100 p-6 sm:p-8 mb-8">
                            <div className="flex items-center gap-3 mb-6 pb-4 border-b border-slate-100">
                                {/* ✨ VIBRANCY CHANGE 4: Stronger color for icon background */}
                                <div className="p-3 bg-emerald-100 rounded-xl text-emerald-600"><MapPin size={24} /></div>
                                <h2 className="text-xl font-bold text-slate-800">Shipping Location</h2>
                            </div>
                            
                            <div className="mb-6 bg-blue-50/70 p-4 rounded-2xl border border-blue-200 shadow-inner">
                                <label className="block text-sm font-bold text-blue-800 mb-2">Load Saved Address</label>
                                {/* ✨ Improved select styling */}
                                <select className="block w-full px-4 py-3 bg-white border border-blue-300 rounded-xl text-slate-700 focus:ring-2 focus:ring-blue-500 outline-none transition-colors" value={selectedSavedAddressId || ''} onChange={(e) => { setSelectedSavedAddressId(e.target.value || null); setActiveMapMode(null); }}>
                                    <option value="">-- Select saved address or add new --</option>
                                    {savedAddresses.map(addr => (<option key={addr.address_id} value={addr.address_id!}>{addr.formatted_address}</option>))}
                                </select>
                            </div>

                            {selectedLocation && activeMapMode !== 'picker' && <div className='mb-6'>{CurrentAddressCard}</div>}
                            
                            {!selectedLocation && activeMapMode !== 'picker' && (
                                <button type='button' onClick={() => setActiveMapMode('picker')} className="w-full py-5 border-2 border-dashed border-emerald-300 rounded-2xl text-emerald-600 hover:bg-emerald-50 transition-colors flex flex-col items-center justify-center gap-1 group">
                                    <Plus size={24} className="group-hover:scale-110 transition-transform" /> 
                                    <p className="font-bold text-sm">Select Location on Map</p>
                                </button>
                            )}

                            {activeMapMode === 'picker' && (
                                <div className="border border-slate-200 rounded-2xl overflow-hidden p-4 shadow-xl shadow-slate-100">
                                    <div className="flex justify-between items-center mb-4">
                                        <h3 className="text-md font-bold text-slate-800">Pick Location</h3>
                                        <button type='button' onClick={() => setActiveMapMode(null)} className="p-2 text-slate-500 hover:text-red-600 hover:bg-red-50 rounded-full transition-colors"><X size={20} /></button>
                                    </div>
                                    <GeoPickerMap onLocationPicked={handleLocationPicked} submitText="Use This Location" successText="Location Selected" />
                                </div>
                            )}
                        </div>

                        {/* Payment Section */}
                        {/* ✨ VIBRANCY CHANGE 3: Enhanced shadow/border on containers */}
                        <div className="bg-white rounded-3xl shadow-2xl shadow-emerald-100/70 border border-slate-100 p-6 sm:p-8 mb-8">
                            <div className="flex items-center gap-3 mb-6 pb-4 border-b border-slate-100">
                                {/* ✨ VIBRANCY CHANGE 4: Stronger color for icon background */}
                                <div className="p-3 bg-emerald-100 rounded-xl text-emerald-600"><CreditCard size={24} /></div>
                                <h2 className="text-xl font-bold text-slate-800">Payment Method</h2>
                            </div>

                            <div className="space-y-4">
                                {/* ✨ Enhanced COD Label Styling */}
                                <label className={`flex items-center justify-between p-4 border rounded-2xl cursor-pointer transition-all duration-200 shadow-sm hover:shadow-md ${paymentMethod === 'cod' ? 'border-emerald-500 bg-emerald-50 ring-2 ring-emerald-300 shadow-emerald-100' : 'border-slate-200 hover:border-emerald-400'}`}>
                                    <div className="flex items-center gap-3">
                                        <input type="radio" name="payment" value="cod" checked={paymentMethod === 'cod'} onChange={() => setPaymentMethod('cod')} className="w-5 h-5 text-emerald-600 focus:ring-emerald-500 border-slate-300" />
                                        <div className="flex items-center gap-2">
                                            <Truck size={20} className="text-emerald-600" />
                                            <span className="font-bold text-slate-700">Cash on Delivery</span>
                                        </div>
                                    </div>
                                </label>

                                {/* ✨ Enhanced Online Label Styling */}
                                <label className={`flex items-center justify-between p-4 border rounded-2xl cursor-pointer transition-all duration-200 shadow-sm hover:shadow-md ${paymentMethod === 'online' ? 'border-indigo-500 bg-indigo-50 ring-2 ring-indigo-300 shadow-indigo-100' : 'border-slate-200 hover:border-indigo-400'}`}>
                                    <div className="flex items-center gap-3">
                                        <input type="radio" name="payment" value="online" checked={paymentMethod === 'online'} onChange={() => setPaymentMethod('online')} className="w-5 h-5 text-indigo-600 focus:ring-indigo-500 border-slate-300" />
                                        <div className="flex items-center gap-2">
                                            <CreditCard size={20} className="text-indigo-600" />
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
                            className={`w-full flex items-center justify-center gap-2 border border-transparent rounded-2xl py-4 px-8 text-xl font-extrabold text-white hover:shadow-xl focus:outline-none focus:ring-4 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-700 ease-out transform hover:scale-[1.01]
                                ${paymentMethod === 'online'
                                    ? 'bg-indigo-600 hover:bg-indigo-700 shadow-indigo-300 hover:shadow-indigo-300 focus:ring-indigo-300'
                                    : 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-300 hover:shadow-emerald-300 focus:ring-emerald-300'
                                }`}
                        >
                            {loading ? (
                                <span className="flex items-center gap-2">
                                    <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                                    Processing Order...
                                </span>
                            ) : (
                                paymentMethod === 'online'
                                    ? `Proceed to Pay ${formatIndianRupee(totalPrice)}`
                                    : `Confirm Order (COD) ${formatIndianRupee(totalPrice)}`
                            )}
                            {paymentMethod === 'online' && !loading && <ExternalLink size={20} />}
                        </button>
                    </div>

                    {/* Order Summary */}
                    <div className="lg:col-span-5 mt-8 lg:mt-0">
                        {/* ✨ VIBRANCY CHANGE 3: Enhanced shadow/border on containers */}
                        <div className="bg-white rounded-3xl shadow-2xl shadow-emerald-100/70 border border-slate-100 p-6 sm:p-8 sticky top-24">
                            <h2 className="text-xl font-bold text-slate-800 mb-6 pb-4 border-b border-slate-200">Order Summary</h2>
                            {/* Scrollbar for items list */}
                            <ul className="space-y-4 mb-6 max-h-96 overflow-y-auto pr-3 custom-scrollbar">
                                {cartItems.map((item) => (
                                    <li key={item.cart_item_id} className="flex justify-between text-sm">
                                        {/* ✨ Item name enhancement */}
                                        <span className="text-slate-600 flex-1 pr-4"><span className="font-bold text-slate-900">{item.quantity}x</span> <span className='text-slate-800'>{item.listing.productInfo.name}</span></span>
                                        <span className="font-bold text-slate-900 whitespace-nowrap">{formatIndianRupee(item.listing.price * item.quantity)}</span>
                                    </li>
                                ))}
                            </ul>
                            <div className="border-t border-slate-200 pt-4 space-y-3">
                                <div className="flex justify-between text-slate-600"><span>Subtotal</span><span>{formatIndianRupee(totalPrice)}</span></div>
                                <div className="flex justify-between text-slate-600"><span>Delivery Fee</span><span className="text-emerald-700 font-extrabold">FREE</span></div>
                                <div className="flex justify-between text-2xl font-extrabold text-slate-900 pt-4 border-t border-slate-200 mt-4">
                                    <span>Total</span>
                                    <span className="text-emerald-700">{formatIndianRupee(totalPrice)}</span>
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