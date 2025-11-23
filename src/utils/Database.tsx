import { createClient, PostgrestError } from "@supabase/supabase-js";
import { Database } from "./DatabaseInterfaces";
import { UserInterface, UserDataInterface, ProductListingInterface, FilteredProductInterface, ReviewInterface } from "./Interfaces";
import { FilterInterface, getFilteredListings, groupListingsByProduct } from "./productsDB";
import { Cat } from "lucide-react";

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

export const getProductById = async (productId: string): Promise<FilteredProductInterface> => {
    const listings = await getFilteredListings({productId});
    const product = groupListingsByProduct(listings);
    if(!product || product.length==0) {
        console.error(`No product with id ${productId} found`);
    }
    return product[0];
};


export const getListingReviews = async (listingId: string): Promise<{data:ReviewInterface[], error:PostgrestError|null}> => {
  const { data, error } = await Supabase
    .from('order_items')
    .select(
      // Select the required fields and navigate through the joins:
      // order_items -> orders -> users
      `
        rating, 
        feedback, 
        orders (
          ordered_at, 
          buyer: users (
            user_id,
            name,
            role: user_role
          )
        )
      `
    )
    .eq('listing_id', listingId)
    .not('rating', 'is', null)    // Only include items that have been rated

  if (error) {
    console.error('Error fetching reviews:', error);
    return { data: [], error };
  }

  const reviews = data.map(item => ({
    rating: item.rating,
    feedback: item.feedback,
    orderedAt: item.orders.ordered_at,
    buyer: item.orders.buyer
  }));

  return { data: reviews, error: null };
}

export const getAllProducts = async (): Promise<FilteredProductInterface[]> => {
    const listings = await getFilteredListings({});
    const products = groupListingsByProduct(listings);

    return products;
};

export default Supabase;
export async function getAllRetailers() {
    const { data, error } = await Supabase
        .from("users")
        .select("user_id, name, user_role")
        .eq("user_role", "retailer");

    if (error) {
        console.error("Error fetching retailers:", error);
        return [];
    }

    // Map user_id to seller_id so the frontend keeps working without changes
    return data.map(user => ({
        seller_id: user.user_id,
        name: user.name,
        user_role: user.user_role
    }));
}

export async function getAllWholesalers() {
    const { data, error } = await Supabase
        .from("users")
        .select("user_id, name, user_role")
        .eq("user_role", "wholesaler");

    if (error) {
        console.error("Error fetching wholesalers:", error);
        return [];
    }

    // Map user_id to seller_id
    return data.map(user => ({
        seller_id: user.user_id,
        name: user.name,
        user_role: user.user_role
    }));
}
export async function getAllCategories() {
    const { data, error } = await Supabase
        .from("categories")
        .select("category_id, category_name");

    if (error) {
        console.error("Error fetching categories:", error);
        return [];
    }
    // Standardize naming so frontend stays clean
    return data.map(cat => ({
        category_id: cat.category_id,
        category_name: cat.category_name
    }));
}
