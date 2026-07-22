'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';

export default function SellerAnalyticsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/sign_in');
      return;
    }

    if (session?.user?.role !== 'seller' && session?.user?.role !== 'admin') {
      router.push('/');
      return;
    }

    const fetchAnalytics = async () => {
      try {
        const res = await fetch('/api/seller/analytics');
        const data = await res.json();
        setAnalytics(data);
      } catch (error) {
        console.error('Error fetching analytics:', error);
      } finally {
        setLoading(false);
      }
    };

    if (status === 'authenticated') {
      fetchAnalytics();
    }
  }, [status, session, router]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 py-8 px-4">
        <div className="max-w-6xl mx-auto">
          <p className="text-center text-gray-600">Loading analytics...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold mb-8 text-gray-900">Analytics</h1>

        {/* Stats Cards */}
        <div className="grid md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <p className="text-gray-600 text-sm font-semibold mb-2">Total Sales</p>
            <p className="text-3xl font-bold text-gray-900">${analytics?.totalSales || 0}</p>
            <p className="text-green-600 text-sm mt-2">+12% from last month</p>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <p className="text-gray-600 text-sm font-semibold mb-2">Total Orders</p>
            <p className="text-3xl font-bold text-gray-900">{analytics?.totalOrders || 0}</p>
            <p className="text-green-600 text-sm mt-2">+8% from last month</p>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <p className="text-gray-600 text-sm font-semibold mb-2">Total Products</p>
            <p className="text-3xl font-bold text-gray-900">{analytics?.totalProducts || 0}</p>
            <p className="text-blue-600 text-sm mt-2">{analytics?.activeProducts || 0} active</p>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <p className="text-gray-600 text-sm font-semibold mb-2">Avg Rating</p>
            <p className="text-3xl font-bold text-gray-900">{analytics?.avgRating || 0}★</p>
            <p className="text-gray-600 text-sm mt-2">Based on {analytics?.totalReviews || 0} reviews</p>
          </div>
        </div>

        {/* Charts Placeholder */}
        <div className="grid md:grid-cols-2 gap-6">
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Sales Trend</h2>
            <div className="h-64 bg-gray-100 rounded flex items-center justify-center">
              <p className="text-gray-600">Chart visualization coming soon</p>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Top Products</h2>
            <div className="space-y-3">
              {analytics?.topProducts?.map((product, idx) => (
                <div key={idx} className="flex justify-between items-center pb-3 border-b last:border-b-0">
                  <span className="text-gray-900">{product.name}</span>
                  <span className="font-semibold text-gray-900">{product.sales} sales</span>
                </div>
              )) || <p className="text-gray-600">No data available</p>}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
