'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Store, ArrowLeft, CheckCircle } from 'lucide-react';
import toast from 'react-hot-toast';

export default function SellerRegisterPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [registered, setRegistered] = useState(false);

  useEffect(() => {
    // no auth redirect — page is accessible without login
  }, [router]);

  const handleRegisterAsSeller = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('/api/seller-register', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
      });

      const data = await res.json();

      if (res.ok) {
        setRegistered(true);
        toast.success('Successfully registered as seller!');
        setTimeout(() => {
          router.push('/seller');
        }, 2000);
      } else {
        toast.error(data.error || 'Failed to register as seller');
      }
    } catch (error) {
      toast.error('Error registering as seller');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 py-12 px-4">
      <div className="max-w-2xl mx-auto">
        <Link href="/shopping" className="inline-flex items-center text-blue-600 hover:text-blue-700 mb-8">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Shopping
        </Link>

        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-8">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center">
                <Store className="w-8 h-8" />
              </div>
              <div>
                <h1 className="text-3xl font-bold">Become a Seller</h1>
                <p className="text-blue-100">Start selling on ShopSense today</p>
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="p-8">
            {registered ? (
              <div className="text-center py-12">
                <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
                <h2 className="text-2xl font-bold text-gray-900 mb-2">Welcome to ShopSense Sellers!</h2>
                <p className="text-gray-600 mb-6">
                  You've successfully registered as a seller. Redirecting to your dashboard...
                </p>
              </div>
            ) : (
              <div className="space-y-6">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 mb-4">Why Become a Seller?</h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                      <h3 className="font-semibold text-blue-900 mb-2">📈 Grow Your Business</h3>
                      <p className="text-sm text-blue-700">
                        Reach thousands of customers and expand your market reach.
                      </p>
                    </div>
                    <div className="p-4 bg-purple-50 rounded-lg border border-purple-200">
                      <h3 className="font-semibold text-purple-900 mb-2">💰 Increase Revenue</h3>
                      <p className="text-sm text-purple-700">
                        Sell more products and increase your revenue streams.
                      </p>
                    </div>
                    <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                      <h3 className="font-semibold text-green-900 mb-2">📊 Analytics & Insights</h3>
                      <p className="text-sm text-green-700">
                        Get detailed analytics about your sales and customer behavior.
                      </p>
                    </div>
                    <div className="p-4 bg-orange-50 rounded-lg border border-orange-200">
                      <h3 className="font-semibold text-orange-900 mb-2">🛠️ Easy Management</h3>
                      <p className="text-sm text-orange-700">
                        Manage your inventory and orders from one dashboard.
                      </p>
                    </div>
                  </div>
                </div>

                <hr />

                <div>
                  <h2 className="text-2xl font-bold text-gray-900 mb-4">Seller Features</h2>
                  <ul className="space-y-3">
                    <li className="flex items-center gap-3">
                      <CheckCircle className="w-5 h-5 text-green-500" />
                      <span className="text-gray-700">Add and manage unlimited products</span>
                    </li>
                    <li className="flex items-center gap-3">
                      <CheckCircle className="w-5 h-5 text-green-500" />
                      <span className="text-gray-700">Track inventory and stock levels</span>
                    </li>
                    <li className="flex items-center gap-3">
                      <CheckCircle className="w-5 h-5 text-green-500" />
                      <span className="text-gray-700">View sales analytics and revenue</span>
                    </li>
                    <li className="flex items-center gap-3">
                      <CheckCircle className="w-5 h-5 text-green-500" />
                      <span className="text-gray-700">Manage customer orders</span>
                    </li>
                    <li className="flex items-center gap-3">
                      <CheckCircle className="w-5 h-5 text-green-500" />
                      <span className="text-gray-700">Dynamic pricing based on demand</span>
                    </li>
                  </ul>
                </div>

                <hr />

                <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
                  <h3 className="font-semibold text-blue-900 mb-2">Ready to get started?</h3>
                  <p className="text-sm text-blue-700 mb-4">
                    Click the button below to register as a seller and access your dashboard.
                  </p>
                  <button
                    onClick={handleRegisterAsSeller}
                    disabled={loading}
                    className="w-full px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold rounded-lg hover:from-blue-700 hover:to-purple-700 transition-colors disabled:opacity-50"
                  >
                    {loading ? 'Registering...' : 'Register as Seller'}
                  </button>
                </div>

                <p className="text-sm text-gray-600 text-center">
                  Already a seller?{' '}
                  <Link href="/seller" className="text-blue-600 hover:underline font-semibold">
                    Go to Dashboard
                  </Link>
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
