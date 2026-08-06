import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { jwtVerify } from 'jose';

const secret = new TextEncoder().encode(process.env.JWT_SECRET || 'your-secret-key-change-me-in-production');

// Get all categories
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = Math.min(parseInt(searchParams.get('limit') || '50'), 100);
    const offset = parseInt(searchParams.get('offset') || '0');

    const categories = await prisma.product.groupBy({
      by: ['category'],
      _count: true,
      orderBy: { _count: { category: 'desc' } },
      take: limit,
      skip: offset,
    });

    const result = categories.map(cat => ({
      name: cat.category,
      count: cat._count,
    }));

    const total = await prisma.product.groupBy({
      by: ['category'],
    });

    return NextResponse.json({
      categories: result,
      total: total.length,
      limit,
      offset,
    });
  } catch (error) {
    console.error('Get categories error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// Create new category (by adding a product with new category)
export async function POST(request) {
  try {
    const token = request.headers.get('authorization')?.split(' ')[1];
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const verified = await jwtVerify(token, secret);
    const userId = verified.payload.id || verified.payload.userId;

    // Check if user is admin
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user || user.role !== 'admin') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    const { name, description } = await request.json();

    if (!name || name.trim().length === 0) {
      return NextResponse.json({ error: 'Category name required' }, { status: 400 });
    }

    // Check if category already exists
    const existing = await prisma.product.findFirst({
      where: { category: name },
    });

    if (existing) {
      return NextResponse.json({ error: 'Category already exists' }, { status: 400 });
    }

    // Create a placeholder product for the category
    const product = await prisma.product.create({
      data: {
        name: `${name} - Placeholder`,
        category: name,
        description: description || `Products in ${name} category`,
        basePrice: 0,
        currentPrice: 0,
        stock: 0,
        maxStock: 0,
        approved: true,
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Category created successfully',
      category: name,
    });
  } catch (error) {
    console.error('Create category error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// Delete category (delete all products in category)
export async function DELETE(request) {
  try {
    const token = request.headers.get('authorization')?.split(' ')[1];
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const verified = await jwtVerify(token, secret);
    const userId = verified.payload.id || verified.payload.userId;

    // Check if user is admin
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user || user.role !== 'admin') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const categoryName = searchParams.get('name');

    if (!categoryName) {
      return NextResponse.json({ error: 'Category name required' }, { status: 400 });
    }

    // Delete all products in this category
    const result = await prisma.product.deleteMany({
      where: { category: categoryName },
    });

    return NextResponse.json({
      success: true,
      message: `Deleted ${result.count} products from ${categoryName}`,
      deletedCount: result.count,
    });
  } catch (error) {
    console.error('Delete category error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
