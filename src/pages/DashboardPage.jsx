import React, { useState, useEffect } from "react";
import { getAllProducts, getAllRetailers } from "../utils/Database";
import ProductCard from "../components/ProductCard";
import "./Dashboard.css";
import PriceSlider from "../components/priceslider";


function DashboardPage() {
    const [products, setProducts] = useState([]);
    const [filtered, setFiltered] = useState([]);
    const [retailers, setRetailers] = useState([]);

    const [loading, setLoading] = useState(true);

    // -------- FILTER STATES --------
    const [minPrice, setMinPrice] = useState(0);
    const [maxPrice, setMaxPrice] = useState(0);

    const [selectedRetailers, setSelectedRetailers] = useState([]);
    const [maxDistance, setMaxDistance] = useState("");
    const [sortType, setSortType] = useState("");
    const [priceBounds, setPriceBounds] = useState({ min: 0, max: 5000 });


    function extractPrice(product) {
        if (!product.listings || product.listings.length === 0) return 0;
        return Math.min(...product.listings.map(l => l.price || 0));
    }
    function productMinListingDistance(product) {
        const dist = (product.listings || []).map(l => Number(l.distance_from_user ?? Infinity)).filter(d => !Number.isNaN(d));
        if (dist.length === 0) return Infinity;
        return Math.min(...dist);
    }

    useEffect(() => {
        const fetchData = async () => {
            const productData = await getAllProducts();
            const retailerData = await getAllRetailers(); // Helper needed

            const retailerIds = new Set(retailerData.map(r => r.user_id));

            // For each product, keep only listings that belong to retailers
            const productsWithRetailListings = (productData || []).map(p => {
                const listings = (p.listings || []).filter(l => retailerIds.has(l.seller_id));
                return {
                    ...p,
                    listings
                };
            })
            // drop products that have zero retailer listings
            .filter(p => (p.listings || []).length > 0);

            const allListingPrices = [];
            for (const p of productsWithRetailListings) {
                for (const l of p.listings) {
                    const price = Number(l.price ?? 0);
                    if (!Number.isNaN(price)) allListingPrices.push(price);
                }
            }

            const minP = allListingPrices.length ? Math.min(...allListingPrices) : 0;
            const maxP = allListingPrices.length ? Math.max(...allListingPrices) : 0;

            setProducts(productData);
            setFiltered(productData);
            setRetailers(retailerData);

            setPriceBounds({ min: minP, max: maxP });
            setMinPrice(minP);
            setMaxPrice(maxP);


            setLoading(false);
        };

        fetchData();
    }, []);

    // -------- HANDLE RETAILER CHECKBOX --------
    const toggleRetailer = (id) => {
        setSelectedRetailers(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
    };


    // -------- APPLY FILTER FUNCTION --------
    const applyFilters = () => {
    const minP = Number(minPrice);
    const maxP = Number(maxPrice);
    const distanceLimit = maxDistance ? Number(maxDistance) : null;

    // product passes if ANY of its retailer listings match all filters
    const f = products.filter(product => {
        const validListings = (product.listings || []).filter(listing => {
            const price = Number(listing.price ?? 0);
            const seller = listing.seller_id;

            // ---- PRICE FILTER ----
            if (price < minP || price > maxP) return false;

            // ---- RETAILER FILTER ----
            if (selectedRetailers.length > 0 && !selectedRetailers.includes(seller)) {
                return false;
            }

            // ---- DISTANCE FILTER ----
            if (distanceLimit !== null) {
                const d = Number(listing.distance_from_user ?? Infinity);
                if (d > distanceLimit) return false;
            }

            return true;
        });

        // include product only if at least one listing is valid
        return validListings.length > 0;
    });

    // ---- SORTING ----
    if (sortType === "price_asc") {
        f.sort((a, b) => extractPrice(a) - extractPrice(b));
    } 
    else if (sortType === "price_desc") {
        f.sort((a, b) => extractPrice(b) - extractPrice(a));
    } 
    else if (sortType === "distance") {
        // sort by min listing distance
        const dist = p =>
            Math.min(
                ...(p.listings || []).map(l => Number(l.distance_from_user ?? Infinity))
            );
        f.sort((a, b) => dist(a) - dist(b));
    }

    setFiltered(f);
};


    if (loading) {
        return (
            <div className="dashboard-container">
                <h1 className="dashboard-title">Loading Products...</h1>
            </div>
        );
    }

    return (
        <div className="dashboard-wrapper">
            
            {/* ---------------------- FILTER SIDEBAR ---------------------- */}
            <aside className="filter-panel">
                <h2>Filters</h2>

                {/* PRICE FILTER */}
                    <h3>Price Range</h3>
                    {minPrice !== "" && maxPrice !== "" && (
                        <PriceSlider
                            min={priceBounds.min}
                            max={priceBounds.max}
                            value={[minPrice, maxPrice]}
                            onChange={(vals) => {
                                setMinPrice(vals[0]);
                                setMaxPrice(vals[1]);
                            }}
                        />
                    )}
                {/* RETAILER FILTER */}
                <div className="filter-block">
                    <h3>Retailers</h3>
                    {retailers.map((r) => (
                        <label key={r.seller_id} className="checkbox">
                            <input
                                type="checkbox"
                                checked={selectedRetailers.includes(r.seller_id)}
                                onChange={() => toggleRetailer(r.seller_id)}
                            />
                            {r.name}
                        </label>
                    ))}
                </div>

                {/* DISTANCE FILTER */}
                <div className="filter-block">
                    <h3>Distance (km)</h3>
                    <input
                        type="number"
                        placeholder="Max distance"
                        value={maxDistance}
                        onChange={(e) => setMaxDistance(e.target.value)}
                    />
                </div>

                {/* SORTING */}
                <div className="filter-block">
                    <h3>Sort By</h3>
                    <select value={sortType} onChange={(e) => setSortType(e.target.value)}>
                        <option value="">None</option>
                        <option value="price_asc">Price: Low → High</option>
                        <option value="price_desc">Price: High → Low</option>
                        <option value="distance">Distance: Near → Far</option>
                    </select>
                </div>

                <button className="apply-btn" onClick={applyFilters}>
                    Apply Filters
                </button>
            </aside>

            {/* ---------------------- PRODUCT GRID ---------------------- */}
            <div className="dashboard-container">
                <h1 className="dashboard-title">Our Products</h1>

                <div className="product-list">
                    {filtered.map((product) => (
                        <ProductCard key={product.id} product={product} />
                    ))}
                </div>
            </div>
        </div>
    );
}

export default DashboardPage;
