import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { calculatePrice } from '@/lib/pricingEngine';

const prisma = new PrismaClient();

export async function POST(request, { params }) {
    try {
        const { productId } = await params;

        const config = await prisma.pricingConfig.findFirst();
        if (!config) {
            return NextResponse.json({ error: 'Pricing config not found. Seed it first.' }, { status: 500 });
        }

        const priceData = await calculatePrice(productId, config);

        return NextResponse.json({
            success: true,
            data: priceData
        });
    } catch (error) {
        console.error('Error calculating price:', error);
        return NextResponse.json(
            { error: error.message },
            { status: 500 }
        );
    }
}
