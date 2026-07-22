'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { TrendingUp } from 'lucide-react';

export default function RecommendedProducts({ productId }) {
  const [products, setProducts] = useState([]);

  useEffect(() => {
    fetch(`/api/recommendations?productId=${productId}&type=similar&limit=4`)
      .then(r => r.json())
      .then(d => setProducts(d.products || []));
  }, [productId]);

  if (!products.length) return null;

  return (
    <div className="mt-16 border-t border-white/10 pt-12">
      <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-2">
        <TrendingUp className="w-6 h-6 text-pink-400" /> You May Also Like
      </h2>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {products.map(p => (
          <Link key={p.id} href={`/shopping/${p.id}`} className="group bg-slate-800/50 border border-white/10 rounded-xl overflow-hidden hover:border-white/30 transition">
            <div className="aspect-square bg-slate-700 overflow-hidden">
              <img
                src={p.imageUrl}
                alt={p.name}
                className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                onError={e => { e.target.src = 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=400&h=400&fit=crop'; }}
              />
            </div>
            <div className="p-3">
              <p className="text-xs text-pink-400 mb-1">{p.category}</p>
              <p className="text-sm font-semibold text-white truncate">{p.name}</p>
              <p className="text-sm font-bold text-white mt-1">${(p.currentPrice || p.basePrice || 0).toFixed(2)}</p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
