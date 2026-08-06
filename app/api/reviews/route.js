import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { jwtVerify } from 'jose';

const secret = new TextEncoder().encode(process.env.JWT_SECRET || 'your-secret-key-change-me-in-production');

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const productId = searchParams.get('productId');
    const limit = parseInt(searchParams.get('limit') || '10');
    const offset = parseInt(searchParams.get('offset') || '0');

    if (!productId) {
      return NextResponse.json({ error: 'Product ID required' }, { status: 400 });
    }

    const reviews = await prisma.review.findMany({
      where: { productId },
      include: { user: { select: { name: true, profilePicture: true } } },
      orderBy: { createdAt: 'desc' },
      take: limit,
      skip: offset,
    });

    const total = await prisma.review.count({ where: { productId } });

    return NextResponse.json({ reviews, total });
  } catch (error) {
    console.error('Get reviews error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const token = request.headers.get('authorization')?.split(' ')[1];
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const verified = await jwtVerify(token, secret);
    const userId = verified.payload.id || verified.payload.userId;

    const { productId, rating, title, comment } = await request.json();

    if (!productId || !rating || !title) {
      return NextResponse.json({ error: 'Product ID, rating, and title required' }, { status: 400 });
    }

    if (rating < 1 || rating > 5) {
      return NextResponse.json({ error: 'Rating must be between 1 and 5' }, { status: 400 });
    }

    // Check if product exists
    const product = await prisma.product.findUnique({ where: { id: productId } });
    if (!product) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }

    // Create review
    const review = await prisma.review.create({
      data: { productId, userId, rating, title, comment },
      include: { user: { select: { name: true, profilePicture: true } } },
    });

    // Update product rating
    const allReviews = await prisma.review.findMany({ where: { productId } });
    const avgRating = allReviews.reduce((sum, r) => sum + r.rating, 0) / allReviews.length;

    await prisma.product.update({
      where: { id: productId },
      data: { rating: avgRating, reviewCount: allReviews.length },
    });

    return NextResponse.json({
      success: true,
      message: 'Review created successfully',
      review,
    });
  } catch (error) {
    console.error('Create review error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
