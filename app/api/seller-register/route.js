import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { jwtVerify } from 'jose';

const secret = new TextEncoder().encode(process.env.JWT_SECRET || 'your-secret-key-change-me-in-production');

export async function POST(request) {
  try {
    const token = request.headers.get('authorization')?.split(' ')[1];
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const verified = await jwtVerify(token, secret);
    const userId = verified.payload.id || verified.payload.userId;

    // Get user
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Check if already a seller or admin
    if (user.role !== 'user') {
      return NextResponse.json(
        { error: `User is already a ${user.role}` },
        { status: 400 }
      );
    }

    // Update user role to seller
    const updated = await prisma.user.update({
      where: { id: userId },
      data: { role: 'seller' },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        role: true,
        createdAt: true,
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Successfully registered as seller',
      user: updated,
    });
  } catch (error) {
    console.error('Seller registration error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
