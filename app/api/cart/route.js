import { NextResponse } from 'next/server';
import { jwtVerify } from 'jose';
import prisma from '@/lib/prisma';

export async function GET(request) {
    try {
        const authHeader = request.headers.get('authorization');
        const token = authHeader?.startsWith('Bearer ')
            ? authHeader.slice(7)
            : request.cookies.get('auth-token')?.value;

        if (!token) {
            return NextResponse.json({ cart: { id: null, items: [], total: 0, itemCount: 0 } }, { status: 200 });
        }

        const secret = new TextEncoder().encode(process.env.JWT_SECRET || 'your-secret-key-change-me-in-production');
        let decoded;

        try {
            decoded = await jwtVerify(token, secret);
        } catch (jwtError) {
            const isExpired = jwtError?.code === 'ERR_JWT_EXPIRED' || jwtError?.message?.includes('JWTExpired');
            const isInvalid = jwtError?.code === 'ERR_JWT' || jwtError?.message?.includes('invalid');

            if (isExpired || isInvalid) {
                console.warn('Cart token invalid or expired:', jwtError?.message || jwtError);
                return NextResponse.json({ cart: { id: null, items: [], total: 0, itemCount: 0 } }, { status: 200 });
            }

            throw jwtError;
        }

        const userId = decoded.payload.id || decoded.payload.userId;
        if (!userId) return NextResponse.json({ error: 'Invalid token' }, { status: 401 });

        let cart = await prisma.cart.findUnique({
            where: { userId },
            include: {
                items: {
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
                }
            }
        });

        if (!cart) {
            cart = await prisma.cart.create({
                data: { userId },
                include: { items: true }
            });
        }

        const total = cart.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);

        return NextResponse.json({
            cart: {
                id: cart.id,
                items: cart.items,
                total,
                itemCount: cart.items.reduce((sum, item) => sum + item.quantity, 0)
            }
        });
    } catch (error) {
        console.error('Get cart error:', error);
        // Return empty cart instead of 500 to avoid breaking the UI
        return NextResponse.json({ cart: { id: null, items: [], total: 0, itemCount: 0 } }, { status: 200 });
    }
}
