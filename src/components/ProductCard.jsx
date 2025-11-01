import React from 'react';
import './ProductCard.css';
import { useCart } from '../context/CartContext';

// receives a single 'product' object as a "prop"
function ProductCard({ product }) {

    const { name, price, stock_status, image_url, availability_date } = product;

    // decide the stock status text and class based on the data
    const isInStock = stock_status === 'In Stock';

    // get addToCart from global context
    const { addToCart } = useCart();

    // runs when button clicked
    const handleAddToCart = () => {
        addToCart(product);
    };

    return (
        <div className="product-card">
            <img src={image_url} alt={name} className="product-card-image" />
            <div className="product-card-body">
                <h3 className="product-card-title">{name}</h3>
                <p className="product-card-price">${price.toFixed(2)}</p>

                {/* show different UI based on stock */}
                {isInStock ? (
                    <p className="product-card-stock in-stock">In Stock</p>
                ) : (
                    <p className="product-card-stock out-of-stock">
                        Out of Stock (Available: {availability_date})
                    </p>
                )}

                {/* disable the button if the item is out of stock */}
                <button
                    className="add-to-cart-btn"
                    disabled={!isInStock}
                    onClick={handleAddToCart}
                >
                    {isInStock ? 'Add to Cart' : 'Notify Me'}
                </button>
            </div>
        </div>
    );
}

export default ProductCard;