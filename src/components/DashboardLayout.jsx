import React from 'react';
import { Outlet, Link } from 'react-router-dom';
import './DashboardLayout.css';

function DashboardLayout() {
    // !!
    // get the user's role from AuthContext.
    // pretending retailer for now (will show retailer pages even in wholesaler till functionality is added)
    const userRole = 'retailer';

    return (
        <div className="dashboard-layout">
            <nav className="dashboard-sidebar">
                <h3>Admin Menu</h3>

                {userRole === 'retailer' && (
                    <>
                        <Link to="/admin/retailer">Dashboard</Link>
                        <Link to="/admin/retailer/inventory">Manage Inventory</Link>
                        <Link to="/admin/retailer/orders">Customer Orders</Link>
                        <Link to="/admin/retailer/wholesale">Wholesale Market</Link>
                    </>
                )}

                {userRole === 'wholesaler' && (
                    <>
                        <Link to="/admin/wholesaler">Dashboard</Link>
                        <Link to="/admin/wholesaler/inventory">Manage Stock</Link>
                        <Link to="/admin/wholesaler/orders">Retailer Orders</Link>
                    </>
                )}
            </nav>
            <main className="dashboard-content">
                <Outlet />
            </main>
        </div>
    );
}

export default DashboardLayout;