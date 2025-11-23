import React, { useState, useEffect } from 'react';
import { Plus, Trash2, Search, X, Image as ImageIcon, Package, DollarSign, Check, Edit2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import {
    getRetailerListings, // Works for any seller ID
    searchMasterProducts,
    createListingForExisting,
    createNewProductAndListing,
    deleteListing,
    updateListing,
    searchCategories,
    createCategory,
    addCategoryToProduct,
} from '../utils/InventoryDB';

function WholesalerInventory() {
    const { user } = useAuth();
    const [listings, setListings] = useState([]);
    const [loading, setLoading] = useState(true);

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [activeTab, setActiveTab] = useState('search');
    const [editingId, setEditingId] = useState(null);


    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState([]);
    const [selectedProduct, setSelectedProduct] = useState(null);
    // Categories (for create-new workflow)
    const [categorySearch, setCategorySearch] = useState("");
    const [categoryResults, setCategoryResults] = useState([]);
    const [selectedCategories, setSelectedCategories] = useState([]);


    const [formData, setFormData] = useState({
        price: '',
        stock: '',
        name: '',
        description: '',
        image_url: ''
    });

    const loadListings = async () => {
        if (!user) return;
        const data = await getRetailerListings(user.id);
        setListings(data);
        setLoading(false);
    };

    useEffect(() => {
        loadListings();
    }, [user]);

    // --- Handlers ---

    const handleSearch = async (e) => {
        const query = e.target.value;
        setSearchQuery(query);
        if (query.length > 2) {
            const results = await searchMasterProducts(query);
            setSearchResults(results);
        } else {
            setSearchResults([]);
        }
    };

    const handleResultClick = (prod, e) => {
        e.preventDefault();
        e.stopPropagation();
        setSelectedProduct(prod);
        setSearchResults([]);
        setSearchQuery(prod.name);
    };

    const handleEdit = (item) => {
        setEditingId(item.product_listings_id);
        setSelectedProduct(item.product);
        setFormData({
            price: item.price,
            stock: item.stock,
            name: '', description: '', image_url: ''
        });
        setIsModalOpen(true);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!user) return;

        let error = null;

        if (editingId) {
            const res = await updateListing(editingId, { price: formData.price, stock: formData.stock });
            error = res.error;
        }
        else if (activeTab === 'search') {
            if (!selectedProduct) return alert("Please select a product first");
            const res = await createListingForExisting(user.id, selectedProduct.product_id, formData.price, formData.stock);
            error = res.error;
        }
        else {
            const res = await createNewProductAndListing(user.id,
                { name: formData.name, description: formData.description, image_url: formData.image_url, categories: selectedCategories },
                formData.price, formData.stock
            );
            error = res.error;
        }

        if (error) {
            console.error(error);
            alert("Operation failed. See console.");
        } else {
            closeModal();
            loadListings();
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm("Are you sure you want to remove this bulk item?")) return;
        const { error, count } = await deleteListing(id);
        if (error) {
            if (error.code === '23503') alert("Cannot delete item: It exists in retailer orders.");
            else alert(`Error: ${error.message}`);
        } else if (count === 0) {
            alert("Delete failed. Permission denied.");
        } else {
            loadListings();
        }
    };

    const closeModal = () => {
        setIsModalOpen(false);
        setFormData({ price: '', stock: '', name: '', description: '', image_url: '' });
        setSearchQuery('');
        setSearchResults([]);
        setSelectedProduct(null);
        setActiveTab('search');
        setEditingId(null);
    };

    return (
        <div className="space-y-6 relative">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-extrabold text-slate-900">Bulk Inventory</h1>
                    <p className="text-slate-500">Manage stock available for retailers.</p>
                </div>
                <button
                    onClick={() => setIsModalOpen(true)}
                    className="inline-flex items-center gap-2 bg-green-600 text-white px-6 py-2.5 rounded-xl font-bold hover:bg-green-700 shadow-lg shadow-green-200 transition-all hover:-translate-y-0.5"
                >
                    <Plus size={18} />
                    Add Bulk Item
                </button>
            </div>

            <div className="bg-white border border-green-100 rounded-[2rem] shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                        <thead className="bg-green-50 text-slate-700 font-bold uppercase tracking-wider">
                            <tr>
                                <th className="px-8 py-5">Product</th>
                                <th className="px-6 py-5">Unit Price</th>
                                <th className="px-6 py-5">Stock Level</th>
                                <th className="px-8 py-5 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {loading ? (
                                <tr><td colSpan="4" className="px-8 py-10 text-center text-slate-400">Loading inventory...</td></tr>
                            ) : listings.length === 0 ? (
                                <tr><td colSpan="4" className="px-8 py-10 text-center text-slate-400">No bulk items listed yet.</td></tr>
                            ) : (
                                listings.map((item) => (
                                    <tr key={item.product_listings_id} className="hover:bg-green-50/30 transition-colors">
                                        <td className="px-8 py-5">
                                            <div className="flex items-center gap-3">
                                                <img src={item.product?.image_url || 'https://via.placeholder.com/40'} className="w-10 h-10 rounded-lg object-cover border border-slate-100" alt="" />
                                                <div>
                                                    <p className="font-bold text-slate-900">{item.product?.name}</p>
                                                    <p className="text-xs text-slate-400 line-clamp-1">{item.product?.description}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-5 text-green-600 font-bold">₹{item.price}</td>
                                        <td className="px-6 py-5">
                                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold ${item.stock < 50 ? 'bg-orange-100 text-orange-700' : 'bg-green-100 text-green-700'}`}>
                                                {item.stock} units
                                            </span>
                                        </td>
                                        <td className="px-8 py-5 text-right space-x-2">
                                            <button onClick={() => handleEdit(item)} className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"><Edit2 size={18} /></button>
                                            <button onClick={() => handleDelete(item.product_listings_id)} className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"><Trash2 size={18} /></button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Modal Code - Reused exactly from Retailer */}
            {isModalOpen && (
                <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-white w-full max-w-lg rounded-[2rem] shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
                        <div className="px-8 py-6 border-b border-slate-100 flex justify-between items-center bg-green-50/50">
                            <h2 className="text-xl font-extrabold text-slate-900">{editingId ? "Edit Bulk Item" : "Add Bulk Item"}</h2>
                            <button onClick={closeModal} className="text-slate-400 hover:text-slate-600"><X size={24} /></button>
                        </div>

                        {!editingId && (
                            <div className="flex p-2 mx-6 mt-4 bg-slate-100 rounded-xl">
                                <button type="button" onClick={() => setActiveTab('search')} className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all ${activeTab === 'search' ? 'bg-white text-green-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>Search Existing</button>
                                <button type="button" onClick={() => setActiveTab('create')} className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all ${activeTab === 'create' ? 'bg-white text-green-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>Create New</button>
                            </div>
                        )}

                        <form onSubmit={handleSubmit} className="p-8 overflow-y-auto custom-scrollbar">
                            {!editingId && activeTab === 'search' && (
                                <div className="space-y-6">
                                    <div>
                                        <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-2">Find Product</label>
                                        <div className="relative">
                                            <Search className="absolute left-3 top-3.5 text-slate-400" size={18} />
                                            <input type="text" placeholder="Search catalog..." className="w-full pl-10 pr-4 py-3 bg-green-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-green-500 outline-none" value={searchQuery} onChange={handleSearch} onKeyDown={e => e.key === 'Enter' && e.preventDefault()} />
                                        </div>
                                        {searchResults.length > 0 && !selectedProduct && (
                                            <div className="mt-2 bg-white border border-slate-100 rounded-xl shadow-lg max-h-40 overflow-y-auto">
                                                {searchResults.map(prod => (
                                                    <div key={prod.product_id} onClick={(e) => handleResultClick(prod, e)} className="p-3 hover:bg-green-50 cursor-pointer flex items-center gap-3 border-b border-slate-50 last:border-0">
                                                        <img src={prod.image_url} className="w-8 h-8 rounded bg-slate-200" alt="" />
                                                        <span className="text-sm font-bold text-slate-700">{prod.name}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                        {selectedProduct && (
                                            <div className="mt-4 p-4 bg-green-50 border border-green-100 rounded-xl flex items-center justify-between">
                                                <div className="flex items-center gap-3">
                                                    <img src={selectedProduct.image_url} className="w-12 h-12 rounded-lg bg-white" alt="" />
                                                    <p className="font-bold text-slate-900">{selectedProduct.name}</p>
                                                </div>
                                                {!editingId && <button type="button" onClick={() => { setSelectedProduct(null); setSearchQuery(''); }} className="text-xs text-green-600 font-bold hover:underline">Change</button>}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}

                            {!editingId && activeTab === 'create' && (
                                <div className="space-y-4">
                                    <input required className="w-full px-4 py-3 bg-green-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-green-500 outline-none"
                                        placeholder="Product Name"
                                        value={formData.name}
                                        onChange={e => setFormData({ ...formData, name: e.target.value })}
                                    />

                                    <textarea className="w-full px-4 py-3 bg-green-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-green-500 outline-none"
                                        placeholder="Description"
                                        rows="2"
                                        value={formData.description}
                                        onChange={e => setFormData({ ...formData, description: e.target.value })}
                                    />

                                    <input className="w-full px-4 py-3 bg-green-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-green-500 outline-none"
                                        placeholder="Image URL"
                                        value={formData.image_url}
                                        onChange={e => setFormData({ ...formData, image_url: e.target.value })}
                                    />

                                    {/* CATEGORY SELECTOR */}
                                    <div>
                                        <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-2">
                                            Categories
                                        </label>

                                        {/* Category Search Input */}
                                        <input
                                            type="text"
                                            className="w-full px-4 py-3 bg-green-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-green-500 outline-none"
                                            placeholder="Search or create (e.g. Snacks)..."
                                            value={categorySearch}
                                            onChange={async (e) => {
                                                const value = e.target.value;
                                                setCategorySearch(value);

                                                if (value.length >= 1) {
                                                    const results = await searchCategories(value); // PREFIX SEARCH
                                                    setCategoryResults(results);
                                                } else {
                                                    setCategoryResults([]);
                                                }
                                            }}
                                        />

                                        {/* Autocomplete Dropdown */}
                                        {categorySearch.length >= 1 && (
                                            <div className="bg-white border rounded-xl shadow-lg mt-2 max-h-40 overflow-y-auto">

                                                {/* Existing categories */}
                                                {categoryResults.map(cat => (
                                                    <div
                                                        key={cat.category_id}
                                                        className="p-3 hover:bg-green-50 cursor-pointer"
                                                        onClick={() => {
                                                            setSelectedCategories([...selectedCategories, cat]);
                                                            setCategorySearch("");
                                                            setCategoryResults([]);
                                                        }}
                                                    >
                                                        {cat.category_name}
                                                    </div>
                                                ))}

                                                {/* Create new category IF none match */}
                                                {categoryResults.length === 0 && (
                                                    <div
                                                        className="p-3 bg-green-50 text-green-600 font-bold cursor-pointer"
                                                        onClick={async () => {
                                                            const { data: newCat } = await createCategory(categorySearch);
                                                            setSelectedCategories([...selectedCategories, newCat]);
                                                            setCategorySearch("");
                                                            setCategoryResults([]);
                                                        }}
                                                    >
                                                        + Create "{categorySearch}"
                                                    </div>
                                                )}
                                            </div>
                                        )}

                                        {/* Selected Categories */}
                                        <div className="flex flex-wrap gap-2 mt-3">
                                            {selectedCategories.map(cat => (
                                                <div key={cat.category_id} className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-bold flex items-center gap-2">
                                                    {cat.category_name}
                                                    <X
                                                        size={14}
                                                        className="cursor-pointer"
                                                        onClick={() => {
                                                            setSelectedCategories(selectedCategories.filter(c => c.category_id !== cat.category_id));
                                                        }}
                                                    />
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            )}


                            {(selectedProduct || activeTab === 'create') && (
                                <div className={`grid grid-cols-2 gap-4 ${!editingId ? "mt-6 pt-6 border-t border-slate-100" : ""}`}>
                                    <div>
                                        <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-2">Unit Price (₹)</label>
                                        <input type="number" required min="0" step="0.01" className="w-full px-4 py-3 bg-green-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-green-500 outline-none font-bold text-slate-800" value={formData.price} onChange={e => setFormData({ ...formData, price: e.target.value })} />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-2">Total Stock</label>
                                        <input type="number" required min="0" className="w-full px-4 py-3 bg-green-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-green-500 outline-none font-bold text-slate-800" value={formData.stock} onChange={e => setFormData({ ...formData, stock: e.target.value })} />
                                    </div>
                                </div>
                            )}

                            <button type="submit" disabled={!formData.price || !formData.stock} className="w-full mt-8 py-4 bg-green-600 text-white font-bold rounded-xl shadow-lg shadow-green-200 hover:bg-green-600 transition-all disabled:opacity-50">
                                {editingId ? 'Update Item' : 'List Item'}
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}

export default WholesalerInventory;