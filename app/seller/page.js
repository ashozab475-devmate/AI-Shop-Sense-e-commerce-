'use client';

export const dynamic = 'force-dynamic';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Store, Package, TrendingUp, DollarSign, Plus, ArrowLeft } from 'lucide-react';
import toast from 'react-hot-toast';

export default function SellerDashboard() {
  const router = useRouter();
  const [sellerInfo, setSellerInfo] = useState(null);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showAddProduct, setShowAddProduct] = useState(false);

  const [newProduct, setNewProduct] = useState({
    name: '',
    description: '',
    basePrice: '',
    category: '',
    imageUrl: '',
    stock: '',
    maxStock: '',
  });

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/signin');
      return;
    }
    fetchSellerData(token);
  }, []);

  const fetchSellerData = async (token) => {
    try {
      // Get seller info
      const profileRes = await fetch('/api/profile', {
        headers: { 'Authorization': `Bearer ${token}` },
      });

      if (!profileRes.ok) throw new Error('Failed to fetch seller info');
      const profile = await profileRes.json();
      setSellerInfo(profile);

      // Get seller products
      const productsRes = await fetch('/api/seller/products', {
        headers: { 'Authorization': `Bearer ${token}` },
      });

      if (productsRes.ok) {
        const productsData = await productsRes.json();
        setProducts(productsData);
      }
    } catch (err) {
      setError(err.message);
      toast.error('Failed to load seller data');
    } finally {
      setLoading(false);
    }
  };

  const handleAddProduct = async () => {
    if (!newProduct.name || !newProduct.basePrice || !newProduct.category || !newProduct.stock) {
      toast.error('Please fill in all required fields');
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const res = await fetch('/api/seller/products', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          ...newProduct,
          basePrice: parseFloat(newProduct.basePrice),
          stock: parseInt(newProduct.stock),
          maxStock: parseInt(newProduct.maxStock) || 100,
        }),
      });

      const data = await res.json();

      if (res.ok) {
        setProducts([...products, data]);
        setNewProduct({
          name: '',
          description: '',
          basePrice: '',
          category: '',
          imageUrl: '',
          stock: '',
          maxStock: '',
        });
        setShowAddProduct(false);
        toast.success('Product added successfully');
      } else {
        toast.error(data.error || 'Failed to add product');
      }
    } catch (error) {
      toast.error('Error adding product');
      console.error(error);
    }
  };

  const handleDeleteProduct = async (productId) => {
    if (!confirm('Are you sure you want to delete this product?')) return;

    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`/api/seller/products/${productId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` },
      });

      if (res.ok) {
        setProducts(products.filter(p => p.id !== productId));
        toast.success('Product deleted successfully');
      } else {
        toast.error('Failed to delete product');
      }
    } catch (error) {
      toast.error('Error deleting product');
      console.error(error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#f5f0e8] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-violet-600 mx-auto mb-4"></div>
          <p>Loading seller dashboard...</p>
        </div>
      </div>
    );
  }

  if (error || !sellerInfo) {
    return (
      <div className="min-h-screen bg-[#f5f0e8] py-12 px-4">
        <div className="max-w-4xl mx-auto">
          <Link href="/shopping" className="inline-flex items-center text-violet-600 hover:text-violet-700 mb-6">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Shopping
          </Link>
          <div className="bg-[#f5f0e8] rounded-lg shadow p-8 text-center">
            <p className="text-gray-600 mb-4">{error || 'Please log in to access the Seller Dashboard.'}</p>
            <Link href="/signin" className="px-6 py-2 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors">
              Log In
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const totalRevenue = products.reduce((sum, p) => sum + (p.basePrice * p.stock), 0);
  const totalProducts = products.length;
  const lowStockProducts = products.filter(p => p.stock < p.maxStock * 0.2).length;

  return (
    <div className="min-h-screen bg-[#f5f0e8] py-12 px-4">
      <div className="max-w-6xl mx-auto">
        <Link href="/shopping" className="inline-flex items-center text-violet-600 hover:text-violet-700 mb-6">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Shopping
        </Link>

        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg shadow-lg p-8 mb-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 bg-[#f5f0e8]/20 rounded-full flex items-center justify-center">
                <Store className="w-8 h-8" />
              </div>
              <div>
                <h1 className="text-3xl font-bold">Seller Dashboard</h1>
                <p className="text-blue-100">{sellerInfo.name}</p>
              </div>
            </div>
            <button
              onClick={() => setShowAddProduct(true)}
              className="flex items-center gap-2 px-6 py-3 bg-[#f5f0e8] text-blue-600 hover:bg-blue-50 rounded-lg font-semibold transition-colors"
            >
              <Plus className="w-5 h-5" />
              Add Product
            </button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-[#f5f0e8] rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm mb-1">Total Products</p>
                <p className="text-3xl font-bold">{totalProducts}</p>
              </div>
              <Package className="w-8 h-8 text-blue-400 opacity-50" />
            </div>
          </div>

          <div className="bg-[#f5f0e8] rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm mb-1">Total Revenue</p>
                <p className="text-3xl font-bold">${totalRevenue.toFixed(2)}</p>
              </div>
              <DollarSign className="w-8 h-8 text-green-400 opacity-50" />
            </div>
          </div>

          <div className="bg-[#f5f0e8] rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm mb-1">Low Stock Items</p>
                <p className="text-3xl font-bold">{lowStockProducts}</p>
              </div>
              <TrendingUp className="w-8 h-8 text-orange-400 opacity-50" />
            </div>
          </div>

          <div className="bg-[#f5f0e8] rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm mb-1">Avg Price</p>
                <p className="text-3xl font-bold">${(totalProducts > 0 ? totalRevenue / totalProducts : 0).toFixed(2)}</p>
              </div>
              <TrendingUp className="w-8 h-8 text-purple-400 opacity-50" />
            </div>
          </div>
        </div>

        {/* Add Product Form */}
        {showAddProduct && (
          <div className="bg-[#f5f0e8] rounded-lg shadow-lg p-6 mb-8">
            <h2 className="text-2xl font-bold mb-6">Add New Product</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <input
                type="text"
                placeholder="Product Name"
                value={newProduct.name}
                onChange={(e) => setNewProduct({ ...newProduct, name: e.target.value })}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <input
                type="text"
                placeholder="Category"
                value={newProduct.category}
                onChange={(e) => setNewProduct({ ...newProduct, category: e.target.value })}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <input
                type="number"
                placeholder="Base Price"
                value={newProduct.basePrice}
                onChange={(e) => setNewProduct({ ...newProduct, basePrice: e.target.value })}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <input
                type="number"
                placeholder="Stock"
                value={newProduct.stock}
                onChange={(e) => setNewProduct({ ...newProduct, stock: e.target.value })}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <input
                type="number"
                placeholder="Max Stock"
                value={newProduct.maxStock}
                onChange={(e) => setNewProduct({ ...newProduct, maxStock: e.target.value })}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <input
                type="url"
                placeholder="Image URL"
                value={newProduct.imageUrl}
                onChange={(e) => setNewProduct({ ...newProduct, imageUrl: e.target.value })}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <textarea
                placeholder="Description"
                value={newProduct.description}
                onChange={(e) => setNewProduct({ ...newProduct, description: e.target.value })}
                className="col-span-1 md:col-span-2 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                rows="3"
              />
            </div>
            <div className="flex gap-3 mt-6">
              <button
                onClick={handleAddProduct}
                className="flex-1 px-6 py-2 bg-blue-600 text-white hover:bg-blue-700 rounded-lg font-semibold transition-colors"
              >
                Add Product
              </button>
              <button
                onClick={() => setShowAddProduct(false)}
                className="flex-1 px-6 py-2 bg-gray-300 text-gray-700 hover:bg-gray-400 rounded-lg font-semibold transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {/* Products List */}
        <div className="bg-[#f5f0e8] rounded-lg shadow-lg overflow-hidden">
          <div className="p-6 border-b">
            <h2 className="text-2xl font-bold">Your Products</h2>
          </div>

          {products.length === 0 ? (
            <div className="p-12 text-center">
              <Package className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-600 mb-4">No products yet</p>
              <button
                onClick={() => setShowAddProduct(true)}
                className="px-6 py-2 bg-blue-600 text-white hover:bg-blue-700 rounded-lg font-semibold transition-colors"
              >
                Add Your First Product
              </button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-[#f5f0e8] border-b">
                  <tr>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Product Name</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Category</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Price</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Stock</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Revenue</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {products.map((product) => (
                    <tr key={product.id} className="border-b hover:bg-[#f5f0e8] transition-colors">
                      <td className="px-6 py-4 font-semibold">{product.name}</td>
                      <td className="px-6 py-4 text-gray-600">{product.category}</td>
                      <td className="px-6 py-4 font-semibold">${product.basePrice.toFixed(2)}</td>
                      <td className="px-6 py-4">
                        <span className={`px-3 py-1 rounded-full text-sm font-semibold ${
                          product.stock < product.maxStock * 0.2
                            ? 'bg-red-100 text-red-800'
                            : product.stock < product.maxStock * 0.5
                            ? 'bg-yellow-100 text-yellow-800'
                            : 'bg-green-100 text-green-800'
                        }`}>
                          {product.stock}/{product.maxStock}
                        </span>
                      </td>
                      <td className="px-6 py-4 font-semibold">${(product.basePrice * product.stock).toFixed(2)}</td>
                      <td className="px-6 py-4">
                        <button
                          onClick={() => handleDeleteProduct(product.id)}
                          className="px-3 py-1 bg-red-100 text-red-600 hover:bg-red-200 rounded transition-colors text-sm font-semibold"
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

