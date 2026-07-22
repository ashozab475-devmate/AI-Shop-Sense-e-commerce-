import { NextResponse } from 'next/server';
import { jwtVerify } from 'jose';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const secret = new TextEncoder().encode(process.env.JWT_SECRET || 'your-secret-key-change-me-in-production');

export async function PUT(request, { params }) {
  try {
    const token = request.headers.get('authorization')?.split(' ')[1];
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const verified = await jwtVerify(token, secret);
    const userId = verified.payload.userId;

    // Check if user is admin
    const admin = await prisma.user.findUnique({ where: { id: userId } });
    if (!admin || admin.role !== 'admin') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    const { productId } = params;
    const { action } = await request.json();

    if (!action || !['approve', 'reject'].includes(action)) {
      return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }

    const product = await prisma.product.findUnique({
      where: { id: productId },
    });

    if (!product) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }

    if (action === 'approve') {
      const updated = await prisma.product.update({
        where: { id: productId },
        data: {
          approved: true,
          approvedBy: userId,
          approvalDate: new Date(),
        },
      });

      return NextResponse.json({
        success: true,
        message: 'Product approved successfully',
        product: updated,
      });
    } else if (action === 'reject') {
      // Delete the product if rejected
      await prisma.product.delete({
        where: { id: productId },
      });

      return NextResponse.json({
        success: true,
        message: 'Product rejected and deleted',
      });
    }
  } catch (error) {
    console.error('Update product approval error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function GET(request, { params }) {
  try {
    const { productId } = params;

    const product = await prisma.product.findUnique({
      where: { id: productId },
    });

    if (!product) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }

    return NextResponse.json(product);
  } catch (error) {
    console.error('Get product error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
