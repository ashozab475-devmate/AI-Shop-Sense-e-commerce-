import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { jwtVerify } from 'jose';

const secret = new TextEncoder().encode(process.env.JWT_SECRET || 'your-secret-key-change-me-in-production');

export async function GET(request, { params }) {
  try {
    const { returnId } = params;

    const returnRequest = await prisma.return.findUnique({
      where: { id: returnId },
      include: { order: { include: { user: true } } },
    });

    if (!returnRequest) {
      return NextResponse.json({ error: 'Return not found' }, { status: 404 });
    }

    return NextResponse.json(returnRequest);
  } catch (error) {
    console.error('Get return error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(request, { params }) {
  try {
    const token = request.headers.get('authorization')?.split(' ')[1];
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const verified = await jwtVerify(token, secret);
    const userId = verified.payload.userId;

    // Check if user is admin
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user || user.role !== 'admin') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    const { returnId } = params;
    const { status, refundAmount, notes } = await request.json();

    if (!status) {
      return NextResponse.json({ error: 'Status is required' }, { status: 400 });
    }

    const validStatuses = ['pending', 'approved', 'rejected', 'refunded', 'completed'];
    if (!validStatuses.includes(status)) {
      return NextResponse.json(
        { error: `Invalid status. Must be one of: ${validStatuses.join(', ')}` },
        { status: 400 }
      );
    }

    // Update return
    const returnRequest = await prisma.return.update({
      where: { id: returnId },
      data: {
        status,
        refundAmount: refundAmount || undefined,
        notes,
      },
      include: { order: true },
    });

    // If refunded, update order status
    if (status === 'refunded') {
      await prisma.order.update({
        where: { id: returnRequest.orderId },
        data: { status: 'refunded' },
      });
    }

    return NextResponse.json({
      success: true,
      message: 'Return updated successfully',
      return: returnRequest,
    });
  } catch (error) {
    console.error('Update return error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(request, { params }) {
  try {
    const token = request.headers.get('authorization')?.split(' ')[1];
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const verified = await jwtVerify(token, secret);
    const userId = verified.payload.userId;

    // Check if user is admin
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user || user.role !== 'admin') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    const { returnId } = params;

    // Only allow deletion of pending returns
    const returnRequest = await prisma.return.findUnique({
      where: { id: returnId },
    });

    if (!returnRequest) {
      return NextResponse.json({ error: 'Return not found' }, { status: 404 });
    }

    if (returnRequest.status !== 'pending') {
      return NextResponse.json(
        { error: 'Can only delete pending returns' },
        { status: 400 }
      );
    }

    await prisma.return.delete({
      where: { id: returnId },
    });

    return NextResponse.json({
      success: true,
      message: 'Return deleted successfully',
    });
  } catch (error) {
    console.error('Delete return error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
