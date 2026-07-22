import { NextResponse } from 'next/server';
import { jwtVerify } from 'jose';
import { updateProductPrice } from '@/lib/pricingEngine';
import prisma from '@/lib/prisma';

const secret = new TextEncoder().encode(process.env.JWT_SECRET || 'your-secret-key-change-me-in-production');

async function getUser(request) {
  const token = request.headers.get('authorization')?.split(' ')[1];
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, secret);
    const userId = payload.id || payload.userId;
    return await prisma.user.findUnique({ where: { id: userId } });
  } catch { return null; }
}

export async function PUT(request, { params }) {
  try {
    const user = await getUser(request);
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    if (user.role !== 'admin') return NextResponse.json({ error: 'Admin access required' }, { status: 403 });

    const { productId } = await params;
    const { newPrice, reason } = await request.json();

    if (!productId || newPrice === undefined) {
      return NextResponse.json({ error: 'Product ID and new price required' }, { status: 400 });
    }
    if (newPrice <= 0) {
      return NextResponse.json({ error: 'Price must be greater than 0' }, { status: 400 });
    }

    const updated = await updateProductPrice(productId, parseFloat(newPrice), reason || 'manual');
    return NextResponse.json({ success: true, product: updated });
  } catch (error) {
    console.error('Update price error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
