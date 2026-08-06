'use client';

export const dynamic = 'force-dynamic';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Package, ArrowLeft } from 'lucide-react';
import Navbar from '@/app/components/Navbar';
import Footer from '@/app/components/Footer';

export default function OrdersPage() {
  const router = useRouter();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) return;
    fetchOrders(token);
  }, [router]);

  const fetchOrders = async (token) => {
    try {
      const res = await fetch('/api/orders', {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      if (!res.ok) throw new Error('Failed to fetch orders');
      const data = await res.json();
      setOrders(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#f5f0e8] flex items-center justify-center">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-violet-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f5f0e8] flex flex-col">
      <Navbar />
      <main className="flex-1 max-w-4xl mx-auto w-full px-4 pt-28 pb-16">
        <Link href="/shopping" className="inline-flex items-center text-gray-500 hover:text-gray-900 mb-6 transition text-sm">
          <ArrowLeft className="w-4 h-4 mr-2" /> Back to Shopping
        </Link>

        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-black text-gray-900 flex items-center gap-3">
            <Package className="w-7 h-7 text-violet-600" /> My Orders
          </h1>
          <Link href="/shopping" className="text-sm text-violet-600 hover:text-violet-700 font-semibold">
            Continue Shopping
          </Link>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl mb-6 text-sm">
            {error}
          </div>
        )}

        {orders.length === 0 ? (
          <div className="bg-white border border-gray-200 rounded-2xl p-12 text-center shadow-sm">
            <Package className="w-14 h-14 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500 mb-4">You haven't placed any orders yet.</p>
            <Link href="/shopping" className="text-violet-600 hover:text-violet-700 font-semibold underline">
              Start shopping
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {orders.map(order => (
              <Link key={order.id} href={`/orders/${order.id}`}>
                <div className="bg-white border border-gray-200 rounded-2xl p-6 hover:border-violet-200 hover:shadow-md transition-all cursor-pointer">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                    <div>
                      <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">Order ID</p>
                      <p className="font-mono text-sm text-gray-700">{order.id.slice(0, 12)}...</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">Date</p>
                      <p className="font-medium text-gray-900 text-sm">{new Date(order.createdAt).toLocaleDateString()}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">Total</p>
                      <p className="font-bold text-gray-900">${order.totalAmount.toFixed(2)}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">Status</p>
                      <span className={`inline-block px-2.5 py-1 rounded-full text-xs font-bold capitalize ${
                        order.status === 'delivered' ? 'bg-green-100 text-green-700' :
                        order.status === 'cancelled' ? 'bg-red-100 text-red-700' :
                        'bg-violet-100 text-violet-700'
                      }`}>
                        {order.status}
                      </span>
                    </div>
                  </div>
                  <div className="border-t border-gray-100 pt-3">
                    <p className="text-xs font-semibold text-gray-500 mb-2 uppercase tracking-wide">Items</p>
                    <div className="space-y-1">
                      {Array.isArray(order.items) && order.items.map((item, idx) => (
                        <div key={idx} className="text-sm text-gray-600">
                          {item.productName} × {item.quantity} — ${item.price.toFixed(2)}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
}

