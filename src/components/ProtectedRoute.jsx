import React, { useEffect, useRef } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const ROLE_LANDING_PATHS = {
    customer: '/dashboard',
    retailer: '/admin/retailer',
    wholesaler: '/admin/wholesaler',
};

function ProtectedRoute({ children, allowedRoles }) {
    const { user, loading } = useAuth();
    const location = useLocation();


    const alertedRef = useRef(false);

    useEffect(() => {
        if (loading) return;

        if (!user && !alertedRef.current) {
            alertedRef.current = true;
            alert("Please sign in to access this page.");
        }

        if (user && allowedRoles && !allowedRoles.includes(user.role) && !alertedRef.current) {
            alertedRef.current = true;
            alert(`Access Denied for role ${user.role}. Redirecting.`);
        }
    }, [loading, user, allowedRoles]);

    // Original logic unchanged below:

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50 text-emerald-500 font-extrabold text-lg">
            <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-emerald-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            Loading products...
        </div>
        );
    }

    if (!user) {
        return <Navigate to="/login" state={{ from: location }} replace />;
    }

    if (allowedRoles && !allowedRoles.includes(user.role)) {
        const redirectPath = ROLE_LANDING_PATHS[user.role] || '/';
        return <Navigate to={redirectPath} replace />;
    }

    return children;
}

export default ProtectedRoute;
