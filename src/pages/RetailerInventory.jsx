import React, { useState, useEffect } from 'react';
import { Plus, Trash2, Search, X, Image as ImageIcon, Package, DollarSign, Check, Edit2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import {
    getRetailerListings,
    searchMasterProducts,
    createListingForExisting,
    createNewProductAndListing,
    deleteListing,
    updateListing,
    searchCategories,
    createCategory,
    // Removed unused addCategoryToProduct
} from '../utils/InventoryDB';

// Define consistent color variables for clarity and easy future re-theming
const PRIMARY_COLOR = 'emerald';
const PRIMARY_SHADE = '600';
const BG_LIGHT_SHADE = '50';
const BORDER_SHADE = '200';
const TEXT_DARK_SHADE = '900';
const TEXT_MUTED_SHADE = '500';

function RetailerInventory() {
    const { user } = useAuth();
    const [listings, setListings] = useState([]);
    const [loading, setLoading] = useState(true);

    // Modal State
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [activeTab, setActiveTab] = useState('search'); // 'search' | 'create'
    const [editingId, setEditingId] = useState(null); // ID of listing being edited
    const [categorySearch, setCategorySearch] = useState("");
    const [categoryResults, setCategoryResults] = useState([]);
    const [selectedCategories, setSelectedCategories] = useState([]); // array of {id, name}

    // Form Data
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState([]);
    const [selectedProduct, setSelectedProduct] = useState(null);

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

    const handleKeyDown = (e) => {
        if (e.key === 'Enter') e.preventDefault();
    };

    const handleResultClick = (prod, e) => {
        e.preventDefault();
        e.stopPropagation();
        // Check if the product is already listed by this retailer
        const alreadyListed = listings.some(item => item.product.product_id === prod.product_id);
        if (alreadyListed) {
            alert("This product is already in your inventory. Please use the 'Edit' button on the main table to update it.");
            closeModal();
            return;
        }

        setSelectedProduct(prod);
        setSearchResults([]);
        setSearchQuery(prod.name);
    };

    // --- EDIT HANDLER ---
    const handleEdit = (item) => {
        setEditingId(item.product_listings_id);
        setSelectedProduct(item.product); // Pre-select the product card
        setFormData({
            price: item.price,
            stock: item.stock,
            name: '', // Not used in edit mode, but reset for consistency
            description: '',
            image_url: ''
        });
        setIsModalOpen(true);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!user) return;

        let error = null;

        // SCENARIO 3: UPDATE EXISTING LISTING
        if (editingId) {
            const res = await updateListing(editingId, {
                price: formData.price,
                stock: formData.stock
            });
            error = res.error;
        }
        // SCENARIO 1: ADD EXISTING
        else if (activeTab === 'search') {
            if (!selectedProduct) return alert("Please select a product first");
            const res = await createListingForExisting(user.id, selectedProduct.product_id, formData.price, formData.stock);
            error = res.error;
        }
        // SCENARIO 2: CREATE NEW
        else {
            const res = await createNewProductAndListing(user.id,
                // Only pass category IDs when creating a product
                { name: formData.name, description: formData.description, image_url: formData.image_url, category_ids: selectedCategories.map(c => c.category_id) },
                formData.price,
                formData.stock
            );
            error = res.error;
        }

        if (error) {
            console.error(error);
            if (error.code === '23505') {
                alert("You have already listed this product. Please edit the existing listing.");
            } else {
                alert("Operation failed. See console for details.");
            }
        } else {
            closeModal();
            loadListings();
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm("Are you sure you want to remove this listing?")) return;

        const { error, count } = await deleteListing(id);

        if (error) {
            if (error.code === '23503') {
                alert("Cannot delete this item because it exists in customer carts or past orders.\n\nTip: Edit the item and set 'Stock' to 0 to stop selling it.");
            } else {
                alert(`Error: ${error.message}`);
            }
        } else if (count === 0) {
            alert("Delete failed. You likely do not have permission to delete this row.");
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
        setEditingId(null); // Clear edit mode
        // Reset category state on modal close
        setCategorySearch("");
        setCategoryResults([]);
        setSelectedCategories([]);
    };

    return (
        <div className="space-y-6 relative">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className={`text-2xl font-extrabold text-slate-${TEXT_DARK_SHADE}`}>My Inventory</h1>
                    <p className={`text-slate-${TEXT_MUTED_SHADE}`}>Manage products and pricing for your store.</p>
                </div>
                <button
                    onClick={() => setIsModalOpen(true)}
                    className={`inline-flex items-center gap-2 bg-${PRIMARY_COLOR}-${PRIMARY_SHADE} text-white px-4 py-2.5 rounded-xl font-bold hover:bg-${PRIMARY_COLOR}-700 shadow-lg shadow-${PRIMARY_COLOR}-200 transition-all hover:-translate-y-0.5`}
                >
                    <Plus size={18} />
                    Add Item
                </button>
            </div>

            {/* LISTINGS TABLE */}
            <div className={`bg-white border border-slate-${BORDER_SHADE} rounded-3xl shadow-sm overflow-hidden`}>
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                        <thead className={`bg-${PRIMARY_COLOR}-50 text-slate-700 font-bold uppercase tracking-wider`}>
                            <tr>
                                <th className="px-6 py-4">Product</th>
                                <th className="px-6 py-4">Price</th>
                                <th className="px-6 py-4">Stock</th>
                                <th className="px-6 py-4 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {loading ? (
                                <tr><td colSpan="4" className="px-6 py-10 text-center text-slate-400">Loading...</td></tr>
                            ) : listings.length === 0 ? (
                                <tr><td colSpan="4" className="px-6 py-10 text-center text-slate-400">No products listed yet.</td></tr>
                            ) : (
                                listings.map((item) => (
                                    <tr key={item.product_listings_id} className={`hover:bg-${PRIMARY_COLOR}-50/30 transition-colors`}>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <img
                                                    src={item.product?.image_url || 'https://via.placeholder.com/40'}
                                                    alt={item.product?.name}
                                                    className={`w-10 h-10 rounded-lg object-cover border border-slate-${BORDER_SHADE}`}
                                                />
                                                <div>
                                                    <p className={`font-bold text-slate-${TEXT_DARK_SHADE}`}>{item.product?.name}</p>
                                                    <p className="text-xs text-slate-400 line-clamp-1">{item.product?.description}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className={`px-6 py-4 text-${PRIMARY_COLOR}-${PRIMARY_SHADE} font-bold`}>₹{item.price}</td>
                                        <td className="px-6 py-4">
                                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold ${item.stock < 5 ? 'bg-orange-100 text-orange-700' : `bg-${PRIMARY_COLOR}-100 text-${PRIMARY_COLOR}-700`}`}>
                                                {item.stock} units
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-right space-x-2">
                                            <button
                                                onClick={() => handleEdit(item)}
                                                className={`p-2 text-slate-400 hover:text-blue-${PRIMARY_SHADE} hover:bg-blue-50 rounded-lg transition-colors`}
                                            >
                                                <Edit2 size={18} />
                                            </button>
                                            <button
                                                onClick={() => handleDelete(item.product_listings_id)}
                                                className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                                            >
                                                <Trash2 size={18} />
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* ADD/EDIT MODAL */}
            {isModalOpen && (
                <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-white w-full max-w-lg rounded-[2rem] shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
                        {/* Modal Header */}
                        <div className={`px-8 py-6 border-b border-slate-${BORDER_SHADE} flex justify-between items-center bg-${PRIMARY_COLOR}-50/50`}>
                            <h2 className={`text-xl font-extrabold text-slate-${TEXT_DARK_SHADE}`}>
                                {editingId ? "Edit Listing" : "Add to Inventory"}
                            </h2>
                            <button onClick={closeModal} className={`text-slate-400 hover:text-slate-${PRIMARY_SHADE}`}><X size={24} /></button>
                        </div>

                        {/* Tabs - Only show if NOT editing */}
                        {!editingId && (
                            <div className="flex p-2 mx-6 mt-4 bg-slate-100 rounded-xl">
                                <button
                                    type="button"
                                    onClick={() => setActiveTab('search')}
                                    className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all ${activeTab === 'search' ? `bg-white text-${PRIMARY_COLOR}-${PRIMARY_SHADE} shadow-sm` : `text-slate-${TEXT_MUTED_SHADE} hover:text-slate-700`}`}
                                >
                                    Search Existing
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setActiveTab('create')}
                                    className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all ${activeTab === 'create' ? `bg-white text-${PRIMARY_COLOR}-${PRIMARY_SHADE} shadow-sm` : `text-slate-${TEXT_MUTED_SHADE} hover:text-slate-700`}`}
                                >
                                    Create New
                                </button>
                            </div>
                        )}

                        <form onSubmit={handleSubmit} className="p-8 overflow-y-auto custom-scrollbar">

                            {/* TAB 1: SEARCH EXISTING (Hidden during Edit) */}
                            {!editingId && activeTab === 'search' && (
                                <div className="space-y-6">
                                    <div>
                                        <label className={`block text-xs font-bold text-slate-${TEXT_MUTED_SHADE} uppercase tracking-wide mb-2`}>Find Product</label>
                                        <div className="relative">
                                            <Search className="absolute left-3 top-3.5 text-slate-400" size={18} />
                                            <input
                                                type="text"
                                                placeholder="Type product name (e.g. Apple)..."
                                                className={`w-full pl-10 pr-4 py-3 bg-${PRIMARY_COLOR}-${BG_LIGHT_SHADE} border border-slate-${BORDER_SHADE} rounded-xl focus:ring-2 focus:ring-${PRIMARY_COLOR}-500 outline-none`}
                                                value={searchQuery}
                                                onChange={handleSearch}
                                                onKeyDown={handleKeyDown}
                                            />
                                        </div>

                                        {/* Search Results */}
                                        {searchResults.length > 0 && !selectedProduct && (
                                            <div className={`mt-2 bg-white border border-slate-100 rounded-xl shadow-lg max-h-40 overflow-y-auto`}>
                                                {searchResults.map(prod => (
                                                    <div
                                                        key={prod.product_id}
                                                        onClick={(e) => handleResultClick(prod, e)}
                                                        className={`p-3 hover:bg-${PRIMARY_COLOR}-50 cursor-pointer flex items-center gap-3 border-b border-slate-50 last:border-0`}
                                                    >
                                                        <img src={prod.image_url || 'https://via.placeholder.com/30'} className="w-8 h-8 rounded bg-slate-200" alt={prod.name} />
                                                        <span className={`text-sm font-bold text-slate-700`}>{prod.name}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}

                            {/* TAB 2: CREATE NEW (Hidden during Edit) */}
                            {!editingId && activeTab === 'create' && (
                                <div className="space-y-4">
                                    <div>
                                        <label className={`block text-xs font-bold text-slate-${TEXT_MUTED_SHADE} uppercase tracking-wide mb-2`}>Product Name</label>
                                        <input
                                            required
                                            className={`w-full px-4 py-3 bg-${PRIMARY_COLOR}-${BG_LIGHT_SHADE} border border-slate-${BORDER_SHADE} rounded-xl focus:ring-2 focus:ring-${PRIMARY_COLOR}-500 outline-none`}
                                            placeholder="e.g. Homemade Jam"
                                            value={formData.name}
                                            onChange={e => setFormData({ ...formData, name: e.target.value })}
                                        />
                                    </div>
                                    <div>
                                        <label className={`block text-xs font-bold text-slate-${TEXT_MUTED_SHADE} uppercase tracking-wide mb-2`}>Description</label>
                                        <textarea
                                            className={`w-full px-4 py-3 bg-${PRIMARY_COLOR}-${BG_LIGHT_SHADE} border border-slate-${BORDER_SHADE} rounded-xl focus:ring-2 focus:ring-${PRIMARY_COLOR}-500 outline-none`}
                                            placeholder="Short description..."
                                            rows="2"
                                            value={formData.description}
                                            onChange={e => setFormData({ ...formData, description: e.target.value })}
                                        />
                                    </div>
                                    <div>
                                        <label className={`block text-xs font-bold text-slate-${TEXT_MUTED_SHADE} uppercase tracking-wide mb-2`}>Image URL</label>
                                        <div className="relative">
                                            <ImageIcon className="absolute left-3 top-3.5 text-slate-400" size={18} />
                                            <input
                                                className={`w-full pl-10 pr-4 py-3 bg-${PRIMARY_COLOR}-${BG_LIGHT_SHADE} border border-slate-${BORDER_SHADE} rounded-xl focus:ring-2 focus:ring-${PRIMARY_COLOR}-500 outline-none`}
                                                placeholder="https://..."
                                                value={formData.image_url}
                                                onChange={e => setFormData({ ...formData, image_url: e.target.value })}
                                            />

                                        </div>
                                    </div>
                                    {/* CATEGORY SELECTOR - Ensuring consistency */}
                                    <div>
                                        <label className={`block text-xs font-bold text-slate-${TEXT_MUTED_SHADE} uppercase tracking-wide mb-2`}>
                                            Categories
                                        </label>

                                        {/* Search box */}
                                        <input
                                            type="text"
                                            className={`w-full px-4 py-3 bg-${PRIMARY_COLOR}-${BG_LIGHT_SHADE} border border-slate-${BORDER_SHADE} rounded-xl focus:ring-2 focus:ring-${PRIMARY_COLOR}-500 outline-none`}
                                            placeholder="Search or create (e.g. Snacks)..."
                                            value={categorySearch}
                                            onChange={async e => {
                                                const value = e.target.value;
                                                setCategorySearch(value);

                                                if (value.length >= 1) {
                                                    const results = await searchCategories(value);
                                                    // Filter out already selected categories
                                                    const filteredResults = results.filter(
                                                        cat => !selectedCategories.some(sCat => sCat.category_id === cat.category_id)
                                                    );
                                                    setCategoryResults(filteredResults);
                                                } else {
                                                    setCategoryResults([]);
                                                }
                                            }}
                                        />

                                        {/* Autocomplete dropdown */}
                                        {categorySearch.length >= 1 && (
                                            <div className={`bg-white border rounded-xl shadow-lg mt-2 max-h-40 overflow-y-auto z-10 relative`}>

                                                {/* Existing categories */}
                                                {categoryResults.map(cat => (
                                                    <div
                                                        key={cat.category_id}
                                                        className={`p-3 hover:bg-${PRIMARY_COLOR}-50 cursor-pointer`}
                                                        onClick={() => {
                                                            setSelectedCategories([...selectedCategories, cat]);
                                                            setCategorySearch("");      // autocomplete fill
                                                            setCategoryResults([]);
                                                        }}
                                                    >
                                                        <span className='font-medium text-slate-700'>{cat.category_name}</span>
                                                    </div>
                                                ))}

                                                {/* Create new only if no matches */}
                                                {categoryResults.length === 0 && (
                                                    <div
                                                        className={`p-3 bg-${PRIMARY_COLOR}-50 text-${PRIMARY_COLOR}-${PRIMARY_SHADE} font-bold cursor-pointer border-t border-${PRIMARY_COLOR}-100`}
                                                        onClick={async () => {
                                                            const { data: newCat, error } = await createCategory(categorySearch);
                                                            if (newCat) {
                                                                setSelectedCategories([...selectedCategories, newCat]);
                                                            } else {
                                                                console.error(error);
                                                                alert("Failed to create category. See console.");
                                                            }
                                                            setCategorySearch("");
                                                            setCategoryResults([]);
                                                        }}
                                                    >
                                                        <Plus size={14} className='inline-block mr-2' /> Create "{categorySearch}"
                                                    </div>
                                                )}
                                            </div>
                                        )}

                                        {/* Selected category chips - Consistent primary color use */}
                                        <div className="flex flex-wrap gap-2 mt-3">
                                            {selectedCategories.map(cat => (
                                                <div key={cat.category_id} className={`px-3 py-1 bg-${PRIMARY_COLOR}-100 text-${PRIMARY_COLOR}-700 rounded-full text-xs font-bold flex items-center gap-2`}>
                                                    {cat.category_name}
                                                    <X
                                                        size={14}
                                                        className="cursor-pointer hover:text-red-500 transition-colors"
                                                        onClick={() =>
                                                            setSelectedCategories(selectedCategories.filter(c => c.category_id !== cat.category_id))
                                                        }
                                                    />
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                </div>
                            )}

                            {/* SELECTED PRODUCT (Showing during Search or Edit) */}
                            {selectedProduct && (
                                <div className={`mt-4 mb-6 p-4 bg-${PRIMARY_COLOR}-50 border border-${PRIMARY_COLOR}-100 rounded-xl flex items-center justify-between`}>
                                    <div className="flex items-center gap-3">
                                        <img src={selectedProduct.image_url || 'https://via.placeholder.com/40'} className="w-12 h-12 rounded-lg bg-white" alt={selectedProduct.name} />
                                        <div>
                                            <p className={`font-bold text-slate-${TEXT_DARK_SHADE}`}>{selectedProduct.name}</p>
                                            {/* Only show Change button if NOT editing */}
                                            {!editingId && (
                                                <button type="button" onClick={() => { setSelectedProduct(null); setSearchQuery(''); }} className={`text-xs text-${PRIMARY_COLOR}-${PRIMARY_SHADE} font-bold hover:underline`}>Change</button>
                                            )}
                                        </div>
                                    </div>
                                    <Check className={`text-${PRIMARY_COLOR}-500`} />
                                </div>
                            )}

                            {/* COMMON FIELDS (Price & Stock) - Show if valid state */}
                            {(selectedProduct || activeTab === 'create') && (
                                <div className={`grid grid-cols-2 gap-4 ${!editingId ? `mt-6 pt-6 border-t border-slate-${BORDER_SHADE}` : ""}`}>
                                    <div>
                                        <label className={`block text-xs font-bold text-slate-${TEXT_MUTED_SHADE} uppercase tracking-wide mb-2`}>Your Price (₹)</label>
                                        <div className="relative">
                                            <DollarSign className="absolute left-3 top-3.5 text-slate-400" size={14} />
                                            <input
                                                type="number" required min="0" step="0.01"
                                                className={`w-full pl-8 pr-4 py-3 bg-${PRIMARY_COLOR}-${BG_LIGHT_SHADE} border border-slate-${BORDER_SHADE} rounded-xl focus:ring-2 focus:ring-${PRIMARY_COLOR}-500 outline-none font-bold text-slate-800`}
                                                placeholder="0.00"
                                                value={formData.price}
                                                onChange={e => setFormData({ ...formData, price: e.target.value })}
                                            />
                                        </div>
                                    </div>
                                    <div>
                                        <label className={`block text-xs font-bold text-slate-${TEXT_MUTED_SHADE} uppercase tracking-wide mb-2`}>Stock Qty</label>
                                        <div className="relative">
                                            <Package className="absolute left-3 top-3.5 text-slate-400" size={14} />
                                            <input
                                                type="number" required min="0"
                                                className={`w-full pl-8 pr-4 py-3 bg-${PRIMARY_COLOR}-${BG_LIGHT_SHADE} border border-slate-${BORDER_SHADE} rounded-xl focus:ring-2 focus:ring-${PRIMARY_COLOR}-500 outline-none font-bold text-slate-800`}
                                                placeholder="0"
                                                value={formData.stock}
                                                onChange={e => setFormData({ ...formData, stock: e.target.value })}
                                            />
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Submit Button */}
                            <button
                                type="submit"
                                disabled={!formData.price || !formData.stock || (activeTab === 'search' && !selectedProduct) || (activeTab === 'create' && !formData.name)}
                                className={`w-full mt-8 py-4 bg-${PRIMARY_COLOR}-${PRIMARY_SHADE} text-white font-bold rounded-xl shadow-lg shadow-${PRIMARY_COLOR}-200 hover:bg-${PRIMARY_COLOR}-700 hover:-translate-y-0.5 transition-all disabled:opacity-50 disabled:cursor-not-allowed`}
                            >
                                {editingId ? 'Update Listing' : (activeTab === 'search' ? 'List Product' : 'Create & List')}
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}

export default RetailerInventory;