import { getServerSession } from 'next-auth/next';
import { prisma } from '@/lib/prisma';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';

export async function GET(request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== 'admin') {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const [totalRevenue, totalOrders, totalUsers, totalProducts, approvedProducts, recentOrders, recentUsers] = await Promise.all([
      prisma.order.aggregate({
        _sum: { total: true },
      }),
      prisma.order.count(),
      prisma.user.count(),
      prisma.product.count(),
      prisma.product.count({ where: { approved: true } }),
      prisma.order.findMany({
        take: 5,
        orderBy: { createdAt: 'desc' },
        include: { user: { select: { name: true } } },
      }),
      prisma.user.findMany({
        take: 5,
        orderBy: { createdAt: 'desc' },
        select: { id: true, name: true, email: true, role: true },
      }),
    ]);

    const activeUsers = await prisma.user.count({
      where: {
        lastLogin: {
          gte: new Date(Date.now() - 24 * 60 * 60 * 1000),
        },
      },
    });

    return Response.json({
      totalRevenue: totalRevenue._sum.total || 0,
      totalOrders,
      totalUsers,
      totalProducts,
      approvedProducts,
      activeUsers,
      recentOrders: recentOrders.map(o => ({
        id: o.id,
        customerName: o.user.name,
        total: o.total,
        createdAt: o.createdAt,
      })),
      recentUsers,
    });
  } catch (error) {
    console.error('Admin dashboard error:', error);
    return Response.json({ error: 'Failed to fetch dashboard' }, { status: 500 });
  }
}
