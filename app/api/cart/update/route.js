import { NextResponse } from 'next/server';
import { jwtVerify } from 'jose';
import prisma from '@/lib/prisma';

export async function PUT(request) {
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
        if (!userId) return NextResponse.json({ error: 'Invalid token' }, { status: 401 });

        const { itemId, quantity } = await request.json();

        if (!itemId || !quantity || quantity < 1) {
            return NextResponse.json({ error: 'Invalid item ID or quantity' }, { status: 400 });
        }

        const cartItem = await prisma.cartItem.findUnique({
            where: { id: itemId },
            include: { cart: true }
        });

        if (!cartItem) {
            return NextResponse.json({ error: 'Item not found' }, { status: 404 });
        }

        if (cartItem.cart.userId !== userId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
        }

        const updatedItem = await prisma.cartItem.update({
            where: { id: itemId },
            data: { quantity },
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

        return NextResponse.json({
            message: 'Item quantity updated',
            item: updatedItem
        });
    } catch (error) {
        console.error('Update cart error:', error);
        return NextResponse.json({ error: 'Failed to update item quantity' }, { status: 500 });
    }
}
