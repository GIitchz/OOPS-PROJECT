import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { ArrowLeft, MapPin, Trash2, Globe, Plus, X, Map } from "lucide-react"; // Added Map icon for variety
import { useNavigate } from "react-router-dom";
import { GeoPickerMap, LocationInterface, OnLocationPicedInterface, StaticLocationMap } from '../components/GeoPickerMap';
import { deleteSavedAddress, getSavedAddresses, saveAddressForUser } from "../utils/AdressDB";
import { SavedAddressInterface } from "../utils/Interfaces";

type MapMode = 'picker' | 'viewer' | null;
const TRANSITION_DURATION = 500;
// Increased max height slightly for better map display
const MAX_GROWTH_HEIGHT = 'max-h-[65rem]'; 
const MAP_INLINE_HEIGHT = 'max-h-[500px]'; // Slightly taller map view

export const ProfileAddressesPage = () => {
    const { user, loading: userLoading } = useAuth();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [addresses, setAddresses] = useState<SavedAddressInterface[]>([]);
    const [activeMapMode, setActiveMapMode] = useState<MapMode>(null);
    const [viewingAddressId, setViewingAddressId] = useState<string | null>(null);
    const [isPickerContentMounted, setIsPickerContentMounted] = useState(false);

    // Effect for handling unmounting map picker content after transition
    useEffect(() => {
        if (activeMapMode === 'picker') {
            setIsPickerContentMounted(true);
        } else if (isPickerContentMounted) {
            const timer = setTimeout(() => {
                setIsPickerContentMounted(false);
            }, TRANSITION_DURATION);
            return () => clearTimeout(timer);
        }
    }, [activeMapMode, isPickerContentMounted]);

    const loadAddresses = async () => {
        try {
            if (!user) return;
            const addressesData = await getSavedAddresses(user!);
            setAddresses(addressesData);
        } catch (error) {
            console.error("Failed to load addresses:", error);
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        if (user && !userLoading) {
            setLoading(true);
            loadAddresses();
        }
    }, [user, userLoading])

    const handleLocationPicked: OnLocationPicedInterface = (location) => {
        setLoading(true);
        const f = async () => {
            if (!user) return;
            await saveAddressForUser(user!, location);
            setActiveMapMode(null);
            await loadAddresses();
        }
        f();
    };

    const handleDeleteAddress = (address_id: string) => {
        if (!window.confirm("Are you sure you want to delete this address?")) return;
        setLoading(true);
        const f = async () => {
            await deleteSavedAddress(address_id);
            if (address_id === viewingAddressId) {
                setViewingAddressId(null);
                setActiveMapMode(null);
            }
            await loadAddresses();
        }
        f();
    }

    const handleViewAddress = (addr: SavedAddressInterface) => {
        if (addr.address_id === viewingAddressId && activeMapMode === 'viewer') {
            setActiveMapMode(null);
            setViewingAddressId(null);
            return;
        }
        
        // Hide picker if it's open
        if (activeMapMode === 'picker') {
             setActiveMapMode(null);
             setViewingAddressId(null);
             // Give picker time to close before opening viewer
             setTimeout(() => {
                 setViewingAddressId(addr.address_id || null);
                 setActiveMapMode('viewer');
                 setTimeout(() => {
                     document.getElementById(`addr-${addr.address_id}`)?.scrollIntoView({ behavior: 'smooth' });
                 }, 100);
             }, TRANSITION_DURATION);
             return;
        }

        // Standard view toggle
        setViewingAddressId(addr.address_id || null);
        setActiveMapMode('viewer');
        setTimeout(() => {
            document.getElementById(`addr-${addr.address_id}`)?.scrollIntoView({ behavior: 'smooth' });
        }, 100);
    }

    const handleCloseMap = () => {
        setActiveMapMode(null);
        // Allow time for the viewer card to shrink before resetting viewingAddressId
        const timer = setTimeout(() => setViewingAddressId(null), TRANSITION_DURATION);
        return () => clearTimeout(timer);
    }

    return (
        <div className="space-y-8 max-w-2xl mx-auto py-12">
            <button
                onClick={() => navigate('/profile')}
                className="flex items-center gap-2 text-slate-500 hover:text-green-600 font-bold transition-colors group"
            >
                <ArrowLeft size={18} className="group-hover:-translate-x-1 transition-transform" />
                Back to Profile
            </button>

            <div>
                <h2 className="text-3xl font-extrabold text-slate-900">Your Addresses</h2>
                <p className="text-slate-600">Manage your shipping and delivery locations.</p>
            </div>

            {loading ? (
                // ✨ Enhanced loading state
                <div className="text-center py-20 text-emerald-500 font-semibold animate-pulse bg-white rounded-3xl shadow-lg border border-slate-100">
                    <Map size={32} className="mx-auto mb-3" />
                    Fetching saved locations...
                </div>
            ) : (
                <div className="grid grid-cols-1 gap-6">

                    {addresses.length === 0 && (
                        <EmptyAddressesState onClick={() => setActiveMapMode('picker')} />
                    )}

                    {addresses.map(addr => {
                        const isViewing = activeMapMode === 'viewer' && viewingAddressId === addr.address_id;
                        const addressLocation: LocationInterface = {
                            lat: addr.lat,
                            lng: addr.lng,
                            formatted_address: addr.formatted_address
                        };

                        return (
                            <div
                                key={addr.address_id}
                                id={`addr-${addr.address_id}`}
                                className={`
                                    bg-white rounded-[2rem] shadow-lg border transition-all duration-500 ease-in-out
                                    ${isViewing 
                                        ? 'shadow-xl shadow-emerald-200/50 border-emerald-300' 
                                        : 'hover:shadow-md border-slate-100'
                                    }
                                    ${isViewing ? MAP_INLINE_HEIGHT : 'min-h-32'} 
                                    ${isViewing ? 'p-0 overflow-hidden' : 'p-6 overflow-visible'}
                                `}
                            >
                                {!isViewing ? (
                                    <div className="p-0">
                                        <div className="flex items-start gap-4">
                                            {/* ✨ MapPin icon container update */}
                                            <div className="p-3 mt-0.5 bg-emerald-100 text-emerald-600 rounded-xl flex-shrink-0">
                                                <MapPin size={20} />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="font-extrabold text-lg text-slate-900 truncate">
                                                    {addr.formatted_address.split(',')[0] || "Saved Location"}
                                                </p>
                                                <p className="font-medium text-slate-600 mt-1 line-clamp-2">
                                                    {addr.formatted_address}
                                                </p>
                                            </div>
                                        </div>

                                        <div className="flex gap-4 mt-6 justify-end border-t border-slate-100 pt-4">
                                            {/* ✨ View Map button enhancement */}
                                            <button
                                                onClick={() => handleViewAddress(addr)}
                                                className="px-4 py-2 text-sm font-semibold text-emerald-600 bg-emerald-50 rounded-xl hover:bg-emerald-100 transition-colors flex items-center gap-1 border border-emerald-200"
                                            >
                                                <Globe size={16} /> View on Map
                                            </button>
                                            {/* ✨ Delete button enhancement */}
                                            <button 
                                                onClick={() => handleDeleteAddress(addr.address_id!)} 
                                                className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-colors border border-transparent hover:border-red-200"
                                                title="Delete Address"
                                            >
                                                <Trash2 size={18} />
                                            </button>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="h-full w-full flex flex-col">
                                        <div className="flex justify-between items-center p-6 pb-0">
                                            <h3 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                                                <MapPin size={22} className="text-emerald-600" />
                                                Location Details
                                            </h3>
                                            <button
                                                onClick={handleCloseMap}
                                                className="p-2 text-slate-500 hover:text-red-600 hover:bg-red-50 rounded-full transition-colors"
                                            >
                                                <X size={20} />
                                            </button>
                                        </div>
                                        <div className="flex-1 pt-4 px-6 pb-6">
                                            <StaticLocationMap location={addressLocation} />
                                        </div>
                                    </div>
                                )}
                            </div>
                        );
                    })}

                    {/* Add New Address Card / Map Picker */}
                    <div
                        className={`
                            bg-white rounded-[2rem] shadow-sm transition-all duration-500 ease-in-out
                            ${activeMapMode === 'picker'
                                ? 'shadow-2xl shadow-emerald-200/70 border border-emerald-300'
                                : 'border-2 border-dashed border-emerald-300 cursor-pointer hover:bg-emerald-50 hover:border-emerald-400'
                            }
                            ${activeMapMode === 'picker' ? `${MAX_GROWTH_HEIGHT}` : 'max-h-32'} 
                            overflow-hidden
                        `}
                        onClick={activeMapMode === 'picker' ? undefined : () => setActiveMapMode('picker')}
                    >
                        {activeMapMode !== 'picker' && (
                            <div className={`h-full flex flex-col items-center justify-center text-center text-emerald-600 max-h-32 p-6 transition-opacity duration-300 ${activeMapMode === 'viewer' ? 'opacity-0' : 'opacity-100'}`}>
                                <Plus size={32} className="mx-auto mb-2" />
                                <p className="font-bold text-lg">Add New Address</p>
                            </div>
                        )}
                        {isPickerContentMounted && activeMapMode === 'picker' && (
                            <div className="p-8">
                                <div className="flex justify-between items-center mb-6">
                                    <h3 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                                        <MapPin size={22} className="text-emerald-600" />
                                        Select New Address Location
                                    </h3>
                                    <button
                                        onClick={() => setActiveMapMode(null)}
                                        className="p-2 text-slate-500 hover:text-red-600 hover:bg-red-50 rounded-full transition-colors"
                                    >
                                        <X size={20} />
                                    </button>
                                </div>
                                <GeoPickerMap 
                                    onLocationPicked={handleLocationPicked} 
                                    submitText="Save Address" 
                                    successText="Saved Address Successfully" 
                                />
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

// Helper component for Empty State
const EmptyAddressesState = ({ onClick }: { onClick: () => void }) => (
    <div className="text-center py-20 bg-white rounded-3xl shadow-lg border-2 border-dashed border-emerald-300">
        <MapPin size={48} className="mx-auto text-emerald-400 mb-4" />
        <h3 className="text-xl font-bold text-slate-700">No Addresses Saved Yet</h3>
        <p className="text-slate-500 mb-6">Click the button below to add your first shipping location.</p>
        <button
            onClick={onClick}
            className="px-6 py-3 text-lg font-bold text-white bg-emerald-600 rounded-xl hover:bg-emerald-700 transition-all shadow-md flex items-center gap-2 mx-auto"
        >
            <Plus size={20} /> Add New Address
        </button>
    </div>
);

export default ProfileAddressesPage;