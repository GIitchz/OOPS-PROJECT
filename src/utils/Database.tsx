import { createClient } from "@supabase/supabase-js";
import { Database } from "./DatabaseInterfaces";
import { UserInterface, UserDataInterface } from "./Interfaces";

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

export const getProductById = async (productId: string) => {
    const { data, error } = await Supabase
        .from("products")
        .select(`
            id: product_id,
            name,
            description,
            image_url,
            listings: product_listings (
                product_listings_id,
                price,
                stock,
                seller_id,
                seller: retailers (
                    user_id,
                    name,
                    location
                )
            )
        `)
        .eq("product_id", productId)
        .single();

    if (error) {
        console.error("Error fetching product:", error);
        return null;
    }

    // Compute lowest price
    const lowestPrice =
        data.listings?.length > 0
            ? Math.min(...data.listings.map((l: any) => l.price))
            : null;

    return {
        ...data,
        listings: data.listings.map((i)=>({...i, productInfo: {name:data.name, image_url:data.image_url, description:data.description}})),
        lowest_price: lowestPrice,
    };
};


    export const getAllProducts = async () => {
    const { data, error } = await Supabase
        .from("products")
        .select(`
            id: product_id,
            name,
            description,
            image_url,
            listings: product_listings (
                product_listings_id,
                seller_id,
                price,
                stock
            )
        `);

    if (error || !data) {
        console.error("Error fetching all products:", error);
        return [];
    }

    // Compute lowest price for each product
    return data.map(product => {
        const lowestPrice = product.listings?.length
            ? Math.min(...product.listings.map(l => l.price))
            : null;

        return {
            ...product,
            lowest_price: lowestPrice,
        };
    });
};

export default Supabase;
export async function getAllRetailers() {
    const { data, error } = await Supabase
        .from("sellers")     // <-- replace with correct table name if different
        .select("seller_id, name, user_role")
        .eq("user_role", "retailer");

    if (error) {
        console.error("Error fetching retailers:", error);
        return [];
    }

    return data;
}
