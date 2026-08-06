import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { jwtVerify } from 'jose';

const secret = new TextEncoder().encode(process.env.JWT_SECRET || 'your-secret-key-change-me-in-production');

export async function DELETE(request, { params }) {
  try {
    const token = request.headers.get('authorization')?.split(' ')[1];
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const verified = await jwtVerify(token, secret);
    const userId = verified.payload.userId;
    const { productId } = params;

    if (!productId) {
      return NextResponse.json({ error: 'Product ID required' }, { status: 400 });
    }

    const product = await prisma.product.findUnique({
      where: { id: productId },
    });

    if (!product) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }

    // Delete related records
    await prisma.cartItem.deleteMany({
      where: { productId: productId },
    });

    await prisma.priceHistory.deleteMany({
      where: { productId: productId },
    });

    await prisma.demandMetrics.deleteMany({
      where: { productId: productId },
    });

    await prisma.competitorPrice.deleteMany({
      where: { productId: productId },
    });

    // Delete product
    await prisma.product.delete({
      where: { id: productId },
    });

    return NextResponse.json({ success: true, message: 'Product deleted' });
  } catch (error) {
    console.error('Delete product error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
