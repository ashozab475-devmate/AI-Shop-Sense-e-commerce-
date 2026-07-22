import { getServerSession } from 'next-auth/next';
import { prisma } from '@/lib/prisma';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';

export async function GET(request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== 'admin') {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type') || 'sales';

    if (type === 'sales') {
      const orders = await prisma.order.findMany({
        select: { total: true, createdAt: true },
        orderBy: { createdAt: 'desc' },
        take: 30,
      });

      const data = orders.map(o => ({
        date: o.createdAt.toLocaleDateString(),
        orders: 1,
        revenue: o.total,
      }));

      return Response.json({
        sales: {
          total: orders.reduce((sum, o) => sum + o.total, 0),
          orders: orders.length,
          avgOrder: orders.length > 0 ? Math.round(orders.reduce((sum, o) => sum + o.total, 0) / orders.length) : 0,
          data,
        },
      });
    }

    if (type === 'users') {
      const users = await prisma.user.findMany({
        select: { id: true, createdAt: true, role: true },
      });

      const newUsers = users.filter(u => u.createdAt > new Date(Date.now() - 30 * 24 * 60 * 60 * 1000));
      const activeUsers = users.filter(u => u.role === 'customer');

      return Response.json({
        users: {
          total: users.length,
          new: newUsers.length,
          active: activeUsers.length,
        },
      });
    }

    if (type === 'products') {
      const products = await prisma.product.findMany({
        select: { id: true, approved: true },
      });

      return Response.json({
        products: {
          total: products.length,
          approved: products.filter(p => p.approved).length,
          pending: products.filter(p => !p.approved).length,
        },
      });
    }

    if (type === 'inventory') {
      const products = await prisma.product.findMany({
        select: { stock: true },
      });

      const lowStock = products.filter(p => p.stock > 0 && p.stock < 10).length;
      const outOfStock = products.filter(p => p.stock === 0).length;

      return Response.json({
        inventory: {
          total: products.reduce((sum, p) => sum + p.stock, 0),
          lowStock,
          outOfStock,
        },
      });
    }

    return Response.json({ error: 'Invalid report type' }, { status: 400 });
  } catch (error) {
    console.error('Admin reports error:', error);
    return Response.json({ error: 'Failed to fetch reports' }, { status: 500 });
  }
}
