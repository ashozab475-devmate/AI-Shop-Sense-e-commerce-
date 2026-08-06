import React from 'react';
import Link from 'next/link';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { Truck, Headphones, RotateCcw, CreditCard, ShieldCheck, ArrowRight } from 'lucide-react';

// Always render dynamically — never statically at build time
export const dynamic = 'force-dynamic';
export const revalidate = 0;

const TRUST = [
  { icon: Truck,        title: 'Free Delivery',    sub: 'On orders over $50' },
  { icon: Headphones,   title: '24/7 Support',     sub: 'Always here to help' },
  { icon: RotateCcw,    title: '30-Day Returns',   sub: 'Hassle-free returns' },
  { icon: CreditCard,   title: 'Secure Payment',   sub: 'SSL encrypted checkout' },
  { icon: ShieldCheck,  title: 'Buyer Protection', sub: '100% purchase guarantee' },
];

const BADGES = ['Best Seller', 'Top Rated', 'New', 'Premium', 'Hot', 'Trending', 'Popular', 'Featured'];

export default async function Home() {
  // Safely fetch products — return empty arrays if DB is unavailable
  let allProducts = [];
  try {
    const prisma = (await import('@/lib/prisma')).default;
    allProducts = await prisma.product.findMany({
      orderBy: { createdAt: 'desc' },
      take: 50,
    });
  } catch (err) {
    console.error('Home page: failed to fetch products', err.message);
  }

  const heroProducts      = allProducts.slice(0, 8);
  const featuredProducts  = allProducts.slice(8, 14);
  const categories        = [...new Set(allProducts.map(p => p.category))].slice(0, 6);

  return (
    <div className="min-h-screen bg-white">
      <Navbar />

      {/* ── ANNOUNCEMENT BAR ─────────────────────────────────────────────── */}
      <div className="bg-gray-950 text-white text-[10px] sm:text-xs font-medium py-2 sm:py-2.5 text-center tracking-wide fixed top-16 sm:top-20 left-0 right-0 z-40">
        <span className="opacity-80 hidden sm:inline">🚚 Free shipping on orders over $100</span>
        <span className="mx-4 opacity-40 hidden sm:inline">•</span>
        <span className="opacity-80">✨ AI Visual Search — find any product by photo</span>
        <span className="mx-4 opacity-40 hidden sm:inline">•</span>
        <span className="opacity-80 hidden sm:inline">🏷️ Dynamic pricing — best deals in real time</span>
      </div>

      {/* ── HERO — Product Grid ───────────────────────────────────────────── */}
      <section className="pt-28 sm:pt-36 pb-10 bg-[#f5f0e8]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-10">
          <div className="text-center mb-8">
            <h1 className="text-3xl sm:text-5xl font-black text-gray-900 tracking-tight mb-3">
              Discover Our <span className="text-[#e8380d]">Collection</span>
            </h1>
            <p className="text-gray-500 text-sm sm:text-base max-w-xl mx-auto">
              Curated products from our catalog — powered by AI visual search and dynamic pricing.
            </p>
            <div className="flex justify-center gap-3 mt-5">
              <Link href="/shopping"
                className="px-6 py-3 rounded-full bg-[#e8380d] hover:bg-[#c42d0a] text-white text-xs font-black tracking-widest uppercase transition-all hover:scale-105 shadow-lg shadow-orange-500/30">
                SHOP ALL PRODUCTS
              </Link>
              <Link href="/shopping"
                className="px-6 py-3 rounded-full border-2 border-gray-800 text-gray-800 text-xs font-black tracking-widest uppercase hover:bg-gray-800 hover:text-white transition-all">
                NEW ARRIVALS
              </Link>
            </div>
          </div>

          {heroProducts.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 sm:gap-4">
              {heroProducts.map((p, i) => (
                <Link key={p.id} href={`/shopping/${p.id}`}
                  className="group bg-white rounded-2xl border border-gray-100 hover:border-orange-200 hover:shadow-xl transition-all overflow-hidden">
                  <div className="relative aspect-square bg-gray-100 flex items-center justify-center overflow-hidden">
                    {p.imageUrl ? (
                      <img
                        src={p.imageUrl}
                        alt={p.name}
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-100 to-gray-200">
                        <span className="text-3xl">🛍️</span>
                      </div>
                    )}
                    <span className="absolute top-2 left-2 px-2 py-0.5 bg-[#e8380d] text-white text-[10px] font-bold rounded-full">
                      {BADGES[i % BADGES.length]}
                    </span>
                  </div>
                  <div className="p-3">
                    <p className="text-[10px] text-gray-400 uppercase tracking-wide mb-0.5">{p.category}</p>
                    <p className="text-xs font-semibold text-gray-800 truncate">{p.name}</p>
                    <p className="text-sm font-extrabold text-[#e8380d] mt-1">${(p.currentPrice || p.basePrice || 0).toFixed(2)}</p>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="text-center py-16 text-gray-400">
              <p className="text-lg">No products yet. <Link href="/shopping" className="text-[#e8380d] underline">Visit the shop</Link></p>
            </div>
          )}
        </div>
      </section>

      {/* ── TRUST BAR ────────────────────────────────────────────────────── */}
      <section className="bg-gray-950 py-6">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex flex-wrap justify-center lg:justify-between gap-6">
            {TRUST.map(({ icon: Icon, title, sub }) => (
              <div key={title} className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-white/10 flex items-center justify-center flex-shrink-0">
                  <Icon className="w-4 h-4 text-white" />
                </div>
                <div>
                  <p className="text-sm font-bold text-white">{title}</p>
                  <p className="text-xs text-gray-400">{sub}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CATEGORIES ───────────────────────────────────────────────────── */}
      {categories.length > 0 && (
        <section className="py-14 bg-white">
          <div className="max-w-7xl mx-auto px-6">
            <div className="flex items-center justify-between mb-8">
              <div>
                <h2 className="text-2xl font-extrabold text-gray-900">Shop by Category</h2>
                <div className="w-12 h-1 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full mt-2"></div>
              </div>
              <Link href="/shopping" className="text-sm font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-1">
                View All <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3 sm:gap-4">
              {categories.map((cat) => {
                const catProduct = allProducts.find(p => p.category === cat && p.imageUrl);
                return (
                  <Link key={cat} href={`/shopping?category=${encodeURIComponent(cat)}`}
                    className="group flex flex-col items-center gap-3 p-4 rounded-2xl border border-gray-100 hover:border-blue-200 hover:shadow-md transition-all">
                    <div className="w-16 h-16 rounded-xl bg-gray-50 group-hover:bg-blue-50 flex items-center justify-center overflow-hidden transition-colors">
                      {catProduct?.imageUrl ? (
                        <img src={catProduct.imageUrl} alt={cat} className="w-full h-full object-cover group-hover:scale-110 transition-transform" />
                      ) : (
                        <span className="text-2xl">🛍️</span>
                      )}
                    </div>
                    <span className="text-xs font-semibold text-gray-700 text-center leading-tight">{cat}</span>
                  </Link>
                );
              })}
            </div>
          </div>
        </section>
      )}

      {/* ── FEATURED PRODUCTS ────────────────────────────────────────────── */}
      {featuredProducts.length > 0 && (
        <section className="py-14 bg-gray-50">
          <div className="max-w-7xl mx-auto px-6">
            <div className="flex items-center justify-between mb-8">
              <div>
                <h2 className="text-2xl font-extrabold text-gray-900">Recommended For You</h2>
                <div className="w-12 h-1 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full mt-2"></div>
              </div>
              <Link href="/shopping" className="text-sm font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-1">
                See All <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3 sm:gap-4">
              {featuredProducts.map((p) => (
                <Link key={p.id} href={`/shopping/${p.id}`}
                  className="group bg-white rounded-2xl border border-gray-100 hover:border-blue-200 hover:shadow-lg transition-all overflow-hidden">
                  <div className="aspect-square bg-gray-50 flex items-center justify-center overflow-hidden">
                    {p.imageUrl ? (
                      <img src={p.imageUrl} alt={p.name}
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300" />
                    ) : (
                      <span className="text-3xl">🛍️</span>
                    )}
                  </div>
                  <div className="p-3">
                    <p className="text-[10px] text-gray-400 uppercase tracking-wide mb-0.5">{p.category}</p>
                    <p className="text-xs font-semibold text-gray-800 truncate mb-1">{p.name}</p>
                    <p className="text-sm font-extrabold text-blue-600">${(p.currentPrice || p.basePrice || 0).toFixed(2)}</p>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      <Footer />
    </div>
  );
}
