'use client';

export const dynamic = 'force-dynamic';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Package, Truck, Calendar, DollarSign, X } from 'lucide-react';
import toast from 'react-hot-toast';

export default function OrderDetailPage() {
  const router = useRouter();
  const params = useParams();
  const orderId = params.orderId;
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) return;
    fetchOrder(token);
  }, [router, orderId]);

  const [cancelling, setCancelling] = useState(false);

  const handleCancelOrder = async () => {
    if (!confirm('Are you sure you want to cancel this order?')) return;

    setCancelling(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`/api/orders/${orderId}/cancel`, {
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${token}` },
      });

      const data = await res.json();

      if (res.ok) {
        setOrder(data.order);
        toast.success('Order cancelled successfully');
      } else {
        toast.error(data.error || 'Failed to cancel order');
      }
    } catch (error) {
      toast.error('Error cancelling order');
      console.error(error);
    } finally {
      setCancelling(false);
    }
  };

  const fetchOrder = async (token) => {
    try {
      const res = await fetch(`/api/orders/${orderId}`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });

      if (!res.ok) throw new Error('Failed to fetch order');
      const data = await res.json();
      setOrder(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p>Loading order details...</p>
        </div>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="min-h-screen bg-gray-50 py-12 px-4">
        <div className="max-w-2xl mx-auto">
          <Link href="/orders" className="inline-flex items-center text-blue-600 hover:text-blue-700 mb-6">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Orders
          </Link>
          <div className="bg-white rounded-lg shadow p-8 text-center">
            <p className="text-red-600 mb-4">{error || 'Order not found'}</p>
            <Link href="/orders" className="text-blue-600 hover:underline">
              Return to orders
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const statusColors = {
    pending: 'bg-yellow-100 text-yellow-800',
    processing: 'bg-blue-100 text-blue-800',
    shipped: 'bg-purple-100 text-purple-800',
    delivered: 'bg-green-100 text-green-800',
    cancelled: 'bg-red-100 text-red-800',
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-2xl mx-auto">
        <Link href="/orders" className="inline-flex items-center text-blue-600 hover:text-blue-700 mb-6">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Orders
        </Link>

        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h1 className="text-3xl font-bold mb-2">Order Details</h1>
                <p className="text-blue-100">Order ID: {order.id}</p>
              </div>
              <span className={`px-4 py-2 rounded-full font-semibold capitalize ${statusColors[order.status] || 'bg-gray-100 text-gray-800'}`}>
                {order.status}
              </span>
            </div>
          </div>

          {/* Content */}
          <div className="p-6 space-y-6">
            {/* Order Info */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="flex items-center gap-3">
                <Calendar className="w-5 h-5 text-gray-400" />
                <div>
                  <p className="text-sm text-gray-600">Order Date</p>
                  <p className="font-semibold">{new Date(order.createdAt).toLocaleDateString()}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <DollarSign className="w-5 h-5 text-gray-400" />
                <div>
                  <p className="text-sm text-gray-600">Total Amount</p>
                  <p className="font-semibold">${order.totalAmount.toFixed(2)}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Package className="w-5 h-5 text-gray-400" />
                <div>
                  <p className="text-sm text-gray-600">Payment ID</p>
                  <p className="font-mono text-sm">{order.paymentId.substring(0, 12)}...</p>
                </div>
              </div>
            </div>

            <hr />

            {/* Items */}
            <div>
              <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
                <Package className="w-5 h-5" />
                Order Items
              </h2>
              <div className="space-y-3">
                {Array.isArray(order.items) && order.items.map((item, idx) => (
                  <div key={idx} className="flex justify-between items-center p-4 bg-gray-50 rounded-lg">
                    <div>
                      <p className="font-semibold">{item.productName}</p>
                      <p className="text-sm text-gray-600">Quantity: {item.quantity}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold">${(item.price * item.quantity).toFixed(2)}</p>
                      <p className="text-sm text-gray-600">${item.price.toFixed(2)} each</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <hr />

            {/* Shipping Address */}
            {order.shippingAddress && (
              <div>
                <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
                  <Truck className="w-5 h-5" />
                  Shipping Address
                </h2>
                <div className="p-4 bg-gray-50 rounded-lg">
                  <p className="font-semibold">{order.shippingAddress.fullName}</p>
                  <p className="text-gray-600">{order.shippingAddress.address}</p>
                  <p className="text-gray-600">
                    {order.shippingAddress.city}, {order.shippingAddress.state} {order.shippingAddress.zipCode}
                  </p>
                  <p className="text-gray-600 mt-2">{order.shippingAddress.email}</p>
                  <p className="text-gray-600">{order.shippingAddress.phone}</p>
                </div>
              </div>
            )}

            <hr />

            <div className="flex gap-3">
              <Link href="/orders" className="flex-1 px-4 py-2 bg-gray-300 text-gray-700 hover:bg-gray-400 rounded-lg font-semibold transition-colors text-center">
                Back to Orders
              </Link>
              {['pending', 'processing'].includes(order.status) && (
                <button
                  onClick={handleCancelOrder}
                  disabled={cancelling}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-red-600 text-white hover:bg-red-700 rounded-lg font-semibold transition-colors disabled:opacity-50"
                >
                  <X className="w-4 h-4" />
                  {cancelling ? 'Cancelling...' : 'Cancel Order'}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
