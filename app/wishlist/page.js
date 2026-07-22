'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Heart, ShoppingBag, Trash2, ArrowLeft } from 'lucide-react';
import Navbar from '@/app/components/Navbar';
import Footer from '@/app/components/Footer';
import { useCart } from '@/app/context/CartContext';
import toast from 'react-hot-toast';

export default function WishlistPage() {
  const router = useRouter();
  const { addToCart } = useCart();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) { router.push('/signin'); return; }
    fetchWishlist(token);
  }, []);

  const fetchWishlist = async (token) => {
    try {
      const res = await fetch('/api/wishlist', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setItems(data.items || []);
      }
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  const removeItem = async (productId) => {
    const token = localStorage.getItem('token');
    const res = await fetch('/api/wishlist', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ productId }),
    });
    if (res.ok) {
      setItems(prev => prev.filter(i => i.productId !== productId));
      toast.success('Removed from wishlist');
    }
  };

  const moveToCart = async (item) => {
    await addToCart(item.product);
    await removeItem(item.productId);
    toast.success('Moved to cart');
  };

  if (loading) return (
    <div className="min-h-screen bg-[#f5f0e8] flex items-center justify-center">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-violet-600"></div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#f5f0e8] text-gray-900 flex flex-col">
      <Navbar />
      <main className="flex-1 max-w-5xl mx-auto w-full px-4 pt-28 pb-12">
        <Link href="/shopping" className="inline-flex items-center text-gray-500 hover:text-gray-900 mb-6 transition text-sm">
          <ArrowLeft className="w-4 h-4 mr-2" /> Back to Shopping
        </Link>
        <h1 className="text-3xl font-black text-gray-900 mb-8 flex items-center gap-3">
          <Heart className="w-7 h-7 text-pink-500 fill-pink-500" /> My Wishlist
          <span className="text-lg font-normal text-gray-400">({items.length} items)</span>
        </h1>

        {items.length === 0 ? (
          <div className="text-center py-20 border border-gray-200 rounded-2xl bg-white">
            <Heart className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500 mb-4">Your wishlist is empty</p>
            <Link href="/shopping" className="px-6 py-2.5 bg-gray-900 hover:bg-gray-700 text-white rounded-full font-semibold transition">
              Browse Products
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {items.map(item => (
              <div key={item.id} className="bg-white border border-gray-200 rounded-2xl overflow-hidden hover:border-violet-200 hover:shadow-md transition">
                <Link href={`/shopping/${item.productId}`}>
                  <div className="aspect-square bg-gray-100 overflow-hidden">
                    <img
                      src={item.product?.imageUrl}
                      alt={item.product?.name}
                      className="w-full h-full object-cover hover:scale-105 transition duration-300"
                      onError={e => { e.target.src = 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=400&h=400&fit=crop'; }}
                    />
                  </div>
                </Link>
                <div className="p-4">
                  <p className="text-xs text-violet-600 font-semibold mb-1">{item.product?.category}</p>
                  <p className="font-bold text-gray-900 truncate mb-1">{item.product?.name}</p>
                  <p className="text-xl font-black text-gray-900 mb-4">
                    ${(item.product?.currentPrice || item.product?.basePrice || 0).toFixed(2)}
                  </p>
                  <div className="flex gap-2">
                    <button
                      onClick={() => moveToCart(item)}
                      className="flex-1 flex items-center justify-center gap-2 py-2 bg-gray-900 hover:bg-gray-700 text-white rounded-lg text-sm font-semibold transition"
                    >
                      <ShoppingBag className="w-4 h-4" /> Add to Cart
                    </button>
                    <button
                      onClick={() => removeItem(item.productId)}
                      className="p-2 bg-gray-100 hover:bg-red-50 hover:text-red-500 rounded-lg transition"
                    >
                      <Trash2 className="w-4 h-4 text-gray-400" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
}

