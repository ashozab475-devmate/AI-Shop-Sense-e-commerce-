#!/usr/bin/env python3
"""
Train Visual Search on ACTUAL store products using IMAGE embeddings (not text).
This replaces the synthetic dataset approach with the real product catalog.

Key fix: Uses MODEL.encode_image() so the FAISS index and the search API
both use the same image embedding space – eliminating the cross-modal gap.
"""

import os
import sys
import json
import pickle
import numpy as np
import torch
import open_clip
import faiss
from PIL import Image

# Fix Windows console encoding
if sys.platform == "win32":
    import io
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', errors='replace')


print("=" * 70)
print("Visual Search Retraining – Actual Products (Image Embeddings)")
print("=" * 70)

# ─────────────────────────────────────────────────────────────────────────────
# Paths
# ─────────────────────────────────────────────────────────────────────────────
BASE_DIR       = os.path.dirname(os.path.abspath(__file__))
PROJECT_ROOT   = os.path.abspath(os.path.join(BASE_DIR, ".."))
IMAGES_DIR     = os.path.join(PROJECT_ROOT, "public", "product-images")
OUTPUT_INDEX   = os.path.join(BASE_DIR, "visual_search_faiss_index.bin")
OUTPUT_META    = os.path.join(BASE_DIR, "visual_search_train_metadata.pkl")
OUTPUT_INFO    = os.path.join(BASE_DIR, "visual_search_model_info.json")

print(f"Images folder : {IMAGES_DIR}")
print(f"Output index  : {OUTPUT_INDEX}")
print()

