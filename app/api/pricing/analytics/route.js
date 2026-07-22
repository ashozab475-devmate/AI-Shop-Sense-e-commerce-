import { NextResponse } from 'next/server';
import { jwtVerify } from 'jose';
import prisma from '@/lib/prisma';

const secret = new TextEncoder().encode(process.env.JWT_SECRET || 'your-secret-key-change-me-in-production');

async function getUser(request) {
  const token = request.headers.get('authorization')?.split(' ')[1];
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, secret);
    const userId = payload.id || payload.userId;
    return await prisma.user.findUnique({ where: { id: userId } });
  } catch { return null; }
}

export async function GET(request) {
  try {
    const user = await getUser(request);
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    if (user.role !== 'admin') return NextResponse.json({ error: 'Admin access required' }, { status: 403 });

    // Fetch all products with demand metrics
    const products = await prisma.product.findMany({
      include: {
        demandMetrics: true,
        priceHistory: { orderBy: { timestamp: 'desc' }, take: 1 },
      },
    });

    if (!products.length) {
      return NextResponse.json({
        totalProducts: 0,
        avgBasePrice: 0,
        avgCurrentPrice: 0,
        priceChanges: 0,
        topDemandProducts: [],
        lowStockProducts: [],
      });
    }

    const totalProducts    = products.length;
    const avgBasePrice     = products.reduce((s, p) => s + (p.basePrice || 0), 0) / totalProducts;
    const avgCurrentPrice  = products.reduce((s, p) => s + (p.currentPrice || 0), 0) / totalProducts;
    const priceChanges     = products.filter(p => p.currentPrice !== p.basePrice).length;

    const topDemandProducts = [...products]
      .sort((a, b) => {
        // Combined demand score: purchases × 10 + cart adds × 3 + views × 1
        const scoreA = (a.demandMetrics?.purchaseCount || 0) * 10
                     + (a.demandMetrics?.cartAddCount  || 0) * 3
                     + (a.demandMetrics?.viewCount     || 0);
        const scoreB = (b.demandMetrics?.purchaseCount || 0) * 10
                     + (b.demandMetrics?.cartAddCount  || 0) * 3
                     + (b.demandMetrics?.viewCount     || 0);
        return scoreB - scoreA;
      })
      .slice(0, 5)
      .map(p => ({
        id:           p.id,
        name:         p.name,
        basePrice:    p.basePrice,
        currentPrice: p.currentPrice,
        demandCount:  p.demandMetrics?.purchaseCount || 0,
        viewCount:    p.demandMetrics?.viewCount     || 0,
        cartAddCount: p.demandMetrics?.cartAddCount  || 0,
        demandScore:  Math.round(
          ((p.demandMetrics?.purchaseCount || 0) * 10 +
           (p.demandMetrics?.cartAddCount  || 0) * 3 +
           (p.demandMetrics?.viewCount     || 0)) * 10
        ) / 10,
      }));

    const lowStockProducts = products
      .filter(p => p.stock < (p.maxStock || 100) * 0.2)
      .slice(0, 5)
      .map(p => ({
        id:           p.id,
        name:         p.name,
        stock:        p.stock,
        maxStock:     p.maxStock || 100,
        currentPrice: p.currentPrice,
        basePrice:    p.basePrice,
      }));

    return NextResponse.json({
      totalProducts,
      avgBasePrice:    Math.round(avgBasePrice * 100) / 100,
      avgCurrentPrice: Math.round(avgCurrentPrice * 100) / 100,
      priceChanges,
      topDemandProducts,
      lowStockProducts,
      isAdmin: user.role === 'admin',
      demandMetrics: [...products]
        .filter(p => p.demandMetrics)
        .sort((a, b) => {
          const scoreA = (a.demandMetrics?.purchaseCount || 0) * 10 + (a.demandMetrics?.cartAddCount || 0) * 3 + (a.demandMetrics?.viewCount || 0);
          const scoreB = (b.demandMetrics?.purchaseCount || 0) * 10 + (b.demandMetrics?.cartAddCount || 0) * 3 + (b.demandMetrics?.viewCount || 0);
          return scoreB - scoreA;
        })
        .slice(0, 10)
        .map(p => ({
          id:            p.id,
          name:          p.name,
          category:      p.category,
          basePrice:     p.basePrice,
          currentPrice:  p.currentPrice,
          viewCount:     p.demandMetrics?.viewCount || 0,
          cartAddCount:  p.demandMetrics?.cartAddCount || 0,
          purchaseCount: p.demandMetrics?.purchaseCount || 0,
          demandScore:   Math.round(
            ((p.demandMetrics?.purchaseCount || 0) * 10 +
             (p.demandMetrics?.cartAddCount || 0) * 3 +
             (p.demandMetrics?.viewCount || 0)) / 10 * 10
          ) / 10,
        })),
    });
  } catch (error) {
    console.error('Get pricing analytics error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
