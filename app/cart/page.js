'use client';

import React from 'react';
import Link from 'next/link';
import { Trash2, Plus, Minus, ArrowLeft, ShoppingCart, Package, CreditCard, Truck, ShieldCheck, Zap } from 'lucide-react';
import { useCart } from '../context/CartContext';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';

export default function Cart() {
    const { cartItems, updateQuantity, removeFromCart } = useCart();

    const subtotal = cartItems.reduce((sum, item) => {
        const price = item.price || item.currentPrice || item.basePrice || 0;
        return sum + (price * item.quantity);
    }, 0);
    const tax      = subtotal * 0.08;
    const shipping = (subtotal > 100 || subtotal === 0) ? 0 : 12.99;
    const total    = subtotal + tax + shipping;

    return (
        <div className="min-h-screen bg-[#f5f0e8] text-gray-900 flex flex-col">
            <Navbar />

            <main className="flex-1 pt-24 sm:pt-28 pb-16 px-4 sm:px-6 lg:px-8">
                <div className="max-w-7xl mx-auto">

                    {/* Header */}
                    <div className="mb-8">
                        <Link href="/shopping"
                            className="inline-flex items-center text-sm text-gray-500 hover:text-gray-900 mb-5 transition group">
                            <ArrowLeft className="w-4 h-4 mr-2 group-hover:-translate-x-1 transition-transform" />
                            Return to Shopping
                        </Link>
                        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3">
                            <div>
                                <h1 className="text-2xl sm:text-3xl font-black text-gray-900 flex items-center gap-3">
                                    <ShoppingCart className="w-7 h-7 text-violet-600" />
                                    Your Cart
                                </h1>
                                <p className="text-gray-500 mt-1 text-sm">
                                    {cartItems.length} {cartItems.length === 1 ? 'item' : 'items'}
                                </p>
                            </div>
                            {cartItems.length > 0 && (
                                <div className="text-right">
                                    <div className="text-xs text-gray-400 uppercase tracking-widest mb-0.5">Estimated Total</div>
                                    <div className="text-xl font-bold text-violet-600">${total.toFixed(2)}</div>
                                </div>
                            )}
                        </div>
                    </div>

                    {cartItems.length === 0 ? (
                        <div className="text-center py-20 bg-white rounded-2xl border border-gray-200 shadow-sm">
                            <ShoppingCart className="w-14 h-14 text-gray-300 mx-auto mb-4" />
                            <h2 className="text-xl font-bold text-gray-900 mb-2">Your cart is empty</h2>
                            <p className="text-gray-500 mb-8 text-sm">Explore our products and find something you love.</p>
                            <Link href="/shopping"
                                className="inline-flex items-center px-7 py-3 rounded-xl bg-violet-600 hover:bg-violet-700 text-white font-bold transition-all">
                                <Package className="w-4 h-4 mr-2" />
                                Browse Products
                            </Link>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">

                            {/* Cart Items */}
                            <div className="lg:col-span-2 space-y-4">
                                {cartItems.map((item) => (
                                    <div key={item.id}
                                        className="bg-white rounded-2xl border border-gray-200 p-4 sm:p-5 hover:border-violet-200 hover:shadow-md transition-all">
                                        <div className="flex gap-4">
                                            {/* Image */}
                                            <div className="w-24 h-24 sm:w-28 sm:h-28 flex-shrink-0 rounded-xl overflow-hidden bg-gray-100 border border-gray-200">
                                                <img
                                                    src={item.imageUrl || item.image || item.product?.imageUrl || 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=400&q=80'}
                                                    alt={item.name || item.product?.name || 'Product'}
                                                    className="w-full h-full object-cover"
                                                    onError={(e) => {
                                                        e.target.src = 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=400&q=80';
                                                    }}
                                                />
                                            </div>

                                            {/* Details */}
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-start justify-between gap-2">
                                                    <div className="min-w-0">
                                                        <span className="text-[10px] font-bold uppercase tracking-widest text-violet-600 block mb-0.5">
                                                            {item.category || item.product?.category}
                                                        </span>
                                                        <h3 className="font-bold text-gray-900 text-sm sm:text-base truncate">
                                                            {item.name || item.product?.name}
                                                        </h3>
                                                    </div>
                                                    <button onClick={() => removeFromCart(item.id)}
                                                        className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all flex-shrink-0">
                                                        <Trash2 className="w-4 h-4" />
                                                    </button>
                                                </div>

                                                <div className="flex flex-wrap items-center justify-between gap-3 mt-3">
                                                    {/* Quantity */}
                                                    <div className="flex items-center bg-gray-100 rounded-lg border border-gray-200 p-0.5">
                                                        <button onClick={() => updateQuantity(item.id, item.quantity - 1)}
                                                            className="p-1.5 hover:bg-white rounded-md transition-all disabled:opacity-30"
                                                            disabled={item.quantity <= 1}>
                                                            <Minus className="w-3.5 h-3.5 text-gray-600" />
                                                        </button>
                                                        <span className="px-3 text-sm font-bold text-gray-900 min-w-[2rem] text-center">{item.quantity}</span>
                                                        <button onClick={() => updateQuantity(item.id, item.quantity + 1)}
                                                            className="p-1.5 hover:bg-white rounded-md transition-all">
                                                            <Plus className="w-3.5 h-3.5 text-gray-600" />
                                                        </button>
                                                    </div>
                                                    {/* Price */}
                                                    <div className="text-right">
                                                        <div className="text-base sm:text-lg font-black text-gray-900">
                                                            ${((item.price || item.currentPrice || item.basePrice || 0) * item.quantity).toFixed(2)}
                                                        </div>
                                                        <div className="text-xs text-gray-400">
                                                            ${(item.price || item.currentPrice || item.basePrice || 0).toFixed(2)} each
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {/* Order Summary */}
                            <div className="lg:col-span-1">
                                <div className="bg-white border border-gray-200 rounded-2xl p-5 sm:p-6 sticky top-20 shadow-sm">
                                    <h2 className="text-base font-bold text-gray-900 mb-5 flex items-center gap-2">
                                        <CreditCard className="w-5 h-5 text-violet-600" />
                                        Order Summary
                                    </h2>
                                    <div className="space-y-3 mb-5">
                                        <div className="flex justify-between text-gray-600 text-sm">
                                            <span>Subtotal ({cartItems.length} items)</span>
                                            <span className="font-semibold text-gray-900">${subtotal.toFixed(2)}</span>
                                        </div>
                                        <div className="flex justify-between text-gray-600 text-sm">
                                            <span>Tax (8%)</span>
                                            <span className="font-semibold text-gray-900">${tax.toFixed(2)}</span>
                                        </div>
                                        <div className="flex justify-between text-gray-600 text-sm">
                                            <span className="flex items-center gap-1"><Truck className="w-3.5 h-3.5" /> Shipping</span>
                                            <span className="font-semibold">
                                                {shipping === 0
                                                    ? <span className="text-green-600 font-bold">FREE</span>
                                                    : <span className="text-gray-900">${shipping.toFixed(2)}</span>}
                                            </span>
                                        </div>
                                        {subtotal < 100 && subtotal > 0 && (
                                            <div className="bg-violet-50 border border-violet-200 rounded-xl p-3 text-xs text-violet-700">
                                                Add <strong>${(100 - subtotal).toFixed(2)}</strong> more for free shipping
                                            </div>
                                        )}
                                        <div className="border-t border-gray-200 pt-3 flex justify-between items-center">
                                            <span className="font-bold text-gray-900">Total</span>
                                            <span className="text-xl font-extrabold text-violet-600">${total.toFixed(2)}</span>
                                        </div>
                                    </div>
                                    <Link href="/checkout"
                                        className="w-full py-3 rounded-xl bg-violet-600 hover:bg-violet-700 text-white font-bold text-sm transition-all flex items-center justify-center gap-2 mb-3">
                                        Checkout Now <Zap className="w-4 h-4 text-yellow-300" />
                                    </Link>
                                    <div className="space-y-2 text-xs text-gray-400">
                                        <div className="flex items-center gap-2"><ShieldCheck className="w-3.5 h-3.5 text-green-500" /> Secure encrypted checkout</div>
                                        <div className="flex items-center gap-2"><Truck className="w-3.5 h-3.5 text-blue-500" /> Fast global delivery</div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </main>
            <Footer />
        </div>
    );
}
