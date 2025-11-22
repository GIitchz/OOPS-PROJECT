import { createClient } from "@supabase/supabase-js";
import { Database } from "./DatabaseInterfaces";
import { UserInterface, UserDataInterface } from "./Interfaces";
import { FilterInterface, getFilteredListings, groupListingsByProduct } from "./productsDB";

const SUPABASE_URL = "https://hopvgsttpmoofwlxhkbx.supabase.co";
const SUPABASE_KEY = "sb_publishable_1TvVZv76Cmle6-R_J8b08g_55S7cK5C";

const Supabase = createClient<Database>(SUPABASE_URL, SUPABASE_KEY);

export const getUserDetails = async (): Promise<UserInterface | null> => {
    const { data: { session }, error: authError } = await Supabase.auth.getSession();
    if (authError || !session) {
        if (authError) { console.log("error retreiving session"); }
        return null;
    }

    interface userDataInterface {
        user_id: string,
        name: string,
        latitude: number,
        longitude: number,
        role: 'customer' | 'retailer' | 'wholesaler'
    };
    const { data, error } = await Supabase.rpc('get_user_data', { uid: session.user.id }).maybeSingle();
    const userData_: userDataInterface | null = data as userDataInterface | null;
    if (data) {
        const userData: UserInterface = {
            id: userData_!.user_id,
            name: userData_!.name,
            email: session!.user.email!,
            location: {
                latitude: userData_!.latitude,
                longitude: userData_!.longitude
            },
            role: userData_!.role
        };
        return userData;
    }
    else {
        console.log("error retreiving user data");
        return null;
    }
};

export const updateName = async (user: UserInterface, newName: string) => {
    if (!newName.trim()) return alert("Enter a name");

    const { error } = await Supabase
        .from("users")
        .update({ name: newName })
        .eq("user_id", user!.id);

    if (error) return alert("Error updating name");
};

export const updatePassword = async (user: UserInterface, newPassword: string) => {
    if (!newPassword.trim()) return alert("Enter a new password");

    const { error } = await Supabase.auth.updateUser({
      password: newPassword
    });

    if (error) {
        console.error("Error updating password", error);
        return;
    }
    else {
        console.log("Password updated");
    }
  };

export const getProductById = async (productId: string, coord?: {lat:number, lng:number}) => {
    let filter: FilterInterface = {productId};
    if(coord) {
        filter.distFrom = coord;
    }
    const listings = await getFilteredListings(filter);
    if(!listings) {
        console.error("Did not find product");
    }
    const product = groupListingsByProduct(listings!)[0];
    return product;
};


export const getAllProducts = async () => {
    const listings = await getFilteredListings({});
    const products = groupListingsByProduct(listings!);
    return products;
};

export async function getAllRetailers() {
    const { data, error } = await Supabase
    .from("users")
    .select("id: user_id, name, role: user_role")
    .eq("user_role", "retailer");
    
    if (error) {
        console.error("Error fetching retailers:", error);
        return [];
    }
    
    return data;
}

export async function getAllWholesalers() {
    const { data, error } = await Supabase
    .from("users")
    .select("id: user_id, name, role: user_role")
    .eq("user_role", "wholesaler");
    
    if (error) {
        console.error("Error fetching wholesalers:", error);
        return [];
    }
    
    return data;
}

export default Supabase;