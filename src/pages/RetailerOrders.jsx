import React from 'react';
import './AdminTable.css'; // We'll reuse this styling

function RetailerOrders() {
    return (
        <div>
            <h1>Customer Orders</h1>
            <p>Here you will see a list of orders from customers.</p>

            <table className="admin-table">
                <thead>
                    <tr>
                        <th>Order ID</th>
                        <th>Customer Name</th>
                        <th>Status</th>
                        <th>Total</th>
                    </tr>
                </thead>
                <tbody>
                    <tr>
                        <td>#2001</td>
                        <td>Test Customer</td>
                        <td>Pending</td>
                        <td>$25.99</td>
                    </tr>
                </tbody>
            </table>
        </div>
    );
}

export default RetailerOrders;