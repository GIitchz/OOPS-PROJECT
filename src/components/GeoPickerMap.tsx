import { useEffect, useState, useRef } from "react";
import { AlertTriangle, Search, LocateFixed } from "lucide-react";
import { GoogleMap, useJsApiLoader, Marker, Autocomplete } from '@react-google-maps/api';

// --- CONFIGURATION ---
const GOOGLE_MAPS_API_KEY = import.meta.env.VITE_GMAP_KEY;
const MAP_LIBRARIES: ("geometry" | "core" | "maps" | "places" | "geocoding" | "routes" | "marker" | "elevation" | "streetView" | "journeySharing" | "drawing" | "visualization")[] = ['places'];
const DEFAULT_CENTER = { lat: 17.5454217, lng: 78.5705673 };

export type LocationInterface = { lat: number, lng: number, formatted_address: string };
export type OnLocationPicedInterface = (location: LocationInterface) => void;

interface GeoPickerMapProps {
    onLocationPicked: OnLocationPicedInterface;
    submitText: string;
    successText: string;
}

export const GeoPickerMap = ({ onLocationPicked, submitText, successText }: GeoPickerMapProps) => {

    const [selectedLocation, setSelectedLocation] = useState<{ lat: number, lng: number } | null>(null);
    const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error', message: string } | null>(null);
    const [isLocating, setIsLocating] = useState(false);

    const autocompleteRef = useRef<google.maps.places.Autocomplete | null>(null);
    const geocoderRef = useRef<google.maps.Geocoder | null>(null);
    const addressInputRef = useRef<HTMLInputElement>(null);

    const { isLoaded } = useJsApiLoader({
        googleMapsApiKey: GOOGLE_MAPS_API_KEY,
        libraries: MAP_LIBRARIES as never[],
    });

    useEffect(() => {
        if (isLoaded && !geocoderRef.current) {
            // @ts-ignore
            geocoderRef.current = new window.google.maps.Geocoder();
        }
    }, [isLoaded]);

    const setLocationFromPlace = (place: google.maps.places.PlaceResult, lat: number, lng: number) => {
        setSelectedLocation({ lat, lng });

        const formattedAddress = place.formatted_address || "Coordinates set.";
        setStatusMessage({ type: 'success', message: `Location set: ${formattedAddress}` });

        if (addressInputRef.current) {
            addressInputRef.current.value = formattedAddress;
        }
    };

    const onPlaceChanged = () => {
        if (autocompleteRef.current) {
            const place = autocompleteRef.current.getPlace();
            if (place.geometry && place.geometry.location) {
                const lat = place.geometry.location.lat();
                const lng = place.geometry.location.lng();
                setLocationFromPlace(place, lat, lng);
            } else {
                setStatusMessage({ type: 'error', message: "Selected place has no geographical coordinates. Try a more specific address." });
            }
        }
    };

    const handleMapClick = (e: google.maps.MapMouseEvent) => {
        if (!geocoderRef.current) {
            setStatusMessage({ type: 'error', message: "Map services are still loading. Please wait." });
            return;
        }

        const lat = e.latLng?.lat() ?? 0;
        const lng = e.latLng?.lng() ?? 0;
        const latLng = new window.google.maps.LatLng(lat, lng);

        geocoderRef.current.geocode({ location: latLng }, (results, status) => {
            if (status === window.google.maps.GeocoderStatus.OK && results?.[0]) {
                const place = results[0];
                setLocationFromPlace(place, lat, lng);
            } else {
                console.error('Geocoder failed due to: ' + status);
                setStatusMessage({ type: 'error', message: "Could not find a specific address for this location. Click again or use the search bar." });
            }
        });
    };

    const handleGetCurrentLocation = () => {
        if (!navigator.geolocation) {
            setStatusMessage({ type: 'error', message: "Geolocation is not supported by your browser." });
            return;
        }
        if (!geocoderRef.current) {
            setStatusMessage({ type: 'error', message: "Map services are still loading. Please wait." });
            return;
        }

        setIsLocating(true);
        setStatusMessage({ type: 'success', message: "Attempting to locate you..." });

        navigator.geolocation.getCurrentPosition(
            (position) => {
                const lat = position.coords.latitude;
                const lng = position.coords.longitude;
                const latLng = new window.google.maps.LatLng(lat, lng);

                geocoderRef.current!.geocode({ location: latLng }, (results, status) => {
                    setIsLocating(false);
                    if (status === window.google.maps.GeocoderStatus.OK && results?.[0]) {
                        setLocationFromPlace(results[0], lat, lng);
                    } else {
                        setSelectedLocation({ lat, lng });
                        setStatusMessage({ type: 'success', message: "Location set to current coordinates. Address could not be resolved." });
                        if (addressInputRef.current) {
                            addressInputRef.current.value = `Current Location: ${lat.toFixed(4)}, ${lng.toFixed(4)}`;
                        }
                    }
                });
            },
            (error) => {
                setIsLocating(false);
                console.error('Geolocation Error:', error);
                setStatusMessage({ type: 'error', message: `Location access denied or failed: ${error.message}` });
            },
            { enableHighAccuracy: true, timeout: 5000, maximumAge: 0 }
        );
    };

    const handleSelectLocation = () => {

        if (!selectedLocation) {
            setStatusMessage({ type: 'error', message: "Please search or click on the map to select a location." });
            return;
        }

        const formattedAddress = statusMessage?.message.startsWith("Location set: ")
            ? statusMessage.message.substring("Location set: ".length)
            : addressInputRef.current?.value || "Address not fully resolved.";

        onLocationPicked({
            lat: selectedLocation.lat,
            lng: selectedLocation.lng,
            formatted_address: formattedAddress
        });

        setStatusMessage({ type: 'success', message: successText });
    };

    return (
        <div className="space-y-4">
            {statusMessage && (
                <div className={`p-4 rounded-xl font-medium flex items-start gap-3 ${statusMessage.type === 'error' ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
                    {statusMessage.type === 'error' && <AlertTriangle size={20} className="mt-0.5" />}
                    <p>{statusMessage.message}</p>
                </div>
            )}

            <div className="space-y-4">

                {isLoaded ? (
                    <div className="relative">
                        <Autocomplete
                            onLoad={(autocomplete) => { autocompleteRef.current = autocomplete; }}
                            onPlaceChanged={onPlaceChanged}
                            fields={["geometry.location", "formatted_address"]}
                        >
                            <div className="relative">
                                <input
                                    name="searchAddress"
                                    placeholder="Search for an Address or Landmark"
                                    ref={addressInputRef}
                                    required
                                    className="w-full p-4 pl-12 bg-slate-50 border border-transparent rounded-xl focus:bg-white focus:border-green-500 focus:ring-2 focus:ring-green-200 outline-none transition-all font-medium text-slate-800"
                                />
                                <Search size={20} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                            </div>
                        </Autocomplete>
                    </div>
                ) : (
                    <input
                        placeholder="Map Service Loading..."
                        disabled
                        className="w-full p-4 bg-slate-50 border border-transparent rounded-xl text-slate-500"
                    />
                )}

                <div className="w-full h-80 rounded-xl overflow-hidden border-2 border-slate-200">
                    {isLoaded ? (
                        <GoogleMap
                            mapContainerStyle={{ width: "100%", height: "100%" }}
                            center={selectedLocation || DEFAULT_CENTER}
                            zoom={selectedLocation ? 15 : 10}
                            onClick={handleMapClick}
                            options={{ streetViewControl: false, mapTypeControl: false }}
                        >
                            {selectedLocation && (
                                <Marker position={selectedLocation} />
                            )}
                        </GoogleMap>
                    ) : (
                        <div className="w-full h-full flex items-center justify-center bg-slate-100 text-slate-500 font-medium">
                            Loading Map... (Check API Key)
                        </div>
                    )}
                </div>

                <div className="flex gap-4 pt-4">
                    <button
                        type="button"
                        onClick={handleSelectLocation}
                        className="flex-1 py-4 bg-green-600 text-white rounded-xl font-bold shadow-lg shadow-green-200 hover:bg-green-700 hover:-translate-y-0.5 transition-all"
                        disabled={!selectedLocation || isLocating}
                    >
                        {submitText}
                    </button>
                    <button
                        type="button"
                        className="flex items-center justify-center gap-1 px-8 py-4 bg-slate-100 text-slate-600 rounded-xl font-bold hover:bg-slate-200 transition-all disabled:opacity-50"
                        onClick={handleGetCurrentLocation}
                        disabled={isLocating}
                    >
                        <LocateFixed size={20} />
                        {isLocating ? 'Locating...' : 'My Location'}
                    </button>
                </div>
            </div>
        </div>
    );
};

const DEFAULT_ZOOM = 15;

export type LocationCoordinates = {
    lat: number;
    lng: number;
};

interface StaticLocationMapProps {
    location: LocationCoordinates;
    zoom?: number;
    title?: string;
}


export const StaticLocationMap = ({ location, zoom = DEFAULT_ZOOM, title = "Saved Location" }: StaticLocationMapProps) => {

    const { isLoaded } = useJsApiLoader({
        googleMapsApiKey: GOOGLE_MAPS_API_KEY,
        libraries: MAP_LIBRARIES as never[],
    });

    const mapOptions = {
        zoomControl: true,
        mapTypeControl: false,
        streetViewControl: false,
        fullscreenControl: false,
        draggable: false,
        scrollwheel: false,
        disableDoubleClickZoom: true,
        clickableIcons: false,
    };

    if (!isLoaded) {
        return (
            <div className="w-full h-80 rounded-xl overflow-hidden border-2 border-slate-200 flex items-center justify-center bg-slate-100 text-slate-500 font-medium">
                Loading Map... (Check API Key)
            </div>
        );
    }

    return (
        <div className="space-y-4">
            <div className="w-full h-80 rounded-xl overflow-hidden border-2 border-slate-200">
                <GoogleMap
                    mapContainerStyle={{ width: "100%", height: "100%" }}
                    center={location}
                    zoom={zoom}
                    options={mapOptions}
                >
                    <Marker position={location} />
                </GoogleMap>
            </div>
        </div>
    );
};