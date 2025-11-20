import React, { useState, useEffect } from 'react';
import { getAllProducts } from '../utils/Database';
import ProductCard from '../components/ProductCard';
import './Dashboard.css';

function WholesaleMarket() {

    // change to get wholesale products from database
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchProducts = async () => {
            const productData = await getAllProducts();
            setProducts(productData);
            setLoading(false);
        };

        fetchProducts();
    }, []);

    if (loading) {
        return (
            <div className="dashboard-container">
                <h1 className="dashboard-title">Loading Wholesale Products...</h1>
            </div>
        );
    }

    return (
        <div className="dashboard-container">
            <h1 className="dashboard-title">Wholesale Market</h1>
            <p style={{ textAlign: 'center', marginBottom: '2rem' }}>
                Browse and order products from our network of wholesalers.
            </p>

            <div className="product-list">
                {products.length === 0 ? (
                    <p>No wholesale products available right now.</p>
                ) : (
                    products.map((product) => (
                        // We reuse the same ProductCard
                        <ProductCard key={product.id} product={product} />
                    ))
                )}
            </div>
        </div>
    );
}

export default WholesaleMarket;