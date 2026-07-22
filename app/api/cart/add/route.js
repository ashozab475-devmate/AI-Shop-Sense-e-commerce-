import { NextResponse } from 'next/server';
import { jwtVerify } from 'jose';
import prisma from '@/lib/prisma';

export async function POST(request) {
    try {
        const authHeader = request.headers.get('authorization');
        const token = authHeader?.startsWith('Bearer ')
            ? authHeader.slice(7)
            : request.cookies.get('auth-token')?.value;
        if (!token) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const secret = new TextEncoder().encode(process.env.JWT_SECRET || 'your-secret-key-change-me-in-production');
        const decoded = await jwtVerify(token, secret);
        const userId = decoded.payload.id || decoded.payload.userId;

        if (!userId) {
            return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
        }

        const { productId, quantity } = await request.json();

        if (!productId || !quantity || quantity < 1) {
            return NextResponse.json({ error: 'Invalid product or quantity' }, { status: 400 });
        }

        const product = await prisma.product.findUnique({
            where: { id: productId }
        });

        if (!product) {
            return NextResponse.json({ error: 'Product not found' }, { status: 404 });
        }

        let cart = await prisma.cart.findUnique({
            where: { userId }
        });

        if (!cart) {
            cart = await prisma.cart.create({
                data: { userId }
            });
        }

        const existingItem = await prisma.cartItem.findFirst({
            where: {
                cartId: cart.id,
                productId
            }
        });

        let cartItem;
        if (existingItem) {
            cartItem = await prisma.cartItem.update({
                where: { id: existingItem.id },
                data: {
                    quantity: existingItem.quantity + quantity
                },
                include: {
                    product: {
                        select: {
                            id: true,
                            name: true,
                            imageUrl: true,
                            currentPrice: true,
                            basePrice: true,
                            category: true,
                        }
                    }
                }
            });
        } else {
            cartItem = await prisma.cartItem.create({
                data: {
                    cartId: cart.id,
                    productId,
                    quantity,
                    price: product.currentPrice || product.basePrice || product.price || 0
                },
                include: {
                    product: {
                        select: {
                            id: true,
                            name: true,
                            imageUrl: true,
                            currentPrice: true,
                            basePrice: true,
                            category: true,
                        }
                    }
                }
            });
        }

        return NextResponse.json({
            message: 'Item added to cart',
            item: cartItem
        });
    } catch (error) {
        console.error('Add to cart error:', error);
        return NextResponse.json({ error: 'Failed to add item to cart' }, { status: 500 });
    }
}