# ─────────────────────────────────────────────────────────────────────────────
# Actual product catalog (from lib/mockData.js – keep in sync manually)
# ─────────────────────────────────────────────────────────────────────────────
PRODUCTS = [
    # Smart Home
    {"id": "mock-sh-7",  "name": "Premium Hydrating Body Lotion",   "category": "Smart Home",  "price": 79.00,  "image": "indigobunting-soap-8429699.jpg"},
    {"id": "mock-sh-9",  "name": "SmartFlow Garden Controller",     "category": "Smart Home",  "price": 99.00,  "image": "smart-home-kit.png"},
    {"id": "mock-sh-10", "name": "SolarShade Motorized Blinds",     "category": "Smart Home",  "price": 179.00, "image": "modern-home.png"},
    {"id": "mock-sh-13", "name": "ChromaSync LED Light Strip",      "category": "Smart Home",  "price": 39.99,  "image": "smart-display.png"},
    {"id": "mock-sh-15", "name": "SecureAccess Smart Garage Hub",   "category": "Smart Home",  "price": 69.99,  "image": "smart-lock-door.png"},
    {"id": "mock-sh-16", "name": "PawView Pet Camera Pro",          "category": "Smart Home",  "price": 129.00, "image": "smart-lock-kit.png"},
    {"id": "mock-sh-17", "name": "VitalTrack Smart Scale",          "category": "Smart Home",  "price": 45.00,  "image": "fitness-tracker.png"},
    {"id": "new-sh-2",   "name": "BrewMaster Smart Coffee Maker",   "category": "Smart Home",  "price": 149.99, "image": "kitchen-automation.png"},

    # Wellness
    {"id": "mock-5",     "name": "ThermoFlask Insulated Bottle",    "category": "Wellness",    "price": 28.00,  "image": "jakub-zerdzicki-uxYLtGRyGKQ-unsplash.jpg"},
    {"id": "mock-wl-1",  "name": "ZenFlow Premium Yoga Mat",        "category": "Wellness",    "price": 40.00,  "image": "samantha-gades-BlIhVfXbi9s-unsplash.jpg"},
    {"id": "mock-wl-4",  "name": "Mindful Meditation Cushion",      "category": "Wellness",    "price": 49.00,  "image": "annie-spratt-qfdBPFMSVPM-unsplash.jpg"},
    {"id": "mock-wl-5",  "name": "FlexFit Resistance Band Kit",     "category": "Wellness",    "price": 22.50,  "image": "fitness tracker.jpg"},
    {"id": "mock-wl-7",  "name": "AromaTherapy Essential Oil Set",  "category": "Wellness",    "price": 18.99,  "image": "rima-kruciene-Tq9Ln3gpiG4-unsplash.jpg"},
    {"id": "mock-wl-11", "name": "CloudComfort Weighted Blanket",   "category": "Wellness",    "price": 75.00,  "image": "nadine-primeau-l5Mjl9qH8VU-unsplash.jpg"},
    {"id": "mock-wl-13", "name": "Serenity Herbal Tea Collection",  "category": "Wellness",    "price": 24.99,  "image": "james-yarema-nz7z0rNdvyI-unsplash.jpg"},
    {"id": "mock-wl-14", "name": "EcoBalance Cork Yoga Block",      "category": "Wellness",    "price": 14.99,  "image": "stephan-bechert-yFV39g6AZ5o-unsplash.jpg"},
    {"id": "mock-wl-15", "name": "ToneFlex Pilates Ring",           "category": "Wellness",    "price": 18.50,  "image": "pexels-ekrulila-33428311.jpg"},
    {"id": "mock-wl-16", "name": "QuickTemp Infrared Thermometer",  "category": "Wellness",    "price": 32.00,  "image": "pexels-sedanur-kunuk-78972032-30548807.jpg"},
    {"id": "new-wl-1",   "name": "HydraGlow Smart Water Bottle",    "category": "Wellness",    "price": 59.99,  "image": "joel-jasmin-forestbird-znoL1m6MD_k-unsplash.jpg"},
    {"id": "new-wl-2",   "name": "ZenSeat Meditation Cushion",      "category": "Wellness",    "price": 45.00,  "image": "laura-chouette-TecD-1MTMiE-unsplash.jpg"},

    # Workspace
    {"id": "mock-ws-1",  "name": "ErgoLux Executive Chair",         "category": "Workspace",   "price": 299.00, "image": "workspace-main.png"},
    {"id": "mock-ws-2",  "name": "StrikeForce Mechanical Keyboard", "category": "Workspace",   "price": 89.99,  "image": "jakub-zerdzicki-bk5ZrIA9OU8-unsplash.jpg"},
    {"id": "mock-ws-3",  "name": "VisionPro 34\" Curved Monitor",   "category": "Workspace",   "price": 499.00, "image": "sebastian-scholz-nuki-IJkSskfEqrM-unsplash.jpg"},
    {"id": "mock-ws-5",  "name": "UrbanTech Laptop Backpack",       "category": "Workspace",   "price": 89.50,  "image": "bag.jpg"},
    {"id": "mock-ws-6",  "name": "VintageSound Bluetooth Speaker",  "category": "Workspace",   "price": 110.00, "image": "sebastian-scholz-nuki-Fh3Dtg6QX4Q-unsplash.jpg"},
    {"id": "mock-ws-7",  "name": "RiseUp Desk Converter",           "category": "Workspace",   "price": 145.00, "image": "desk-creative.png"},
    {"id": "mock-ws-8",  "name": "ErgoGrip Vertical Mouse",         "category": "Workspace",   "price": 29.99,  "image": "jakub-zerdzicki-_0T3hgs3lig-unsplash.jpg"},
    {"id": "mock-ws-9",  "name": "SilentZone ANC Headphones",       "category": "Workspace",   "price": 249.00, "image": "headphone.png"},
    {"id": "mock-ws-10", "name": "DeskPro Organizer System",        "category": "Workspace",   "price": 24.50,  "image": "high-angle-measuring-tools-desk.jpg"},
    {"id": "mock-ws-18", "name": "LuxeDesk Leather Mat",            "category": "Workspace",   "price": 25.00,  "image": "desk-leather.png"},
    {"id": "mock-ws-20", "name": "CoolFlow Laptop Cooling Stand",   "category": "Workspace",   "price": 19.99,  "image": "mb.jpg"},
    {"id": "new-ws-1",   "name": "InfinityView 34\" Ultrawide",     "category": "Workspace",   "price": 499.00, "image": "ultrawide-monitor.jpg"},
    {"id": "new-ws-2",   "name": "FlexiRise Electric Standing Desk","category": "Workspace",   "price": 549.00, "image": "desk-creative.png"},

    # Audio
    {"id": "new-au-1",   "name": "ClassicSpin Vinyl Turntable",     "category": "Audio",       "price": 199.00, "image": "hans-Mqx2-kbCVE8-unsplash.jpg"},

    # Outdoors
    {"id": "new-od-1",   "name": "SummitPro 2-Person Tent",         "category": "Outdoors",    "price": 180.00, "image": "heather-ford-Ug7kk0kThLk-unsplash.jpg"},
    {"id": "new-od-2",   "name": "TrailBlaze Portable Grill",       "category": "Outdoors",    "price": 65.00,  "image": "brigitte-tohm-EAay7Aj4jbc-unsplash.jpg"},
]

