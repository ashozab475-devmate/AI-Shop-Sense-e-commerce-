'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, PackageX, Plus, X } from 'lucide-react';
import Navbar from '@/app/components/Navbar';
import Footer from '@/app/components/Footer';
import toast from 'react-hot-toast';

const REASONS = ['Defective product', 'Wrong item received', 'Not as described', 'Changed my mind', 'Damaged in shipping', 'Other'];

const STATUS_COLORS = {
  pending: 'bg-yellow-100 text-yellow-800',
  approved: 'bg-blue-100 text-blue-800',
  rejected: 'bg-red-100 text-red-800',
  refunded: 'bg-green-100 text-green-800',
  completed: 'bg-green-100 text-green-800',
};

export default function ReturnsPage() {
  const router = useRouter();
  const [returns, setReturns] = useState([]);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ orderId: '', reason: '', description: '' });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) { router.push('/signin'); return; }
    Promise.all([fetchReturns(token), fetchOrders(token)]).finally(() => setLoading(false));
  }, []);

  const fetchReturns = async (token) => {
    const res = await fetch('/api/returns', { headers: { Authorization: `Bearer ${token}` } });
    if (res.ok) { const d = await res.json(); setReturns(d.returns || []); }
  };

  const fetchOrders = async (token) => {
    const res = await fetch('/api/orders', { headers: { Authorization: `Bearer ${token}` } });
    if (res.ok) { const d = await res.json(); setOrders(d || []); }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.orderId || !form.reason) { toast.error('Please fill all required fields'); return; }
    setSubmitting(true);
    const token = localStorage.getItem('token');
    const res = await fetch('/api/returns', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify(form),
    });
    const data = await res.json();
    if (res.ok) {
      toast.success('Return request submitted');
      setReturns(prev => [data.return, ...prev]);
      setShowForm(false);
      setForm({ orderId: '', reason: '', description: '' });
    } else {
      toast.error(data.error || 'Failed to submit return');
    }
    setSubmitting(false);
  };

  if (loading) return (
    <div className="min-h-screen bg-[#f5f0e8] flex items-center justify-center">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-violet-600"></div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#f5f0e8] flex flex-col">
      <Navbar />
      <main className="flex-1 max-w-4xl mx-auto w-full px-4 pt-28 pb-12">
        <Link href="/orders" className="inline-flex items-center text-violet-600 hover:text-violet-700 mb-6 transition">
          <ArrowLeft className="w-4 h-4 mr-2" /> Back to Orders
        </Link>

        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <PackageX className="w-7 h-7 text-red-500" /> Returns & Refunds
          </h1>
          <button
            onClick={() => setShowForm(true)}
            className="flex items-center gap-2 px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-700 transition font-semibold"
          >
            <Plus className="w-4 h-4" /> New Return
          </button>
        </div>

        {/* New Return Form */}
        {showForm && (
          <div className="bg-[#f5f0e8] rounded-xl shadow-lg p-6 mb-8 border border-gray-200">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">Submit Return Request</h2>
              <button onClick={() => setShowForm(false)}><X className="w-5 h-5 text-gray-400 hover:text-gray-600" /></button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Select Order</label>
                <select
                  value={form.orderId}
                  onChange={e => setForm(f => ({ ...f, orderId: e.target.value }))}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500"
                  required
                >
                  <option value="">-- Select an order --</option>
                  {orders.filter(o => ['delivered', 'shipped'].includes(o.status)).map(o => (
                    <option key={o.id} value={o.id}>
                      Order #{o.id.slice(0, 8)} — ${o.totalAmount.toFixed(2)} ({new Date(o.createdAt).toLocaleDateString()})
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Reason</label>
                <select
                  value={form.reason}
                  onChange={e => setForm(f => ({ ...f, reason: e.target.value }))}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500"
                  required
                >
                  <option value="">-- Select a reason --</option>
                  {REASONS.map(r => <option key={r} value={r}>{r}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Description (optional)</label>
                <textarea
                  value={form.description}
                  onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                  rows={3}
                  placeholder="Describe the issue..."
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500"
                />
              </div>
              <button
                type="submit"
                disabled={submitting}
                className="w-full py-2 bg-gray-900 text-white rounded-lg font-semibold hover:bg-gray-700 transition disabled:opacity-50"
              >
                {submitting ? 'Submitting...' : 'Submit Return Request'}
              </button>
            </form>
          </div>
        )}

        {/* Returns List */}
        {returns.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-xl border border-gray-200">
            <PackageX className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">No return requests yet</p>
          </div>
        ) : (
          <div className="space-y-4">
            {returns.map(r => (
              <div key={r.id} className="bg-[#f5f0e8] rounded-xl shadow p-6 border border-gray-100">
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <p className="font-semibold text-gray-900">Order #{r.orderId.slice(0, 8)}</p>
                    <p className="text-sm text-gray-500">{new Date(r.createdAt).toLocaleDateString()}</p>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-xs font-semibold capitalize ${STATUS_COLORS[r.status] || 'bg-[#ede8df] text-gray-700'}`}>
                    {r.status}
                  </span>
                </div>
                <p className="text-sm text-gray-700 mb-1"><span className="font-medium">Reason:</span> {r.reason}</p>
                {r.description && <p className="text-sm text-gray-500">{r.description}</p>}
                <p className="text-sm font-semibold text-green-600 mt-2">Refund: ${r.refundAmount.toFixed(2)}</p>
                {r.notes && <p className="text-xs text-blue-600 mt-1">Admin note: {r.notes}</p>}
              </div>
            ))}
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
}


