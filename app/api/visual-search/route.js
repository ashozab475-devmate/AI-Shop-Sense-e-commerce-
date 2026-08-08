import { NextResponse } from 'next/server';
import { readFile } from 'fs/promises';
import path from 'path';

export const dynamic = 'force-dynamic';

export async function POST(request) {
  try {
    const formData = await request.formData();
    const file = formData.get('file');

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    const pythonServiceUrl = process.env.SEARCH_SERVICE_URL;

    // ── No external search service — graceful offline mode ──────────────────
    if (!pythonServiceUrl || pythonServiceUrl.includes('127.0.0.1') || pythonServiceUrl.includes('localhost')) {
      return NextResponse.json(
        { error: 'Visual search service is not configured for this deployment.', offline: true },
        { status: 503 }
      );
    }

    const pythonFormData = new FormData();
    pythonFormData.append('image', file);

    const response = await fetch(pythonServiceUrl, {
      method: 'POST',
      body: pythonFormData,
      signal: AbortSignal.timeout(15000), // 15s timeout
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Search service error:', errorText);
      return NextResponse.json(
        { error: `Search service failed: ${response.statusText}` },
        { status: response.status }
      );
    }

    const data = await response.json();

    if (data.status === 'success' && data.products && data.products.length > 0) {
      const MIN_SCORE = 0.30;
      const qualified = data.products.filter(p => (p.similarity_score || 0) >= MIN_SCORE);

      if (qualified.length === 0) {
        return NextResponse.json({ message: 'No result found' });
      }

      // Convert image paths to base64 or use relative_path for serving
      const products = await Promise.all(qualified.map(async (p) => {
        let imageUrl = p.image_url || '';
        const imgPath = p.image_path || p.path || '';
        const relPath = p.relative_path || '';

        if (!imageUrl && imgPath) {
          try {
            // Try relative path from relevant_images first
            if (relPath) {
              const absPath = path.join(process.cwd(), relPath);
              const imgBuffer = await readFile(absPath);
              imageUrl = `data:image/jpeg;base64,${imgBuffer.toString('base64')}`;
            } else {
              const imgBuffer = await readFile(imgPath);
              imageUrl = `data:image/jpeg;base64,${imgBuffer.toString('base64')}`;
            }
          } catch {
            imageUrl = '';
          }
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
    const isConnRefused = error.code === 'ECONNREFUSED' || error.name === 'TimeoutError' ||
      error.message?.includes('ECONNREFUSED') || error.message?.includes('fetch failed');
    console.error('Visual Search Error:', error.message);

    return NextResponse.json(
      {
        error: isConnRefused ? 'Search service unavailable.' : 'Search service error.',
        offline: isConnRefused,
        details: error.message,
      },
      { status: isConnRefused ? 503 : 500 }
    );
  }
}
