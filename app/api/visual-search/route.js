/**
 * Visual Search API — Pure JavaScript CLIP via @xenova/transformers
 * No Python service needed. Runs entirely on Vercel serverless.
 *
 * Flow:
 *  1. Receive uploaded image
 *  2. Extract CLIP embedding using transformers.js (ViT-B/32)
 *  3. Compare against pre-computed index in public/visual-search-index.json
 *  4. Return top matches with similarity scores
 */

import { NextResponse } from 'next/server';
import { loadSearchIndex, findTopK } from '@/lib/visualSearchIndex';

export const dynamic = 'force-dynamic';
// Allow larger payloads for image uploads
export const config = { api: { bodyParser: false } };

// Cache the pipeline across requests (module-level singleton)
let _pipeline = null;

async function getEmbeddingPipeline() {
  if (_pipeline) return _pipeline;

  try {
    const { pipeline, env } = await import('@xenova/transformers');

    // Use local cache in /tmp on Vercel to avoid re-downloading
    env.cacheDir = '/tmp/transformers-cache';
    env.allowLocalModels = false;

    _pipeline = await pipeline(
      'image-feature-extraction',
      'Xenova/clip-vit-base-patch32',
      { revision: 'main' }
    );

    console.log('[VisualSearch] CLIP pipeline loaded');
    return _pipeline;
  } catch (err) {
    console.error('[VisualSearch] Failed to load pipeline:', err.message);
    return null;
  }
}

export async function POST(request) {
  try {
    const formData = await request.formData();
    const file = formData.get('file');

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    // ── Load search index ───────────────────────────────────────────────────
    const index = await loadSearchIndex();

    if (!index || index.length === 0) {
      return NextResponse.json(
        { error: 'Visual search index not available. Please check deployment.', offline: true },
        { status: 503 }
      );
    }

    // ── Get CLIP pipeline ───────────────────────────────────────────────────
    const extractor = await getEmbeddingPipeline();

    if (!extractor) {
      return NextResponse.json(
        { error: 'Visual search model not available.', offline: true },
        { status: 503 }
      );
    }

    // ── Extract embedding from uploaded image ───────────────────────────────
    const arrayBuffer = await file.arrayBuffer();
    const base64 = Buffer.from(arrayBuffer).toString('base64');
    const mimeType = file.type || 'image/jpeg';
    const dataUrl = `data:${mimeType};base64,${base64}`;

    const output = await extractor(dataUrl, { pooling: 'mean', normalize: true });
    const embedding = Array.from(output.data);

    // ── Find top matches ────────────────────────────────────────────────────
    const topMatches = findTopK(embedding, index, 5, 0.20);

    if (topMatches.length === 0) {
      return NextResponse.json({ message: 'No result found' });
    }

    // Format results — serve images as base64 from relevant_images/
    const { readFile } = await import('fs/promises');
    const { join } = await import('path');

    const formatProduct = async (match) => {
      let imageUrl = '';

      if (match.relative_path) {
        try {
          const absPath = join(process.cwd(), match.relative_path);
          const buf = await readFile(absPath);
          imageUrl = `data:image/jpeg;base64,${buf.toString('base64')}`;
        } catch {
          imageUrl = '';
        }
      }

      return {
        name:     match.category || 'Product',
        category: match.category || '',
        price:    match.price    || 0,
        score:    match.score,
        imageUrl,
        image_id: match.image_id,
      };
    };

    const formatted = await Promise.all(topMatches.map(formatProduct));

    return NextResponse.json({
      best_match: formatted[0],
      similar:    formatted.slice(1),
    });

  } catch (error) {
    console.error('[VisualSearch] Error:', error.message);
    return NextResponse.json(
      { error: 'Visual search failed.', details: error.message, offline: true },
      { status: 500 }
    );
  }
}
