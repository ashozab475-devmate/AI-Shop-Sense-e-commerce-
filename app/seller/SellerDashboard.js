'use client';

import React, { useState, useEffect } from 'react';
import { Package, Plus, Edit, Trash2, DollarSign, TrendingUp } from 'lucide-react';

export default function SellerDashboard() {
    const [activeTab, setActiveTab] = useState('products');
    const [showAddProduct, setShowAddProduct] = useState(false);
    const [products, setProducts] = useState([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        fetchProducts();
    }, []);

    const fetchProducts = async () => {
        try {
            const response = await fetch('/api/seller/products');
            if (response.ok) {
                const data = await response.json();
                // Map the status if it doesn't exist in the database yet
                const enrichedData = data.map(p => ({
                    ...p,
                    status: p.stock > 0 ? 'Active' : 'Out of Stock'
                }));
                setProducts(enrichedData);
            }
        } catch (error) {
            console.error('Error fetching products:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const [formData, setFormData] = useState({
        name: '',
        description: '',
        price: '',
        category: '',
        stock: '',
        imageUrl: ''
    });

    const handleInputChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleAddProduct = async (e) => {
        e.preventDefault();
        
        try {
            const response = await fetch('/api/seller/products', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            });

            if (response.ok) {
                const newProduct = await response.json();
                setProducts([...products, { ...newProduct, status: 'Active' }]);
                setShowAddProduct(false);
                setFormData({ name: '', description: '', price: '', category: '', stock: '', imageUrl: '' });
            }
        } catch (error) {
            console.error('Error adding product:', error);
        }
    };

    const handleDeleteProduct = async (id) => {
        if (!window.confirm('Are you sure you want to delete this product? This action cannot be undone.')) {
            return;
        }

        try {
            const response = await fetch(`/api/seller/products/${id}`, {
                method: 'DELETE'
            });

            if (response.ok) {
                setProducts(products.filter(p => p.id !== id));
            } else {
                const error = await response.json();
                alert(error.error || 'Failed to delete product');
            }
        } catch (error) {
            console.error('Error deleting product:', error);
            alert('An error occurred while deleting the product');
        }
    };

    return (
        <div className="space-y-8">
            {/* Header */}
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-[#6dd3ff] via-[#9f8bff] to-[#ffb3ec]">
                        Seller Dashboard
                    </h1>
                    <p className="text-slate-300 mt-2">Manage your products and sales</p>
                </div>
                <button
                    onClick={() => setShowAddProduct(true)}
                    className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 rounded-xl font-semibold transition-all shadow-lg"
                >
                    <Plus className="w-5 h-5" />
                    Add Product
                </button>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-gradient-to-br from-[#1a2948] to-[#22345a] p-6 rounded-2xl border border-white/10">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-slate-400 text-sm">Total Products</p>
                            <p className="text-3xl font-bold mt-2">{products.length}</p>
                        </div>
                        <Package className="w-12 h-12 text-blue-400" />
                    </div>
                </div>

                <div className="bg-gradient-to-br from-[#1a2948] to-[#22345a] p-6 rounded-2xl border border-white/10">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-slate-400 text-sm">Total Revenue</p>
                            <p className="text-3xl font-bold mt-2">$0</p>
                        </div>
                        <DollarSign className="w-12 h-12 text-green-400" />
                    </div>
                </div>

                <div className="bg-gradient-to-br from-[#1a2948] to-[#22345a] p-6 rounded-2xl border border-white/10">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-slate-400 text-sm">Total Sales</p>
                            <p className="text-3xl font-bold mt-2">0</p>
                        </div>
                        <TrendingUp className="w-12 h-12 text-purple-400" />
                    </div>
                </div>
            </div>

            {/* Products Table */}
            <div className="bg-gradient-to-br from-[#1a2948] to-[#22345a] rounded-2xl border border-white/10 overflow-hidden">
                <div className="p-6 border-b border-white/10">
                    <h2 className="text-2xl font-bold">My Products</h2>
                </div>
                
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-white/5">
                            <tr>
                                <th className="px-6 py-4 text-left text-sm font-semibold text-slate-300">Product</th>
                                <th className="px-6 py-4 text-left text-sm font-semibold text-slate-300">Category</th>
                                <th className="px-6 py-4 text-left text-sm font-semibold text-slate-300">Price</th>
                                <th className="px-6 py-4 text-left text-sm font-semibold text-slate-300">Stock</th>
                                <th className="px-6 py-4 text-left text-sm font-semibold text-slate-300">Status</th>
                                <th className="px-6 py-4 text-left text-sm font-semibold text-slate-300">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                            {products.map((product) => (
                                <tr key={product.id} className="hover:bg-white/5 transition">
                                    <td className="px-6 py-4">{product.name}</td>
                                    <td className="px-6 py-4 text-slate-400">{product.category}</td>
                                    <td className="px-6 py-4 font-semibold">${product.price}</td>
                                    <td className="px-6 py-4 text-slate-400">{product.stock}</td>
                                    <td className="px-6 py-4">
                                        <span className="px-3 py-1 bg-green-500/20 text-green-400 rounded-full text-xs font-semibold">
                                            {product.status}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex gap-2">
                                            <button className="p-2 hover:bg-white/10 rounded-lg transition">
                                                <Edit className="w-4 h-4" />
                                            </button>
                                            <button 
                                                onClick={() => handleDeleteProduct(product.id)}
                                                className="p-2 hover:bg-red-500/20 rounded-lg transition text-red-400"
                                                title="Delete Product"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Add Product Modal */}
            {showAddProduct && (
                <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-[#1a2333] border border-gray-700 rounded-2xl w-full max-w-2xl p-8">
                        <h2 className="text-2xl font-bold mb-6">Add New Product</h2>
                        
                        <form onSubmit={handleAddProduct} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium mb-2">Product Name</label>
                                <input
                                    type="text"
                                    name="name"
                                    value={formData.name}
                                    onChange={handleInputChange}
                                    className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    required
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium mb-2">Description</label>
                                <textarea
                                    name="description"
                                    value={formData.description}
                                    onChange={handleInputChange}
                                    className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    rows="3"
                                    required
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium mb-2">Price</label>
                                    <input
                                        type="number"
                                        name="price"
                                        value={formData.price}
                                        onChange={handleInputChange}
                                        step="0.01"
                                        className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        required
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium mb-2">Stock</label>
                                    <input
                                        type="number"
                                        name="stock"
                                        value={formData.stock}
                                        onChange={handleInputChange}
                                        className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        required
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium mb-2">Category</label>
                                <select
                                    name="category"
                                    value={formData.category}
                                    onChange={handleInputChange}
                                    className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    required
                                >
                                    <option value="">Select Category</option>
                                    <option value="Smart Home">Smart Home</option>
                                    <option value="Wellness">Wellness</option>
                                    <option value="Workspace">Workspace</option>
                                    <option value="Audio">Audio</option>
                                    <option value="Outdoors">Outdoors</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium mb-2">Image URL</label>
                                <input
                                    type="url"
                                    name="imageUrl"
                                    value={formData.imageUrl}
                                    onChange={handleInputChange}
                                    className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    required
                                />
                            </div>

                            <div className="flex gap-4 pt-4">
                                <button
                                    type="submit"
                                    className="flex-1 px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 rounded-xl font-semibold transition-all"
                                >
                                    Add Product
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setShowAddProduct(false)}
                                    className="flex-1 px-6 py-3 bg-white/10 hover:bg-white/20 rounded-xl font-semibold transition-all"
                                >
                                    Cancel
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
