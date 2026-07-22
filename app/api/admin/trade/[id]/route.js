import { NextResponse } from 'next/server';
import { jwtVerify } from 'jose';
import prisma from '@/lib/prisma';

const secret = new TextEncoder().encode(process.env.JWT_SECRET || 'your-secret-key-change-me-in-production');

export async function PUT(request, { params }) {
  try {
    const token = request.headers.get('authorization')?.split(' ')[1];
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const { payload } = await jwtVerify(token, secret);
    const userId = payload.id || payload.userId;
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (user?.role !== 'admin') return NextResponse.json({ error: 'Admin access required' }, { status: 403 });

    const { id } = await params;
    const { status, adminNotes } = await request.json();

    const trade = await prisma.tradeRequest.update({
      where: { id },
      data: { status, adminNotes },
      include: { user: true },
    });

    // When admin APPROVES a trade → list the product on the shopping page
    if (status === 'approved') {
      const listingPrice = trade.offeredValue * 1.2; // 20% markup for resale

      await prisma.product.create({
        data: {
          name:         `${trade.productName} (Pre-owned)`,
          description:  `${trade.condition.replace('_', ' ')} condition, ${trade.ageYears}yr old. ${trade.description || ''} — Trade-in item verified by ShopSense.`.trim(),
          category:     trade.category,
          imageUrl:     trade.imageUrl || null,
          basePrice:    listingPrice,
          currentPrice: listingPrice,
          minPrice:     listingPrice * 0.7,
          maxPrice:     listingPrice * 1.5,
          stock:        1,
          maxStock:     1,
          approved:     true,
        },
      });
    }

    return NextResponse.json({ success: true, trade });
  } catch (error) {
    console.error('Trade approval error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
