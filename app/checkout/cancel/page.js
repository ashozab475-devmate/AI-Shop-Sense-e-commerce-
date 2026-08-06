'use client';

export const dynamic = 'force-dynamic';

import Link from 'next/link';

export default function CheckoutCancelPage() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full text-center">
        <div className="mb-6">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Payment Cancelled</h1>
        </div>

        <p className="text-gray-600 mb-8">
          Your payment was cancelled. Your cart items are still saved.
        </p>

        <div className="space-y-3">
          <Link
            href="/checkout"
            className="block w-full bg-blue-600 text-white py-2 rounded-lg font-semibold hover:bg-blue-700"
          >
            Return to Checkout
          </Link>
          <Link
            href="/shopping"
            className="block w-full bg-gray-200 text-gray-900 py-2 rounded-lg font-semibold hover:bg-gray-300"
          >
            Continue Shopping
          </Link>
        </div>
      </div>
    </div>
  );
}
