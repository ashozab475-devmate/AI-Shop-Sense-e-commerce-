'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function AdminDashboardPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [dashboard, setDashboard] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/sign_in');
      return;
    }

    if (session?.user?.role !== 'admin') {
      router.push('/');
      return;
    }

    const fetchDashboard = async () => {
      try {
        const res = await fetch('/api/admin/dashboard');
        const data = await res.json();
        setDashboard(data);
      } catch (error) {
        console.error('Error fetching dashboard:', error);
      } finally {
        setLoading(false);
      }
    };

    if (status === 'authenticated') {
      fetchDashboard();
    }
  }, [status, session, router]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 py-8 px-4">
        <div className="max-w-6xl mx-auto">
          <p className="text-center text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold mb-8 text-gray-900">Admin Dashboard</h1>

        {/* Stats Cards */}
        <div className="grid md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <p className="text-gray-600 text-sm font-semibold mb-2">Total Revenue</p>
            <p className="text-3xl font-bold text-gray-900">${dashboard?.totalRevenue || 0}</p>
            <p className="text-green-600 text-sm mt-2">+15% from last month</p>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <p className="text-gray-600 text-sm font-semibold mb-2">Total Orders</p>
            <p className="text-3xl font-bold text-gray-900">{dashboard?.totalOrders || 0}</p>
            <p className="text-green-600 text-sm mt-2">+10% from last month</p>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <p className="text-gray-600 text-sm font-semibold mb-2">Total Users</p>
            <p className="text-3xl font-bold text-gray-900">{dashboard?.totalUsers || 0}</p>
            <p className="text-blue-600 text-sm mt-2">{dashboard?.activeUsers || 0} active today</p>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <p className="text-gray-600 text-sm font-semibold mb-2">Total Products</p>
            <p className="text-3xl font-bold text-gray-900">{dashboard?.totalProducts || 0}</p>
            <p className="text-gray-600 text-sm mt-2">{dashboard?.approvedProducts || 0} approved</p>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid md:grid-cols-4 gap-4 mb-8">
          <Link
            href="/admin/users"
            className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition text-center"
          >
            <p className="text-2xl mb-2">👥</p>
            <p className="font-semibold text-gray-900">Manage Users</p>
          </Link>
          <Link
            href="/admin/products"
            className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition text-center"
          >
            <p className="text-2xl mb-2">📦</p>
            <p className="font-semibold text-gray-900">Manage Products</p>
          </Link>
          <Link
            href="/admin/orders"
            className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition text-center"
          >
            <p className="text-2xl mb-2">📋</p>
            <p className="font-semibold text-gray-900">Manage Orders</p>
          </Link>
          <Link
            href="/admin/analytics"
            className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition text-center"
          >
            <p className="text-2xl mb-2">📊</p>
            <p className="font-semibold text-gray-900">View Analytics</p>
          </Link>
        </div>

        {/* Recent Orders */}
        <div className="grid md:grid-cols-2 gap-6">
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Recent Orders</h2>
            <div className="space-y-3">
              {dashboard?.recentOrders?.map((order, idx) => (
                <div key={idx} className="flex justify-between items-center pb-3 border-b last:border-b-0">
                  <div>
                    <p className="font-semibold text-gray-900">Order #{order.id.slice(0, 8)}</p>
                    <p className="text-sm text-gray-600">{order.customerName}</p>
                  </div>
                  <p className="font-semibold text-gray-900">${order.total}</p>
                </div>
              )) || <p className="text-gray-600">No recent orders</p>}
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Recent Users</h2>
            <div className="space-y-3">
              {dashboard?.recentUsers?.map((user, idx) => (
                <div key={idx} className="flex justify-between items-center pb-3 border-b last:border-b-0">
                  <div>
                    <p className="font-semibold text-gray-900">{user.name}</p>
                    <p className="text-sm text-gray-600">{user.email}</p>
                  </div>
                  <span className="text-xs px-2 py-1 bg-blue-100 text-blue-800 rounded capitalize">
                    {user.role}
                  </span>
                </div>
              )) || <p className="text-gray-600">No recent users</p>}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
