import React from 'react';
import './ProductCard.css';
import { useCart } from '../context/CartContext';
import { Link } from 'react-router-dom';

// receives a single 'product' object as a "prop"
function ProductCard({ product }) {

    const { name, price, stock_status, image_url, availability_date } = product;

    // decide the stock status text and class based on the data
    const isInStock = stock_status >0;

    // get addToCart from global context
    const { addToCart } = useCart();

    // runs when button clicked
    const handleAddToCart = (e) => {
        e.preventDefault();
        addToCart(product);
    };

    return (
    <Link to={`/product/${product.id}`} className="product-card-link">
        <div className="product-card">
            <img src={image_url} alt={name} className="product-card-image" />
            <div className="product-card-body">
                <h3 className="product-card-title">{name}</h3>
                <p className="product-card-price">${price.toFixed(2)}</p>

                {isInStock ? (
                    <p className="product-card-stock in-stock">In Stock</p>
                ) : (
                    <p className="product-card-stock out-of-stock">
                        Out of Stock (Available: {availability_date})
                    </p>
                )}

                <button
                    className="add-to-cart-btn"
                    disabled={!isInStock}
                    onClick={handleAddToCart}
                >
                    {isInStock ? 'Add to Cart' : 'Notify Me'}
                </button>
            </div>
        </div>
    </Link>
)
}

export default ProductCard;