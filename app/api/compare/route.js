import { prisma } from '@/lib/prisma';

export async function POST(request) {
  try {
    const { productIds } = await request.json();

    if (!Array.isArray(productIds) || productIds.length === 0) {
      return Response.json({ error: 'Invalid product IDs' }, { status: 400 });
    }

    const products = await prisma.product.findMany({
      where: { id: { in: productIds } },
      select: {
        id: true,
        name: true,
        price: true,
        image: true,
        category: true,
        rating: true,
        stock: true,
        brand: true,
        warranty: true,
        description: true,
      },
    });

    return Response.json({ products });
  } catch (error) {
    console.error('Compare error:', error);
    return Response.json({ error: 'Compare failed' }, { status: 500 });
  }
}
