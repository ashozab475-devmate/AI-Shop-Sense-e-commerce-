import { getServerSession } from 'next-auth/next';
import { prisma } from '@/lib/prisma';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';

export async function GET(request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || (session.user.role !== 'seller' && session.user.role !== 'admin')) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const orders = await prisma.order.findMany({
      where: session.user.role === 'seller' ? { sellerId: session.user.id } : {},
      include: { items: true },
      orderBy: { createdAt: 'desc' },
    });

    return Response.json({ orders });
  } catch (error) {
    console.error('Seller orders error:', error);
    return Response.json({ error: 'Failed to fetch orders' }, { status: 500 });
  }
}
