import { NextResponse } from 'next/server';
import { getPricingSchedulerStatus } from '@/lib/pricingScheduler';

export async function GET(request) {
  try {
    const status = getPricingSchedulerStatus();
    return NextResponse.json(status);
  } catch (error) {
    console.error('Get scheduler status error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
