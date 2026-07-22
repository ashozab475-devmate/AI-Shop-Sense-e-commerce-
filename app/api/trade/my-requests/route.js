import { NextResponse } from 'next/server';
import { jwtVerify } from 'jose';
import prisma from '@/lib/prisma';

const secret = new TextEncoder().encode(process.env.JWT_SECRET || 'your-secret-key-change-me-in-production');

export async function GET(request) {
  try {
    const token = request.headers.get('authorization')?.split(' ')[1];
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const { payload } = await jwtVerify(token, secret);
    const userId = payload.id || payload.userId;

    const trades = await prisma.tradeRequest.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ trades });
  } catch (error) {
    if (error.message?.includes('JWTExpired') || error.message?.includes('JWTInvalid') || error.code === 'ERR_JWT') {
      return NextResponse.json({ error: 'Session expired, please sign in again' }, { status: 401 });
    }
    console.error('Trade my-requests error:', error.message);
    return NextResponse.json({ trades: [] }, { status: 200 }); // return empty instead of 500
  }
}
