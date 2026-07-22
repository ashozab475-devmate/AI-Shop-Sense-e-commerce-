#!/usr/bin/env python3
"""
train_classifier.py
────────────────────
Combines CLIP image embeddings with a category classifier.

Pipeline:
  1. Load all images from abo_dataset_6000.csv
  2. Extract 512-dim CLIP embeddings for each image
  3. Encode category labels as integers
  4. Train a 2-layer MLP classifier: 512 → 256 → num_categories
  5. Save:
       - visual_search_train_embeddings.npy   (N × 512 embeddings)
       - visual_search_train_metadata.pkl     (list of product dicts)
       - category_classifier.pkl             (trained classifier)
       - category_label_map.json             (label → category name)
       - visual_search_faiss_index.bin        (FAISS index for fast search)

Run from fypapp/:
    python search_service/train_classifier.py
"""

import os, csv, json, pickle, logging
import numpy as np
import torch
import torch.nn as nn
import torch.optim as optim
from torch.utils.data import DataLoader, TensorDataset
from pathlib import Path
from PIL import Image
import open_clip
import faiss
from collections import Counter

logging.basicConfig(level=logging.INFO, format='%(asctime)s %(levelname)s %(message)s')
logger = logging.getLogger(__name__)

# ── Paths ─────────────────────────────────────────────────────────────────────
BASE_DIR    = Path(__file__).parent
DATA_DIR    = BASE_DIR / 'data'
CSV_PATH    = DATA_DIR / 'abo_dataset_combined.csv'
PUBLIC_DIR  = Path(__file__).parent.parent / 'public'

# Output files
EMBEDDINGS_OUT  = BASE_DIR / 'visual_search_train_embeddings.npy'
METADATA_OUT    = BASE_DIR / 'visual_search_train_metadata.pkl'
CLASSIFIER_OUT  = BASE_DIR / 'category_classifier.pkl'
LABEL_MAP_OUT   = BASE_DIR / 'category_label_map.json'
FAISS_OUT       = BASE_DIR / 'visual_search_faiss_index.bin'

# ── Config ────────────────────────────────────────────────────────────────────
BATCH_SIZE      = 32
CLASSIFIER_EPOCHS = 30
LR              = 0.001
DEVICE          = 'cuda' if torch.cuda.is_available() else 'cpu'
CONFIDENCE_THRESHOLD = 0.60   # min softmax confidence to trust classifier

# ── Classifier architecture ───────────────────────────────────────────────────
class CategoryClassifier(nn.Module):
    def __init__(self, input_dim=512, hidden_dim=256, num_classes=20):
        super().__init__()
        self.net = nn.Sequential(
            nn.Linear(input_dim, hidden_dim),
            nn.BatchNorm1d(hidden_dim),
            nn.ReLU(),
            nn.Dropout(0.3),
            nn.Linear(hidden_dim, 128),
            nn.BatchNorm1d(128),
            nn.ReLU(),
            nn.Dropout(0.2),
            nn.Linear(128, num_classes),
        )

    def forward(self, x):
        return self.net(x)


def load_image(path_str: str):
    """Load image directly from the absolute path stored in CSV."""
    p = Path(path_str.strip())
    if p.exists():
        try:
            return Image.open(p).convert('RGB')
        except Exception:
            pass
    return None


