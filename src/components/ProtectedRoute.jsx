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
            <div style={{ padding: '50px', textAlign: 'center' }}>
                Loading authentication session...
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
