import React from 'react';
import './AdminTable.css';

// Maintain retailer purchase/transaction history page
function WholesalerOrders() {
    return (
        <div>
            <h1>Manage Retailer Orders</h1>
            <p>View and fulfill incoming orders from retailers.</p>

            <table className="admin-table">
                <thead>
                    <tr>
                        <th>Order ID</th>
                        <th>Retailer Name</th>
                        <th>Items</th>
                        <th>Status</th>
                        <th>Actions</th>
                    </tr>
                </thead>
                <tbody>
                    <tr>
                        <td>#1002</td>
                        <td>Local Grocers</td>
                        <td>100 x Apples</td>
                        <td>Pending</td>
                        <td><button>Fulfill Order</button></td>
                    </tr>
                    <tr>
                        <td>#1001</td>
                        <td>Main St. Market</td>
                        <td>50 x Bread Loaves</td>
                        <td>Shipped</td>
                        <td><button disabled>Fulfilled</button></td>
                    </tr>
                </tbody>
            </table>
        </div>
    );
}

export default WholesalerOrders;