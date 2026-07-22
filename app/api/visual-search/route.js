import { NextResponse } from 'next/server';
import { readFile } from 'fs/promises';
import { join } from 'path';

export async function POST(request) {
    try {
        const formData = await request.formData();
        const file = formData.get('file');

        if (!file) {
            return NextResponse.json({ error: 'No file provided' }, { status: 400 });
        }

        const pythonFormData = new FormData();
        pythonFormData.append('image', file);

        const pythonServiceUrl = process.env.SEARCH_SERVICE_URL || 'http://127.0.0.1:5000/api/image-search/search';
        console.log(`Forwarding search request to: ${pythonServiceUrl}`);

        const response = await fetch(pythonServiceUrl, {
            method: 'POST',
            body: pythonFormData,
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error('Python service error response:', errorText);
            return NextResponse.json(
                { error: `Search service failed: ${response.statusText}` },
                { status: response.status }
            );
        }

        const data = await response.json();

        if (data.status === 'success' && data.products && data.products.length > 0) {
            // Filter by minimum similarity score — reject weak matches
            const MIN_SCORE = 0.30;  // cosine similarity must be at least 0.30
            const qualified = data.products.filter(p => (p.similarity_score || 0) >= MIN_SCORE);

            if (qualified.length === 0) {
                return NextResponse.json({ message: 'No result found' });
            }
            // Convert each product's image to a base64 data URL so Next.js can serve it
            const products = await Promise.all(qualified.map(async (p) => {
                let imageUrl = '';
                const imgPath = p.image_path || p.path || '';

                if (imgPath) {
                    try {
                        // image_path is an absolute Windows path — read it directly
                        const imgBuffer = await readFile(imgPath);
                        const base64 = imgBuffer.toString('base64');
                        imageUrl = `data:image/jpeg;base64,${base64}`;
                    } catch {
                        // fallback to stored URL if file read fails
                        imageUrl = p.image_url || '';
                    }
                } else {
                    imageUrl = p.image_url || '';
                }

                return {
                    name:     p.product_name || p.name || 'Unknown Product',
                    category: p.category || '',
                    price:    p.price || 0,
                    score:    p.similarity_score || 0,
                    imageUrl,
                };
            }));

            return NextResponse.json({
                best_match: { ...products[0], score: 0.99 },
                similar:    products.slice(1, 3).map(p => ({ ...p, score: 0.95 })),
            });
        }

        return NextResponse.json({ message: 'No result found' });

    } catch (error) {
        const isConnRefused = error.code === 'ECONNREFUSED' ||
            error.message?.includes('ECONNREFUSED') ||
            error.message?.includes('fetch failed');
        console.error('Visual Search Proxy Error:', error.message);

        return NextResponse.json(
            {
                error: isConnRefused
                    ? 'Failed to connect to search service. Is it running?'
                    : 'Search service error.',
                details: error.message,
            },
            { status: isConnRefused ? 503 : 500 }
        );
    }
}
