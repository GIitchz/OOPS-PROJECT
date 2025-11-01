import React from 'react';
import { Link } from 'react-router-dom';
import './NavBar.css';
import { useCart } from '../context/CartContext';

function Navbar() {
    const { cartItems } = useCart();
    const cartItemCount = cartItems.length;

    return (
        <nav className="navbar">
            <Link to="/" className="navbar-brand">
                Live MART
            </Link>
            <div className="navbar-links">
                <Link to="/dashboard">Products</Link>
                <Link to="/cart">
                    Cart ({cartItemCount})
                </Link>

                <Link to="/login" className="nav-login-btn">
                    Sign In
                </Link>
            </div>
        </nav>
    );
}

export default Navbar;