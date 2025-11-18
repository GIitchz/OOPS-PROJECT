import React from 'react';
import { Link } from 'react-router-dom';
import './NavBar.css';
import { useCart } from '../context/CartContext';

function Navbar() {
    const { cartItems } = useCart();
    const cartItemCount = cartItems.reduce((total, item) => {
        return total + item.quantity;
    }, 0);

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

                {/* --- TEST LINKS (REMOVE LATER) --- */}
                <Link to="/admin/retailer" style={{ color: 'red' }}>
                    Retailer Admin
                </Link>
                <Link to="/admin/wholesaler" style={{ color: 'blue' }}>
                    Wholesaler Admin
                </Link>
                {/* --- END OF TEST LINKS --- */}

                <Link to="/login" className="nav-login-btn">
                    Sign In
                </Link>
            </div>
        </nav>
    );
}

export default Navbar;