'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';

export default function SearchPage() {
  const searchParams = useSearchParams();
  const query = searchParams.get('q') || '';
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    minPrice: 0,
    maxPrice: 10000,
    category: '',
    rating: 0,
  });
  const [sortBy, setSortBy] = useState('relevance');

  useEffect(() => {
    const fetchResults = async () => {
      setLoading(true);
      try {
        const params = new URLSearchParams({
          q: query,
          minPrice: filters.minPrice,
          maxPrice: filters.maxPrice,
          category: filters.category,
          rating: filters.rating,
          sortBy,
        });
        const res = await fetch(`/api/search?${params}`);
        const data = await res.json();
        setProducts(data.products || []);
      } catch (error) {
        console.error('Search error:', error);
      } finally {
        setLoading(false);
      }
    };

    if (query) {
      fetchResults();
    }
  }, [query, filters, sortBy]);

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold mb-2 text-gray-900">Search Results</h1>
        <p className="text-gray-600 mb-8">
          {loading ? 'Searching...' : `Found ${products.length} results for "${query}"`}
        </p>

        <div className="grid lg:grid-cols-4 gap-8">
          {/* Filters */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow p-6 space-y-6">
              <div>
                <h3 className="font-bold text-gray-900 mb-4">Price Range</h3>
                <div className="space-y-2">
                  <input
                    type="range"
                    min="0"
                    max="10000"
                    value={filters.maxPrice}
                    onChange={(e) => setFilters({ ...filters, maxPrice: parseInt(e.target.value) })}
                    className="w-full"
                  />
                  <div className="flex justify-between text-sm text-gray-600">
                    <span>${filters.minPrice}</span>
                    <span>${filters.maxPrice}</span>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="font-bold text-gray-900 mb-4">Category</h3>
                <select
                  value={filters.category}
                  onChange={(e) => setFilters({ ...filters, category: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                >
                  <option value="">All Categories</option>
                  <option value="electronics">Electronics</option>
                  <option value="home">Home & Garden</option>
                  <option value="sports">Sports & Outdoors</option>
                  <option value="health">Health & Beauty</option>
                </select>
              </div>

              <div>
                <h3 className="font-bold text-gray-900 mb-4">Rating</h3>
                <select
                  value={filters.rating}
                  onChange={(e) => setFilters({ ...filters, rating: parseInt(e.target.value) })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                >
                  <option value="0">All Ratings</option>
                  <option value="4">4+ Stars</option>
                  <option value="3">3+ Stars</option>
                  <option value="2">2+ Stars</option>
                  <option value="1">1+ Stars</option>
                </select>
              </div>
            </div>
          </div>

          {/* Results */}
          <div className="lg:col-span-3">
            <div className="mb-6 flex justify-between items-center">
              <div className="text-sm text-gray-600">
                Showing {products.length} results
              </div>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg"
              >
                <option value="relevance">Relevance</option>
                <option value="price-low">Price: Low to High</option>
                <option value="price-high">Price: High to Low</option>
                <option value="rating">Highest Rated</option>
                <option value="newest">Newest</option>
              </select>
            </div>

            {loading ? (
              <div className="text-center py-12">
                <p className="text-gray-600">Loading results...</p>
              </div>
            ) : products.length > 0 ? (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {products.map((product) => (
                  <Link
                    key={product.id}
                    href={`/shopping/${product.id}`}
                    className="bg-white rounded-lg shadow hover:shadow-lg transition overflow-hidden"
                  >
                    <div className="aspect-square bg-gray-200 relative">
                      {product.image && (
                        <img
                          src={product.image}
                          alt={product.name}
                          className="w-full h-full object-cover"
                        />
                      )}
                    </div>
                    <div className="p-4">
                      <h3 className="font-semibold text-gray-900 line-clamp-2">{product.name}</h3>
                      <p className="text-sm text-gray-600 mt-1">{product.category}</p>
                      <div className="flex justify-between items-center mt-4">
                        <span className="text-lg font-bold text-blue-600">${product.price}</span>
                        <span className="text-sm text-yellow-500">★ {product.rating || 0}</span>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="text-center py-12 bg-white rounded-lg">
                <p className="text-gray-600 mb-4">No products found matching your search.</p>
                <Link href="/shopping" className="text-blue-600 hover:text-blue-800 font-semibold">
                  Browse all products
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
