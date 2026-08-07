'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

export const dynamic = 'force-dynamic';

export default function SellerAnalyticsPage() {
  const router = useRouter();
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const token = localStorage.getItem('token');
    if (!token) { router.push('/sign_in'); return; }
    fetch('/api/seller/analytics', { headers: { 'Authorization': `Bearer ${token}` } })
      .then(r => r.json()).then(setAnalytics).catch(console.error).finally(() => setLoading(false));
  }, [router]);

  if (!mounted || loading) return <div className="min-h-screen flex items-center justify-center"><p className="text-gray-600">Loading analytics...</p></div>;

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold mb-8 text-gray-900">Analytics</h1>
        <div className="grid md:grid-cols-4 gap-6 mb-8">
          {[['Total Sales',`$${analytics?.totalSales||0}`,'text-green-600'],['Total Orders',analytics?.totalOrders||0,'text-green-600'],
            ['Total Products',analytics?.totalProducts||0,'text-blue-600'],['Avg Rating',`${analytics?.avgRating||0}★`,'text-gray-600']
          ].map(([label,val,cls]) => (
            <div key={label} className="bg-white rounded-lg shadow p-6">
              <p className="text-gray-600 text-sm font-semibold mb-2">{label}</p>
              <p className={`text-3xl font-bold ${cls}`}>{val}</p>
            </div>
          ))}
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Top Products</h2>
          {analytics?.topProducts?.map((p,i) => (
            <div key={i} className="flex justify-between pb-3 border-b last:border-0">
              <span>{p.name}</span><span className="font-semibold">{p.sales} sales</span>
            </div>
          )) || <p className="text-gray-600">No data available</p>}
        </div>
      </div>
    </div>
  );
}
