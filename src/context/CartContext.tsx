import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { getUserDetails } from "../utils/Database";
import {
    getCartItems,
    updateCartQuantity,
    clearCart as clearCartDB,
    upsertCart
} from "../utils/CartDB";
import Supabase from "../utils/Database";

import { ListingInterface, CartItemInterface, UserInterface } from "../utils/Interfaces";
import { useAuth } from "./AuthContext";

interface CartContextInterface{
    cartItems: CartItemInterface[];
    totalPrice: number;
    addToCart: (listing: ListingInterface) => Promise<void>;
    removeFromCart: (item: CartItemInterface) => Promise<void>;
    updateQuantity: (item: CartItemInterface, newQty: number) => Promise<void>;
    clearCart: () => Promise<void>;
    refreshCart: (user: UserInterface) => Promise<void>;
}
const CartContext = createContext<CartContextInterface>({
    cartItems: [],
    totalPrice: 0,
    addToCart: async (listing)=>{},
    removeFromCart: async (item)=>{},
    updateQuantity: async (item)=>{},
    clearCart: async ()=>{},
    refreshCart: async (user)=>{}
});

export function useCart() {
    return useContext(CartContext);
}

export const CartProvider:  React.FC<{ children: ReactNode }> = ({ children }) => {
    const { user } = useAuth();
    const [cartItems, setCartItems] = useState<CartItemInterface[]>([]);
    const [totalPrice, setTotalPrice] = useState(0);

    // -------------------------------------------------
    // Load user + cart on startup
    // -------------------------------------------------
    useEffect(() => {
        const loadCart = async () => {
            if(!user) return;

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
    // Add item to cart
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

    const {data:addedItem, error} = await upsertCart(user, listing);
    if (!addedItem) {
        console.error("failed to add item to cart", error);
        return;
    }

    // Reload cart
    const items = await getCartItems(user);
    setCartItems(items);
};


    // -------------------------------------------------
    // Remove an item
    // -------------------------------------------------
    const removeFromCart = async (item: CartItemInterface) => {
        const { error } = await Supabase.from("cart_items1")
            .delete()
            .eq("cart_item_id", item.cart_item_id);

        if(error) console.error(error);

        const items = await getCartItems(user!);
        setCartItems(items);
    };


    // -------------------------------------------------
    // Update quantity
    // -------------------------------------------------
    const updateQuantity = async (item: CartItemInterface, newQty: number) => {
        if (newQty < 1) {
            await removeFromCart(item);
            return;
        }

        await updateCartQuantity(item, newQty);

        const items = await getCartItems(user!);
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
        refreshCart: async (user:UserInterface) => {
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
