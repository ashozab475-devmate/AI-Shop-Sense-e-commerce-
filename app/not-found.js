import Link from 'next/link';

export default function NotFoundPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center px-4">
      <div className="text-center">
        <h1 className="text-9xl font-bold text-blue-600 mb-4">404</h1>
        <h2 className="text-4xl font-bold text-gray-900 mb-4">Page Not Found</h2>
        <p className="text-xl text-gray-600 mb-8">Sorry, the page you're looking for doesn't exist.</p>
        <div className="space-y-4">
          <p className="text-gray-600">Here are some helpful links:</p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/" className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 font-semibold">
              Go Home
            </Link>
            <Link href="/shopping" className="bg-gray-600 text-white px-6 py-3 rounded-lg hover:bg-gray-700 font-semibold">
              Browse Products
            </Link>
            <Link href="/contact" className="bg-gray-600 text-white px-6 py-3 rounded-lg hover:bg-gray-700 font-semibold">
              Contact Us
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
