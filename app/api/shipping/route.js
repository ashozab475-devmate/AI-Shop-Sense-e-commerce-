import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';


export async function POST(request) {
  try {
    const { weight, country, method } = await request.json();

    if (!weight || !country) {
      return NextResponse.json(
        { error: 'Weight and country are required' },
        { status: 400 }
      );
    }

    // Find applicable shipping rate
    const shippingRate = await prisma.shippingRate.findFirst({
      where: {
        country: { equals: country, mode: 'insensitive' },
        minWeight: { lte: weight },
        maxWeight: { gte: weight },
        active: true,
        ...(method && { method }),
      },
      orderBy: { baseCost: 'asc' },
    });

    if (!shippingRate) {
      return NextResponse.json(
        { error: 'Shipping not available for this location' },
        { status: 404 }
      );
    }

    // Calculate shipping cost
    const shippingCost = shippingRate.baseCost + (weight * shippingRate.perKgCost);
    const estimatedDelivery = new Date();
    estimatedDelivery.setDate(estimatedDelivery.getDate() + shippingRate.estimatedDays);

    return NextResponse.json({
      success: true,
      shippingCost: parseFloat(shippingCost.toFixed(2)),
      method: shippingRate.method,
      estimatedDays: shippingRate.estimatedDays,
      estimatedDelivery: estimatedDelivery.toISOString(),
      carrier: 'Standard Carrier',
    });
  } catch (error) {
    console.error('Calculate shipping error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const country = searchParams.get('country');

    if (!country) {
      return NextResponse.json(
        { error: 'Country is required' },
        { status: 400 }
      );
    }

    // Get all shipping methods for country
    const rates = await prisma.shippingRate.findMany({
      where: {
        country: { equals: country, mode: 'insensitive' },
        active: true,
      },
      select: {
        method: true,
        baseCost: true,
        perKgCost: true,
        estimatedDays: true,
      },
      distinct: ['method'],
    });

    if (rates.length === 0) {
      return NextResponse.json(
        { error: 'No shipping methods available for this country' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      country,
      methods: rates,
    });
  } catch (error) {
    console.error('Get shipping methods error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
