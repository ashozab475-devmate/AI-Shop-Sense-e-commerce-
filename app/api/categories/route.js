import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { cache, CACHE_KEYS, CACHE_TTL } from '@/lib/cache';

const prisma = new PrismaClient();

export async function GET(request) {
  try {
    // Check cache
    const cacheKey = CACHE_KEYS.CATEGORIES;
    const cached = cache.get(cacheKey);
    if (cached) {
      return NextResponse.json(cached);
    }

    // Get unique categories with product count
    const categories = await prisma.product.groupBy({
      by: ['category'],
      _count: true,
    });

    const result = categories.map(cat => ({
      name: cat.category,
      count: cat._count,
    }));

    // Cache result
    cache.set(cacheKey, result, CACHE_TTL.CATEGORIES);

    return NextResponse.json(result);
  } catch (error) {
    console.error('Get categories error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
