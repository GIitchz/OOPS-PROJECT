import React, { useState, useEffect } from 'react';
import { getAllProducts } from '../utils/Database';
import ProductCard from '../components/ProductCard';
import { Search } from 'lucide-react';
import { FilteredProductInterface } from '../utils/Interfaces';

function WholesaleMarket() {
    const [products, setProducts] = useState<FilteredProductInterface[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");

    useEffect(() => {
        const fetchProducts = async () => {
            const productData = await getAllProducts();
            if (productData) setProducts(productData);
            setLoading(false);
        };
        fetchProducts();
    }, []);

    // Live Filter Logic
    const filteredProducts = products.filter(product =>
        product.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="space-y-8">

            {/* Header with Search */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-extrabold text-slate-900">Wholesale Market</h1>
                    <p className="text-slate-500 mt-2">Restock your inventory directly from top suppliers.</p>
                </div>

                <div className="relative w-full md:w-80">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                        <Search className="h-5 w-5 text-rose-400" />
                    </div>
                    <input
                        type="text"
                        className="block w-full pl-11 pr-4 py-3 bg-white border border-rose-100 rounded-2xl text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-rose-500 focus:border-transparent shadow-sm transition-all"
                        placeholder="Search wholesale items..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
            </div>

            {loading ? (
                <div className="text-center py-20 text-rose-400 font-medium animate-pulse">Loading market data...</div>
            ) : (
                <>
                    {filteredProducts.length === 0 ? (
                        <div className="text-center py-20 bg-white rounded-[2rem] border border-rose-100">
                            <p className="text-slate-500 text-lg">No items found matching "{searchTerm}".</p>
                            <button
                                onClick={() => setSearchTerm('')}
                                className="mt-4 text-rose-600 font-bold hover:underline"
                            >
                                Clear Search
                            </button>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                            {filteredProducts.map((product) => (
                                <div key={product.id || product.id} className="h-full">
                                    <ProductCard product={product} displayDist={false}/>
                                </div>
                            ))}
                        </div>
                    )}
                </>
            )}
        </div>
    );
}

export default WholesaleMarket;