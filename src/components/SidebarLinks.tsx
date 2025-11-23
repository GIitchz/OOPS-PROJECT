// src/components/ProfileSidebar.jsx
import { NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { MapPin, ShoppingCart, ClipboardList, Settings, LogOut } from 'lucide-react';

// Define common icon classes for consistency
const IconClass = "w-5 h-5 transition-colors";

function RetailerProfileSidebar() {
  const { logout } = useAuth();

  // Unified class for the NavLink wrapper
  const linkBaseClass = "flex items-center gap-3 p-3 rounded-xl transition-all duration-200 font-medium";

  // Function to determine link classes based on active state
  const getLinkClasses = ({ isActive, isLogout = false }) => {
    let classes = `${linkBaseClass} text-slate-600 hover:bg-emerald-50 hover:text-emerald-700`;

    if (isLogout) {
      // Special styling for the Logout link
      classes = `${linkBaseClass} text-red-500 hover:bg-red-50 hover:text-red-700`;
    }

    if (isActive && !isLogout) {
      // Active state for non-logout links
      classes = `${linkBaseClass} text-white bg-emerald-600 shadow-md shadow-emerald-200`;
    } else if (isActive && isLogout) {
        // Active state for logout (if somehow clicked and stayed)
        classes = `${linkBaseClass} text-white bg-red-600 shadow-md shadow-red-200`;
    }
    
    return classes;
  };

  return (
    // ✨ VIBRANCY CHANGE 1: Elevated card styling for the sidebar container
    <aside className="bg-white p-6 rounded-3xl shadow-xl shadow-emerald-100/70 border border-slate-100">
      
      {/* ✨ VIBRANCY CHANGE 2: Stronger header styling */}
      <h2 className="text-2xl font-extrabold text-slate-900 mb-6">Navigation</h2>

      <nav>
        <ul className="space-y-2">
          
          {/* Addresses */}
          <li>
            <NavLink
              to="/profile/addresses"
              className={(state) => getLinkClasses(state)}
            >
              {/* Conditional icon coloring based on active state */}
              <MapPin size={20} className={IconClass} />
              Addresses
            </NavLink>
          </li>
          
          {/* Orders */}
          <li>
            <NavLink
              to="/profile/orders"
              className={(state) => getLinkClasses(state)}
            >
              <ClipboardList size={20} className={IconClass} />
              Orders
            </NavLink>
          </li>
          
          {/* Cart */}
          <li>
            <NavLink
              to="/cart"
              className={(state) => getLinkClasses(state)}
            >
              <ShoppingCart size={20} className={IconClass} />
              Cart
            </NavLink>
          </li>
          
          {/* Profile Settings */}
          <li>
            <NavLink
              to="/profile/settings"
              className={(state) => getLinkClasses(state)}
            >
              <Settings size={20} className={IconClass} />
              Profile Settings
            </NavLink>
          </li>
          
          {/* Logout - Uses distinct red styling */}
          <li>
            <NavLink
              to="/"
              className={(state) => getLinkClasses({...state, isLogout: true})}
              onClick={logout}
            >
              <LogOut size={20} className={IconClass} />
              Logout
            </NavLink>
          </li>
          
        </ul>
      </nav>
    </aside>
  );
}

export default RetailerProfileSidebar;