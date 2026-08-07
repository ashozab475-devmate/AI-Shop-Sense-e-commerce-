'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';

function SellerAnalyticsContent() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (status === 'loading') return;
    if (status === 'unauthenticated') { router.push('/sign_in'); return; }
    if (session?.user?.role !== 'seller' && session?.user?.role !== 'admin') { router.push('/'); return; }
    if (status === 'authenticated') {
      fetch('/api/seller/analytics').then(r => r.json()).then(setAnalytics).catch(console.error).finally(() => setLoading(false));
    }
  }, [status, session, router]);

  if (status === 'loading' || loading) return <div className="min-h-screen flex items-center justify-center"><p className="text-gray-600">Loading analytics...</p></div>;

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold mb-8 text-gray-900">Analytics</h1>
        <div className="grid md:grid-cols-4 gap-6 mb-8">
          {[['Total Sales', `$${analytics?.totalSales || 0}`, '+12% from last month', 'text-green-600'],
            ['Total Orders', analytics?.totalOrders || 0, '+8% from last month', 'text-green-600'],
            ['Total Products', analytics?.totalProducts || 0, `${analytics?.activeProducts || 0} active`, 'text-blue-600'],
            ['Avg Rating', `${analytics?.avgRating || 0}★`, `${analytics?.totalReviews || 0} reviews`, 'text-gray-600'],
          ].map(([label, val, sub, cls]) => (
            <div key={label} className="bg-white rounded-lg shadow p-6">
              <p className="text-gray-600 text-sm font-semibold mb-2">{label}</p>
              <p className="text-3xl font-bold text-gray-900">{val}</p>
              <p className={`text-sm mt-2 ${cls}`}>{sub}</p>
            </div>
          ))}
        </div>
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
              {analytics?.topProducts?.map((p, i) => (
                <div key={i} className="flex justify-between items-center pb-3 border-b last:border-b-0">
                  <span className="text-gray-900">{p.name}</span>
                  <span className="font-semibold text-gray-900">{p.sales} sales</span>
                </div>
              )) || <p className="text-gray-600">No data available</p>}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function SellerAnalyticsPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><p>Loading...</p></div>}>
      <SellerAnalyticsContent />
    </Suspense>
  );
}
