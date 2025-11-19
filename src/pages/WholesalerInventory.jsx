import React from 'react';
import './AdminTable.css';

function WholesalerInventory() {
    return (
        <div>
            <h1>Manage Wholesale Stock</h1>
            <p>Here you can set the products, pricing, and stock available to retailers.</p>

            <button style={{ marginBottom: '1rem' }}>Add New Product</button>

            <table className="admin-table">
                <thead>
                    <tr>
                        <th>Product Name</th>
                        <th>Wholesale Price</th>
                        <th>Current Stock</th>
                        <th>Actions</th>
                    </tr>
                </thead>
                <tbody>
                    <tr>
                        <td>Bulk Organic Apples (Case)</td>
                        <td>$50.00</td>
                        <td>200</td>
                        <td>
                            <button>Edit</button>
                            <button>Delete</button>
                        </td>
                    </tr>
                    <tr>
                        <td>Sourdough Loaves (Batch)</td>
                        <td>$40.00</td>
                        <td>150</td>
                        <td>
                            <button>Edit</button>
                            <button>Delete</button>
                        </td>
                    </tr>
                </tbody>
            </table>
        </div>
    );
}

export default WholesalerInventory;