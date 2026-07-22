#!/usr/bin/env python3
"""
Fix Visual Search Metadata Alignment
──────────────────────────────────────
Synchronizes the FAISS index and metadata to ensure products match images.

This script:
1. Reads the FAISS index to get the exact number of vectors
2. Processes the CSV in the same order as the training script
3. Builds metadata that perfectly aligns with FAISS indices
4. Saves the corrected metadata
"""

import os
import csv
import pickle
import numpy as np
import faiss
from pathlib import Path
from collections import Counter

# ── Paths ─────────────────────────────────────────────────────────────────────
BASE_DIR = Path(__file__).parent
CSV_PATH = BASE_DIR / 'data' / 'abo_dataset_2000_actual.csv'
PUBLIC_DIR = Path(__file__).parent.parent / 'public'

FAISS_PATH = BASE_DIR / 'visual_search_faiss_index.bin'
METADATA_OUT = BASE_DIR / 'visual_search_train_metadata.pkl'

# ── Configuration ─────────────────────────────────────────────────────────────
BATCH_SIZE = 32
MAX_PRODUCTS = 2000

print("="*80)
print("Visual Search Metadata Alignment Fix")
print("="*80)
print()

# ── 1. Read FAISS index to get expected vector count ─────────────────────────
print("[1/4] Reading FAISS index...")
if not FAISS_PATH.exists():
    print(f"ERROR: FAISS index not found at {FAISS_PATH}")
    exit(1)

faiss_index = faiss.read_index(str(FAISS_PATH))
expected_count = faiss_index.ntotal
print(f"  Expected metadata items: {expected_count}")
print()

# ── 2. Load CLIP for image verification (optional) ────────────────────────────
print("[2/4] Loading image data from CSV...")
if not CSV_PATH.exists():
    print(f"ERROR: CSV not found at {CSV_PATH}")
    exit(1)

with open(CSV_PATH, newline='', encoding='utf-8') as f:
    all_rows = list(csv.DictReader(f))

print(f"  Total rows in CSV: {len(all_rows)}")

# Sample if needed
if len(all_rows) > MAX_PRODUCTS:
    import random
    random.seed(42)
    rows = random.sample(all_rows, MAX_PRODUCTS)
    print(f"  Sampled {MAX_PRODUCTS} products (seed=42)")
else:
    rows = all_rows
    print(f"  Using all {len(rows)} products")

print()

# ── 3. Build metadata by checking which images can be loaded ──────────────────
def load_image_check(path_str: str):
    """Check if image exists without actually loading it."""
    from pathlib import Path
    fname = Path(path_str).name
    candidates = [
        Path(path_str),
        PUBLIC_DIR / 'product-images' / 'abo' / fname,
        PUBLIC_DIR / 'product-images' / fname,
        Path(__file__).parent.parent / 'public' / 'product-images' / 'abo' / fname,
    ]
    for p in candidates:
        if p.exists():
            return True
    return False

print("[3/4] Building synchronized metadata...")
metadata = []
skipped = 0
processed = 0

# Process products in batches (same as training)
for i in range(0, len(rows), BATCH_SIZE):
    batch = rows[i:i + BATCH_SIZE]
    
    # Check which images in this batch exist
    valid_rows = []
    for row in batch:
        if load_image_check(row.get('image_path', '')):
            valid_rows.append(row)
        else:
            skipped += 1
    
    # Add metadata for valid rows (maintaining order)
    for row in valid_rows:
        metadata.append({
            'product_name': row.get('product_name', row.get('category', 'Unknown')),
            'category': row['category'],
            'price': float(row.get('price', 0)),
            'description': row.get('description', ''),
            'image_url': row.get('image_url', ''),
            'image_path': row.get('image_path', ''),
        })
    
    processed = min(i + BATCH_SIZE, len(rows))
    if (i // BATCH_SIZE) % 10 == 0 or processed == len(rows):
        print(f"  {processed}/{len(rows)} processed  ({len(metadata)} valid, {skipped} skipped)")

print()
print(f"  Final metadata count: {len(metadata)}")
print(f"  FAISS index count: {expected_count}")
print()

# ── 4. Check alignment and save ───────────────────────────────────────────────
if len(metadata) != expected_count:
    print(f"WARNING: Metadata count ({len(metadata)}) != FAISS count ({expected_count})")
    print(f"  Difference: {abs(len(metadata) - expected_count)} items")
    print()
    print("This might happen if:")
    print("  1. Images were added/removed after index creation")
    print("  2. Image paths changed")
    print("  3. Training used different random sampling")
    print()
    response = input("Continue and save anyway? (yes/no): ").strip().lower()
    if response != 'yes':
        print("Aborted.")
        exit(1)

print("[4/4] Saving corrected metadata...")

# Show category distribution
categories = [p['category'] for p in metadata]
cat_dist = Counter(categories)
print(f"  Categories ({len(cat_dist)}): {dict(cat_dist)}")
print()

# Save metadata
with open(METADATA_OUT, 'wb') as f:
    pickle.dump(metadata, f)

print(f"✓ Metadata saved → {METADATA_OUT}")
print(f"  Items: {len(metadata)}")
print()

print("="*80)
print("Alignment Complete!")
print("="*80)
print()
print("Next steps:")
print("  1. Restart the Python search service")
print("  2. Test visual search with a product image")
print("  3. Verify that product names now match images")
print()
