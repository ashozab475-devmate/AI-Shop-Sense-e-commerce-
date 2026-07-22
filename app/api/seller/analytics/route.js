import { getServerSession } from 'next-auth/next';
import { prisma } from '@/lib/prisma';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';

export async function GET(request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || (session.user.role !== 'seller' && session.user.role !== 'admin')) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const where = session.user.role === 'seller' ? { sellerId: session.user.id } : {};

    const [totalSales, totalOrders, totalProducts, avgRating, totalReviews, topProducts] = await Promise.all([
      prisma.order.aggregate({
        where,
        _sum: { total: true },
      }),
      prisma.order.count({ where }),
      prisma.product.count({ where }),
      prisma.product.aggregate({
        where,
        _avg: { rating: true },
      }),
      prisma.review.count({ where: { product: { ...where } } }),
      prisma.product.findMany({
        where,
        orderBy: { sales: 'desc' },
        take: 5,
        select: { name: true, sales: true },
      }),
    ]);

    return Response.json({
      totalSales: totalSales._sum.total || 0,
      totalOrders,
      totalProducts,
      avgRating: avgRating._avg.rating || 0,
      totalReviews,
      topProducts,
      activeProducts: totalProducts,
    });
  } catch (error) {
    console.error('Seller analytics error:', error);
    return Response.json({ error: 'Failed to fetch analytics' }, { status: 500 });
  }
}
