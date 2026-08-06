'use client';

export const dynamic = 'force-dynamic';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Truck, Package, CheckCircle, XCircle, Clock, Search } from 'lucide-react';
import Navbar from '@/app/components/Navbar';
import Footer from '@/app/components/Footer';

const STATUS_ICONS = {
  pending: <Clock className="w-5 h-5 text-yellow-500" />,
  picked_up: <Package className="w-5 h-5 text-blue-500" />,
  in_transit: <Truck className="w-5 h-5 text-purple-500" />,
  delivered: <CheckCircle className="w-5 h-5 text-green-500" />,
  failed: <XCircle className="w-5 h-5 text-red-500" />,
};

export default function TrackShipmentPage() {
  const [trackingNumber, setTrackingNumber] = useState('');
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleTrack = async (e) => {
    e.preventDefault();
    if (!trackingNumber.trim()) return;
    setLoading(true);
    setError('');
    setResult(null);
    const token = localStorage.getItem('token');
    const res = await fetch(`/api/shipping/track?trackingNumber=${encodeURIComponent(trackingNumber)}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const data = await res.json();
    if (res.ok) setResult(data);
    else setError(data.error || 'Shipment not found');
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Navbar />
      <main className="flex-1 max-w-3xl mx-auto w-full px-4 pt-28 pb-12">
        <Link href="/orders" className="inline-flex items-center text-blue-600 hover:text-blue-700 mb-6 transition">
          <ArrowLeft className="w-4 h-4 mr-2" /> Back to Orders
        </Link>

        <h1 className="text-3xl font-bold mb-8 flex items-center gap-3">
          <Truck className="w-7 h-7 text-blue-600" /> Track Shipment
        </h1>

        <form onSubmit={handleTrack} className="flex gap-3 mb-8">
          <input
            type="text"
            value={trackingNumber}
            onChange={e => setTrackingNumber(e.target.value)}
            placeholder="Enter tracking number..."
            className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button
            type="submit"
            disabled={loading}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition flex items-center gap-2 disabled:opacity-50"
          >
            <Search className="w-4 h-4" /> {loading ? 'Tracking...' : 'Track'}
          </button>
        </form>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">{error}</div>
        )}

        {result && (
          <div className="bg-white rounded-xl shadow-lg overflow-hidden">
            {/* Header */}
            <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-6">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-blue-100 text-sm mb-1">Tracking Number</p>
                  <p className="font-mono font-bold text-lg">{result.shipment.trackingNumber}</p>
                </div>
                <span className={`px-3 py-1 rounded-full text-sm font-semibold capitalize bg-white/20`}>
                  {result.shipment.status.replace('_', ' ')}
                </span>
              </div>
              <div className="grid grid-cols-2 gap-4 mt-4 text-sm">
                <div>
                  <p className="text-blue-100">Carrier</p>
                  <p className="font-semibold">{result.shipment.carrier}</p>
                </div>
                <div>
                  <p className="text-blue-100">Est. Delivery</p>
                  <p className="font-semibold">
                    {result.shipment.estimatedDelivery
                      ? new Date(result.shipment.estimatedDelivery).toLocaleDateString()
                      : 'N/A'}
                  </p>
                </div>
              </div>
            </div>

            {/* Timeline */}
            <div className="p-6">
              <h3 className="font-bold text-gray-900 mb-4">Tracking History</h3>
              <div className="space-y-4">
                {result.events.slice().reverse().map((event, idx) => (
                  <div key={idx} className="flex gap-4">
                    <div className="flex flex-col items-center">
                      <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center flex-shrink-0">
                        {STATUS_ICONS[event.status] || <Package className="w-5 h-5 text-gray-400" />}
                      </div>
                      {idx < result.events.length - 1 && <div className="w-0.5 h-full bg-gray-200 mt-2"></div>}
                    </div>
                    <div className="pb-4">
                      <p className="font-semibold text-gray-900 capitalize">{event.status.replace('_', ' ')}</p>
                      <p className="text-sm text-gray-600">{event.description}</p>
                      <p className="text-xs text-gray-400 mt-1">
                        {event.location} · {new Date(event.timestamp).toLocaleString()}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
}
