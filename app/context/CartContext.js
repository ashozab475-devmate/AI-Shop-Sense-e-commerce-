'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';

const CartContext = createContext();

export function CartProvider({ children }) {
    const [cartItems, setCartItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // Fetch cart on mount — only client-side after hydration
    useEffect(() => {
        const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
        if (token) fetchCart();
        else setLoading(false);
    }, []);

    const fetchCart = async () => {
        try {
            const token = localStorage.getItem('token');
            if (!token) {
                setCartItems([]);
                setLoading(false);
                return;
            }
            setLoading(true);
            const response = await fetch('/api/cart', {
                headers: { 'Authorization': `Bearer ${token}` },
            });
            if (response.ok) {
                const data = await response.json();
                setCartItems(data.cart.items);
            } else {
                setCartItems([]);
            }
        } catch (err) {
            console.error('Failed to fetch cart:', err);
            setError('Failed to load cart');
        } finally {
            setLoading(false);
        }
    };

    const addToCart = async (product) => {
        try {
            const token = localStorage.getItem('token');

            // Guest mode — no token, store locally in state only
            if (!token) {
                setCartItems(items => {
                    const existing = items.find(i => i.productId === product.id || i.id === product.id);
                    if (existing) {
                        return items.map(i =>
                            (i.productId === product.id || i.id === product.id)
                                ? { ...i, quantity: i.quantity + 1 }
                                : i
                        );
                    }
                    return [...items, {
                        id:        `guest-${product.id}`,
                        productId: product.id,
                        quantity:  1,
                        price:     product.currentPrice || product.basePrice || 0,
                        imageUrl:  product.imageUrl,
                        name:      product.name,
                        category:  product.category,
                        description: product.description,
                        product,
                    }];
                });
                return;
            }

            const response = await fetch('/api/cart/add', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
                body: JSON.stringify({ productId: product.id, quantity: 1 })
            });

            if (response.ok) {
                const data = await response.json();
                setCartItems(items => {
                    const existingItem = items.find(item => item.productId === product.id);
                    if (existingItem) {
                        return items.map(item =>
                            item.productId === product.id
                                ? { ...item, quantity: item.quantity + 1 }
                                : item
                        );
                    }
                    return [...items, data.item];
                });
            } else if (response.status === 401) {
                // Token expired — fall back to guest mode
                setCartItems(items => {
                    const existing = items.find(i => i.productId === product.id);
                    if (existing) {
                        return items.map(i =>
                            i.productId === product.id ? { ...i, quantity: i.quantity + 1 } : i
                        );
                    }
                    return [...items, {
                        id:        `guest-${product.id}`,
                        productId: product.id,
                        quantity:  1,
                        price:     product.currentPrice || product.basePrice || 0,
                        imageUrl:  product.imageUrl,
                        name:      product.name,
                        category:  product.category,
                        description: product.description,
                        product,
                    }];
                });
            }
        } catch (err) {
            console.error('Failed to add to cart:', err);
            setError('Failed to add item to cart');
        }
    };

    const removeFromCart = async (itemId) => {
        try {
            // Guest item — remove locally only
            if (String(itemId).startsWith('guest-')) {
                setCartItems(items => items.filter(item => item.id !== itemId));
                return;
            }

            const token = localStorage.getItem('token');

            if (!token) {
                setCartItems(items => items.filter(item => item.id !== itemId));
                return;
            }

            const response = await fetch('/api/cart/remove', {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
                body: JSON.stringify({ itemId })
            });

            // Remove from local state regardless of API result
            setCartItems(items => items.filter(item => item.id !== itemId));
        } catch (err) {
            console.error('Failed to remove from cart:', err);
            setCartItems(items => items.filter(item => item.id !== itemId));
        }
    };

    const updateQuantity = async (itemId, quantity) => {
        try {
            if (quantity < 1) {
                await removeFromCart(itemId);
                return;
            }

            // Guest item — update locally only
            if (String(itemId).startsWith('guest-')) {
                setCartItems(items =>
                    items.map(item =>
                        item.id === itemId ? { ...item, quantity } : item
                    )
                );
                return;
            }

            const token = localStorage.getItem('token');

            // No token — update locally
            if (!token) {
                setCartItems(items =>
                    items.map(item =>
                        item.id === itemId ? { ...item, quantity } : item
                    )
                );
                return;
            }

            const response = await fetch('/api/cart/update', {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
                body: JSON.stringify({ itemId, quantity })
            });

            if (response.ok) {
                setCartItems(items =>
                    items.map(item =>
                        item.id === itemId ? { ...item, quantity } : item
                    )
                );
            } else {
                // API failed — still update locally so UI responds
                setCartItems(items =>
                    items.map(item =>
                        item.id === itemId ? { ...item, quantity } : item
                    )
                );
            }
        } catch (err) {
            console.error('Failed to update quantity:', err);
            // Update locally even on error
            setCartItems(items =>
                items.map(item =>
                    item.id === itemId ? { ...item, quantity } : item
                )
            );
        }
    };

    const clearCart = async () => {
        try {
            const token = localStorage.getItem('token');
            const response = await fetch('/api/cart/clear', {
                method: 'DELETE',
                headers: {
                    ...(token && { 'Authorization': `Bearer ${token}` }),
                },
            });

            if (response.ok) {
                setCartItems([]);
            }
        } catch (err) {
            console.error('Failed to clear cart:', err);
            setError('Failed to clear cart');
        }
    };

    const getCartTotal = () => {
        return cartItems.reduce((sum, item) => {
            const price = item.price || 0;
            return sum + (price * item.quantity);
        }, 0);
    };

    const getCartCount = () => {
        return cartItems.reduce((sum, item) => sum + item.quantity, 0);
    };

    return (
        <CartContext.Provider value={{
            cartItems,
            loading,
            error,
            addToCart,
            removeFromCart,
            updateQuantity,
            clearCart,
            getCartTotal,
            getCartCount,
            fetchCart
        }}>
            {children}
        </CartContext.Provider>
    );
}

export function useCart() {
    const context = useContext(CartContext);
    if (!context) {
        throw new Error('useCart must be used within CartProvider');
    }
    return context;
}
