import { NextResponse } from 'next/server';
import { jwtVerify } from 'jose';
import prisma from '@/lib/prisma';
import { calculateTradeValue } from '@/lib/tradeValuationEngine';

const secret = new TextEncoder().encode(process.env.JWT_SECRET || 'your-secret-key-change-me-in-production');

export async function POST(request) {
  try {
    const token = request.headers.get('authorization')?.split(' ')[1];
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const { payload } = await jwtVerify(token, secret);
    const userId = payload.id || payload.userId;

    const { productName, category, condition, ageYears, description, imageUrl } = await request.json();
    if (!productName || !category || !condition || ageYears === undefined) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const valuation = await calculateTradeValue({ productName, category, condition, ageYears: parseFloat(ageYears) });

    const trade = await prisma.tradeRequest.create({
      data: {
        userId,
        productName,
        category,
        condition,
        ageYears: parseFloat(ageYears),
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
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
