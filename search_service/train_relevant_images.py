#!/usr/bin/env python3
"""
Retrain Visual Search Model on relevant_images_index.csv
=========================================================
Uses CLIP ViT-B-32 + FAISS IndexFlatIP (cosine similarity).

Source:
  ../relevant_images_index.csv  (1808 images across 10 categories)

Run from the project root:
    python search_service/train_relevant_images.py

Or from inside search_service/:
    python train_relevant_images.py
"""

import sys
import os
import csv
import json
import pickle
import numpy as np
import torch
import faiss
from pathlib import Path
from PIL import Image
from datetime import datetime

# Fix Windows console encoding and disable buffering
if sys.platform == "win32":
    import io
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding="utf-8", errors="replace", line_buffering=True)
else:
    sys.stdout.reconfigure(line_buffering=True) if hasattr(sys.stdout, 'reconfigure') else None

# ── Paths ─────────────────────────────────────────────────────────────────────
SCRIPT_DIR   = Path(__file__).resolve().parent          # search_service/
PROJECT_ROOT = SCRIPT_DIR.parent                        # project root

CSV_PATH     = PROJECT_ROOT / "relevant_images_index.csv"
IMG_ROOT     = PROJECT_ROOT                              # relative_path is relative to here

OUTPUT_INDEX = SCRIPT_DIR / "visual_search_faiss_index.bin"
OUTPUT_META  = SCRIPT_DIR / "visual_search_train_metadata.pkl"
OUTPUT_INFO  = SCRIPT_DIR / "visual_search_model_info.json"

BATCH_SIZE   = 32

# ── Banner ────────────────────────────────────────────────────────────────────
print("=" * 70)
print("  Visual Search Retraining — relevant_images_index.csv")
print("=" * 70)
print(f"  CSV      : {CSV_PATH}")
print(f"  Image dir: {IMG_ROOT}")
print(f"  Output   : {SCRIPT_DIR}")
print()

# ── Validate CSV ──────────────────────────────────────────────────────────────
if not CSV_PATH.exists():
    print(f"ERROR: CSV not found at {CSV_PATH}")
    sys.exit(1)

print("[1/5] Loading CSV...")
rows = []
missing = 0

with open(CSV_PATH, newline="", encoding="utf-8-sig") as f:
    reader = csv.DictReader(f)
    for row in reader:
        rel_path = row.get("relative_path", "").strip()
        if not rel_path:
            missing += 1
            continue

        abs_path = IMG_ROOT / rel_path
        if not abs_path.exists():
            missing += 1
            continue

        rows.append({
            "filename":     row["filename"].strip(),
            "category":     row["category"].strip(),
            "image_path":   str(abs_path),
            "relative_path": rel_path,
        })

print(f"  Valid images found : {len(rows)}")
print(f"  Missing / skipped  : {missing}")

if not rows:
    print("ERROR: No valid images found. Check that relevant_images/ folder is present.")
    sys.exit(1)

# Category breakdown
cat_counts = {}
for r in rows:
    cat_counts[r["category"]] = cat_counts.get(r["category"], 0) + 1
print(f"  Categories ({len(cat_counts)}):")
for cat, cnt in sorted(cat_counts.items(), key=lambda x: -x[1]):
    print(f"    {cat:<20}: {cnt}")
print()

# ── Load CLIP ─────────────────────────────────────────────────────────────────
print("[2/5] Loading CLIP ViT-B-32...")
try:
    import open_clip
except ImportError:
    print("ERROR: open_clip not installed. Run: pip install open-clip-torch")
    sys.exit(1)

DEVICE = "cuda" if torch.cuda.is_available() else "cpu"
print(f"  Device: {DEVICE}")

model, _, preprocess = open_clip.create_model_and_transforms("ViT-B-32", pretrained="openai")
model = model.to(DEVICE)
model.eval()
print("  Model loaded.\n")

# ── Extract embeddings ────────────────────────────────────────────────────────
print(f"[3/5] Extracting image embeddings (batch_size={BATCH_SIZE})...")
embeddings = []
metadata   = []
errors     = 0
total      = len(rows)

for batch_start in range(0, total, BATCH_SIZE):
    batch  = rows[batch_start : batch_start + BATCH_SIZE]
    images = []
    valid  = []

    for row in batch:
        try:
            img = Image.open(row["image_path"]).convert("RGB")
            images.append(preprocess(img))
            valid.append(row)
        except Exception as e:
            errors += 1
            continue

    if not images:
        continue

    tensor = torch.stack(images).to(DEVICE)
    with torch.no_grad():
        feats = model.encode_image(tensor)
        feats = feats / feats.norm(dim=-1, keepdim=True)   # L2-normalise → cosine sim

    embs = feats.cpu().numpy().astype("float32")

    for i, row in enumerate(valid):
        embeddings.append(embs[i])
        metadata.append({
            "image_id":     Path(row["image_path"]).stem,
            "product_name": Path(row["image_path"]).stem,  # filenames are IDs here
            "category":     row["category"],
            "price":        0.0,
            "description":  row["category"],
            "image_path":   row["image_path"],
            "image_url":    "",
            "relative_path": row["relative_path"],
        })

    done = min(batch_start + BATCH_SIZE, total)
    if done % 200 == 0 or done == total:
        print(f"  [{done:>4}/{total}] indexed: {len(embeddings)}, errors: {errors}")

print(f"\n  Total indexed : {len(embeddings)}")
print(f"  Total errors  : {errors}")

if not embeddings:
    print("ERROR: No embeddings extracted.")
    sys.exit(1)

# ── Build FAISS index ─────────────────────────────────────────────────────────
print("\n[4/5] Building FAISS IndexFlatIP...")
emb_matrix = np.array(embeddings).astype("float32")
dim        = emb_matrix.shape[1]          # 512 for ViT-B-32
index      = faiss.IndexFlatIP(dim)        # inner-product = cosine sim (vectors are L2-normed)
index.add(emb_matrix)
print(f"  Embedding dim : {dim}")
print(f"  Vectors in index: {index.ntotal}")

# ── Save artefacts ────────────────────────────────────────────────────────────
print("\n[5/5] Saving model artefacts...")

faiss.write_index(index, str(OUTPUT_INDEX))
print(f"  FAISS index   -> {OUTPUT_INDEX}")

with open(OUTPUT_META, "wb") as f:
    pickle.dump(metadata, f)
print(f"  Metadata      -> {OUTPUT_META}")

info = {
    "model":          "ViT-B-32 (openai)",
    "embedding_type": "image",
    "index_type":     "IndexFlatIP",
    "embedding_dim":  dim,
    "num_products":   len(embeddings),
    "errors":         errors,
    "categories":     cat_counts,
    "sources":        [str(CSV_PATH)],
    "trained_at":     datetime.now().isoformat(),
}
with open(OUTPUT_INFO, "w") as f:
    json.dump(info, f, indent=2)
print(f"  Model info    -> {OUTPUT_INFO}")

# ── Summary ───────────────────────────────────────────────────────────────────
print()
print("=" * 70)
print("  RETRAINING COMPLETE")
print("=" * 70)
print(f"  Images indexed : {len(embeddings)}")
print(f"  Errors         : {errors}")
print(f"  Categories     : {len(cat_counts)}")
for cat, cnt in sorted(cat_counts.items(), key=lambda x: -x[1]):
    print(f"    {cat:<20}: {cnt}")
print()
print("  Restart the search service to load the new index.")
print("=" * 70)
