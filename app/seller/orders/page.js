'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

export const dynamic = 'force-dynamic';

export default function SellerOrdersPage() {
  const router = useRouter();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const token = localStorage.getItem('token');
    if (!token) { router.push('/sign_in'); return; }
    fetch('/api/seller/orders', { headers: { 'Authorization': `Bearer ${token}` } })
      .then(r => r.json()).then(d => setOrders(d.orders||[])).catch(console.error).finally(() => setLoading(false));
  }, [router]);

  const filteredOrders = orders.filter(o => filter === 'all' || o.status === filter);

  if (!mounted || loading) return <div className="min-h-screen flex items-center justify-center"><p className="text-gray-600">Loading orders...</p></div>;

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold mb-8 text-gray-900">My Orders</h1>
        <div className="mb-6 flex gap-2 flex-wrap">
          {['all','pending','processing','shipped','delivered','cancelled'].map(f => (
            <button key={f} onClick={() => setFilter(f)}
              className={`px-4 py-2 rounded-lg font-semibold capitalize ${filter===f?'bg-blue-600 text-white':'bg-white text-gray-900 border border-gray-300'}`}>{f}</button>
          ))}
        </div>
        {filteredOrders.length > 0 ? (
          <div className="bg-white rounded-lg shadow overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-100 border-b">
                <tr>{['Order ID','Customer','Total','Status','Date'].map(h=><th key={h} className="px-6 py-4 text-left font-semibold text-gray-900">{h}</th>)}</tr>
              </thead>
              <tbody>
                {filteredOrders.map(o=>(
                  <tr key={o.id} className="border-b hover:bg-gray-50">
                    <td className="px-6 py-4 font-semibold">#{o.id?.slice(0,8)}</td>
                    <td className="px-6 py-4">{o.customerName}</td>
                    <td className="px-6 py-4">${o.total}</td>
                    <td className="px-6 py-4"><span className="capitalize px-2 py-1 bg-blue-100 text-blue-800 rounded text-sm">{o.status}</span></td>
                    <td className="px-6 py-4 text-gray-600 text-sm">{new Date(o.createdAt).toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : <div className="text-center py-12 bg-white rounded-lg"><p className="text-gray-600">No orders found.</p></div>}
      </div>
    </div>
  );
}
