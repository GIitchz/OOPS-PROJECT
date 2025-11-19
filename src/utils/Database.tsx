import { createClient } from "@supabase/supabase-js";
import { UserInterface, UserDataInterface } from "./Interfaces";

const SUPABASE_URL = "https://hopvgsttpmoofwlxhkbx.supabase.co";
const SUPABASE_KEY = "sb_publishable_1TvVZv76Cmle6-R_J8b08g_55S7cK5C";

const Supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

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

export const getProductById = async (productId: string) => {
    const { data, error } = await Supabase
        .from('products')
        .select(`
            id: product_id,
            name,
            description,
            price: wholesaler_price,
            stock_status: wholesaler_stock,
            availability_date,
            image_url 
        `)
        .eq('product_id', productId)
        .single();

    if (error) {
        console.error('Error fetching product:', error);
        return null;
    }

    return data;
};

export const getAllProducts = async () => {
    const { data, error } = await Supabase
        .from('products')
        .select(`
        id: product_id,
        name,
        price: wholesaler_price,
        stock_status: wholesaler_stock,
        image_url,
        availability_date
    `);

    if (error) {
        console.error('Error fetching all products:', error);
        return [];
    }
    return data;
};

export default Supabase;