'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Search, Heart, X } from 'lucide-react';
import { useCart } from '../context/CartContext';
import toast from 'react-hot-toast';

export default function ShoppingLogic({ initialProducts, initialSearch = '', initialCategory = '' }) {
    // Local input state — does NOT filter products, only used to build the URL on submit
    const [inputValue, setInputValue]     = useState(initialSearch);
    const [selectedCategory, setSelectedCategory] = useState(initialCategory || 'All');
    const [wishlisted, setWishlisted]     = useState(new Set());
    const { addToCart } = useCart();
    const router = useRouter();

    // ── Navigation helpers ────────────────────────────────────────────────────
    const navigate = (search, category) => {
        const params = new URLSearchParams();
        if (search.trim())                                    params.set('search', search.trim());
        if (category && category !== 'All' && category !== 'Featured') params.set('category', category);
        router.push(`/shopping${params.toString() ? '?' + params.toString() : ''}`);
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        navigate(inputValue, selectedCategory);
    };

    const handleCategoryChange = (cat) => {
        setSelectedCategory(cat);
        navigate(inputValue, cat);
    };

    const clearSearch = () => {
        setInputValue('');
        setSelectedCategory('All');
        router.push('/shopping');
    };

    // ── Wishlist ──────────────────────────────────────────────────────────────
    const toggleWishlist = async (e, product) => {
        e.preventDefault();
        e.stopPropagation();
        const token = localStorage.getItem('token');
        if (!token) { toast.error('Please sign in to save items'); return; }
        const isWishlisted = wishlisted.has(product.id);
        const res = await fetch('/api/wishlist', {
            method: isWishlisted ? 'DELETE' : 'POST',
            headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
            body: JSON.stringify({ productId: product.id }),
        });
        if (res.ok) {
            setWishlisted(prev => {
                const next = new Set(prev);
                isWishlisted ? next.delete(product.id) : next.add(product.id);
                return next;
            });
            toast.success(isWishlisted ? 'Removed from wishlist' : 'Added to wishlist');
        } else if (res.status === 401) {
            toast.error('Please sign in to save items');
        }
    };

    // Products come 100% from the server — no client-side filtering
    const products = initialProducts;

    const cardGradients = [
        'from-[#1a2948] via-[#22345a] to-[#27406d]',
        'from-[#19253f] via-[#24315b] to-[#2b3c6c]',
        'from-[#1c2d45] via-[#26395d] to-[#2f4570]',
        'from-[#1b2a42] via-[#22365a] to-[#2c426d]',
    ];

    return (
        <>
            {/* ── Search bar ─────────────────────────────────────────────── */}
            <form onSubmit={handleSubmit}
                className="flex flex-col md:flex-row items-center justify-between gap-4 mb-8">
                <div className="relative w-full md:max-w-md group">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Search className="h-5 w-5 text-gray-400 group-focus-within:text-blue-400 transition-colors" />
                    </div>
                    <input
                        type="text"
                        className="block w-full pl-10 pr-10 py-2 border border-white/10 rounded-xl bg-white/5 text-slate-100 placeholder-gray-400 focus:outline-none focus:bg-white/10 focus:ring-1 focus:ring-blue-400 focus:border-blue-400 text-sm transition-all"
                        placeholder="Search products and press Enter..."
                        value={inputValue}
                        onChange={(e) => setInputValue(e.target.value)}
                    />
                    {inputValue && (
                        <button type="button" onClick={clearSearch}
                            className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-white transition-colors">
                            <X className="h-4 w-4" />
                        </button>
                    )}
                </div>

                <button type="submit"
                    className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-medium rounded-xl shadow-lg transition-all hover:-translate-y-0.5">
                    <Search className="h-5 w-5" />
                    <span>Search</span>
                </button>
            </form>

            {/* ── Active search label ─────────────────────────────────────── */}
            {initialSearch && (
                <div className="flex items-center gap-2 mb-4 text-sm text-slate-300">
                    <Search className="w-4 h-4 text-blue-400" />
                    {products.length === 0
                        ? <span className="text-red-400">No results for <strong className="text-white">"{initialSearch}"</strong></span>
                        : <span>Showing <strong className="text-white">{products.length}</strong> result{products.length !== 1 ? 's' : ''} for <strong className="text-white">"{initialSearch}"</strong></span>
                    }
                    <button onClick={clearSearch} className="ml-2 text-blue-400 hover:text-blue-300 underline text-xs">
                        Clear
                    </button>
                </div>
            )}

            {/* ── Hero / Category filters ─────────────────────────────────── */}
            <section className="text-center space-y-3 sm:space-y-4">
                <p className="text-xs sm:text-sm uppercase tracking-widest text-blue-200">ShopSense Marketplace</p>
                <h1 className="text-2xl sm:text-4xl md:text-5xl font-bold leading-tight">
                    Curated Finds{' '}
                    <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#6dd3ff] via-[#9f8bff] to-[#ffb3ec]">
                        for every lifestyle
                    </span>
                </h1>
                <p className="text-slate-200 max-w-3xl mx-auto text-sm sm:text-base">
                    Discover tech essentials, wellness must-haves, and eye-catching decor.
                </p>
                <div className="flex items-center justify-center gap-2 sm:gap-4 flex-wrap">
                    {['All', 'Featured', 'Smart Home', 'Wellness', 'Workspace'].map((filter) => (
                        <button
                            key={filter}
                            onClick={() => handleCategoryChange(filter)}
                            className={`px-4 py-2 rounded-full border border-white/20 backdrop-blur transition-all text-sm cursor-pointer shadow-lg ${
                                selectedCategory === filter
                                    ? 'bg-gradient-to-r from-blue-500 to-indigo-600 text-white font-bold ring-2 ring-blue-400/50'
                                    : 'bg-gradient-to-b from-slate-900/80 to-slate-950/90 hover:from-slate-800/80 text-gray-300 hover:text-white border-white/10'
                            }`}
                        >
                            {filter}
                        </button>
                    ))}
                </div>
            </section>

            {/* ── Product Grid ────────────────────────────────────────────── */}
            <section className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                {products.length === 0 ? (
                    <div className="col-span-2 text-center py-20">
                        <Search className="w-12 h-12 text-slate-500 mx-auto mb-4" />
                        <p className="text-xl font-semibold text-slate-300 mb-2">No products found</p>
                        <p className="text-slate-500 mb-6">
                            {initialSearch ? `No results for "${initialSearch}"` : 'No products in this category'}
                        </p>
                        <button onClick={clearSearch}
                            className="px-6 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-xl transition-colors">
                            View All Products
                        </button>
                    </div>
                ) : products.map((product, idx) => (
                    <Link
                        key={product.id}
                        href={`/shopping/${product.id}`}
                        className={`relative overflow-hidden rounded-2xl bg-gradient-to-br ${cardGradients[idx % cardGradients.length]} border border-white/10 shadow-xl p-4 sm:p-6 flex flex-col gap-3 sm:gap-4 backdrop-blur group cursor-pointer hover:shadow-2xl transition-all duration-300`}
                    >
                        <div className="absolute inset-0 opacity-15 bg-gradient-to-br from-white/10 via-white/0 to-white/5"></div>

                        <div className="relative rounded-xl overflow-hidden border border-white/10 h-48 sm:h-64 bg-slate-800">
                            <img
                                src={product.imageUrl || '/product-images/placeholder.png'}
                                alt={product.name}
                                className="absolute inset-0 w-full h-full object-cover transition duration-500 ease-out group-hover:scale-105"
                                loading={idx < 2 ? 'eager' : 'lazy'}
                                onError={(e) => {
                                    e.target.onerror = null;
                                    e.target.style.display = 'none';
                                }}
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent pointer-events-none"></div>
                            <div className="absolute top-2 sm:top-3 left-2 sm:left-3 px-2 sm:px-3 py-1 sm:py-1.5 rounded-full bg-gradient-to-br from-black/90 via-slate-900/70 to-black/90 text-[9px] sm:text-[10px] font-bold uppercase tracking-[0.15em] text-white border border-white/20 backdrop-blur-md shadow-2xl">
                                {product.category}
                            </div>
                            <div className="absolute bottom-0 left-0 right-0 p-3 sm:p-4 text-white">
                                <h3 className="text-base sm:text-xl font-bold mb-1">{product.name}</h3>
                                <p className="text-white/90 text-xs sm:text-sm line-clamp-2">{product.description}</p>
                            </div>
                        </div>

                        <div className="relative flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <span className="text-xl sm:text-2xl font-bold text-white">
                                    ${(product.currentPrice || product.basePrice || 0).toFixed(2)}
                                </span>
                                {product.basePrice && product.currentPrice && product.currentPrice !== product.basePrice && (
                                    <span className="text-xs sm:text-sm text-gray-400 line-through">${product.basePrice.toFixed(2)}</span>
                                )}
                            </div>
                        </div>

                        <div className="relative flex items-center gap-2 sm:gap-3 text-sm">
                            <span className="px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg bg-white text-gray-900 font-semibold hover:scale-105 transition text-xs sm:text-sm">
                                View Details
                            </span>
                            <button
                                onClick={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    addToCart(product);
                                    // Track demand
                                    fetch('/api/demand/track', {
                                        method: 'POST',
                                        headers: { 'Content-Type': 'application/json' },
                                        body: JSON.stringify({ productId: product.id, event: 'cart_add' }),
                                    }).catch(() => {});
                                }}
                                className="px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg border border-white/30 text-white hover:bg-white/10 transition cursor-pointer active:scale-95 text-xs sm:text-sm"
                            >
                                Add to Cart
                            </button>
                            <button
                                onClick={(e) => toggleWishlist(e, product)}
                                className="p-1.5 sm:p-2 rounded-lg border border-white/30 hover:bg-white/10 transition"
                                title="Save to Wishlist"
                            >
                                <Heart className={`w-5 h-5 transition-colors ${wishlisted.has(product.id) ? 'fill-pink-500 text-pink-500' : 'text-white'}`} />
                            </button>
                        </div>
                    </Link>
                ))}
            </section>
        </>
    );
}

