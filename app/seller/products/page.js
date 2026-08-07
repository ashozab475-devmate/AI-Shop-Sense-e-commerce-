'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

export default function SellerProductsPage() {
  const router = useRouter();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const token = localStorage.getItem('token');
    if (!token) { router.push('/sign_in'); return; }
    fetch('/api/seller/products', { headers: { 'Authorization': `Bearer ${token}` } })
      .then(r => r.json()).then(d => setProducts(d.products||[])).catch(console.error).finally(() => setLoading(false));
  }, [router]);

  const handleDelete = async (id) => {
    if (!confirm('Delete this product?')) return;
    const token = localStorage.getItem('token');
    await fetch(`/api/seller/products/${id}`, { method: 'DELETE', headers: { 'Authorization': `Bearer ${token}` } });
    setProducts(products.filter(p => p.id !== id));
  };

  if (!mounted || loading) return <div className="min-h-screen flex items-center justify-center"><p className="text-gray-600">Loading products...</p></div>;

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">My Products</h1>
          <Link href="/seller/products/new" className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 font-semibold">Add Product</Link>
        </div>
        {products.length > 0 ? (
          <div className="bg-white rounded-lg shadow overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-100 border-b">
                <tr>{['Product','Price','Stock','Status','Actions'].map(h=><th key={h} className="px-6 py-4 text-left font-semibold text-gray-900">{h}</th>)}</tr>
              </thead>
              <tbody>
                {products.map(p=>(
                  <tr key={p.id} className="border-b hover:bg-gray-50">
                    <td className="px-6 py-4 font-semibold">{p.name}</td>
                    <td className="px-6 py-4">${p.price}</td>
                    <td className="px-6 py-4">{p.stock}</td>
                    <td className="px-6 py-4"><span className={`px-3 py-1 rounded-full text-sm font-semibold ${p.approved?'bg-green-100 text-green-800':'bg-yellow-100 text-yellow-800'}`}>{p.approved?'Approved':'Pending'}</span></td>
                    <td className="px-6 py-4 space-x-2">
                      <Link href={`/seller/products/${p.id}/edit`} className="text-blue-600 font-semibold text-sm">Edit</Link>
                      <button onClick={()=>handleDelete(p.id)} className="text-red-600 font-semibold text-sm">Delete</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : <div className="text-center py-12 bg-white rounded-lg"><p className="text-gray-600 mb-4">No products yet.</p><Link href="/seller/products/new" className="text-blue-600 font-semibold">Add your first product</Link></div>}
      </div>
    </div>
  );
}
