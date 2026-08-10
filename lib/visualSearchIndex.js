/**
 * Visual Search Index — singleton loader
 * Loads the pre-computed embeddings JSON from public/visual-search-index.json
 * Falls back to empty index gracefully.
 */

let _index = null;

export async function loadSearchIndex() {
  if (_index) return _index;

  try {
    // In Node.js (API route), read from filesystem
    const { readFile } = await import('fs/promises');
    const { join } = await import('path');
    const filePath = join(process.cwd(), 'public', 'visual-search-index.json');
    const raw = await readFile(filePath, 'utf-8');
    _index = JSON.parse(raw);
    console.log(`[VisualSearch] Index loaded: ${_index.length} embeddings`);
    return _index;
  } catch (err) {
    console.warn('[VisualSearch] Index not found, returning empty:', err.message);
    return [];
  }
}

/**
 * Cosine similarity between two float32 arrays
 */
export function cosineSimilarity(a, b) {
  let dot = 0, normA = 0, normB = 0;
  for (let i = 0; i < a.length; i++) {
    dot   += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }
  return dot / (Math.sqrt(normA) * Math.sqrt(normB) + 1e-8);
}

/**
 * Find top-k most similar items to queryEmbedding
 */
export function findTopK(queryEmbedding, index, k = 5, minScore = 0.25) {
  const results = index.map(item => ({
    ...item,
    score: cosineSimilarity(queryEmbedding, item.embedding),
  }));

  return results
    .filter(r => r.score >= minScore)
    .sort((a, b) => b.score - a.score)
    .slice(0, k);
}
