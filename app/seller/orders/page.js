'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';

function SellerOrdersContent() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    if (status === 'loading') return;
    if (status === 'unauthenticated') { router.push('/sign_in'); return; }
    if (session?.user?.role !== 'seller' && session?.user?.role !== 'admin') { router.push('/'); return; }
    if (status === 'authenticated') {
      fetch('/api/seller/orders').then(r => r.json()).then(d => setOrders(d.orders || [])).catch(console.error).finally(() => setLoading(false));
    }
  }, [status, session, router]);

  const handleStatusUpdate = async (orderId, newStatus) => {
    await fetch(`/api/seller/orders/${orderId}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ status: newStatus }) });
    setOrders(orders.map(o => o.id === orderId ? { ...o, status: newStatus } : o));
  };

  const filtered = orders.filter(o => filter === 'all' || o.status === filter);

  if (status === 'loading' || loading) return <div className="min-h-screen flex items-center justify-center"><p className="text-gray-600">Loading orders...</p></div>;

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold mb-8 text-gray-900">My Orders</h1>
        <div className="mb-6 flex gap-2 flex-wrap">
          {['all','pending','processing','shipped','delivered','cancelled'].map(f => (
            <button key={f} onClick={() => setFilter(f)}
              className={`px-4 py-2 rounded-lg font-semibold capitalize ${filter === f ? 'bg-blue-600 text-white' : 'bg-white text-gray-900 border border-gray-300 hover:bg-gray-50'}`}>{f}</button>
          ))}
        </div>
        {filtered.length > 0 ? (
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-100 border-b">
                <tr>{['Order ID','Customer','Total','Status','Date','Actions'].map(h => <th key={h} className="px-6 py-4 text-left font-semibold text-gray-900">{h}</th>)}</tr>
              </thead>
              <tbody>
                {filtered.map(order => (
                  <tr key={order.id} className="border-b hover:bg-gray-50">
                    <td className="px-6 py-4 font-semibold">#{order.id.slice(0,8)}</td>
                    <td className="px-6 py-4">{order.customerName}</td>
                    <td className="px-6 py-4">${order.total}</td>
                    <td className="px-6 py-4">
                      <select value={order.status} onChange={e => handleStatusUpdate(order.id, e.target.value)} className="px-3 py-1 border border-gray-300 rounded-lg text-sm">
                        {['pending','processing','shipped','delivered','cancelled'].map(s => <option key={s} value={s}>{s}</option>)}
                      </select>
                    </td>
                    <td className="px-6 py-4 text-gray-600 text-sm">{new Date(order.createdAt).toLocaleDateString()}</td>
                    <td className="px-6 py-4"><button className="text-blue-600 hover:text-blue-800 font-semibold text-sm">View</button></td>
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

export default function SellerOrdersPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><p>Loading...</p></div>}>
      <SellerOrdersContent />
    </Suspense>
  );
}
