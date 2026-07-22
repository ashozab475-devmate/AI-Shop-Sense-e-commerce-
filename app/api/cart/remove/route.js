import { NextResponse } from 'next/server';
import { jwtVerify } from 'jose';
import prisma from '@/lib/prisma';

export async function DELETE(request) {
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

        const { itemId } = await request.json();

        if (!itemId) {
            return NextResponse.json({ error: 'Item ID required' }, { status: 400 });
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

        await prisma.cartItem.delete({
            where: { id: itemId }
        });

        return NextResponse.json({
            message: 'Item removed from cart'
        });
    } catch (error) {
        console.error('Remove from cart error:', error);
        return NextResponse.json({ error: 'Failed to remove item from cart' }, { status: 500 });
    }
}
