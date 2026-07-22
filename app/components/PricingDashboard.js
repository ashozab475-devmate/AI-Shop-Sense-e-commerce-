'use client';

import React, { useState, useEffect } from 'react';
import { TrendingUp, TrendingDown, DollarSign, BarChart3, AlertCircle } from 'lucide-react';

export default function PricingDashboard({ productId }) {
    const [priceData, setPriceData] = useState(null);
    const [history, setHistory] = useState([]);
    const [analytics, setAnalytics] = useState(null);
    const [competitors, setCompetitors] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        fetchPricingData();
        const interval = setInterval(fetchPricingData, 60000); // Refresh every minute
        return () => clearInterval(interval);
    }, [productId]);

    const fetchPricingData = async () => {
        try {
            setLoading(true);
            
            // Fetch current price calculation
            const priceRes = await fetch(`/api/pricing/calculate/${productId}`, {
                method: 'POST'
            });
            const priceJson = await priceRes.json();
            setPriceData(priceJson.data);
            
            // Fetch price history
            const historyRes = await fetch(`/api/pricing/history/${productId}`);
            const historyJson = await historyRes.json();
            setHistory(historyJson.data || []);
            
            // Fetch analytics
            const analyticsRes = await fetch(`/api/pricing/analytics?productId=${productId}`);
            const analyticsJson = await analyticsRes.json();
            setAnalytics(analyticsJson.data);
            
            // Fetch competitor prices
            const competitorsRes = await fetch(`/api/pricing/competitors?productId=${productId}`);
            const competitorsJson = await competitorsRes.json();
            setCompetitors(competitorsJson.data);
            
            setError(null);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleUpdatePrice = async () => {
        try {
            const res = await fetch(`/api/pricing/update/${productId}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ reason: 'manual_update' })
            });
            const json = await res.json();
            if (json.success) {
                fetchPricingData();
            }
        } catch (err) {
            setError(err.message);
        }
    };

    if (loading) {
        return <div className="text-center py-8">Loading pricing data...</div>;
    }

    return (
        <div className="space-y-6">
            {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center gap-3">
                    <AlertCircle className="w-5 h-5 text-red-600" />
                    <span className="text-red-700">{error}</span>
                </div>
            )}

            {/* Price Overview */}
            {priceData && (
                <div className="grid md:grid-cols-3 gap-6">
                    <div className="bg-white rounded-lg border border-gray-200 p-6">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-gray-600 font-medium">Current Price</h3>
                            <DollarSign className="w-5 h-5 text-blue-600" />
                        </div>
                        <div className="text-3xl font-bold text-gray-900">
                            ${priceData.newPrice.toFixed(2)}
                        </div>
                        <p className="text-sm text-gray-500 mt-2">
                            Base: ${priceData.oldPrice.toFixed(2)}
                        </p>
                    </div>

                    <div className="bg-white rounded-lg border border-gray-200 p-6">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-gray-600 font-medium">Price Change</h3>
                            {priceData.newPrice > priceData.oldPrice ? (
                                <TrendingUp className="w-5 h-5 text-green-600" />
                            ) : (
                                <TrendingDown className="w-5 h-5 text-red-600" />
                            )}
                        </div>
                        <div className={`text-3xl font-bold ${priceData.newPrice > priceData.oldPrice ? 'text-green-600' : 'text-red-600'}`}>
                            {((priceData.newPrice - priceData.oldPrice) / priceData.oldPrice * 100).toFixed(1)}%
                        </div>
                        <p className="text-sm text-gray-500 mt-2">
                            ${Math.abs(priceData.newPrice - priceData.oldPrice).toFixed(2)}
                        </p>
                    </div>

                    <div className="bg-white rounded-lg border border-gray-200 p-6">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-gray-600 font-medium">Adjustment Factors</h3>
                            <BarChart3 className="w-5 h-5 text-purple-600" />
                        </div>
                        <div className="space-y-2 text-sm">
                            <div className="flex justify-between">
                                <span className="text-gray-600">Stock:</span>
                                <span className="font-medium">{(priceData.factors.stock * 100).toFixed(1)}%</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-gray-600">Demand:</span>
                                <span className="font-medium">{(priceData.factors.demand * 100).toFixed(1)}%</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-gray-600">Competitor:</span>
                                <span className="font-medium">{(priceData.factors.competitor * 100).toFixed(1)}%</span>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Demand Metrics */}
            {analytics && (
                <div className="bg-white rounded-lg border border-gray-200 p-6">
                    <h3 className="text-lg font-bold text-gray-900 mb-4">Demand Metrics</h3>
                    <div className="grid md:grid-cols-3 gap-6">
                        <div>
                            <p className="text-gray-600 text-sm mb-2">Views</p>
                            <p className="text-2xl font-bold text-gray-900">{analytics.viewCount}</p>
                        </div>
                        <div>
                            <p className="text-gray-600 text-sm mb-2">Cart Adds</p>
                            <p className="text-2xl font-bold text-gray-900">{analytics.cartAddCount}</p>
                        </div>
                        <div>
                            <p className="text-gray-600 text-sm mb-2">Purchases</p>
                            <p className="text-2xl font-bold text-gray-900">{analytics.purchaseCount}</p>
                        </div>
                    </div>
                </div>
            )}

            {/* Competitor Prices */}
            {competitors && (
                <div className="bg-white rounded-lg border border-gray-200 p-6">
                    <h3 className="text-lg font-bold text-gray-900 mb-4">Competitor Analysis</h3>
                    <div className="grid md:grid-cols-4 gap-6">
                        <div>
                            <p className="text-gray-600 text-sm mb-2">Average Price</p>
                            <p className="text-2xl font-bold text-gray-900">${competitors.average?.toFixed(2)}</p>
                        </div>
                        <div>
                            <p className="text-gray-600 text-sm mb-2">Lowest Price</p>
                            <p className="text-2xl font-bold text-green-600">${competitors.min?.toFixed(2)}</p>
                        </div>
                        <div>
                            <p className="text-gray-600 text-sm mb-2">Highest Price</p>
                            <p className="text-2xl font-bold text-red-600">${competitors.max?.toFixed(2)}</p>
                        </div>
                        <div>
                            <p className="text-gray-600 text-sm mb-2">Competitors</p>
                            <p className="text-2xl font-bold text-gray-900">{competitors.count}</p>
                        </div>
                    </div>
                </div>
            )}

            {/* Price History */}
            {history.length > 0 && (
                <div className="bg-white rounded-lg border border-gray-200 p-6">
                    <h3 className="text-lg font-bold text-gray-900 mb-4">Price History</h3>
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-4 py-2 text-left text-gray-600 font-medium">Date</th>
                                    <th className="px-4 py-2 text-left text-gray-600 font-medium">Old Price</th>
                                    <th className="px-4 py-2 text-left text-gray-600 font-medium">New Price</th>
                                    <th className="px-4 py-2 text-left text-gray-600 font-medium">Change</th>
                                    <th className="px-4 py-2 text-left text-gray-600 font-medium">Reason</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200">
                                {history.slice(0, 10).map((entry) => (
                                    <tr key={entry.id} className="hover:bg-gray-50">
                                        <td className="px-4 py-2 text-gray-900">
                                            {new Date(entry.timestamp).toLocaleDateString()}
                                        </td>
                                        <td className="px-4 py-2 text-gray-900">${entry.oldPrice.toFixed(2)}</td>
                                        <td className="px-4 py-2 text-gray-900">${entry.newPrice.toFixed(2)}</td>
                                        <td className={`px-4 py-2 font-medium ${entry.newPrice > entry.oldPrice ? 'text-green-600' : 'text-red-600'}`}>
                                            {((entry.newPrice - entry.oldPrice) / entry.oldPrice * 100).toFixed(1)}%
                                        </td>
                                        <td className="px-4 py-2 text-gray-600">{entry.reason}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* Action Button */}
            <button
                onClick={handleUpdatePrice}
                className="w-full px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-colors"
            >
                Update Price Now
            </button>
        </div>
    );
}
