import React, { useState, useEffect } from 'react';
import { getAllProducts } from '../utils/Database';
import ProductCard from '../components/ProductCard';
import './Dashboard.css';

function DashboardPage() {
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchProducts = async () => {
            const productData = await getAllProducts();
            console.log("Products fetched:", productData);
            setProducts(productData);
            setLoading(false);
        };

        fetchProducts();
    }, []);

    if (loading) {
        return (
            <div className="dashboard-container">
                <h1 className="dashboard-title">Loading Products...</h1>
            </div>
        );
    }

    return (
        <div className="dashboard-container">
            <h1 className="dashboard-title">Our Products</h1>
            <div className="product-list">
                {products.map((product) => (
                    <ProductCard key={product.id} product={product} />
                ))}
            </div>
        </div>
    );
}

export default DashboardPage;