import { prisma } from '@/lib/prisma';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const q = searchParams.get('q') || '';
    const minPrice = parseInt(searchParams.get('minPrice') || '0');
    const maxPrice = parseInt(searchParams.get('maxPrice') || '10000');
    const category = searchParams.get('category') || '';
    const rating = parseInt(searchParams.get('rating') || '0');
    const sortBy = searchParams.get('sortBy') || 'relevance';

    let where = {
      AND: [
        { approved: true },
        { stock: { gt: 0 } },
        { price: { gte: minPrice, lte: maxPrice } },
      ],
    };

    if (q) {
      where.AND.push({
        OR: [
          { name: { contains: q, mode: 'insensitive' } },
          { description: { contains: q, mode: 'insensitive' } },
        ],
      });
    }

    if (category) {
      where.AND.push({ category });
    }

    if (rating > 0) {
      where.AND.push({ rating: { gte: rating } });
    }

    let orderBy = { createdAt: 'desc' };
    if (sortBy === 'price-low') orderBy = { price: 'asc' };
    if (sortBy === 'price-high') orderBy = { price: 'desc' };
    if (sortBy === 'rating') orderBy = { rating: 'desc' };
    if (sortBy === 'newest') orderBy = { createdAt: 'desc' };

    const products = await prisma.product.findMany({
      where,
      orderBy,
      take: 50,
      select: {
        id: true,
        name: true,
        price: true,
        image: true,
        category: true,
        rating: true,
        stock: true,
      },
    });

    return Response.json({ products });
  } catch (error) {
    console.error('Search error:', error);
    return Response.json({ error: 'Search failed' }, { status: 500 });
  }
}
