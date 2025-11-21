import Supabase from "./Database";
import { AddressInterface, UserInterface } from "./Interfaces";

type AddressInputInterface = {
    address1: string,
    address2: string|null,
    city: string,
    pincode: string,
    country: string,
    lat: number | null,
    lng: number | null
}
export async function saveAddressForUser(user: UserInterface, address: AddressInputInterface) {
    const payload = {
        user_id: user.id,
        address1: address.address1,
        address2: address.address2,
        city: address.city,
        pincode: address.pincode,
        country: address.country,
        lat: address.lat,
        lng: address.lng
    };

    const { data, error } = await Supabase
        .from('saved_addresses')
        .insert([payload])
        .select()
        .single();

    if (error) {
        console.error('Error saving address:', error);
        return null;
    }
    return data;
}

export async function getSavedAddresses(user: UserInterface) {
    const { data, error } = await Supabase
        .from("saved_addresses")
        .select("*")
        .eq("user_id", user.id);

    if (error) {
        console.error("Error fetching addresses:", error);
        return [];
    }

    return data;
}

type AddressUpdateInterface = {
    address1: string | undefined,
    address2: string | undefined,
    city: string | undefined,
    pincode: string | undefined,
    country: string | undefined,
    lat: number | undefined,
    lng: number | undefined
}
export async function updateSavedAddress(addressId: string, updates: AddressUpdateInterface) {
    const { data, error } = await Supabase
        .from("saved_addresses")
        .update(updates)
        .eq("address_id", addressId)
        .select()
        .single();

    if (error) {
        console.error("Error updating address:", error);
        return null;
    }

    return data;
}
export async function deleteSavedAddress(addressId: string) {
    const { error } = await Supabase
        .from("saved_addresses")
        .delete()
        .eq("address_id", addressId);

    if (error) {
        console.error("Error deleting address:", error);
        return false;
    }
    return true;
}
export async function updateOrderLatLng(orderId:number, lat:number, lng:number) {
    const { data, error } = await Supabase
        .from("orders")
        .update({
            lat: lat,
            lng: lng,
        })
        .eq("order_id", orderId)
        .select();

    if (error) {
        console.error("Failed to update order location:", error);
        return null;
    }

    return data;
}
