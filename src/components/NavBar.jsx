import { useEffect, useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import  Supabase from '../utils/Database';
import { useCart } from '../context/CartContext';
import React from 'react';
import { Link } from 'react-router-dom';
import './NavBar.css'; 
import { AuthContext } from '../context/AuthContext';

function Navbar() {
  const { user } = useContext(AuthContext);

  const { cartItems } = useCart();
  const cartItemCount = cartItems.reduce((total, item) => {
      return total + item.quantity;
  }, 0);

  return ( 
    <nav className="navbar">
    <Link to="/" className="navbar-brand"> Live MART </Link>
     <div className="navbar-links">
     <Link to="/dashboard">Products</Link> 
     <Link to="/cart"> Cart ({cartItemCount}) </Link> 
      {/* --- TEST LINKS (REMOVE LATER) --- */}
      <Link to="/admin/retailer" style={{ color: 'red' }}>
          Retailer Admin
      </Link>
      <Link to="/admin/wholesaler" style={{ color: 'blue' }}>
          Wholesaler Admin
      </Link>
      {/* --- END OF TEST LINKS --- */}

      <Link to={(user)?"/profile":"/login"} className="nav-login-btn">
          {(user)?"Profile":"Log In"}
      </Link>
     </div> 
     </nav>
    );



//   return (
//     <nav className="navbar">
//       <button onClick={handleAuthClick}>
//         {user ? 'Profile' : 'Sign In'}
//       </button>
//     </nav>
//   );
}

export default Navbar;
