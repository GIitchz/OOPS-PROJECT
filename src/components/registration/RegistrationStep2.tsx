import React, { useState, ChangeEvent } from 'react';
import { MapPin, ArrowLeft, Check, X, LocateFixed } from 'lucide-react';
// Assuming GeoPickerMap and LocationInterface are available for this step
import { GeoPickerMap, LocationInterface } from '../GeoPickerMap';
import { OnLocationPicedInterface } from '../GeoPickerMap';


// Define an interface for the location data structure expected from the GeoPicker
interface PickerLocation extends LocationInterface {
    formatted_address: string;
}

interface Step2Props {
    onNext: (e: React.FormEvent<HTMLFormElement>) => void;
    onPrev: () => void;
    onChange: (data: { [key: string]: string | number | null }) => void; // Updated onChange to support number/null
    initialFormData: {
        role: "Customer" | "Retailer" | "Wholesaler",
        name: string,
        latitude: number | null,
        longitude: number | null,
        formatted_address?: string | null // Added optional address field for display
    };
}

const Step2 = ({ onNext, onPrev, onChange, initialFormData }: Step2Props) => {
    // Ensure initialFormData has a default formatted_address for state consistency
    const initialAddress = initialFormData.formatted_address || null;

    const [formData, setFormData] = useState({
        ...initialFormData,
        formatted_address: initialAddress
    });

    // State to control the visibility of the map picker
    const [isMapOpen, setIsMapOpen] = useState(false);

    // Determine if location data is present for validation/display
    const isLocationSet = formData.latitude !== null && formData.longitude !== null;


    const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData({ ...formData, [name]: value });
        onChange({ [name]: value });
    };

    const handleSelect = (e: ChangeEvent<HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData({ ...formData, [name]: value });
        onChange({ [name]: value });
    };

    const handleLocationPicked: OnLocationPicedInterface = (location) => {
        // Update the form state with the received coordinates and formatted address
        const updatedLocationData = {
            latitude: location.lat,
            longitude: location.lng,
            formatted_address: location.formatted_address,
        };

        setFormData(prev => ({
            ...prev,
            ...updatedLocationData
        }));

        // Notify parent component
        onChange(updatedLocationData);

        // Close the map
        setIsMapOpen(false);
    };

    // Shared styles: Changed focus:ring-rose-500 to focus:ring-emerald-500
    const labelClass = "block text-sm font-bold text-slate-700 mb-1";
    const inputClass = "appearance-none block w-full px-4 py-3 border border-slate-200 rounded-xl shadow-sm placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm bg-slate-50/50 transition-all";

    // Validation Check for form submission
    const isSubmitDisabled =
        formData.role !== 'Customer' && !isLocationSet ||
        isMapOpen ||
        formData.name.trim() === '';

    return (
        <form className="space-y-6" onSubmit={onNext}>
            <div className="space-y-5">
                {/* Role Selection */}
                <div>
                    <label htmlFor="role" className={labelClass}>I am a:</label>
                    <div className="relative">
                        <select
                            id="role"
                            name="role"
                            value={formData.role}
                            onChange={handleSelect}
                            className={inputClass}
                        >
                            <option value="Customer">Customer (I want to buy things)</option>
                            <option value="Retailer">Retailer (I own a shop)</option>
                            <option value="Wholesaler">Wholesaler (I supply in bulk)</option>
                        </select>
                    </div>
                </div>

                {/* Name Input */}
                <div>
                    <label htmlFor="name" className={labelClass}>
                        {formData.role !== 'Customer' ? `${formData.role} Name` : 'Full Name'}
                    </label>
                    <input
                        id="name"
                        type="text"
                        name="name"
                        value={formData.name}
                        onChange={handleChange}
                        required
                        className={inputClass}
                        placeholder={formData.role === 'Retailer' ? "e.g. Joe's Grocery" : "e.g. John Doe"}
                    />
                </div>

                {/* Location Section (Only for Sellers) */}
                {(formData.role !== 'Customer') && (
                    // Changed bg-green-50 and border-green-100 to emerald
                    <div className="bg-emerald-50 rounded-2xl p-5 border border-emerald-100">
                        {/* Changed text-green-700 to emerald */}
                        <h3 className="text-sm font-bold text-emerald-700 mb-3">Business Location</h3>

                        {/* Location Display/Picker Toggle */}
                        {isLocationSet && !isMapOpen ? (
                            // Changed border-green-200 to emerald
                            <div className="p-4 bg-white rounded-xl border border-emerald-200">
                                <div className="flex items-start justify-between">
                                    <div className="flex items-center gap-2 mb-2">
                                        {/* Changed text-green-500 to emerald */}
                                        <MapPin size={20} className="text-emerald-500" />
                                        <p className="font-semibold text-slate-800">Location Set</p>
                                    </div>
                                    <button
                                        onClick={() => setIsMapOpen(true)}
                                        type="button"
                                        // Changed text-green-600/800 to emerald
                                        className="text-xs font-bold text-emerald-600 hover:text-emerald-800 transition-colors"
                                    >
                                        Change Location
                                    </button>
                                </div>
                                <p className="text-sm text-slate-600 truncate">
                                    {formData.formatted_address || `Lat: ${formData.latitude}, Lng: ${formData.longitude}`}
                                </p>
                            </div>
                        ) : (
                            isMapOpen ? (
                                // GeoPicker is Open
                                // Changed border-green-200 to emerald
                                <div className="p-4 border border-emerald-200 rounded-xl bg-white shadow-inner">
                                    <div className="flex justify-between items-center mb-3">
                                        <p className="text-sm font-semibold text-slate-700 flex items-center gap-1">
                                            <LocateFixed size={16} /> Pin your business on the map
                                        </p>
                                        <button
                                            type='button'
                                            onClick={() => setIsMapOpen(false)}
                                            // Changed hover:text-green-600 and hover:bg-green-50 to emerald
                                            className="p-1 text-slate-500 hover:text-emerald-600 hover:bg-emerald-50 rounded-full transition-colors"
                                        >
                                            <X size={18} />
                                        </button>
                                    </div>
                                    <GeoPickerMap
                                        onLocationPicked={handleLocationPicked}
                                        submitText="Confirm Business Location"
                                        successText="Location Selected"
                                    />
                                </div>
                            ) : (
                                // Location is not set and map is closed (Initial state)
                                <button
                                    onClick={() => setIsMapOpen(true)}
                                    type="button"
                                    // Changed border-green-200, text-green-500, and hover:bg-green-100 to emerald
                                    className="w-full py-4 border-2 border-dashed border-emerald-200 rounded-2xl text-emerald-500 hover:bg-emerald-100/50 transition-colors flex flex-col items-center justify-center gap-1"
                                >
                                    <MapPin size={24} />
                                    <p className="font-bold text-sm">Select Business Location</p>
                                </button>
                            )
                        )}

                        {/* Location Required Error (Kept red for standard error) */}
                        {!isLocationSet && !isMapOpen && (
                            <p className="text-xs text-red-500 mt-2 font-medium">
                                A map location is required for Retailers and Wholesalers.
                            </p>
                        )}
                    </div>
                )}
            </div>

            {/* Navigation Buttons */}
            <div className="flex gap-3 pt-2">
                <button
                    type="button"
                    onClick={onPrev}
                    className="flex-1 flex justify-center items-center py-3 px-4 border border-slate-200 rounded-2xl shadow-sm text-sm font-bold text-slate-600 bg-white hover:bg-slate-50 transition-all"
                >
                    <ArrowLeft size={16} className="mr-2" /> Back
                </button>
                <button
                    type="submit"
                    disabled={isSubmitDisabled}
                    // Changed shadow-green-200, bg-green-600/700 to emerald
                    className="flex-[2] flex justify-center items-center py-3 px-4 border border-transparent rounded-2xl shadow-lg shadow-emerald-200 text-sm font-bold text-white bg-emerald-600 hover:bg-emerald-700 hover:-translate-y-0.5 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    Complete Registration <Check size={16} className="ml-2" />
                </button>
            </div>
        </form>
    );
};

export default Step2;