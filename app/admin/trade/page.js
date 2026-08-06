'use client';

export const dynamic = 'force-dynamic';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, RefreshCw, CheckCircle, XCircle } from 'lucide-react';
import toast from 'react-hot-toast';

const STATUS_COLORS = {
  pending:   'bg-yellow-100 text-yellow-800',
  approved:  'bg-green-100 text-green-800',
  rejected:  'bg-red-100 text-red-800',
  completed: 'bg-blue-100 text-blue-800',
};

export default function AdminTradePage() {
  const router = useRouter();
  const [trades, setTrades] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('');
  const [notes, setNotes] = useState({});

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) { router.push('/signin'); return; }
    fetchTrades(token);
  }, [filter]);

  const fetchTrades = async (token) => {
    setLoading(true);
    const url = filter ? `/api/admin/trade?status=${filter}` : '/api/admin/trade';
    const res = await fetch(url, { headers: { Authorization: `Bearer ${token || localStorage.getItem('token')}` } });
    if (res.ok) { const d = await res.json(); setTrades(d.trades || []); }
    else if (res.status === 403) { toast.error('Admin access required'); router.push('/shopping'); }
    setLoading(false);
  };

  const updateStatus = async (id, status) => {
    const token = localStorage.getItem('token');
    const res = await fetch(`/api/admin/trade/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ status, adminNotes: notes[id] || '' }),
    });
    if (res.ok) {
      setTrades(prev => prev.map(t => t.id === id ? { ...t, status, adminNotes: notes[id] || t.adminNotes } : t));
      toast.success(`Trade ${status}`);
    } else toast.error('Failed to update');
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-6xl mx-auto">
        <Link href="/admin" className="inline-flex items-center text-blue-600 hover:text-blue-700 mb-6">
          <ArrowLeft className="w-4 h-4 mr-2" /> Back to Admin
        </Link>

        <div className="bg-gradient-to-r from-amber-500 to-orange-600 text-white rounded-xl p-8 mb-8 flex items-center gap-4">
          <div className="w-14 h-14 bg-white/20 rounded-full flex items-center justify-center">
            <RefreshCw className="w-7 h-7" />
          </div>
          <div>
            <h1 className="text-3xl font-bold">Trade Requests</h1>
            <p className="text-orange-100">Review and manage user trade-in submissions</p>
          </div>
        </div>

        {/* Filter */}
        <div className="flex gap-2 mb-6">
          {['', 'pending', 'approved', 'rejected', 'completed'].map(s => (
            <button key={s} onClick={() => setFilter(s)}
              className={`px-4 py-2 rounded-lg font-semibold text-sm capitalize transition ${filter === s ? 'bg-amber-500 text-white' : 'bg-white text-gray-700 hover:bg-gray-100 shadow'}`}>
              {s || 'All'}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="text-center py-12"><div className="animate-spin rounded-full h-10 w-10 border-b-2 border-amber-500 mx-auto"></div></div>
        ) : trades.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-xl shadow">
            <RefreshCw className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500">No trade requests found</p>
          </div>
        ) : (
          <div className="space-y-4">
            {trades.map(t => (
              <div key={t.id} className="bg-white rounded-xl shadow p-6">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <p className="font-bold text-gray-900 text-lg">{t.productName}</p>
                    <p className="text-sm text-gray-500">{t.user?.name} · {t.user?.email}</p>
                    <p className="text-sm text-gray-500 mt-1">{t.category} · {t.condition.replace('_', ' ')} · {t.ageYears}yr old</p>
                    {t.description && <p className="text-sm text-gray-600 mt-1 italic">"{t.description}"</p>}
                  </div>
                  <span className={`px-3 py-1 rounded-full text-xs font-semibold capitalize ${STATUS_COLORS[t.status]}`}>{t.status}</span>
                </div>

                <div className="flex gap-6 mb-4 p-3 bg-gray-50 rounded-lg">
                  <div><p className="text-xs text-gray-500">Estimated Value</p><p className="font-bold text-gray-900">${t.estimatedValue.toFixed(2)}</p></div>
                  <div><p className="text-xs text-gray-500">Offered Value</p><p className="font-bold text-amber-600">${t.offeredValue.toFixed(2)}</p></div>
                  <div><p className="text-xs text-gray-500">Submitted</p><p className="font-medium text-gray-700">{new Date(t.createdAt).toLocaleDateString()}</p></div>
                </div>

                {t.status === 'pending' && (
                  <div className="space-y-3">
                    <div className="p-3 bg-green-50 border border-green-200 rounded-lg text-xs text-green-700">
                      ✅ Approving will automatically list <strong>{t.productName} (Pre-owned)</strong> on the shopping page at <strong>${(t.offeredValue * 1.2).toFixed(2)}</strong> (20% markup).
                    </div>
                    <input
                      type="text"
                      placeholder="Admin notes (optional)..."
                      value={notes[t.id] || ''}
                      onChange={e => setNotes(n => ({ ...n, [t.id]: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
                    />
                    <div className="flex gap-3">
                      <button onClick={() => updateStatus(t.id, 'approved')}
                        className="flex-1 flex items-center justify-center gap-2 py-2 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 transition">
                        <CheckCircle className="w-4 h-4" /> Approve & List on Shop
                      </button>
                      <button onClick={() => updateStatus(t.id, 'rejected')}
                        className="flex-1 flex items-center justify-center gap-2 py-2 bg-red-600 text-white rounded-lg font-semibold hover:bg-red-700 transition">
                        <XCircle className="w-4 h-4" /> Reject
                      </button>
                    </div>
                  </div>
                )}
                {t.adminNotes && <p className="text-xs text-blue-600 mt-2">Note: {t.adminNotes}</p>}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
