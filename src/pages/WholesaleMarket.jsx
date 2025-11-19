import React from 'react';
import './AdminTable.css'; // We'll reuse this styling

function WholesaleMarket() {
    return (
        <div>
            <h1>Wholesale Market</h1>
            <p>Here you can browse and order products from wholesalers.</p>

            <table className="admin-table">
                <thead>
                    <tr>
                        <th>Product</th>
                        <th>Wholesaler</th>
                        <th>Price</th>
                        <th>Actions</th>
                    </tr>
                </thead>
                <tbody>
                    <tr>
                        <td>Bulk Apples</td>
                        <td>Supplier Inc.</td>
                        <td>$50.00 / case</td>
                        <td><button>Order</button></td>
                    </tr>
                </tbody>
            </table>
        </div>
    );
}

export default WholesaleMarket;