"""
Build public/visual-search-index.json from the existing FAISS embeddings.
Run once: python build_js_index.py

This creates a compact JSON index that the JS CLIP route uses for similarity search.
Each entry: { image_id, category, relative_path, price, embedding: [...512 floats] }
"""
import os, json, pickle
import numpy as np
from pathlib import Path

BASE_DIR    = Path(__file__).parent
SS_DIR      = BASE_DIR / 'search_service'
OUTPUT_PATH = BASE_DIR / 'public' / 'visual-search-index.json'

print("Loading embeddings and metadata...")

# Load embeddings
emb_path = SS_DIR / 'visual_search_train_embeddings.npy'
if not emb_path.exists():
    emb_path = SS_DIR / 'visual_search_model_train_embeddings.npy'

embeddings = np.load(str(emb_path)).astype('float32')
print(f"  Embeddings shape: {embeddings.shape}")

# Load metadata
meta_path = SS_DIR / 'visual_search_train_metadata.pkl'
with open(meta_path, 'rb') as f:
    metadata = pickle.load(f)
print(f"  Metadata entries: {len(metadata)}")

count = min(len(embeddings), len(metadata))
embeddings = embeddings[:count]
metadata   = metadata[:count]
print(f"  Using {count} entries")

# Build index
print("Building JSON index...")
index = []
project_root = str(BASE_DIR)

for i, (meta, emb) in enumerate(zip(metadata, embeddings)):
    # Make relative_path relative to project root
    img_path = meta.get('image_path', '') or ''
    rel_path = meta.get('relative_path', '')

    if not rel_path and img_path:
        # Try to make it relative
        try:
            rel_path = str(Path(img_path).relative_to(BASE_DIR))
            rel_path = rel_path.replace('\\', '/')
        except ValueError:
            rel_path = ''

    # Normalise embedding to unit vector for cosine sim
    norm = np.linalg.norm(emb)
    if norm > 0:
        emb = emb / norm

    entry = {
        'image_id':     meta.get('image_id', f'img_{i}'),
        'category':     meta.get('category', ''),
        'relative_path': rel_path,
        'price':        float(meta.get('price', 0) or 0),
        'embedding':    emb.tolist(),   # list of 512 floats
    }
    index.append(entry)

    if (i + 1) % 200 == 0:
        print(f"  Processed {i+1}/{len(metadata)}")

print(f"\nTotal entries: {len(index)}")

# Save to public/
OUTPUT_PATH.parent.mkdir(exist_ok=True)
with open(OUTPUT_PATH, 'w') as f:
    json.dump(index, f, separators=(',', ':'))  # compact JSON

size_mb = OUTPUT_PATH.stat().st_size / 1024 / 1024
print(f"Saved to {OUTPUT_PATH}  ({size_mb:.1f} MB)")
print("Done!")
