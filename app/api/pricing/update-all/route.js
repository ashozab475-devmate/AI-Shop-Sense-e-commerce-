import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { updateAllPrices } from '@/lib/pricingEngine';

const prisma = new PrismaClient();

export async function POST(request) {
  try {
    // Get pricing config
    const config = await prisma.pricingConfig.findFirst();
    if (!config) {
      return NextResponse.json({ error: 'Pricing config not found' }, { status: 500 });
    }

    const results = await updateAllPrices(config);
    
    return NextResponse.json({
      success: true,
      totalUpdated: results.filter(r => r.success).length,
      totalFailed: results.filter(r => !r.success).length,
      results,
    });
  } catch (error) {
    console.error('Batch update prices error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