def main():
    logger.info(f"Device: {DEVICE}")

    # ── 1. Load CLIP ──────────────────────────────────────────────────────────
    logger.info("Loading CLIP ViT-B-32...")
    model, _, preprocess = open_clip.create_model_and_transforms('ViT-B-32', pretrained='openai')
    model = model.to(DEVICE)
    model.eval()
    logger.info("CLIP loaded.")

    # ── 2. Read CSV ───────────────────────────────────────────────────────────
    if not CSV_PATH.exists():
        logger.error(f"CSV not found: {CSV_PATH}")
        return

    rows = []
    with open(CSV_PATH, newline='', encoding='utf-8') as f:
        rows = list(csv.DictReader(f))
    logger.info(f"CSV rows: {len(rows)}")

    # Build label map from all unique categories
    all_cats = sorted(set(r['category'] for r in rows))
    label_map = {cat: i for i, cat in enumerate(all_cats)}
    inv_label_map = {i: cat for cat, i in label_map.items()}
    num_classes = len(label_map)
    logger.info(f"Categories ({num_classes}): {all_cats}")

    # Save label map
    with open(LABEL_MAP_OUT, 'w') as f:
        json.dump({'label_to_category': inv_label_map, 'category_to_label': label_map}, f, indent=2)
    logger.info(f"Label map saved → {LABEL_MAP_OUT}")

    # ── 3. Extract embeddings ─────────────────────────────────────────────────
    embeddings = []
    labels     = []
    metadata   = []
    skipped    = 0

    logger.info("Extracting CLIP embeddings...")
    with torch.no_grad():
        for i in range(0, len(rows), BATCH_SIZE):
            batch = rows[i:i + BATCH_SIZE]
            imgs, valid_rows = [], []

            for row in batch:
                img = load_image(row.get('image_path', ''))
                if img is None:
                    skipped += 1
                    continue
                imgs.append(preprocess(img))
                valid_rows.append(row)

            if not imgs:
                continue

            tensor = torch.stack(imgs).to(DEVICE)
            feats  = model.encode_image(tensor)
            feats  = feats / feats.norm(dim=-1, keepdim=True)
            feats  = feats.cpu().numpy().astype('float32')

            for feat, row in zip(feats, valid_rows):
                embeddings.append(feat)
                labels.append(label_map[row['category']])
                metadata.append({
                    'product_name': row.get('product_name', row.get('category', 'Unknown')),
                    'category':     row['category'],
                    'price':        float(row.get('price', 0)),
                    'description':  row.get('description', ''),
                    'image_url':    row.get('image_url', ''),
                    'image_path':   row.get('image_path', ''),
                })

            done = min(i + BATCH_SIZE, len(rows))
            if (i // BATCH_SIZE) % 10 == 0 or done == len(rows):
                logger.info(f"  {done}/{len(rows)} processed  ({len(embeddings)} valid, {skipped} skipped)")

    if not embeddings:
        logger.error("No embeddings extracted — check image paths in CSV.")
        return

    embeddings_np = np.array(embeddings, dtype='float32')
    labels_np     = np.array(labels,     dtype='int64')
    logger.info(f"Embeddings shape: {embeddings_np.shape}")
    logger.info(f"Label distribution: {Counter(labels_np.tolist())}")

    # Save embeddings + metadata
    np.save(EMBEDDINGS_OUT, embeddings_np)
    with open(METADATA_OUT, 'wb') as f:
        pickle.dump(metadata, f)
    logger.info(f"Embeddings saved → {EMBEDDINGS_OUT}")
    logger.info(f"Metadata saved   → {METADATA_OUT}")

    # ── 4. Build FAISS index ──────────────────────────────────────────────────
    logger.info("Building FAISS index...")
    dim   = embeddings_np.shape[1]
    index = faiss.IndexFlatIP(dim)   # Inner product (cosine on normalized vecs)
    index.add(embeddings_np)
    faiss.write_index(index, str(FAISS_OUT))
    logger.info(f"FAISS index saved → {FAISS_OUT}  ({index.ntotal} vectors)")

    # ── 5. Train classifier ───────────────────────────────────────────────────
    logger.info(f"Training classifier ({num_classes} classes, {CLASSIFIER_EPOCHS} epochs)...")

    X = torch.tensor(embeddings_np)
    y = torch.tensor(labels_np)

    dataset    = TensorDataset(X, y)
    loader     = DataLoader(dataset, batch_size=64, shuffle=True)

    clf        = CategoryClassifier(input_dim=dim, hidden_dim=256, num_classes=num_classes).to(DEVICE)
    criterion  = nn.CrossEntropyLoss()
    optimizer  = optim.Adam(clf.parameters(), lr=LR, weight_decay=1e-4)
    scheduler  = optim.lr_scheduler.CosineAnnealingLR(optimizer, T_max=CLASSIFIER_EPOCHS)

    best_acc   = 0.0
    best_state = None

    for epoch in range(1, CLASSIFIER_EPOCHS + 1):
        clf.train()
        total_loss, correct, total = 0.0, 0, 0
        for xb, yb in loader:
            xb, yb = xb.to(DEVICE), yb.to(DEVICE)
            optimizer.zero_grad()
            logits = clf(xb)
            loss   = criterion(logits, yb)
            loss.backward()
            optimizer.step()
            total_loss += loss.item() * len(xb)
            correct    += (logits.argmax(1) == yb).sum().item()
            total      += len(xb)
        scheduler.step()

        acc = correct / total * 100
        if acc > best_acc:
            best_acc   = acc
            best_state = {k: v.clone() for k, v in clf.state_dict().items()}

        if epoch % 5 == 0 or epoch == CLASSIFIER_EPOCHS:
            logger.info(f"  Epoch {epoch:3d}/{CLASSIFIER_EPOCHS}  loss={total_loss/total:.4f}  acc={acc:.1f}%")

    # Load best weights
    clf.load_state_dict(best_state)
    clf.eval()
    logger.info(f"Best training accuracy: {best_acc:.1f}%")

    # Save classifier + config
    clf_data = {
        'model_state':        clf.state_dict(),
        'label_map':          label_map,
        'inv_label_map':      inv_label_map,
        'num_classes':        num_classes,
        'input_dim':          dim,
        'confidence_threshold': CONFIDENCE_THRESHOLD,
    }
    with open(CLASSIFIER_OUT, 'wb') as f:
        pickle.dump(clf_data, f)
    logger.info(f"Classifier saved → {CLASSIFIER_OUT}")

    # ── 6. Quick validation ───────────────────────────────────────────────────
    logger.info("Running quick validation...")
    clf.eval()
    with torch.no_grad():
        logits = clf(X.to(DEVICE))
        preds  = logits.argmax(1).cpu()
        val_acc = (preds == y).float().mean().item() * 100
    logger.info(f"Full-dataset accuracy: {val_acc:.1f}%")

    # Per-category accuracy
    logger.info("Per-category accuracy:")
    for cat_id, cat_name in sorted(inv_label_map.items(), key=lambda x: int(x[0])):
        mask    = y == int(cat_id)
        if mask.sum() == 0:
            continue
        cat_acc = (preds[mask] == y[mask]).float().mean().item() * 100
        count   = mask.sum().item()
        logger.info(f"  {cat_name:<20} {cat_acc:5.1f}%  ({count} samples)")

    logger.info("\n✓ Training complete!")
    logger.info(f"  Embeddings : {EMBEDDINGS_OUT}")
    logger.info(f"  Metadata   : {METADATA_OUT}")
    logger.info(f"  Classifier : {CLASSIFIER_OUT}")
    logger.info(f"  Label map  : {LABEL_MAP_OUT}")
    logger.info(f"  FAISS index: {FAISS_OUT}")
    logger.info("\nRestart the search service to use the new classifier.")


if __name__ == '__main__':
    main()
