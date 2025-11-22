import React, { useEffect, useRef, useState } from "react";

const GoogleMapComponent = ({
  onLocationSelect,
}: {
  onLocationSelect: (lat: number, lng: number) => void;
}) => {
  const mapRef = useRef<HTMLDivElement | null>(null);
  const searchInputRef = useRef<HTMLInputElement | null>(null);
  const [map, setMap] = useState<google.maps.Map | null>(null);
  const [marker, setMarker] = useState<google.maps.Marker | null>(null);
  const [currentLocation, setCurrentLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [address, setAddress] = useState<Address | null>(null);
  const [placesService, setPlacesService] = useState<google.maps.places.PlacesService | null>(null);

  // Function to initialize the map
  const initializeMap = (lat: number, lng: number) => {
    if (!mapRef.current) return;

    const mapInstance = new google.maps.Map(mapRef.current, {
      center: { lat, lng },
      zoom: 15,
      mapTypeId: google.maps.MapTypeId.ROADMAP,
    });

    setMap(mapInstance);

    const newMarker = new google.maps.Marker({
      position: { lat, lng },
      map: mapInstance,
      draggable: true,
    });

    setMarker(newMarker);

    google.maps.event.addListener(newMarker, "dragend", () => {
      const position = newMarker.getPosition();
      if (position) {
        onLocationSelect(position.lat(), position.lng());
        fetchAddress(position.lat(), position.lng()); // Fetch address after dragging the marker
      }
    });

    // Initialize the Places Service
    setPlacesService(new google.maps.places.PlacesService(mapInstance));
  };

  // Function to get the user's current location
  const getCurrentLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const lat = position.coords.latitude;
          const lng = position.coords.longitude;
          setCurrentLocation({ lat, lng });
          initializeMap(lat, lng);
          fetchAddress(lat, lng); // Fetch address after initializing map
        },
        (error) => {
          console.error(error);
          initializeMap(0, 0);
          fetchAddress(0, 0);
        }
      );
    } else {
      console.error("Geolocation is not supported by this browser.");
      initializeMap(0, 0);
      fetchAddress(0, 0);
    }
  };

  // Fetch address using reverse geocode helper function
  const fetchAddress = async (lat: number, lng: number) => {
    try {
      const address = await reverseGeocode(lat, lng); // Call the reverse geocode function
      setAddress(address); // Store the formatted address
    } catch (error) {
      console.error("Error fetching address:", error);
      setAddress(null);
    }
  };

  // Function to handle place search (using Places API)
  const handlePlaceSearch = () => {
    if (searchInputRef.current && placesService && currentLocation) {
      const request = {
        query: searchInputRef.current.value,
        fields: ["name", "geometry"],
        location: new google.maps.LatLng(currentLocation.lat, currentLocation.lng),
        radius: 50000,
      };

      placesService.textSearch(request, (results, status) => {
        if (status === google.maps.places.PlacesServiceStatus.OK && results) {
          const place = results[0]; // Use the first search result
          const { geometry, name } = place;

          if (geometry && geometry.location) {
            const lat = geometry.location.lat();
            const lng = geometry.location.lng();

            map?.setCenter(geometry.location);
            marker?.setPosition(geometry.location);
            onLocationSelect(lat, lng);
            fetchAddress(lat, lng); // Reverse geocode the selected place
          }
        } else {
          alert("No results found.");
        }
      });
    }
  };

  // Initialize the map when the component mounts
  useEffect(() => {
    getCurrentLocation();
  }, []);

  return (
    <div className="google-map-container">
      <div className="search-bar">
        <input
          ref={searchInputRef}
          type="text"
          placeholder="Search for a place..."
          className="search-input"
        />
        <button className="search-button" onClick={handlePlaceSearch}>
          Search
        </button>
      </div>

      <div ref={mapRef} style={{ width: "100%", height: "400px", borderRadius: "8px" }}></div>

      <div className="address-display">
        <h3>Selected Address:</h3>
        {address ? (
          <pre>{JSON.stringify(address, null, 2)}</pre> // Display the structured address in JSON format
        ) : (
          <p>Loading address...</p>
        )}
      </div>

      <style jsx>{`
        .google-map-container {
          width: 100%;
          max-width: 600px;
          margin: auto;
          padding: 16px;
          background-color: #fff;
          border-radius: 8px;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
        }

        .search-bar {
          display: flex;
          margin-bottom: 12px;
          justify-content: space-between;
        }

        .search-input {
          width: 80%;
          padding: 8px 12px;
          font-size: 14px;
          border: 1px solid #ddd;
          border-radius: 4px;
          outline: none;
        }

        .search-button {
          padding: 8px 12px;
          background-color: #ff5722;
          color: white;
          border: none;
          border-radius: 4px;
          cursor: pointer;
          font-size: 14px;
        }

        .search-button:hover {
          background-color: #e64a19;
        }

        .google-map-container > div {
          margin-top: 16px;
        }

        .address-display {
          margin-top: 16px;
        }

        .address-display h3 {
          font-size: 16px;
          font-weight: bold;
        }

        .address-display p {
          font-size: 14px;
          color: #333;
        }
      `}</style>
    </div>
  );
};

export interface Address {
  addressLine1: string;
  addressLine2: string;
  city: string;
  pincode: string;
  country: string;
  formatted: string;
}

export const reverseGeocode = (lat: number, lng: number): Promise<Address | null> => {
  return new Promise((resolve, reject) => {
    const geocoder = new google.maps.Geocoder();

    const latLng = new google.maps.LatLng(lat, lng);

    geocoder.geocode({ location: latLng }, (results, status) => {
      if (status === google.maps.GeocoderStatus.OK) {
        if (results && results[0]) {
          // Extract the address components from the results
          const addressComponents = results[0].address_components;
          
          const address: Address = {
            addressLine1: "",
            addressLine2: "",
            city: "",
            pincode: "",
            country: "",
            formatted: ""
          };

          // Loop through the address components to map them to the structured format
          addressComponents.forEach((component) => {
            if (component.types.includes("street_address") || component.types.includes("route")) {
              address.addressLine1 = component.long_name;
            } else if (component.types.includes("sublocality") || component.types.includes("neighborhood")) {
              address.addressLine2 = component.long_name;
            } else if (component.types.includes("locality") || component.types.includes("administrative_area_level_2")) {
              address.city = component.long_name;
            } else if (component.types.includes("postal_code")) {
              address.pincode = component.long_name;
            } else if (component.types.includes("country")) {
              address.country = component.long_name;
            }
          });

          address.formatted = results[0].formatted_address;

          resolve(address);
        } else {
          reject("No results found.");
        }
      } else {
        reject(`Geocoder failed due to: ${status}`);
      }
    });
  });
};


export default GoogleMapComponent;
