'use client';

import { useState } from 'react';

const faqData = [
  {
    category: 'Shipping',
    items: [
      { q: 'How long does shipping take?', a: 'Standard shipping takes 5-7 business days. Express shipping takes 2-3 business days.' },
      { q: 'Do you offer free shipping?', a: 'Yes! Free shipping on orders over $50.' },
      { q: 'Can I track my order?', a: 'Yes, you can track your order in the Shipping section of your account.' },
    ]
  },
  {
    category: 'Returns',
    items: [
      { q: 'What is your return policy?', a: 'We offer 30-day returns on most items. See our return policy for details.' },
      { q: 'How do I return an item?', a: 'Go to your Orders page, select the item, and click "Return Item".' },
      { q: 'When will I get my refund?', a: 'Refunds are processed within 5-7 business days after we receive your return.' },
    ]
  },
  {
    category: 'Payments',
    items: [
      { q: 'What payment methods do you accept?', a: 'We accept credit cards, debit cards, PayPal, and digital wallets.' },
      { q: 'Is my payment information secure?', a: 'Yes, we use SSL encryption and PCI compliance to protect your data.' },
      { q: 'Can I save my payment method?', a: 'Yes, you can save payment methods for faster checkout.' },
    ]
  },
  {
    category: 'Account',
    items: [
      { q: 'How do I create an account?', a: 'Click Sign Up and fill in your email and password.' },
      { q: 'How do I reset my password?', a: 'Click "Forgot Password" on the login page and follow the instructions.' },
      { q: 'Can I delete my account?', a: 'Yes, go to Account Settings and click "Delete Account".' },
    ]
  },
];

export default function FAQPage() {
  const [search, setSearch] = useState('');
  const [expandedIndex, setExpandedIndex] = useState(null);

  const filteredFAQ = faqData.map(category => ({
    ...category,
    items: category.items.filter(item =>
      item.q.toLowerCase().includes(search.toLowerCase()) ||
      item.a.toLowerCase().includes(search.toLowerCase())
    )
  })).filter(category => category.items.length > 0);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-bold text-center mb-4 text-gray-900">Frequently Asked Questions</h1>
        <p className="text-center text-gray-600 mb-8">Find answers to common questions</p>

        <div className="mb-8">
          <input
            type="text"
            placeholder="Search FAQ..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        {filteredFAQ.length > 0 ? (
          <div className="space-y-8">
            {filteredFAQ.map((category, catIdx) => (
              <div key={catIdx}>
                <h2 className="text-2xl font-bold text-gray-900 mb-4">{category.category}</h2>
                <div className="space-y-3">
                  {category.items.map((item, itemIdx) => (
                    <div key={itemIdx} className="bg-white rounded-lg shadow">
                      <button
                        onClick={() => setExpandedIndex(expandedIndex === `${catIdx}-${itemIdx}` ? null : `${catIdx}-${itemIdx}`)}
                        className="w-full px-6 py-4 text-left hover:bg-gray-50 flex justify-between items-center"
                      >
                        <span className="font-semibold text-gray-900">{item.q}</span>
                        <span className="text-blue-600">{expandedIndex === `${catIdx}-${itemIdx}` ? '−' : '+'}</span>
                      </button>
                      {expandedIndex === `${catIdx}-${itemIdx}` && (
                        <div className="px-6 py-4 border-t border-gray-200 text-gray-600">
                          {item.a}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <p className="text-gray-600 mb-4">No results found for "{search}"</p>
            <a href="/contact" className="text-blue-600 hover:text-blue-800 font-semibold">Contact us for help</a>
          </div>
        )}
      </div>
    </div>
  );
}
