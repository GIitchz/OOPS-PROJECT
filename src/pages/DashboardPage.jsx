import React from 'react';
import { FAKE_PRODUCTS } from '../fakeData'; // import fake data
import ProductCard from '../components/ProductCard'; // import component
import './Dashboard.css';

function DashboardPage() {
    return (
        <div className="dashboard-container">
            <h1 className="dashboard-title">Our Products</h1>
            <div className="product-list">
                {/* map over the array of fake products.
          For each 'product' in the array, render a ProductCard
          and pass that 'product' object down as a prop.
        */}
                {FAKE_PRODUCTS.map((product) => (
                    <ProductCard key={product.id} product={product} />
                ))}
            </div>
        </div>
    );
}

export default DashboardPage;