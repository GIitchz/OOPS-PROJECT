import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import {
    getCartItems,
    updateCartQuantity,
    clearCart as clearCartDB,
    upsertCart
} from "../utils/CartDB";
import Supabase from "../utils/Database";

import { ListingInterface, CartItemInterface, UserInterface } from "../utils/Interfaces";
import { useAuth } from "./AuthContext";

// FIXED: Updated interface to match the implementation
interface CartContextInterface {
    cartItems: CartItemInterface[];
    totalPrice: number;
    addToCart: (listing: ListingInterface) => Promise<void>; // Changed from string to ListingInterface
    removeFromCart: (item: CartItemInterface) => Promise<void>;
    updateQuantity: (item: CartItemInterface, newQty: number) => Promise<void>;
    clearCart: () => Promise<void>;
    refreshCart: (user: UserInterface) => Promise<void>;
}

// FIXED: Updated default context value to match interface
const CartContext = createContext<CartContextInterface>({
    cartItems: [],
    totalPrice: 0,
    addToCart: async (listing) => { },
    removeFromCart: async (item) => { },
    updateQuantity: async (item) => { },
    clearCart: async () => { },
    refreshCart: async (user) => { }
});

export function useCart() {
    return useContext(CartContext);
}

export const CartProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const { user } = useAuth();
    const [cartItems, setCartItems] = useState<CartItemInterface[]>([]);
    const [totalPrice, setTotalPrice] = useState(0);

    // -------------------------------------------------
    // Load user + cart on startup
    // -------------------------------------------------
    useEffect(() => {
        const loadCart = async () => {
            if (!user) return;

            // FIXED: Passed 'user' instead of 'user.id' to match CartDB
            const items = await getCartItems(user);
            setCartItems(items);
        };

        loadCart();
    }, [user]);

    // -------------------------------------------------
    // Recalculate total price anytime cart changes
    // -------------------------------------------------
    useEffect(() => {
        const total = cartItems.reduce((sum, item) => {
            const listing = item.listing;
            return sum + listing.price * item.quantity;
        }, 0);

        setTotalPrice(total);
    }, [cartItems]);

    // -------------------------------------------------
    // Add item to cart (With Wholesale Logic)
    // -------------------------------------------------
    const addToCart = async (listing: ListingInterface) => {
        if (!user) {
            alert("Please sign in to add to cart.");
            return;
        }

        if (!listing?.product_listings_id) {
            console.error("addToCart called without a valid listing:", listing);
            return;
        }

        // 1. Add the item to DB
        const { data: addedItems, error } = await upsertCart(user, listing);

        if (!addedItems || error) {
            console.error("failed to add item to cart", error);
            return;
        }

        // 2. WHOLESALE CHECK: Enforce Minimum Quantity of 50
        if (listing.seller?.user_role === 'wholesaler') {
            const newItem = addedItems[0];

            if (newItem && newItem.quantity < 50) {
                // Construct a temporary object sufficient for the update function
                const itemToUpdate = {
                    ...newItem,
                    listing: listing
                } as CartItemInterface;

                await updateCartQuantity(itemToUpdate, 50);
            }
        }

        // 3. Reload cart to update UI
        const items = await getCartItems(user);
        setCartItems(items);
    };


    // -------------------------------------------------
    // Remove an item
    // -------------------------------------------------
    const removeFromCart = async (item: CartItemInterface) => {
        if (!user) return;

        const { error } = await Supabase.from("cart_items1")
            .delete()
            .eq("cart_item_id", item.cart_item_id);

        if (error) console.error(error);

        const items = await getCartItems(user);
        setCartItems(items);
    };


    // -------------------------------------------------
    // Update quantity
    // -------------------------------------------------
    const updateQuantity = async (item: CartItemInterface, newQty: number) => {
        if (!user) return;

        if (newQty < 1) {
            await removeFromCart(item);
            return;
        }

        await updateCartQuantity(item, newQty);

        const items = await getCartItems(user);
        setCartItems(items);
    };

    // -------------------------------------------------
    // Clear cart
    // -------------------------------------------------
    const clearCart = async () => {
        if (!user) return;

        await clearCartDB(user);
        setCartItems([]);
    };

    const value = {
        cartItems,
        totalPrice,
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
        refreshCart: async (user: UserInterface) => {
            const items = await getCartItems(user);
            setCartItems(items);
        }
    };

    return (
        <CartContext.Provider value={value}>
            {children}
        </CartContext.Provider>
    );
}