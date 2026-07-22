'use client';

import React, { useState } from 'react';
import PricingDashboard from '../components/PricingDashboard';

export default function PricingPageClient({ initialProducts }) {
    const [selectedProductId, setSelectedProductId] = useState(
        initialProducts.length > 0 ? initialProducts[0].id : null
    );

    return (
        <div className="grid lg:grid-cols-4 gap-6">
            {/* Product List */}
            <div className="lg:col-span-1">
                <div className="bg-white rounded-lg border border-gray-200 p-4 sticky top-32">
                    <h2 className="text-lg font-bold text-gray-900 mb-4">Your Products</h2>
                    <div className="space-y-2 max-h-[600px] overflow-y-auto">
                        {initialProducts.map((product) => (
                            <button
                                key={product.id}
                                onClick={() => setSelectedProductId(product.id)}
                                className={`w-full text-left px-4 py-3 rounded-lg transition-colors ${
                                    selectedProductId === product.id
                                        ? 'bg-blue-100 border border-blue-300 text-blue-900'
                                        : 'bg-gray-50 hover:bg-gray-100 text-gray-900'
                                }`}
                            >
                                <p className="font-medium truncate">{product.name}</p>
                                <p className="text-sm text-gray-600">
                                    ${product.currentPrice.toFixed(2)}
                                </p>
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* Pricing Dashboard */}
            <div className="lg:col-span-3">
                {selectedProductId ? (
                    <PricingDashboard productId={selectedProductId} />
                ) : (
                    <div className="bg-white rounded-lg border border-gray-200 p-8 text-center">
                        <p className="text-gray-600">No products available</p>
                    </div>
                )}
            </div>
        </div>
    );
}
