// lib/dynamicImports.js
// Dynamic imports for code splitting - reduces initial bundle size

import dynamic from 'next/dynamic';

// Admin pages - only loaded when needed
export const AdminDashboard = dynamic(() => import('@/app/admin/page'), {
  loading: () => (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <p>Loading admin dashboard...</p>
      </div>
    </div>
  ),
  ssr: true,
});

export const AdminUsers = dynamic(() => import('@/app/admin/users/page'), {
  loading: () => (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <p>Loading user management...</p>
      </div>
    </div>
  ),
  ssr: true,
});

export const AdminProducts = dynamic(() => import('@/app/admin/products/page'), {
  loading: () => (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <p>Loading product approval...</p>
      </div>
    </div>
  ),
  ssr: true,
});

// Seller pages - only loaded for sellers
export const SellerDashboard = dynamic(() => import('@/app/seller/page'), {
  loading: () => (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <p>Loading seller dashboard...</p>
      </div>
    </div>
  ),
  ssr: true,
});

// Pricing page - heavy component
export const PricingDashboard = dynamic(() => import('@/app/pricing/page'), {
  loading: () => (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <p>Loading pricing analytics...</p>
      </div>
    </div>
  ),
  ssr: true,
});

// Visual search - heavy component with AI
export const VisualSearch = dynamic(() => import('@/app/components/VisualSearch'), {
  loading: () => (
    <div className="p-8 text-center">
      <div className="animate-pulse">Loading visual search...</div>
    </div>
  ),
  ssr: false,
});

// Checkout - payment related
export const CheckoutPage = dynamic(() => import('@/app/checkout/page'), {
  loading: () => (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <p>Loading checkout...</p>
      </div>
    </div>
  ),
  ssr: true,
});

// Orders page
export const OrdersPage = dynamic(() => import('@/app/orders/page'), {
  loading: () => (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <p>Loading orders...</p>
      </div>
    </div>
  ),
  ssr: true,
});

// Profile page
export const ProfilePage = dynamic(() => import('@/app/profile/page'), {
  loading: () => (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <p>Loading profile...</p>
      </div>
    </div>
  ),
  ssr: true,
});
