import { NextResponse } from 'next/server';
import { jwtVerify } from 'jose';
import prisma from '@/lib/prisma';

const secret = new TextEncoder().encode(process.env.JWT_SECRET || 'your-secret-key-change-me-in-production');

async function requireAdmin(request) {
  const token = request.headers.get('authorization')?.split(' ')[1];
  if (!token) return null;
  const { payload } = await jwtVerify(token, secret);
  const userId = payload.id || payload.userId;
  const user = await prisma.user.findUnique({ where: { id: userId } });
  return user?.role === 'admin' ? user : null;
}

export async function GET(request) {
  try {
    const admin = await requireAdmin(request);
    if (!admin) return NextResponse.json({ error: 'Admin access required' }, { status: 403 });

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');

    const trades = await prisma.tradeRequest.findMany({
      where: status ? { status } : {},
      include: { user: { select: { name: true, email: true } } },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ trades });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
