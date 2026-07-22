import { NextResponse } from 'next/server';
import { getPriceHistory } from '@/lib/pricingEngine';

export async function GET(request, { params }) {
  try {
    const { productId } = params;
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '30');

    if (!productId) {
      return NextResponse.json({ error: 'Product ID required' }, { status: 400 });
    }

    const history = await getPriceHistory(productId, limit);
    return NextResponse.json({ history });
  } catch (error) {
    console.error('Get price history error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
