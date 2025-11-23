import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { ArrowLeft, MapPin, Trash2, Globe, Plus, X } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { GeoPickerMap, LocationInterface, OnLocationPicedInterface, StaticLocationMap } from '../components/GeoPickerMap';
import { deleteSavedAddress, getSavedAddresses, saveAddressForUser } from "../utils/AdressDB";
import { SavedAddressInterface } from "../utils/Interfaces";

type MapMode = 'picker' | 'viewer' | null;
const TRANSITION_DURATION = 500;
const MAX_GROWTH_HEIGHT = 'max-h-[60rem]';
const MAP_INLINE_HEIGHT = 'max-h-[450px]';

export const ProfileAddressesPage = () => {
    const { user, loading: userLoading } = useAuth();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [addresses, setAddresses] = useState<SavedAddressInterface[]>([]);
    const [activeMapMode, setActiveMapMode] = useState<MapMode>(null);
    const [viewingAddressId, setViewingAddressId] = useState<string | null>(null);
    const [isPickerContentMounted, setIsPickerContentMounted] = useState(false);

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
        setViewingAddressId(addr.address_id || null);
        setActiveMapMode('viewer');
        setTimeout(() => {
            document.getElementById(`addr-${addr.address_id}`)?.scrollIntoView({ behavior: 'smooth' });
        }, 100);
    }

    const handleCloseMap = () => {
        setActiveMapMode(null);
        setTimeout(() => setViewingAddressId(null), 500);
    }

    return (
        <div className="space-y-8 animate-fade-in max-w-2xl mx-auto py-12">
            <button
                onClick={() => navigate('/profile')}
                className="flex items-center gap-2 text-slate-500 hover:text-green-600 font-bold transition-colors group"
            >
                <ArrowLeft size={18} className="group-hover:-translate-x-1 transition-transform" />
                Back to Profile
            </button>

            <div>
                <h2 className="text-2xl font-extrabold text-slate-900">Saved Addresses</h2>
                <p className="text-slate-500">Manage your shipping locations.</p>
            </div>

            {loading ? (
                <div className="text-center py-10 text-green-400 font-medium animate-pulse">Loading addresses...</div>
            ) : (
                <div className="grid grid-cols-1 gap-4">

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
                                    bg-white rounded-[2rem] shadow-sm border border-green-100 transition-all duration-500 ease-in-out
                                    ${isViewing ? 'shadow-xl shadow-green-100/50' : 'hover:shadow-md'}
                                    ${isViewing ? MAP_INLINE_HEIGHT : 'max-h-64'} 
                                    ${isViewing ? 'p-0 overflow-hidden' : 'p-6 overflow-visible'}
                                `}
                            >
                                {!isViewing && (
                                    <div className="p-0">
                                        <div className="flex items-start gap-3 p-0">
                                            <div className="mt-1 p-2 bg-green-50 rounded-xl text-green-500">
                                                <MapPin size={18} />
                                            </div>
                                            <div className="flex-1">
                                                <p className="font-semibold text-slate-800">{addr.formatted_address}</p>
                                            </div>
                                        </div>

                                        <div className="flex gap-2 mt-6 justify-end">
                                            <button
                                                onClick={() => handleViewAddress(addr)}
                                                className="px-4 py-2 text-sm text-slate-600 bg-slate-100 rounded-xl hover:bg-slate-200 transition-colors flex items-center gap-1"
                                            >
                                                <Globe size={16} /> View Map
                                            </button>
                                            <button onClick={() => handleDeleteAddress(addr.address_id!)} className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-colors">
                                                <Trash2 size={18} />
                                            </button>
                                        </div>
                                    </div>
                                )}

                                {isViewing && (
                                    <div className="p-8">
                                        <div className="flex justify-between items-center mb-6">
                                            <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                                                <MapPin size={20} className="text-green-500" />
                                                Viewing Address Location
                                            </h3>
                                            <button
                                                onClick={handleCloseMap}
                                                className="p-2 text-slate-500 hover:text-green-600 hover:bg-green-50 rounded-full transition-colors"
                                            >
                                                <X size={20} />
                                            </button>
                                        </div>
                                        <StaticLocationMap location={addressLocation} />
                                    </div>
                                )}
                            </div>
                        );
                    })}

                    <div
                        className={`
                            bg-white rounded-[2rem] shadow-sm transition-all duration-500 ease-in-out
                            ${activeMapMode === 'picker'
                                ? 'shadow-xl shadow-green-100/50 border border-green-100'
                                : 'border-2 border-dashed border-green-200 cursor-pointer hover:bg-green-50'
                            }
                            ${activeMapMode === 'picker' ? `${MAX_GROWTH_HEIGHT}` : 'max-h-32'} 
                            overflow-hidden
                        `}
                        onClick={activeMapMode === 'picker' ? undefined : () => setActiveMapMode('picker')}
                    >
                        {activeMapMode !== 'picker' && (
                            <div className={`h-full flex flex-col items-center justify-center text-center text-green-500 max-h-32 p-6 transition-opacity duration-300 ${activeMapMode === 'viewer' ? 'invisible opacity-0' : 'opacity-100'}`}>
                                <Plus size={32} className="mx-auto mb-2" />
                                <p className="font-bold">Add New Address</p>
                            </div>
                        )}
                        {isPickerContentMounted && activeMapMode === 'picker' && (
                            <div className="p-8">
                                <div className="flex justify-between items-center mb-6">
                                    <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                                        <MapPin size={20} className="text-green-500" />
                                        Select New Address Location
                                    </h3>
                                    <button
                                        onClick={() => setActiveMapMode(null)}
                                        className="p-2 text-slate-500 hover:text-green-600 hover:bg-green-50 rounded-full transition-colors"
                                    >
                                        <X size={20} />
                                    </button>
                                </div>
                                <GeoPickerMap onLocationPicked={handleLocationPicked} submitText="Save Address" successText="Saved Address Successfully" />
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default ProfileAddressesPage;