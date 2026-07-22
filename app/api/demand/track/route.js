import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

/**
 * POST /api/demand/track
 * Body: { productId, event: 'view' | 'cart_add' | 'purchase' }
 * Upserts DemandMetrics for the product.
 */
export async function POST(request) {
    try {
        const { productId, event } = await request.json();

        if (!productId || !event) {
            return NextResponse.json({ error: 'productId and event required' }, { status: 400 });
        }

        const validEvents = ['view', 'cart_add', 'purchase'];
        if (!validEvents.includes(event)) {
            return NextResponse.json({ error: `event must be one of: ${validEvents.join(', ')}` }, { status: 400 });
        }

        // Map event to the DB field to increment
        const incrementMap = {
            view:      { viewCount: { increment: 1 }, lastViewed: new Date() },
            cart_add:  { cartAddCount: { increment: 1 } },
            purchase:  { purchaseCount: { increment: 1 }, cartAddCount: { increment: 1 } },
        };

        const updateData = incrementMap[event];

        // Upsert — create row if it doesn't exist yet
        await prisma.demandMetrics.upsert({
            where:  { productId },
            update: updateData,
            create: {
                productId,
                viewCount:     event === 'view'     ? 1 : 0,
                cartAddCount:  event === 'cart_add' || event === 'purchase' ? 1 : 0,
                purchaseCount: event === 'purchase' ? 1 : 0,
                lastViewed:    event === 'view' ? new Date() : null,
            },
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        // Non-critical — don't break the user flow if tracking fails
        console.error('Demand tracking error:', error.message);
        return NextResponse.json({ success: false }, { status: 200 });
    }
}
