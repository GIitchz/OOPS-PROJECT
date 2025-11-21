import React from "react";
import "./ProductCard.css";
import { useCart } from "../context/CartContext";
import { Link } from "react-router-dom";

function ProductCard({ product }) {
    const { name, image_url, lowest_price } = product;

    const { addToCart } = useCart();

    const handleAddToCart = (e) => {
        e.preventDefault();

        // Pass only the base product — cart system will map it later
        addToCart({
            id: product.id,
            name: product.name,
            price: lowest_price, // we add the BEST listing price
            image_url: product.image_url,
        });
    };

    return (
        <Link to={`/product/${product.id}`} className="product-card-link">
            <div className="product-card">
                <img src={image_url} alt={name} className="product-card-image" />

                <div className="product-card-body">
                    <h3 className="product-card-title">{name}</h3>

                    {lowest_price ? (
                        <p className="product-card-price">₹{lowest_price.toFixed(2)}</p>
                    ) : (
                        <p className="product-card-price unavailable">No sellers available</p>
                    )}


                </div>
            </div>
        </Link>
    );
}

export default ProductCard;
