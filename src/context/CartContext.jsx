import React, { createContext, useContext, useState } from 'react';

const CartContext = createContext();

export function useCart() {
    return useContext(CartContext);
}

export function CartProvider({ children }) {
    const [cartItems, setCartItems] = useState([]); // actual cart state

    // add a product to the cart
    const addToCart = (product) => {
        // check if the item is already in the cart
        const existingItem = cartItems.find((item) => item.id === product.id);

        if (existingItem) {
            // for now, just alert the user. can increase quantity later.
            alert(`${product.name} is already in the cart!`);
        } else {
            // if it's a new item, add it to the cart array
            setCartItems((prevItems) => [...prevItems, { ...product, quantity: 1 }]);
        }
    };

    const value = {
        cartItems,
        addToCart,
        // add removeFromCart, clearCart, etc. here later
    };

    return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}