'use client';

import React, { useState } from 'react';
import { useCart } from '../../context/CartContext';
import { ShoppingCart, Check, Heart } from 'lucide-react';

export default function AddToCartButton({ product }) {
    const { addToCart } = useCart();
    const [isAdded, setIsAdded] = useState(false);

    const handleAddToCart = () => {
        addToCart(product);
        setIsAdded(true);
        setTimeout(() => setIsAdded(false), 2000);

        // Track cart_add demand event — fire and forget
        fetch('/api/demand/track', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ productId: product.id, event: 'cart_add' }),
        }).catch(() => {});
    };

    return (
        <div className="flex flex-col sm:flex-row gap-4">
            <button 
                onClick={handleAddToCart}
                disabled={isAdded}
                className={`flex-1 py-4 rounded-xl font-bold text-lg transition-all duration-300 active:scale-95 shadow-2xl flex items-center justify-center gap-3 ${
                    isAdded 
                    ? 'bg-green-500 text-white shadow-green-500/20' 
                    : 'bg-white text-slate-900 hover:bg-slate-100 shadow-white/5'
                }`}
            >
                {isAdded ? (
                    <>
                        <Check className="h-6 w-6 animate-bounce" />
                        Added to selections
                    </>
                ) : (
                    <>
                        <ShoppingCart className="h-6 w-6" />
                        Add to Cart
                    </>
                )}
            </button>
            <button className="px-6 py-4 rounded-xl border border-white/20 hover:bg-white/10 transition-all duration-300 active:scale-95 text-white group">
                <Heart className="h-6 w-6 group-hover:scale-110 group-hover:fill-pink-500 group-hover:text-pink-500 transition-all" />
            </button>
        </div>
    );
}
