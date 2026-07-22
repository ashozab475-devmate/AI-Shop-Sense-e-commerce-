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

// GET /api/wallet — get current balance
export async function GET(request) {
  const userId = await getUser(request);
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const user = await prisma.user.findUnique({ where: { id: userId }, select: { walletBalance: true } });
  return NextResponse.json({ balance: user?.walletBalance || 0 });
}

// POST /api/wallet/deduct — deduct credit at checkout
export async function POST(request) {
  const userId = await getUser(request);
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const { amount } = await request.json();
  if (!amount || amount <= 0) return NextResponse.json({ error: 'Invalid amount' }, { status: 400 });

  const user = await prisma.user.findUnique({ where: { id: userId }, select: { walletBalance: true } });
  if (!user || user.walletBalance < amount) {
    return NextResponse.json({ error: 'Insufficient wallet balance' }, { status: 400 });
  }

  const updated = await prisma.user.update({
    where: { id: userId },
    data: { walletBalance: { decrement: amount } },
    select: { walletBalance: true },
  });

  return NextResponse.json({ success: true, newBalance: updated.walletBalance });
}
