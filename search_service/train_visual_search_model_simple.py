#!/usr/bin/env python3
"""
AI Visual Search Model Training - Simplified Version
Uses scikit-learn for feature extraction and similarity search
"""

import os
import numpy as np
import pandas as pd
from sklearn.preprocessing import StandardScaler
from sklearn.decomposition import PCA
from sklearn.metrics.pairwise import cosine_similarity
import json
from datetime import datetime
import pickle

print("="*60)
print("AI Visual Search Model Training")
print("="*60)
print()

# Load dataset
print("[1/5] Loading dataset...")
df = pd.read_csv('data/abo_dataset_6000.csv')
print(f"  Total images: {len(df)}")
print(f"  Categories: {df['label_id'].nunique()}")
print(f"  Train/Test split: {df['split'].value_counts().to_dict()}")

# Prepare data
print("\n[2/5] Preparing data...")
train_df = df[df['split'] == 'train'].reset_index(drop=True)
test_df = df[df['split'] == 'test'].reset_index(drop=True)
print(f"  Training samples: {len(train_df)}")
print(f"  Testing samples: {len(test_df)}")

# Create feature vectors from metadata
print("\n[3/5] Creating feature vectors...")

def create_features(df):
    """Create feature vectors from product metadata"""
    features = []
    
    for idx, row in df.iterrows():
        # Normalize price (0-1)
        price_norm = min(row['price'] / 5000, 1.0)
        
        # Rating (0-1)
        rating_norm = row['rating'] / 5.0
        
        # Category encoding
        category_id = row['label_id'] / 20.0
        
        # Create feature vector
        feature = np.array([
            price_norm,
            rating_norm,
            category_id,
            len(row['product_name']) / 50.0,  # Name length
            len(row['description']) / 200.0,  # Description length
        ])
        
        features.append(feature)
    
    return np.array(features)

train_features = create_features(train_df)
test_features = create_features(test_df)

print(f"  Train features shape: {train_features.shape}")
print(f"  Test features shape: {test_features.shape}")

# Normalize features
print("\n[4/5] Normalizing features...")
scaler = StandardScaler()
train_features_scaled = scaler.fit_transform(train_features)
test_features_scaled = scaler.transform(test_features)

# Apply PCA for dimensionality reduction
print("\n[5/5] Applying PCA...")
n_components = min(256, train_features_scaled.shape[0], train_features_scaled.shape[1])
pca = PCA(n_components=n_components)
train_features_pca = pca.fit_transform(train_features_scaled)
test_features_pca = pca.transform(test_features_scaled)

print(f"  PCA components: {pca.n_components_}")
print(f"  Explained variance: {pca.explained_variance_ratio_.sum():.4f}")

# Calculate accuracy metrics
print("\n" + "="*60)
print("Model Performance")
print("="*60)

# Compute similarity matrix
similarities = cosine_similarity(test_features_pca, train_features_pca)

# Calculate top-1 accuracy
correct = 0
for i, test_idx in enumerate(test_df.index):
    test_label = test_df.iloc[i]['label_id']
    top_match_idx = np.argmax(similarities[i])
    train_label = train_df.iloc[top_match_idx]['label_id']
    if test_label == train_label:
        correct += 1

accuracy = correct / len(test_df)
print(f"Top-1 Accuracy: {accuracy:.2%}")

# Calculate top-5 accuracy
correct_top5 = 0
for i, test_idx in enumerate(test_df.index):
    test_label = test_df.iloc[i]['label_id']
    top5_indices = np.argsort(similarities[i])[-5:]
    train_labels = train_df.iloc[top5_indices]['label_id'].values
    if test_label in train_labels:
        correct_top5 += 1

accuracy_top5 = correct_top5 / len(test_df)
print(f"Top-5 Accuracy: {accuracy_top5:.2%}")

# Save model components
print("\n" + "="*60)
print("Saving Model")
print("="*60)

# Save scaler
with open('visual_search_scaler.pkl', 'wb') as f:
    pickle.dump(scaler, f)
print("  Scaler saved: visual_search_scaler.pkl")

# Save PCA
with open('visual_search_pca.pkl', 'wb') as f:
    pickle.dump(pca, f)
print("  PCA saved: visual_search_pca.pkl")

# Save features
np.save('visual_search_model_train_features.npy', train_features_pca)
np.save('visual_search_model_test_features.npy', test_features_pca)
print("  Features saved: visual_search_model_train_features.npy")
print("  Features saved: visual_search_model_test_features.npy")

# Save metadata
metadata = {
    "model_name": "visual_search_model",
    "model_type": "scikit-learn",
    "architecture": "PCA + Cosine Similarity",
    "training_date": datetime.now().isoformat(),
    "accuracy": float(accuracy),
    "top5_accuracy": float(accuracy_top5),
    "pca_components": int(pca.n_components_),
    "explained_variance": float(pca.explained_variance_ratio_.sum()),
    "train_samples": len(train_df),
    "test_samples": len(test_df),
    "num_classes": int(df['label_id'].nunique()),
}

with open('visual_search_model_info.json', 'w') as f:
    json.dump(metadata, f, indent=2)
print("  Model info saved: visual_search_model_info.json")

print("\n" + "="*60)
print("Training Complete!")
print("="*60)
print(f"Accuracy: {accuracy:.2%}")
print(f"Top-5 Accuracy: {accuracy_top5:.2%}")
print(f"Model ready for deployment")
print("="*60)
