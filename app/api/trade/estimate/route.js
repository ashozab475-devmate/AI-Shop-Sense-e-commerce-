import { NextResponse } from 'next/server';
import { calculateTradeValue } from '@/lib/tradeValuationEngine';

export async function POST(request) {
  try {
    const { productName, category, condition, ageYears } = await request.json();
    if (!productName || !category || !condition || ageYears === undefined) {
      return NextResponse.json({ error: 'productName, category, condition, ageYears are required' }, { status: 400 });
    }
    const valuation = await calculateTradeValue({ productName, category, condition, ageYears: parseFloat(ageYears) });
    return NextResponse.json(valuation);
  } catch (error) {
    console.error('Trade estimate error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
