import React, { createContext, useContext, useState, useEffect } from 'react';

const CartContext = createContext();

export function useCart() {
    return useContext(CartContext);
}

export function CartProvider({ children }) {
    const [cartItems, setCartItems] = useState([]);
    const [totalPrice, setTotalPrice] = useState(0);

    useEffect(() => {
        const calculateTotal = () => {
            return cartItems.reduce((total, item) => {
                return total + (item.price * item.quantity);
            }, 0);
        };
        setTotalPrice(calculateTotal());
    }, [cartItems]);

    const addToCart = (product) => {
        setCartItems((prevItems) => {

            const existingItem = prevItems.find((item) => item.id === product.id);

            if (existingItem) {
                return prevItems.map((item) =>
                    item.id === product.id
                        ? { ...item, quantity: item.quantity + 1 }
                        : item
                );
            } else {
                return [...prevItems, { ...product, quantity: 1 }];
            }
        });
    };

    const removeFromCart = (productId) => {
        setCartItems((prevItems) => {
            return prevItems.filter((item) => item.id !== productId);
        });
    };

    const updateQuantity = (productId, newQuantity) => {
        const quantity = parseInt(newQuantity, 10);

        if (quantity < 1) {
            removeFromCart(productId);
            return;
        }

        setCartItems((prevItems) => {
            return prevItems.map((item) =>
                item.id === productId ? { ...item, quantity: quantity } : item
            );
        });
    };

    const clearCart = () => {
        setCartItems([]);
    };

    const value = {
        cartItems,
        totalPrice,
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
    };

    return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}