'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';

export default function AdminAnalyticsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState('month');

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/sign_in');
      return;
    }

    if (session?.user?.role !== 'admin') {
      router.push('/');
      return;
    }

    const fetchAnalytics = async () => {
      try {
        const res = await fetch(`/api/admin/analytics?period=${period}`);
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
  }, [status, session, router, period]);

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
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Analytics</h1>
          <select
            value={period}
            onChange={(e) => setPeriod(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg"
          >
            <option value="week">This Week</option>
            <option value="month">This Month</option>
            <option value="year">This Year</option>
          </select>
        </div>

        {/* Revenue Analytics */}
        <div className="grid md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <p className="text-gray-600 text-sm font-semibold mb-2">Total Revenue</p>
            <p className="text-3xl font-bold text-gray-900">${analytics?.revenue?.total || 0}</p>
            <p className="text-green-600 text-sm mt-2">+{analytics?.revenue?.growth || 0}% growth</p>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <p className="text-gray-600 text-sm font-semibold mb-2">Avg Order Value</p>
            <p className="text-3xl font-bold text-gray-900">${analytics?.revenue?.avgOrder || 0}</p>
            <p className="text-gray-600 text-sm mt-2">{analytics?.revenue?.totalOrders || 0} orders</p>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <p className="text-gray-600 text-sm font-semibold mb-2">Conversion Rate</p>
            <p className="text-3xl font-bold text-gray-900">{analytics?.revenue?.conversionRate || 0}%</p>
            <p className="text-gray-600 text-sm mt-2">From {analytics?.revenue?.visitors || 0} visitors</p>
          </div>
        </div>

        {/* User Analytics */}
        <div className="grid md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <p className="text-gray-600 text-sm font-semibold mb-2">New Users</p>
            <p className="text-3xl font-bold text-gray-900">{analytics?.users?.new || 0}</p>
            <p className="text-blue-600 text-sm mt-2">+{analytics?.users?.newGrowth || 0}% from last period</p>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <p className="text-gray-600 text-sm font-semibold mb-2">Active Users</p>
            <p className="text-3xl font-bold text-gray-900">{analytics?.users?.active || 0}</p>
            <p className="text-gray-600 text-sm mt-2">{analytics?.users?.activePercent || 0}% of total</p>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <p className="text-gray-600 text-sm font-semibold mb-2">Retention Rate</p>
            <p className="text-3xl font-bold text-gray-900">{analytics?.users?.retention || 0}%</p>
            <p className="text-gray-600 text-sm mt-2">Returning customers</p>
          </div>
        </div>

        {/* Product Analytics */}
        <div className="grid md:grid-cols-2 gap-6">
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Top Products</h2>
            <div className="space-y-3">
              {analytics?.products?.top?.map((product, idx) => (
                <div key={idx} className="flex justify-between items-center pb-3 border-b last:border-b-0">
                  <span className="text-gray-900">{product.name}</span>
                  <span className="font-semibold text-gray-900">{product.sales} sales</span>
                </div>
              )) || <p className="text-gray-600">No data available</p>}
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Category Performance</h2>
            <div className="space-y-3">
              {analytics?.products?.categories?.map((cat, idx) => (
                <div key={idx} className="flex justify-between items-center pb-3 border-b last:border-b-0">
                  <span className="text-gray-900">{cat.name}</span>
                  <span className="font-semibold text-gray-900">${cat.revenue}</span>
                </div>
              )) || <p className="text-gray-600">No data available</p>}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
