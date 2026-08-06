import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';


export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const productId = searchParams.get('productId');
    const type = searchParams.get('type') || 'similar'; // similar, trending, popular
    const limit = Math.min(parseInt(searchParams.get('limit') || '6'), 20);

    if (type === 'similar' && !productId) {
      return NextResponse.json({ error: 'Product ID required for similar products' }, { status: 400 });
    }

    let products = [];

    if (type === 'similar') {
      // Get similar products by category
      const product = await prisma.product.findUnique({ where: { id: productId } });
      if (!product) {
        return NextResponse.json({ error: 'Product not found' }, { status: 404 });
      }

      products = await prisma.product.findMany({
        where: {
          category: product.category,
          id: { not: productId },
        },
        orderBy: { rating: 'desc' },
        take: limit,
        select: {
          id: true,
          name: true,
          description: true,
          basePrice: true,
          currentPrice: true,
          category: true,
          imageUrl: true,
          stock: true,
          rating: true,
          reviewCount: true,
        },
      });
    } else if (type === 'trending') {
      // Get trending products (high demand, high rating)
      products = await prisma.product.findMany({
        where: { stock: { gt: 0 } },
        orderBy: [{ reviewCount: 'desc' }, { rating: 'desc' }],
        take: limit,
        select: {
          id: true,
          name: true,
          description: true,
          basePrice: true,
          currentPrice: true,
          category: true,
          imageUrl: true,
          stock: true,
          rating: true,
          reviewCount: true,
        },
      });
    } else if (type === 'popular') {
      // Get popular products (high rating)
      products = await prisma.product.findMany({
        where: { stock: { gt: 0 } },
        orderBy: { rating: 'desc' },
        take: limit,
        select: {
          id: true,
          name: true,
          description: true,
          basePrice: true,
          currentPrice: true,
          category: true,
          imageUrl: true,
          stock: true,
          rating: true,
          reviewCount: true,
        },
      });
    }

    return NextResponse.json({ products, type });
  } catch (error) {
    console.error('Get recommendations error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
