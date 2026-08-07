'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

export default function AdminDashboardPage() {
  const router = useRouter();
  const [dashboard, setDashboard] = useState(null);
  const [loading, setLoading] = useState(true);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const token = localStorage.getItem('token');
    if (!token) { router.push('/sign_in'); return; }

    fetch('/api/admin/dashboard', {
      headers: { 'Authorization': `Bearer ${token}` },
    })
      .then(r => r.json())
      .then(setDashboard)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [router]);

  if (!mounted || loading) {
    return <div className="min-h-screen bg-gray-50 flex items-center justify-center"><p className="text-gray-600">Loading dashboard...</p></div>;
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold mb-8 text-gray-900">Admin Dashboard</h1>
        <div className="grid md:grid-cols-4 gap-6 mb-8">
          {[
            ['Total Revenue', `$${dashboard?.totalRevenue || 0}`, '+15% from last month', 'text-green-600'],
            ['Total Orders',  dashboard?.totalOrders || 0,         '+10% from last month', 'text-green-600'],
            ['Total Users',   dashboard?.totalUsers  || 0,         `${dashboard?.activeUsers || 0} active today`, 'text-blue-600'],
            ['Total Products',dashboard?.totalProducts||0,         `${dashboard?.approvedProducts||0} approved`, 'text-gray-600'],
          ].map(([label, val, sub, cls]) => (
            <div key={label} className="bg-white rounded-lg shadow p-6">
              <p className="text-gray-600 text-sm font-semibold mb-2">{label}</p>
              <p className="text-3xl font-bold text-gray-900">{val}</p>
              <p className={`text-sm mt-2 ${cls}`}>{sub}</p>
            </div>
          ))}
        </div>
        <div className="grid md:grid-cols-4 gap-4 mb-8">
          {[['👥','Manage Users','/admin/users'],['📦','Manage Products','/admin/products'],['📋','Manage Orders','/admin'],['📊','View Analytics','/admin/analytics']].map(([icon,label,href]) => (
            <Link key={label} href={href} className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition text-center">
              <p className="text-2xl mb-2">{icon}</p><p className="font-semibold text-gray-900">{label}</p>
            </Link>
          ))}
        </div>
        <div className="grid md:grid-cols-2 gap-6">
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Recent Orders</h2>
            <div className="space-y-3">
              {dashboard?.recentOrders?.map((order, idx) => (
                <div key={idx} className="flex justify-between items-center pb-3 border-b last:border-b-0">
                  <div><p className="font-semibold text-gray-900">Order #{order.id?.slice(0, 8)}</p><p className="text-sm text-gray-600">{order.customerName}</p></div>
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
                  <div><p className="font-semibold text-gray-900">{user.name}</p><p className="text-sm text-gray-600">{user.email}</p></div>
                  <span className="text-xs px-2 py-1 bg-blue-100 text-blue-800 rounded capitalize">{user.role}</span>
                </div>
              )) || <p className="text-gray-600">No recent users</p>}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
