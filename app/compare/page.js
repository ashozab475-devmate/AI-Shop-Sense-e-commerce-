'use client';

export const dynamic = 'force-dynamic';

import { useState, useEffect } from 'react';
import Link from 'next/link';

export default function ComparePage() {
  const [compareList, setCompareList] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);

  useEffect(() => {
    const saved = localStorage.getItem('compareList');
    if (saved) {
      setCompareList(JSON.parse(saved));
    }
  }, []);

  const handleSearch = async (e) => {
    const query = e.target.value;
    setSearchQuery(query);
    if (query.length > 2) {
      try {
        const res = await fetch(`/api/search?q=${query}`);
        const data = await res.json();
        setSearchResults(data.products || []);
      } catch (error) {
        console.error('Search error:', error);
      }
    }
  };

  const addToCompare = (product) => {
    if (compareList.length < 4) {
      const updated = [...compareList, product];
      setCompareList(updated);
      localStorage.setItem('compareList', JSON.stringify(updated));
      setSearchQuery('');
      setSearchResults([]);
    }
  };

  const removeFromCompare = (productId) => {
    const updated = compareList.filter(p => p.id !== productId);
    setCompareList(updated);
    localStorage.setItem('compareList', JSON.stringify(updated));
  };

  const specs = ['price', 'rating', 'stock', 'warranty', 'brand'];

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold mb-8 text-gray-900">Compare Products</h1>

        {/* Search */}
        <div className="mb-8 relative">
          <input
            type="text"
            placeholder="Search products to compare (max 4)..."
            value={searchQuery}
            onChange={handleSearch}
            disabled={compareList.length >= 4}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50"
          />
          {searchResults.length > 0 && (
            <div className="absolute top-full left-0 right-0 bg-white border border-gray-300 rounded-lg mt-1 shadow-lg z-10">
              {searchResults.map((product) => (
                <button
                  key={product.id}
                  onClick={() => addToCompare(product)}
                  className="w-full text-left px-4 py-2 hover:bg-gray-100 border-b last:border-b-0"
                >
                  <div className="font-semibold text-gray-900">{product.name}</div>
                  <div className="text-sm text-gray-600">${product.price}</div>
                </button>
              ))}
            </div>
          )}
        </div>

        {compareList.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full bg-white rounded-lg shadow">
              <thead>
                <tr className="border-b">
                  <th className="px-4 py-4 text-left font-bold text-gray-900 w-32">Specification</th>
                  {compareList.map((product) => (
                    <th key={product.id} className="px-4 py-4 text-center min-w-48">
                      <div className="mb-4">
                        <img
                          src={product.image}
                          alt={product.name}
                          className="w-32 h-32 object-cover rounded mx-auto mb-2"
                        />
                        <h3 className="font-semibold text-gray-900 line-clamp-2">{product.name}</h3>
                      </div>
                      <button
                        onClick={() => removeFromCompare(product.id)}
                        className="text-red-600 hover:text-red-800 text-sm font-semibold mt-2"
                      >
                        Remove
                      </button>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {specs.map((spec) => (
                  <tr key={spec} className="border-b hover:bg-gray-50">
                    <td className="px-4 py-4 font-semibold text-gray-900 capitalize">{spec}</td>
                    {compareList.map((product) => (
                      <td key={product.id} className="px-4 py-4 text-center text-gray-600">
                        {spec === 'price' && `$${product.price}`}
                        {spec === 'rating' && `${product.rating || 0} ★`}
                        {spec === 'stock' && (product.stock > 0 ? 'In Stock' : 'Out of Stock')}
                        {spec === 'warranty' && (product.warranty || 'N/A')}
                        {spec === 'brand' && (product.brand || 'N/A')}
                      </td>
                    ))}
                  </tr>
                ))}
                <tr>
                  <td colSpan={compareList.length + 1} className="px-4 py-4">
                    <div className="flex gap-4 justify-center">
                      {compareList.map((product) => (
                        <Link
                          key={product.id}
                          href={`/shopping/${product.id}`}
                          className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 font-semibold"
                        >
                          View Details
                        </Link>
                      ))}
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-12 bg-white rounded-lg">
            <p className="text-gray-600 mb-4">No products selected for comparison yet.</p>
            <p className="text-gray-600">Search and add up to 4 products to compare.</p>
          </div>
        )}
      </div>
    </div>
  );
}