# ─────────────────────────────────────────────────────────────────────────────
# Load CLIP model
# ─────────────────────────────────────────────────────────────────────────────
DEVICE = "cuda" if torch.cuda.is_available() else "cpu"
print(f"[1/4] Loading CLIP model on {DEVICE}...")
model, _, preprocess = open_clip.create_model_and_transforms("ViT-B-32", pretrained="openai")
model = model.to(DEVICE)
model.eval()
print("      CLIP ViT-B-32 loaded.\n")

# ─────────────────────────────────────────────────────────────────────────────
# Extract image embeddings
# ─────────────────────────────────────────────────────────────────────────────
print("[2/4] Extracting image embeddings...")
embeddings = []
metadata   = []
skipped    = 0

for p in PRODUCTS:
    img_path = os.path.join(IMAGES_DIR, p["image"])
    if not os.path.exists(img_path):
        print(f"  [SKIP] {p['image']} not found – skipping '{p['name']}'")
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
            "image_id":        p["id"],
            "product_name":    p["name"],
            "category":        p["category"],
            "price":           p["price"],
            "rating":          4.5,
            "image_path":      p["image"],
            "image_url":       f"/product-images/{p['image']}",
        }
        metadata.append(meta)
        print(f"  ✓ {p['name']} ({p['image']})")

    except Exception as e:
        print(f"  [ERROR] {p['name']}: {e}")
        skipped += 1

print(f"\n  Indexed: {len(embeddings)} products  |  Skipped: {skipped}\n")

if not embeddings:
    print("ERROR: No product images could be embedded. Check IMAGES_DIR path.")
    sys.exit(1)

embeddings_np = np.array(embeddings).astype("float32")

# ─────────────────────────────────────────────────────────────────────────────
# Build FAISS index (IndexFlatIP = inner product on normalised vectors = cosine)
# ─────────────────────────────────────────────────────────────────────────────
print("[3/4] Building FAISS index (cosine similarity via IndexFlatIP)...")
dim   = embeddings_np.shape[1]
index = faiss.IndexFlatIP(dim)      # cosine on L2-normalised vectors
index.add(embeddings_np)
print(f"      Dimension: {dim}  |  Vectors: {index.ntotal}\n")

# ─────────────────────────────────────────────────────────────────────────────
# Save outputs
# ─────────────────────────────────────────────────────────────────────────────
print("[4/4] Saving index and metadata...")

faiss.write_index(index, OUTPUT_INDEX)
print(f"      Saved FAISS index  → {OUTPUT_INDEX}")

with open(OUTPUT_META, "wb") as f:
    pickle.dump(metadata, f)
print(f"      Saved metadata      → {OUTPUT_META}")

info = {
    "model":          "ViT-B-32 (openai)",
    "embedding_type": "image",        # KEY CHANGE
    "index_type":     "IndexFlatIP",
    "embedding_dim":  dim,
    "num_products":   len(embeddings),
    "skipped":        skipped,
}
with open(OUTPUT_INFO, "w") as f:
    json.dump(info, f, indent=2)
print(f"      Saved model info    → {OUTPUT_INFO}")

print()
print("=" * 70)
print(f"  Done!  {len(embeddings)} real products indexed with IMAGE embeddings.")
print("  Restart the Flask server to use the new index.")
print("=" * 70)
