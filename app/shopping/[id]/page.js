import React from 'react';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import Navbar from '../../components/Navbar';
import Footer from '../../components/Footer';
import ProductImage from '../../components/ProductImage';
import AddToCartButton from './AddToCartButton';
import ReviewSection from './ReviewSection';
import RecommendedProducts from './RecommendedProducts';
import TrackView from './TrackView';
import prisma from '@/lib/prisma';
import { mockProducts } from '@/lib/mockData';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function ProductDetailsPage({ params }) {
    const { id } = await params;

    // Try to find in DB
    let product = null;
    try {
        // Check if ID looks like a valid CUID or generic usage.
        // To allow for flexibility, we try to fetch from DB first.
        // However, Prisma findUnique throws if ID format is invalid for some connectors, 
        // but usually returns null for not found.
        product = await prisma.product.findUnique({
            where: { id: id },
        });
    } catch (e) {
        // If DB fetch fails (e.g. invalid ID format for CUID), ignore and try mock
        product = null;
    }

    // If not in DB, check mock data
    if (!product) {
        product = mockProducts.find((p) => p.id === id);
    }

    if (!product) {
        notFound();
    }

    // Mock gallery if not present
    // Mock gallery if not present
    const gallery = product.gallery && product.gallery.length > 0
        ? product.gallery
        : [
            product.imageUrl || 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=1200&q=90',
            product.imageUrl || 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=1200&q=90',
            product.imageUrl || 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=1200&q=90'
        ];

    return (
        <div className="min-h-screen bg-slate-900 text-white flex flex-col font-sans selection:bg-pink-500 selection:text-white">
            <TrackView productId={product.id} />
            <Navbar />

            <main className="flex-1 max-w-7xl mx-auto w-full p-4 md:p-8 lg:p-12">
                <Link
                    href="/shopping"
                    className="inline-flex items-center text-sm text-slate-400 hover:text-white mb-8 transition group"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2 transform group-hover:-translate-x-1 transition" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                    Back to Shopping
                </Link>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 xl:gap-20">

                    {/* Image Section */}
                    <div className="space-y-6">
                        <div className="relative aspect-square w-full rounded-3xl overflow-hidden bg-slate-800 border border-white/10 shadow-2xl group">
                            <ProductImage
                                src={product.imageUrl}
                                alt={product.name}
                                category={product.category}
                                fill
                                className="object-cover transition duration-700 ease-in-out group-hover:scale-105"
                                priority
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent pointer-events-none"></div>
                        </div>

                        <div className="grid grid-cols-3 gap-4">
                            {gallery.map((img, i) => (
                                <div key={i} className="relative aspect-square rounded-xl overflow-hidden bg-slate-800 border border-white/10 cursor-pointer hover:border-white/40 transition">
                                    <ProductImage
                                        src={img || product.imageUrl}
                                        alt={`${product.name} view ${i + 1}`}
                                        category={product.category}
                                        fill
                                        className="object-cover"
                                    />
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Details Section */}
                    <div className="flex flex-col justify-center space-y-8">
                        <div>
                            <span className="inline-block px-3 py-1 bg-gradient-to-r from-pink-500 to-violet-600 rounded-full text-xs font-bold tracking-wider uppercase mb-3 shadow-lg shadow-pink-500/20">
                                {product.category}
                            </span>
                            <h1 className="text-4xl md:text-5xl font-bold leading-tight mb-4 text-transparent bg-clip-text bg-gradient-to-r from-white via-white to-slate-400">
                                {product.name}
                            </h1>
                            <div className="flex items-center gap-4 text-yellow-400 text-sm">
                                <div className="flex">
                                    {[1, 2, 3, 4, 5].map(star => (
                                        <svg key={star} className="w-5 h-5 fill-current" viewBox="0 0 24 24"><path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" /></svg>
                                    ))}
                                </div>
                                <span className="text-slate-400">(4.8 / 5.0)</span>
                            </div>
                        </div>

                        <div className="text-slate-300 text-lg leading-relaxed border-l-2 border-slate-700 pl-6">
                            {product.description || "Experience the ultimate in quality and design. This product has been curated to meet the highest standards of our marketplace."}
                        </div>

                        <div className="space-y-6 pt-6 border-t border-white/10">
                            <div className="flex items-end justify-between">
                                <div>
                                    <p className="text-sm text-slate-400 mb-1">Price</p>
                                    <div className="flex items-center gap-3">
                                        <p className="text-4xl font-bold text-white">${(product.currentPrice || product.basePrice || 0).toFixed(2)}</p>
                                        {product.basePrice && product.currentPrice && product.currentPrice !== product.basePrice && (
                                            <p className="text-lg text-gray-400 line-through">${product.basePrice.toFixed(2)}</p>
                                        )}
                                    </div>
                                </div>
                                <div className="text-right">
                                    <p className="text-sm text-green-400 mb-1 flex items-center justify-end gap-1">
                                        <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
                                        In Stock
                                    </p>
                                    <p className="text-sm text-slate-500">{product.stock || 50} units left</p>
                                </div>
                            </div>

                            <AddToCartButton product={product} />
                        </div>

                        <div className="bg-slate-800/50 rounded-xl p-4 flex items-center gap-4 text-sm text-slate-300 border border-white/5">
                            <div className="p-2 bg-slate-700 rounded-lg">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                                </svg>
                            </div>
                            <div>
                                <p className="font-semibold text-white">Free Express Shipping</p>
                                <p className="text-xs text-slate-500">On all orders over $50</p>
                            </div>
                        </div>

                    </div>
                </div>
                <RecommendedProducts productId={id} />
                <ReviewSection productId={id} />
            </main>

            <Footer />
        </div>
    );
}
