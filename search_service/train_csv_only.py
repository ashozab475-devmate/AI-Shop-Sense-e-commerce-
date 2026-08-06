"""
Train visual search ONLY on CSV dataset images (no shopping page products).
Uses open_clip ViT-B-32 + FAISS IndexFlatIP (cosine similarity).

Sources:
  - search_service/data/abo_dataset_6000.csv    (~2453 images)
  - search_service/data/abo_dataset_2000_actual.csv (~2000 images)

Total: ~4453 unique images across 20 product categories.

Run from project root:
    python search_service/train_csv_only.py
"""

import sys, os, csv, json, pickle
import numpy as np
import torch
import open_clip
import faiss
from PIL import Image
from pathlib import Path

if sys.platform == "win32":
    import io
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', errors='replace')

print("=" * 70)
print("Visual Search Training — CSV Dataset Images Only")
print("=" * 70)

BASE_DIR     = Path(__file__).parent
PROJECT_ROOT = BASE_DIR.parent
CSV_FILES    = [
    BASE_DIR / "data" / "abo_dataset_6000_cleaned.csv",
]
OUTPUT_INDEX = BASE_DIR / "visual_search_faiss_index.bin"
OUTPUT_META  = BASE_DIR / "visual_search_train_metadata.pkl"
OUTPUT_INFO  = BASE_DIR / "visual_search_model_info.json"
BATCH_SIZE   = 32

# ── Load and deduplicate CSV rows ─────────────────────────────────────────────
print("\n[1/4] Loading CSV files...")
all_rows = []
seen_paths = set()
public_abo_root = BASE_DIR.parent / 'public' / 'product-images' / 'abo'

for csv_file in CSV_FILES:
    if not csv_file.exists():
        print(f"  SKIP: {csv_file.name} not found")
        continue
    with open(csv_file, newline='', encoding='utf-8') as f:
        rows = list(csv.DictReader(f))
    added = 0
    missing = 0
    for row in rows:
        img_path = row.get('image_path', '').strip()
        if not img_path or img_path in seen_paths:
            continue

        resolved_path = Path(img_path)
        if not resolved_path.exists():
            alt_name = resolved_path.name
            alt_path = public_abo_root / f"abo_{alt_name}"
            if alt_path.exists():
                resolved_path = alt_path
            else:
                # Try best-effort fallback by searching for the same basename in the workspace.
                matches = list(BASE_DIR.parent.rglob(alt_name))
                if len(matches) == 1:
                    resolved_path = matches[0]
                else:
                    missing += 1
                    continue

        seen_paths.add(str(resolved_path))
        row['image_path'] = str(resolved_path)
        all_rows.append(row)
        added += 1

    print(f"  {csv_file.name}: {added} valid unique rows loaded, {missing} missing image paths")

print(f"\n  Total unique images to index: {len(all_rows)}")

if not all_rows:
    print("ERROR: No valid images found. Run fix_csv_paths.py first.")
    sys.exit(1)

# ── Load CLIP model ───────────────────────────────────────────────────────────
DEVICE = "cuda" if torch.cuda.is_available() else "cpu"
print(f"\n[2/4] Loading CLIP ViT-B-32 on {DEVICE}...")
model, _, preprocess = open_clip.create_model_and_transforms("ViT-B-32", pretrained="openai")
model = model.to(DEVICE)
model.eval()
print("      Model loaded.")

# ── Extract embeddings in batches ─────────────────────────────────────────────
print(f"\n[3/4] Extracting image embeddings (batch_size={BATCH_SIZE})...")
embeddings = []
metadata   = []
errors     = 0
total      = len(all_rows)

for batch_start in range(0, total, BATCH_SIZE):
    batch = all_rows[batch_start:batch_start + BATCH_SIZE]
    images  = []
    valid   = []

    for row in batch:
        img_path = Path(row['image_path'].strip())
        try:
            img = Image.open(img_path).convert("RGB")
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
        feats = feats / feats.norm(dim=-1, keepdim=True)

    embs = feats.cpu().numpy().astype("float32")
    for i, row in enumerate(valid):
        embeddings.append(embs[i])
        metadata.append({
            "image_id":     f"csv-{Path(row['image_path']).stem}",
            "product_name": row.get('product_name', 'Unknown'),
            "category":     row.get('category', 'General'),
            "price":        float(row.get('price', 0) or 0),
            "description":  row.get('description', ''),
            "image_path":   row['image_path'],
            "image_url":    row.get('image_url', ''),
        })

    done = min(batch_start + BATCH_SIZE, total)
    if done % 500 == 0 or done == total:
        print(f"  Progress: {done}/{total} ({len(embeddings)} indexed, {errors} errors)")

print(f"\n  Indexed: {len(embeddings)} | Errors: {errors}")

if not embeddings:
    print("ERROR: No embeddings extracted.")
    sys.exit(1)

# ── Build FAISS index ─────────────────────────────────────────────────────────
print("\n[4/4] Building FAISS index...")
emb_matrix = np.array(embeddings).astype("float32")
dim        = emb_matrix.shape[1]
index      = faiss.IndexFlatIP(dim)
index.add(emb_matrix)
print(f"      Dimension: {dim} | Vectors: {index.ntotal}")

# ── Save ──────────────────────────────────────────────────────────────────────
faiss.write_index(index, str(OUTPUT_INDEX))
print(f"      Saved index    -> {OUTPUT_INDEX}")

with open(OUTPUT_META, "wb") as f:
    pickle.dump(metadata, f)
print(f"      Saved metadata -> {OUTPUT_META}")

# Category distribution
cats = {}
for m in metadata:
    cats[m['category']] = cats.get(m['category'], 0) + 1

info = {
    "model":           "ViT-B-32 (openai)",
    "embedding_type":  "image",
    "index_type":      "IndexFlatIP",
    "embedding_dim":   dim,
    "num_products":    len(embeddings),
    "errors":          errors,
    "categories":      cats,
    "sources":         [str(c) for c in CSV_FILES],
}
with open(OUTPUT_INFO, "w") as f:
    json.dump(info, f, indent=2)
print(f"      Saved info     -> {OUTPUT_INFO}")

print("\n" + "=" * 70)
print(f"  DONE! {len(embeddings)} images indexed across {len(cats)} categories:")
for cat, count in sorted(cats.items(), key=lambda x: -x[1]):
    print(f"    {cat.ljust(30)}: {count}")
print("\n  Restart the search service to use the new index.")
print("=" * 70)
