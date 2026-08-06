import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { jwtVerify } from 'jose';

const secret = new TextEncoder().encode(process.env.JWT_SECRET || 'your-secret-key-change-me-in-production');

// Get returns for user
export async function GET(request) {
  try {
    const token = request.headers.get('authorization')?.split(' ')[1];
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const verified = await jwtVerify(token, secret);
    const userId = verified.payload.id || verified.payload.userId;

    const { searchParams } = new URL(request.url);
    const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 100);
    const offset = parseInt(searchParams.get('offset') || '0');

    // Get returns for this user
    const returns = await prisma.return.findMany({
      where: { order: { userId } },
      include: { order: true },
      orderBy: { createdAt: 'desc' },
      take: limit,
      skip: offset,
    });

    const total = await prisma.return.count({
      where: { order: { userId } },
    });

    return NextResponse.json({
      returns,
      total,
      limit,
      offset,
    });
  } catch (error) {
    console.error('Get returns error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// Create return request
export async function POST(request) {
  try {
    const token = request.headers.get('authorization')?.split(' ')[1];
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const verified = await jwtVerify(token, secret);
    const userId = verified.payload.id || verified.payload.userId;

    const { orderId, reason, description } = await request.json();

    if (!orderId || !reason) {
      return NextResponse.json(
        { error: 'Order ID and reason are required' },
        { status: 400 }
      );
    }

    // Verify order exists and belongs to user
    const order = await prisma.order.findUnique({
      where: { id: orderId },
    });

    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    if (order.userId !== userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    // Check if return already exists
    const existingReturn = await prisma.return.findFirst({
      where: { orderId },
    });

    if (existingReturn) {
      return NextResponse.json(
        { error: 'Return already exists for this order' },
        { status: 400 }
      );
    }

    // Create return request
    const returnRequest = await prisma.return.create({
      data: {
        orderId,
        reason,
        description,
        status: 'pending',
        refundAmount: order.totalAmount,
      },
      include: { order: true },
    });

    return NextResponse.json({
      success: true,
      message: 'Return request created successfully',
      return: returnRequest,
    });
  } catch (error) {
    console.error('Create return error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
