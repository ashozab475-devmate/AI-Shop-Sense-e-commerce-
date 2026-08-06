import { NextResponse } from 'next/server';
import { jwtVerify } from 'jose';
import prisma from '@/lib/prisma';
import { calculateTradeValue } from '@/lib/tradeValuationEngine';

const secret = new TextEncoder().encode(process.env.JWT_SECRET || 'your-secret-key-change-me-in-production');

export async function POST(request) {
  try {
    const token = request.headers.get('authorization')?.split(' ')[1];
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { payload } = await jwtVerify(token, secret);
    const userId = payload.userId || payload.id;
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { productName, category, condition, ageYears, description, imageUrl } = await request.json();
    const parsedAge = Number(ageYears);

    if (!productName || !category || !condition || Number.isNaN(parsedAge)) {
      return NextResponse.json({ error: 'Missing or invalid required fields' }, { status: 400 });
    }

    const valuation = await calculateTradeValue({
      productName,
      category,
      condition,
      ageYears: parsedAge,
    });

    const trade = await prisma.tradeRequest.create({
      data: {
        userId,
        productName,
        category,
        condition,
        ageYears: parsedAge,
        description,
        imageUrl,
        estimatedValue: valuation.estimatedValue,
        offeredValue: valuation.offeredValue,
        status: 'pending',
      },
    });

    return NextResponse.json({ success: true, trade, valuation });
  } catch (error) {
    console.error('Trade submit error:', error);

    const message = error instanceof Error ? error.message : 'Internal server error';
    const isAuthError =
      message.includes('JWT') ||
      message.includes('token') ||
      message.includes('invalid') ||
      message.includes('expired') ||
      message.includes('signature');

    if (isAuthError) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    return NextResponse.json({ error: message }, { status: 500 });
  }
}
