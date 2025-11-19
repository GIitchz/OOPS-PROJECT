import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { getProductById } from "../utils/Database";
import { useCart } from "../context/CartContext";
import "./ProductDetail.css";

function ProductDetailPage() {
    const { productId } = useParams();
    const [product, setProduct] = useState(null);
    const { addToCart } = useCart();
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const loadProduct = async () => {
            const data = await getProductById(productId);
            setProduct(data);
            setLoading(false);
        };
        loadProduct();
    }, [productId]);

    if (loading) return <div className="loading">Loading...</div>;
    if (!product) return <div className="not-found">Product not found.</div>;

    const isInStock = product.stock_status>0;

    return (
        <div className="pd-container">

            {/* LEFT — Image */}
            <div className="pd-images">
                <img
                    src={product.image_url}
                    alt={product.name}
                    className="pd-main-image"
                />
            </div>

            {/* CENTER — Product Details */}
            <div className="pd-details">
                <h1 className="pd-title">{product.name}</h1>

                <p className="pd-price">₹{product.price}</p>

                <p className={`pd-stock ${isInStock ? "in" : "out"}`}>
                    {isInStock
                        ? "In Stock"
                        : `Out of Stock (Available: ${product.availability_date})`}
                </p>

                <p className="pd-description">{product.description}</p>
            </div>

            {/* RIGHT — Buy Box */}
            <div className="pd-buybox">
                <div className="pd-buy-box-inner">
                    <p className="pd-price-buybox">₹{product.price}</p>

                    <button
                        className="pd-btn add"
                        disabled={!isInStock}
                        onClick={() => addToCart(product)}
                    >
                        Add to Cart
                    </button>

                    <button
                        className="pd-btn buy-now"
                        disabled={!isInStock}
                        onClick={() => alert("Proceeding to buy...")}
                    >
                        Buy Now
                    </button>

                    <p className={`pd-stock-buybox ${isInStock ? "in" : "out"}`}>
                        {isInStock ? "In Stock" : "Unavailable"}
                    </p>
                </div>
            </div>

        </div>
    );
}

export default ProductDetailPage;
