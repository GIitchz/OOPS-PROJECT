import { ChangeEvent, FormEvent, useEffect, useState } from "react";
import { AddressInterface } from "../utils/Interfaces";
import { deleteSavedAddress, getSavedAddresses, saveAddressForUser, updateSavedAddress } from "../utils/AdressDB";
import { useAuth } from "../context/AuthContext";
import { getLatLongFromAddress } from "../utils/Geo";


export const ProfileAddressesPage = () => {
    console.log("Hello from address page");
    const { user } = useAuth();
    const [addresses, setAddresses] = useState<AddressInterface[]>([]);
    const [form, setForm] = useState({
    address1: "",
    address2: "",
    city: "",
    pincode: "",
    country: ""
    });
    const [ loading, setLoading ] = useState(true);

    const loadAddresses = async () => {
        if (!user) return;
        const data = await getSavedAddresses(user);
        setAddresses(data);
        setLoading(false);
    };

    useEffect(() => {
        setLoading(true);
        loadAddresses();
    }, [user]);

    
    const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
        setForm({ ...form, [e.target.name]: e.target.value });
    };

    const startEdit = (addr: AddressInterface) => {
        setEditingId(addr.address_id);
        setForm({
        address1: addr.address1,
        address2: addr.address2 || "",
        city: addr.city,
        pincode: addr.pincode,
        country: addr.country
        });
    };

    const handleDeleteAddress = async (id: string) => {
        if (!window.confirm("Delete this address?")) return;
        await deleteSavedAddress(id);
        setLoading(true);
        loadAddresses();
    };

    const handleSaveAddress = async (e: FormEvent<HTMLFormElement>) => {
      e.preventDefault();
      if (!user) return;
    
      // ---------------------------------
      // 1. Fetch coordinates first
      // ---------------------------------
      const coords = await getLatLongFromAddress(
        form.address1,
        form.address2,
        form.city,
        form.pincode,
        form.country
      );
    
      console.log("📍 Geocoded coords:", coords);
    
      // ---------------------------------
      // 2. SAVE OR UPDATE WITH COORDINATES
      // ---------------------------------
      if (editingId) {
        // Updating an existing address
        await updateSavedAddress(editingId, {
          ...form,
          lat: coords?.lat ?? null,
          lng: coords?.lng ?? null
        });
    
        setEditingId(null);
    
      } else {
        // Creating a new address
        await saveAddressForUser(
          user,
          {
            ...form,
            lat: coords?.lat ?? null,
            lng: coords?.lng ?? null
          }
        );
      }
    
      // ---------------------------------
      // 3. Reset form & reload
      // ---------------------------------
      setForm({
        address1: "",
        address2: "",
        city: "",
        pincode: "",
        country: ""
      });
    
      setLoading(true);
      loadAddresses();
    };

    
    const [editingId, setEditingId] = useState<string|null>(null);

    return (
        <div className="min-h-screen bg-rose-50 py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-2xl mx-auto">
                <h2 className="section-title text-2xl font-extrabold text-slate-900 mb-6">Your Saved Addresses</h2>

                {loading ? (
                    <p>Loading saved addresses.</p>
                ):
                addresses.length === 0 && <p>No saved addresses yet.</p>}

                {/* Address List */}
                <div className="space-y-4">
                    {addresses.map(addr => (
                        <div key={addr.address_id} className="bg-white rounded-2xl shadow-md p-6">
                            <p className="text-lg font-medium text-slate-800">{addr.address1}</p>
                            {addr.address2 && <p className="text-sm text-slate-600">{addr.address2}</p>}
                            <p className="text-sm text-slate-600">{addr.city}, {addr.pincode}</p>
                            <p className="text-sm text-slate-600">{addr.country}</p>

                            {addr.lat && addr.lng && (
                                <p className="text-sm text-slate-500">📍 {addr.lat}, {addr.lng}</p>
                            )}

                            <div className="flex gap-4 mt-4">
                                <button 
                                    onClick={() => startEdit(addr)} 
                                    className="p-2 bg-rose-100 text-rose-600 rounded-lg hover:bg-rose-500 hover:text-white transition-colors"
                                >
                                    Edit
                                </button>
                                <button 
                                    className="p-2 bg-slate-100 text-slate-600 rounded-lg hover:bg-slate-800 hover:text-white transition-colors" 
                                    onClick={() => handleDeleteAddress(addr.address_id!)}
                                >
                                    Delete
                                </button>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Add/Edit Address Form */}
                <h2 className="section-title text-2xl font-extrabold text-slate-900 mt-8 mb-6">{editingId ? "Edit Address" : "Add New Address"}</h2>

                <form className="space-y-4" onSubmit={handleSaveAddress}>
                    <input 
                        name="address1" 
                        placeholder="Address Line 1" 
                        value={form.address1} 
                        onChange={handleChange} 
                        required 
                        className="w-full p-4 bg-white border border-slate-200 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-rose-500"
                    />
                    <input 
                        name="address2" 
                        placeholder="Address Line 2" 
                        value={form.address2} 
                        onChange={handleChange} 
                        className="w-full p-4 bg-white border border-slate-200 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-rose-500"
                    />
                    <input 
                        name="city" 
                        placeholder="City" 
                        value={form.city} 
                        onChange={handleChange} 
                        required 
                        className="w-full p-4 bg-white border border-slate-200 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-rose-500"
                    />
                    <input 
                        name="pincode" 
                        placeholder="Pincode" 
                        value={form.pincode} 
                        onChange={handleChange} 
                        required 
                        className="w-full p-4 bg-white border border-slate-200 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-rose-500"
                    />
                    <input 
                        name="country" 
                        placeholder="Country" 
                        value={form.country} 
                        onChange={handleChange} 
                        required 
                        className="w-full p-4 bg-white border border-slate-200 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-rose-500"
                    />

                    <div className="flex gap-4">
                        <button 
                            type="submit" 
                            className="w-full p-4 bg-rose-500 text-white rounded-xl shadow-md hover:bg-rose-600 transition-all"
                        >
                            {editingId ? "Save Changes" : "Add Address"}
                        </button>

                        {editingId && (
                            <button 
                                type="button" 
                                className="w-full p-4 bg-slate-200 text-slate-700 rounded-xl shadow-md hover:bg-slate-300 transition-all"
                                onClick={() => {
                                    setEditingId(null);
                                    setForm({ address1: "", address2: "", city: "", pincode: "", country: "" });
                                }}
                            >
                                Cancel
                            </button>
                        )}
                    </div>
                </form>
            </div>
        </div>
    );
};

export default ProfileAddressesPage;