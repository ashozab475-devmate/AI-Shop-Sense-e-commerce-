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

    const products = await prisma.product.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    });

    return Response.json({ products });
  } catch (error) {
    console.error('Seller products error:', error);
    return Response.json({ error: 'Failed to fetch products' }, { status: 500 });
  }
}
