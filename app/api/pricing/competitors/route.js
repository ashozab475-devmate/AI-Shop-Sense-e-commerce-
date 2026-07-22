import { NextResponse } from 'next/server';
import competitorTracker from '@/lib/competitorTracker';

export async function POST(request) {
    try {
        const { productId, competitorName, price, url } = await request.json();
        
        if (!productId || !competitorName || !price) {
            return NextResponse.json(
                { error: 'Missing required fields: productId, competitorName, price' },
                { status: 400 }
            );
        }
        
        const result = await competitorTracker.addCompetitorPrice(
            productId,
            competitorName,
            price,
            url
        );
        
        return NextResponse.json({
            success: true,
            data: result
        });
    } catch (error) {
        console.error('Error adding competitor price:', error);
        return NextResponse.json(
            { error: error.message },
            { status: 500 }
        );
    }
}

export async function GET(request) {
    try {
        const { searchParams } = new URL(request.url);
        const productId = searchParams.get('productId');
        
        if (!productId) {
            return NextResponse.json(
                { error: 'productId is required' },
                { status: 400 }
            );
        }
        
        const priceData = await competitorTracker.getAverageCompetitorPrice(productId);
        
        return NextResponse.json({
            success: true,
            data: priceData
        });
    } catch (error) {
        console.error('Error fetching competitor prices:', error);
        return NextResponse.json(
            { error: error.message },
            { status: 500 }
        );
    }
}
