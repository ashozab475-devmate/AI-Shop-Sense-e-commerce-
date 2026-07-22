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

        const cart = await prisma.cart.findUnique({
            where: { userId }
        });

        if (!cart) {
            return NextResponse.json({ error: 'Cart not found' }, { status: 404 });
        }

        await prisma.cartItem.deleteMany({
            where: { cartId: cart.id }
        });

        return NextResponse.json({
            message: 'Cart cleared successfully'
        });
    } catch (error) {
        console.error('Clear cart error:', error);
        return NextResponse.json({ error: 'Failed to clear cart' }, { status: 500 });
    }
}
