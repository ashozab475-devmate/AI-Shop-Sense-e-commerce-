import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { calculatePrice } from '@/lib/pricingEngine';

const prisma = new PrismaClient();

export async function POST(request) {
  try {
    const { productId } = await request.json();

    if (!productId) {
      return NextResponse.json({ error: 'Product ID required' }, { status: 400 });
    }

    // Get pricing config
    const config = await prisma.pricingConfig.findFirst();
    if (!config) {
      return NextResponse.json({ error: 'Pricing config not found' }, { status: 500 });
    }

    const priceData = await calculatePrice(productId, config);
    return NextResponse.json(priceData);
  } catch (error) {
    console.error('Calculate price error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
