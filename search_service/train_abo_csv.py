#!/usr/bin/env python3
"""
Train Visual Search on the new 6,000 item ABO Dataset
Computes Image Embeddings (using model.encode_image) for all 6,000 images and builds the FAISS index.
"""

import os
import sys
import json
import pickle
import csv
import numpy as np
import torch
import open_clip
import faiss
from PIL import Image
from tqdm import tqdm

print("=" * 70)
print("Training Visual Search FAISS Index (6,000 Items)")
print("=" * 70)

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
CSV_FILE = os.path.join(BASE_DIR, "data", "abo_dataset_6000.csv")
OUTPUT_INDEX = os.path.join(BASE_DIR, "visual_search_faiss_index.bin")
OUTPUT_META = os.path.join(BASE_DIR, "visual_search_train_metadata.pkl")
OUTPUT_INFO = os.path.join(BASE_DIR, "visual_search_model_info.json")

# 1. Load CLIP Model
DEVICE = "cuda" if torch.cuda.is_available() else "cpu"
print(f"Loading CLIP model on {DEVICE}...")
model, _, preprocess = open_clip.create_model_and_transforms("ViT-B-32", pretrained="openai")
model = model.to(DEVICE)
model.eval()

# 2. Read CSV Data
products = []
with open(CSV_FILE, 'r', encoding='utf-8') as f:
    reader = csv.DictReader(f)
    for row in reader:
        products.append(row)

print(f"Loaded {len(products)} products from CSV.")

# 3. Extract Image Embeddings
embeddings = []
metadata = []
skipped = 0

print("Extracting image embeddings (this may take a few minutes)...")
for idx, p in enumerate(tqdm(products)):
    img_path = p["image_path"]
    
    if not os.path.exists(img_path):
        skipped += 1
        continue
        
    try:
        image = Image.open(img_path).convert("RGB")
        tensor = preprocess(image).unsqueeze(0).to(DEVICE)

        with torch.no_grad():
            feat = model.encode_image(tensor)
            feat /= feat.norm(dim=-1, keepdim=True)   # L2 normalise

        emb = feat.cpu().numpy().astype("float32")[0]
        embeddings.append(emb)

        meta = {
            "image_id":        f"abo-{idx}",
            "product_name":    p["product_name"],
            "category":        p["category"],
            "price":           float(p["price"]),
            "rating":          4.5,
            "image_path":      p["image_path"],
            "image_url":       p["image_url"],
        }
        metadata.append(meta)

    except Exception as e:
        skipped += 1

print(f"\nIndexed: {len(embeddings)} products | Skipped: {skipped}")

if not embeddings:
    print("ERROR: No images could be embedded.")
    sys.exit(1)

embeddings_np = np.array(embeddings).astype("float32")

# 4. Build FAISS Index
print("Building FAISS index (IndexFlatIP)...")
dim = embeddings_np.shape[1]
index = faiss.IndexFlatIP(dim)
index.add(embeddings_np)

# 5. Save Artifacts
print("Saving artifacts...")
faiss.write_index(index, OUTPUT_INDEX)
with open(OUTPUT_META, "wb") as f:
    pickle.dump(metadata, f)

info = {
    "model":          "ViT-B-32 (openai)",
    "embedding_type": "image",
    "index_type":     "IndexFlatIP",
    "embedding_dim":  dim,
    "num_products":   len(embeddings),
}
with open(OUTPUT_INFO, "w") as f:
    json.dump(info, f, indent=2)

print("\nDONE! FAISS index is trained and ready.")
