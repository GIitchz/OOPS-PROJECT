import { User } from "@supabase/supabase-js";
import Supabase from "./Database";
import { CartItemInterface, ListingInterface, UserInterface } from "./Interfaces";

export async function upsertCart(user:UserInterface, listing:ListingInterface) {
    const { data, error } = await Supabase.rpc("upsert_cart_item", {
        p_user_id: user.id,
        p_product_listing_id: listing.product_listings_id
    });

    return { data, error };
}

// ---------------------------
// 3) Get all items in cart (for CartPage)
// ---------------------------
export async function getCartItems(user:UserInterface) {
    const { data, error } = await Supabase
        .from("cart_items1")
        .select(`
            cart_item_id,
            quantity,
            listing:product_listing_id (
                product_listings_id,
                price,
                stock,
                seller_id,
                seller:seller_id (
                    name,
                    location
                ),
                productInfo:product_id (
                    name,
                    image_url,
                    description
                )
            )
        `)
        .eq("user_id", user.id);

    if (error) {
        console.error("Error fetching cart items:", error);
        return [];
    }

    return data;
}

/* ---------------------------------------------------
   Delete cart item
----------------------------------------------------*/
export async function removeCartItem(item:CartItemInterface) {
    const { error } = await Supabase
        .from("cart_items1")
        .delete()
        .eq("cart_item_id", item.cart_item_id);

    if (error) {
        console.error("Error removing item:", error);
        return false;
    }
    return true;
}

/* ---------------------------------------------------
   5. Update quantity
----------------------------------------------------*/
export async function updateCartQuantity(item:CartItemInterface, newQty:number) {
    const { error } = await Supabase
        .from("cart_items1")
        .update({ quantity: newQty })
        .eq("cart_item_id", item.cart_item_id);

    if (error) {
        console.error("Error updating quantity:", error);
        return false;
    }
    return true;
}

/* ---------------------------------------------------
   6. Clear all items for a user
----------------------------------------------------*/
export async function clearCart(user:UserInterface) {

    const { error } = await Supabase
        .from("cart_items1")
        .delete()
        .eq("user_id", user.id);

    if (error) console.error("Error clearing cart:", error);
}