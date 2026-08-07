'use client';

import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

// useSearchParams must be inside a Suspense boundary
function SuccessContent() {
  const searchParams = useSearchParams();
  const orderId = searchParams.get('orderId');

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full text-center">
        <div className="mb-6">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Order Confirmed!</h1>
        </div>

        <p className="text-gray-600 mb-2">Thank you for your purchase.</p>
        {orderId && (
          <p className="text-sm text-gray-500 mb-6">
            Order ID: <span className="font-mono font-semibold">{orderId}</span>
          </p>
        )}
        <p className="text-gray-600 mb-8">
          We've sent a confirmation email with your order details and tracking information.
        </p>

        <div className="space-y-3">
          <Link href="/orders"
            className="block w-full bg-blue-600 text-white py-2 rounded-lg font-semibold hover:bg-blue-700">
            View Orders
          </Link>
          <Link href="/shopping"
            className="block w-full bg-gray-200 text-gray-900 py-2 rounded-lg font-semibold hover:bg-gray-300">
            Continue Shopping
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function CheckoutSuccessPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600"></div>
      </div>
    }>
      <SuccessContent />
    </Suspense>
  );
}
