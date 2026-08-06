'use client';

export const dynamic = 'force-dynamic';

import Link from 'next/link';
import { useState } from 'react';

const helpCategories = [
  {
    title: 'Getting Started',
    icon: '🚀',
    articles: [
      { title: 'Create an Account', slug: 'create-account' },
      { title: 'Sign In to Your Account', slug: 'sign-in' },
      { title: 'Reset Your Password', slug: 'reset-password' },
    ]
  },
  {
    title: 'Shopping',
    icon: '🛍️',
    articles: [
      { title: 'How to Search for Products', slug: 'search-products' },
      { title: 'Filter and Sort Products', slug: 'filter-sort' },
      { title: 'Add Items to Cart', slug: 'add-to-cart' },
      { title: 'Save Items to Wishlist', slug: 'wishlist' },
    ]
  },
  {
    title: 'Checkout & Payment',
    icon: '💳',
    articles: [
      { title: 'How to Checkout', slug: 'checkout' },
      { title: 'Payment Methods', slug: 'payment-methods' },
      { title: 'Secure Payment', slug: 'secure-payment' },
      { title: 'Promo Codes', slug: 'promo-codes' },
    ]
  },
  {
    title: 'Orders & Shipping',
    icon: '📦',
    articles: [
      { title: 'Track Your Order', slug: 'track-order' },
      { title: 'Shipping Methods', slug: 'shipping-methods' },
      { title: 'Delivery Times', slug: 'delivery-times' },
      { title: 'Change Shipping Address', slug: 'change-address' },
    ]
  },
  {
    title: 'Returns & Refunds',
    icon: '↩️',
    articles: [
      { title: 'Return an Item', slug: 'return-item' },
      { title: 'Refund Status', slug: 'refund-status' },
      { title: 'Exchange Items', slug: 'exchange' },
      { title: 'Return Policy', slug: 'return-policy' },
    ]
  },
  {
    title: 'Account & Profile',
    icon: '👤',
    articles: [
      { title: 'Update Profile', slug: 'update-profile' },
      { title: 'Change Password', slug: 'change-password' },
      { title: 'Manage Addresses', slug: 'manage-addresses' },
      { title: 'Delete Account', slug: 'delete-account' },
    ]
  },
];

export default function HelpPage() {
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState(null);

  const filteredCategories = helpCategories.map(cat => ({
    ...cat,
    articles: cat.articles.filter(article =>
      article.title.toLowerCase().includes(search.toLowerCase())
    )
  })).filter(cat => cat.articles.length > 0);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-12 px-4">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-4xl font-bold text-center mb-4 text-gray-900">Help Center</h1>
        <p className="text-center text-gray-600 mb-8">Find answers and learn how to use ShopSense</p>

        <div className="mb-12">
          <input
            type="text"
            placeholder="Search help articles..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        {search ? (
          <div className="space-y-8">
            {filteredCategories.length > 0 ? (
              filteredCategories.map((category, idx) => (
                <div key={idx}>
                  <h2 className="text-2xl font-bold text-gray-900 mb-4">{category.title}</h2>
                  <div className="grid md:grid-cols-2 gap-4">
                    {category.articles.map((article, aidx) => (
                      <Link
                        key={aidx}
                        href={`/help/${article.slug}`}
                        className="bg-white p-4 rounded-lg shadow hover:shadow-lg transition"
                      >
                        <p className="font-semibold text-gray-900 hover:text-blue-600">{article.title}</p>
                      </Link>
                    ))}
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-12">
                <p className="text-gray-600 mb-4">No articles found for "{search}"</p>
                <Link href="/contact" className="text-blue-600 hover:text-blue-800 font-semibold">Contact support</Link>
              </div>
            )}
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {helpCategories.map((category, idx) => (
              <div
                key={idx}
                onClick={() => setSelectedCategory(selectedCategory === idx ? null : idx)}
                className="bg-white rounded-lg shadow-lg p-6 cursor-pointer hover:shadow-xl transition"
              >
                <div className="text-4xl mb-4">{category.icon}</div>
                <h3 className="text-xl font-bold text-gray-900 mb-4">{category.title}</h3>
                <ul className="space-y-2">
                  {category.articles.map((article, aidx) => (
                    <li key={aidx}>
                      <Link
                        href={`/help/${article.slug}`}
                        className="text-blue-600 hover:text-blue-800 text-sm"
                      >
                        {article.title}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        )}

        <div className="mt-12 bg-white rounded-lg shadow-lg p-8 text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Still need help?</h2>
          <p className="text-gray-600 mb-6">Can't find what you're looking for? Contact our support team.</p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/contact" className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 font-semibold">
              Contact Support
            </Link>
            <Link href="/faq" className="bg-gray-600 text-white px-6 py-3 rounded-lg hover:bg-gray-700 font-semibold">
              View FAQ
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
