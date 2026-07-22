#!/usr/bin/env python3
"""
AI Visual Search Model - CLIP + FAISS Implementation
Uses OpenAI CLIP for text/image embeddings and FAISS for fast similarity search
"""

import os
import numpy as np
import pandas as pd
import torch
import json
from datetime import datetime
import pickle
import open_clip
import faiss
from PIL import Image
import requests
from io import BytesIO

print("="*80)
print("AI Visual Search Model Training - CLIP + FAISS")
print("="*80)
print()

# Device setup
device = "cuda" if torch.cuda.is_available() else "cpu"
print(f"Using device: {device}")
print()

# Load CLIP model
print("[1/6] Loading CLIP model...")
model_name = "ViT-B-32"
pretrained = "openai"
model, _, preprocess = open_clip.create_model_and_transforms(model_name, pretrained=pretrained)
tokenizer = open_clip.get_tokenizer(model_name)
model = model.to(device)
model.eval()
print(f"  Model: {model_name} ({pretrained})")
print(f"  Embedding dimension: 512")
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
print()

# Generate text embeddings from product metadata
print("[3/6] Generating text embeddings from product metadata...")

def create_product_text(row):
    """Create descriptive text from product metadata"""
    text = f"{row['product_name']} {row['category']} {row['subcategory']} "
    text += f"{row['description']} {row['brand']} {row['color']} {row['size']}"
    return text

def get_text_embedding(text):
    """Get CLIP text embedding"""
    with torch.no_grad():
        tokens = tokenizer(text).to(device)
        text_features = model.encode_text(tokens)
        text_features /= text_features.norm(dim=-1, keepdim=True)
    return text_features.cpu().numpy()

# Generate embeddings for training data
train_embeddings = []
train_texts = []

for idx, row in train_df.iterrows():
    if idx % 500 == 0:
        print(f"  Processing training sample {idx}/{len(train_df)}")
    
    text = create_product_text(row)
    embedding = get_text_embedding(text)
    train_embeddings.append(embedding[0])
    train_texts.append(text)

train_embeddings = np.array(train_embeddings).astype('float32')
print(f"  Train embeddings shape: {train_embeddings.shape}")

# Generate embeddings for test data
test_embeddings = []
test_texts = []

for idx, row in test_df.iterrows():
    if idx % 500 == 0:
        print(f"  Processing test sample {idx}/{len(test_df)}")
    
    text = create_product_text(row)
    embedding = get_text_embedding(text)
    test_embeddings.append(embedding[0])
    test_texts.append(text)

test_embeddings = np.array(test_embeddings).astype('float32')
print(f"  Test embeddings shape: {test_embeddings.shape}")
print()

# Build FAISS index
print("[4/6] Building FAISS index...")
embedding_dim = train_embeddings.shape[1]

# Create index
index = faiss.IndexFlatL2(embedding_dim)
index.add(train_embeddings)

print(f"  Index type: IndexFlatL2")
print(f"  Embedding dimension: {embedding_dim}")
print(f"  Total vectors indexed: {index.ntotal}")
print()

# Calculate accuracy
print("[5/6] Calculating accuracy...")

# Top-1 accuracy
distances, indices = index.search(test_embeddings, k=1)
correct = 0

for i in range(len(test_df)):
    test_label = test_df.iloc[i]['label_id']
    top_match_idx = indices[i][0]
    train_label = train_df.iloc[top_match_idx]['label_id']
    if test_label == train_label:
        correct += 1

accuracy = correct / len(test_df)
print(f"  Top-1 Accuracy: {accuracy:.2%}")

# Top-5 accuracy
distances, indices = index.search(test_embeddings, k=5)
correct_top5 = 0

for i in range(len(test_df)):
    test_label = test_df.iloc[i]['label_id']
    top5_indices = indices[i]
    train_labels = train_df.iloc[top5_indices]['label_id'].values
    if test_label in train_labels:
        correct_top5 += 1

accuracy_top5 = correct_top5 / len(test_df)
print(f"  Top-5 Accuracy: {accuracy_top5:.2%}")
print()

# Save model components
print("="*80)
print("Saving Model Components")
print("="*80)

# Save FAISS index
faiss.write_index(index, 'visual_search_faiss_index.bin')
print("  FAISS index saved")

# Save embeddings
np.save('visual_search_train_embeddings.npy', train_embeddings)
np.save('visual_search_test_embeddings.npy', test_embeddings)
print("  Embeddings saved")

# Save metadata
metadata = {
    "model_name": "visual_search_clip_faiss",
    "model_type": "CLIP + FAISS",
    "architecture": "ViT-B-32 + IndexFlatL2",
    "embedding_dim": int(embedding_dim),
    "training_date": datetime.now().isoformat(),
    "accuracy": float(accuracy),
    "top5_accuracy": float(accuracy_top5),
    "train_samples": len(train_df),
    "test_samples": len(test_df),
    "num_classes": int(df['label_id'].nunique()),
    "device": device,
    "model_pretrained": pretrained,
}

with open('visual_search_model_info.json', 'w') as f:
    json.dump(metadata, f, indent=2)
print("  Model info saved")

# Save training metadata for reference
train_metadata = train_df[['image_id', 'product_name', 'category', 'price', 'rating', 'label_id']].to_dict('records')
with open('visual_search_train_metadata.pkl', 'wb') as f:
    pickle.dump(train_metadata, f)
print("  Training metadata saved")

print()
print("="*80)
print("Training Complete!")
print("="*80)
print(f"Model: CLIP + FAISS")
print(f"Accuracy: {accuracy:.2%}")
print(f"Top-5 Accuracy: {accuracy_top5:.2%}")
print(f"Embedding Dimension: {embedding_dim}")
print(f"Device: {device}")
print("="*80)
