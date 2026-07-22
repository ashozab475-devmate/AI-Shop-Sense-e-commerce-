import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(request) {
    try {
        let config = await prisma.pricingConfig.findFirst();
        
        if (!config) {
            config = await prisma.pricingConfig.create({
                data: {
                    stockWeight: 0.3,
                    demandWeight: 0.4,
                    competitorWeight: 0.3,
                    maxIncreasePercent: 50,
                    maxDecreasePercent: 30,
                    minProfitMargin: 10,
                    updateFrequencyHours: 6
                }
            });
        }
        
        return NextResponse.json({
            success: true,
            data: config
        });
    } catch (error) {
        console.error('Error fetching pricing config:', error);
        return NextResponse.json(
            { error: error.message },
            { status: 500 }
        );
    }
}

export async function PUT(request) {
    try {
        const body = await request.json();
        
        let config = await prisma.pricingConfig.findFirst();
        
        if (!config) {
            config = await prisma.pricingConfig.create({
                data: body
            });
        } else {
            config = await prisma.pricingConfig.update({
                where: { id: config.id },
                data: body
            });
        }
        
        return NextResponse.json({
            success: true,
            data: config
        });
    } catch (error) {
        console.error('Error updating pricing config:', error);
        return NextResponse.json(
            { error: error.message },
            { status: 500 }
        );
    }
}
