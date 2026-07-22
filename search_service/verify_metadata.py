#!/usr/bin/env python3
"""
Verify Visual Search Metadata Alignment
────────────────────────────────────────
Checks that the loaded metadata matches the images correctly.
"""

import os
import pickle
import numpy as np
import faiss
import requests
import json
from pathlib import Path

print("="*80)
print("Visual Search Metadata Verification")
print("="*80)
print()

BASE_DIR = Path(__file__).parent

# Load metadata
METADATA_PATH = BASE_DIR / 'visual_search_train_metadata.pkl'
with open(METADATA_PATH, 'rb') as f:
    metadata = pickle.load(f)

print(f"✓ Loaded metadata: {len(metadata)} items")
print()

# Check a few random samples
print("Sample products from metadata:")
print("-" * 80)

import random
random.seed(42)
sample_indices = random.sample(range(len(metadata)), 5)

for idx in sorted(sample_indices):
    product = metadata[idx]
    print(f"\n[{idx}] {product['product_name']}")
    print(f"    Category: {product['category']}")
    print(f"    Price: ${product['price']}")
    print(f"    Image: {product['image_path']}")

print()
print("-" * 80)
print()

# Test with the backend service
print("Testing visual search service...")
print()

SERVICE_URL = 'http://127.0.0.1:5000/api/image-search/search'

# Use the first product's image as test
test_product = metadata[0]
test_image_path = test_product['image_path']

print(f"Uploading test image: {test_image_path}")
print(f"Expected product: {test_product['product_name']}")
print()

# Try to load the image file
if os.path.exists(test_image_path):
    try:
        with open(test_image_path, 'rb') as img_file:
            files = {'image': img_file}
            
            # Send to backend
            response = requests.post(SERVICE_URL, files=files, timeout=30)
            
            if response.status_code == 200:
                data = response.json()
                
                if 'products' in data and len(data['products']) > 0:
                    results = data['products'][:5]
                    
                    print("Top 5 search results:")
                    print("-" * 80)
                    for i, product in enumerate(results, 1):
                        print(f"\n[{i}] {product.get('product_name', 'Unknown')}")
                        print(f"    Category: {product.get('category', 'N/A')}")
                        print(f"    Similarity: {product.get('similarity_score', 0):.3f}")
                        print(f"    Image: {product.get('image_path', 'N/A')}")
                    
                    print()
                    print("-" * 80)
                    print()
                    
                    # Check if top result matches
                    top_result = results[0]
                    if top_result.get('product_name') == test_product['product_name']:
                        print("✅ SUCCESS: Top result matches the input image!")
                    else:
                        print("⚠️  WARNING: Top result differs from input image")
                        print(f"   Input: {test_product['product_name']}")
                        print(f"   Got: {top_result.get('product_name')}")
                else:
                    print("❌ No products in response")
            else:
                print(f"❌ Service returned status {response.status_code}")
                print(response.text)
    except Exception as e:
        print(f"❌ Error: {e}")
else:
    print(f"❌ Test image not found: {test_image_path}")

print()
print("="*80)
print("Verification Complete!")
print("="*80)
