import { useState } from "react";
import GoogleMapComponent from "../components/GoogleMap"; // Import the map component

export const ProfileAddressesPage = () => {
  const [form, setForm] = useState({ address1: "", address2: "", city: "", pincode: "", country: "" });
  const [selectedLocation, setSelectedLocation] = useState<{ lat: number; lng: number } | null>(null);

  const handleLocationSelect = (lat: number, lng: number) => {
    setSelectedLocation({ lat, lng });
    // Optionally, use reverse geocoding to get the address
    // You can use the Google Geocoder here to convert lat, lng into an address.
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Save the address along with the lat, lng coordinates
  };

  return (
    <div>
      <form onSubmit={handleSubmit}>
        <GoogleMapComponent onLocationSelect={handleLocationSelect} />

        <input
          name="address1"
          placeholder="Address Line 1"
          value={form.address1}
          onChange={(e) => setForm({ ...form, address1: e.target.value })}
        />
        <input
          name="address2"
          placeholder="Address Line 2 (Optional)"
          value={form.address2}
          onChange={(e) => setForm({ ...form, address2: e.target.value })}
        />
        <input
          name="city"
          placeholder="City"
          value={form.city}
          onChange={(e) => setForm({ ...form, city: e.target.value })}
        />
        <input
          name="pincode"
          placeholder="Pincode"
          value={form.pincode}
          onChange={(e) => setForm({ ...form, pincode: e.target.value })}
        />
        <input
          name="country"
          placeholder="Country"
          value={form.country}
          onChange={(e) => setForm({ ...form, country: e.target.value })}
        />

        <button type="submit">Save Address</button>
      </form>
    </div>
  );
};

export default
