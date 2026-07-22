'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Tag, ArrowLeft, Plus, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';

export default function AdminCategoriesPage() {
  const router = useRouter();
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [newCategory, setNewCategory] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) return;
    fetchCategories(token);
  }, [router]);

  const fetchCategories = async (token) => {
    try {
      setLoading(true);
      const res = await fetch('/api/admin/categories', {
        headers: { 'Authorization': `Bearer ${token}` },
      });

      if (res.status === 403) {
        setError('Admin access required');
        toast.error('You do not have admin access');
        router.push('/shopping');
        return;
      }

      if (!res.ok) throw new Error('Failed to fetch categories');
      const data = await res.json();
      setCategories(data.categories);
    } catch (err) {
      setError(err.message);
      toast.error('Failed to load categories');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateCategory = async (e) => {
    e.preventDefault();

    if (!newCategory.trim()) {
      toast.error('Category name required');
      return;
    }

    try {
      setSubmitting(true);
      const token = localStorage.getItem('token');
      const res = await fetch('/api/admin/categories', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: newCategory,
          description: newDescription,
        }),
      });

      const data = await res.json();

      if (res.ok) {
        setCategories([...categories, { name: newCategory, count: 0 }]);
        setNewCategory('');
        setNewDescription('');
        setShowForm(false);
        toast.success('Category created successfully');
      } else {
        toast.error(data.error || 'Failed to create category');
      }
    } catch (error) {
      toast.error('Error creating category');
      console.error(error);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteCategory = async (categoryName) => {
    if (!confirm(`Delete all products in "${categoryName}" category?`)) return;

    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`/api/admin/categories?name=${encodeURIComponent(categoryName)}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` },
      });

      if (res.ok) {
        setCategories(categories.filter(c => c.name !== categoryName));
        toast.success('Category deleted successfully');
      } else {
        toast.error('Failed to delete category');
      }
    } catch (error) {
      toast.error('Error deleting category');
      console.error(error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p>Loading categories...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 py-12 px-4">
        <div className="max-w-4xl mx-auto">
          <Link href="/admin" className="inline-flex items-center text-blue-600 hover:text-blue-700 mb-6">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Admin
          </Link>
          <div className="bg-white rounded-lg shadow p-8 text-center">
            <p className="text-red-600 mb-4">{error}</p>
            <Link href="/admin" className="text-blue-600 hover:underline">
              Return to admin dashboard
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-6xl mx-auto">
        <Link href="/admin" className="inline-flex items-center text-blue-600 hover:text-blue-700 mb-6">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Admin
        </Link>

        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg shadow-lg p-8 mb-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center">
                <Tag className="w-8 h-8" />
              </div>
              <div>
                <h1 className="text-3xl font-bold">Category Management</h1>
                <p className="text-blue-100">Manage product categories</p>
              </div>
            </div>
            <button
              onClick={() => setShowForm(!showForm)}
              className="flex items-center gap-2 px-6 py-3 bg-white text-blue-600 hover:bg-blue-50 rounded-lg font-semibold transition-colors"
            >
              <Plus className="w-5 h-5" />
              New Category
            </button>
          </div>
        </div>

        {/* Create Form */}
        {showForm && (
          <div className="bg-white rounded-lg shadow-lg p-6 mb-8">
            <h2 className="text-2xl font-bold mb-6">Create New Category</h2>
            <form onSubmit={handleCreateCategory} className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Category Name</label>
                <input
                  type="text"
                  value={newCategory}
                  onChange={(e) => setNewCategory(e.target.value)}
                  placeholder="e.g., Electronics, Fashion, Home"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Description (Optional)</label>
                <textarea
                  value={newDescription}
                  onChange={(e) => setNewDescription(e.target.value)}
                  placeholder="Category description..."
                  rows="3"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div className="flex gap-3">
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 px-6 py-2 bg-blue-600 text-white hover:bg-blue-700 rounded-lg font-semibold transition-colors disabled:opacity-50"
                >
                  {submitting ? 'Creating...' : 'Create Category'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowForm(false);
                    setNewCategory('');
                    setNewDescription('');
                  }}
                  className="flex-1 px-6 py-2 bg-gray-300 text-gray-700 hover:bg-gray-400 rounded-lg font-semibold transition-colors"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Categories Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {categories.length === 0 ? (
            <div className="col-span-full text-center py-12">
              <Tag className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-600">No categories found</p>
            </div>
          ) : (
            categories.map((category) => (
              <div key={category.name} className="bg-white rounded-lg shadow-lg p-6 hover:shadow-xl transition-shadow">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="text-xl font-bold text-gray-900">{category.name}</h3>
                    <p className="text-gray-600 text-sm mt-1">{category.count} products</p>
                  </div>
                  <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                    <Tag className="w-6 h-6 text-blue-600" />
                  </div>
                </div>

                <div className="mb-4 p-3 bg-gray-50 rounded-lg">
                  <p className="text-sm text-gray-600">
                    <strong>Products:</strong> {category.count}
                  </p>
                </div>

                <button
                  onClick={() => handleDeleteCategory(category.name)}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-red-100 text-red-600 hover:bg-red-200 rounded-lg transition-colors font-semibold"
                >
                  <Trash2 className="w-4 h-4" />
                  Delete Category
                </button>
              </div>
            ))
          )}
        </div>

        {/* Info Box */}
        <div className="mt-8 p-6 bg-blue-50 border border-blue-200 rounded-lg">
          <h3 className="font-bold text-blue-900 mb-2">ℹ️ Important Information</h3>
          <ul className="text-sm text-blue-800 space-y-1">
            <li>• Deleting a category will delete all products in that category</li>
            <li>• This action cannot be undone</li>
            <li>• New categories are created with a placeholder product</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
