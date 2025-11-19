import React from 'react';
import './AdminTable.css';
// Manage Inventory page

function RetailerInventory() {
    return (
        <div>
            <h1>Manage My Inventory</h1>
            <p>Here you can add, edit, and update stock for your products.</p>

            <button style={{ marginBottom: '1rem' }}>Add New Product</button>

            <table className="admin-table">
                <thead>
                    <tr>
                        <th>Product Name</th>
                        <th>Price</th>
                        <th>Stock</th>
                        <th>Actions</th>
                    </tr>
                </thead>
                <tbody>
                    <tr>
                        <td>My Organic Apples</td>
                        <td>$4.99</td>
                        <td>50</td>
                        <td>
                            <button>Edit</button>
                            <button>Delete</button>
                        </td>
                    </tr>
                    <tr>
                        <td>My Local Bread</td>
                        <td>$6.50</td>
                        <td>20</td>
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

export default RetailerInventory;