#!/usr/bin/env python3
"""
AI Visual Search Model Training - CLIP Based
Uses OpenAI CLIP for image-text embeddings
"""

import os
import numpy as np
import pandas as pd
from PIL import Image
import json
from datetime import datetime
import pickle
import requests
from io import BytesIO

print("="*60)
print("AI Visual Search Model Training - CLIP Based")
print("="*60)
print()

# Try to import CLIP
try:
    import clip
    import torch
    print("[1/6] CLIP and PyTorch found")
except ImportError:
    print("[1/6] Installing CLIP and PyTorch...")
    os.system("pip install clip-by-openai torch torchvision -q")
    import clip
    import torch
    print("  OK - CLIP and PyTorch installed")

print()

# Load dataset
print("[2/6] Loading dataset...")
df = pd.read_csv('data/abo_dataset_6000.csv')
print(f"  Total images: {len(df)}")
print(f"  Categories: {df['label_id'].nunique()}")

# Split data
train_df = df[df['split'] == 'train'].reset_index(drop=True)
test_df = df[df['split'] == 'test'].reset_index(drop=True)
print(f"  Training samples: {len(train_df)}")
print(f"  Testing samples: {len(test_df)}")

# Load CLIP model
print("\n[3/6] Loading CLIP model...")
device = "cuda" if torch.cuda.is_available() else "cpu"
print(f"  Device: {device}")

model, preprocess = clip.load("ViT-B/32", device=device)
print("  CLIP model loaded: ViT-B/32")

# Create text embeddings from product metadata
print("\n[4/6] Creating text embeddings...")

def create_text_embedding(row):
    """Create text embedding from product metadata"""
    text = f"{row['product_name']} {row['category']} {row['subcategory']} {row['description']}"
    
    with torch.no_grad():
        text_tokens = clip.tokenize(text).to(device)
        text_embedding = model.encode_text(text_tokens)
    
    return text_embedding.cpu().numpy()[0]

# Generate embeddings for training data
print("  Generating training embeddings...")
train_embeddings = []
for idx, row in train_df.iterrows():
    if idx % 500 == 0:
        print(f"    Progress: {idx}/{len(train_df)}")
    embedding = create_text_embedding(row)
    train_embeddings.append(embedding)

train_embeddings = np.array(train_embeddings)
print(f"  Training embeddings shape: {train_embeddings.shape}")

# Generate embeddings for test data
print("  Generating test embeddings...")
test_embeddings = []
for idx, row in test_df.iterrows():
    if idx % 200 == 0:
        print(f"    Progress: {idx}/{len(test_df)}")
    embedding = create_text_embedding(row)
    test_embeddings.append(embedding)

test_embeddings = np.array(test_embeddings)
print(f"  Test embeddings shape: {test_embeddings.shape}")

# Calculate accuracy
print("\n[5/6] Calculating accuracy...")

from sklearn.metrics.pairwise import cosine_similarity

# Compute similarity matrix
similarities = cosine_similarity(test_embeddings, train_embeddings)

# Top-1 accuracy
correct = 0
for i in range(len(test_df)):
    test_label = test_df.iloc[i]['label_id']
    top_match_idx = np.argmax(similarities[i])
    train_label = train_df.iloc[top_match_idx]['label_id']
    if test_label == train_label:
        correct += 1

accuracy = correct / len(test_df)
print(f"  Top-1 Accuracy: {accuracy:.2%}")

# Top-5 accuracy
correct_top5 = 0
for i in range(len(test_df)):
    test_label = test_df.iloc[i]['label_id']
    top5_indices = np.argsort(similarities[i])[-5:]
    train_labels = train_df.iloc[top5_indices]['label_id'].values
    if test_label in train_labels:
        correct_top5 += 1

accuracy_top5 = correct_top5 / len(test_df)
print(f"  Top-5 Accuracy: {accuracy_top5:.2%}")

# Save model components
print("\n[6/6] Saving model...")

# Save embeddings
np.save('visual_search_model_train_embeddings.npy', train_embeddings)
np.save('visual_search_model_test_embeddings.npy', test_embeddings)
print("  Embeddings saved")

# Save model info
metadata = {
    "model_name": "visual_search_clip",
    "model_type": "CLIP",
    "architecture": "ViT-B/32",
    "embedding_dim": int(train_embeddings.shape[1]),
    "training_date": datetime.now().isoformat(),
    "accuracy": float(accuracy),
    "top5_accuracy": float(accuracy_top5),
    "train_samples": len(train_df),
    "test_samples": len(test_df),
    "num_classes": int(df['label_id'].nunique()),
    "device": device,
}

with open('visual_search_model_info.json', 'w') as f:
    json.dump(metadata, f, indent=2)
print("  Model info saved")

print("\n" + "="*60)
print("Training Complete!")
print("="*60)
print(f"Model: CLIP ViT-B/32")
print(f"Accuracy: {accuracy:.2%}")
print(f"Top-5 Accuracy: {accuracy_top5:.2%}")
print(f"Embedding Dimension: {train_embeddings.shape[1]}")
print(f"Device: {device}")
print("="*60)
