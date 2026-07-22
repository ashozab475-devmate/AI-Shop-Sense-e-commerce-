import { NextResponse } from 'next/server';
import { jwtVerify } from 'jose';
import prisma from '@/lib/prisma';

const secret = new TextEncoder().encode(process.env.JWT_SECRET || 'your-secret-key-change-me-in-production');

async function getUser(request) {
  const token = request.headers.get('authorization')?.split(' ')[1];
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, secret);
    return payload.id || payload.userId;
  } catch { return null; }
}

export async function GET(request) {
  const userId = await getUser(request);
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  let wishlist = await prisma.wishlist.findUnique({
    where: { userId },
    include: { items: { include: { product: { select: { id: true, name: true, imageUrl: true, basePrice: true, currentPrice: true, category: true } } }, orderBy: { createdAt: 'desc' } } },
  });

  if (!wishlist) wishlist = { items: [] };
  return NextResponse.json({ items: wishlist.items });
}

export async function POST(request) {
  const userId = await getUser(request);
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { productId } = await request.json();
  if (!productId) return NextResponse.json({ error: 'productId required' }, { status: 400 });

  let wishlist = await prisma.wishlist.findUnique({ where: { userId } });
  if (!wishlist) wishlist = await prisma.wishlist.create({ data: { userId } });

  try {
    const item = await prisma.wishlistItem.create({
      data: { wishlistId: wishlist.id, productId },
      include: { product: { select: { id: true, name: true, imageUrl: true, basePrice: true, currentPrice: true, category: true } } },
    });
    return NextResponse.json({ success: true, item });
  } catch {
    return NextResponse.json({ error: 'Already in wishlist' }, { status: 400 });
  }
}

export async function DELETE(request) {
  const userId = await getUser(request);
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { productId } = await request.json();
  const wishlist = await prisma.wishlist.findUnique({ where: { userId } });
  if (!wishlist) return NextResponse.json({ error: 'Wishlist not found' }, { status: 404 });

  await prisma.wishlistItem.deleteMany({ where: { wishlistId: wishlist.id, productId } });
  return NextResponse.json({ success: true });
}
