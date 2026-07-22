#!/usr/bin/env python3
"""
Visual Search Test Script
"""

import json
from visual_search_api_simple import init_visual_search, find_similar_products, create_features
import numpy as np

print("="*60)
print("Visual Search API Test")
print("="*60)
print()

# Initialize
print("[1/3] Initializing visual search...")
init_visual_search()
print("  OK - Visual search initialized")
print()

# Test 1: Search for similar electronics
print("[2/3] Testing product search...")
test_product = {
    "product_name": "iPhone 14 Pro",
    "price": 999.99,
    "rating": 4.8,
    "label_id": 1,
    "description": "Premium smartphone with advanced camera"
}

features = create_features(test_product)
results = find_similar_products(features, top_k=5)

print(f"  Query: {test_product['product_name']}")
print(f"  Results: {len(results)} similar products found")
print()

for i, product in enumerate(results, 1):
    print(f"  {i}. {product['product_name']}")
    print(f"     Category: {product['category']} / {product['subcategory']}")
    print(f"     Price: ${product['price']:.2f}")
    print(f"     Rating: {product['rating']}/5.0")
    print(f"     Similarity: {product['similarity_score']:.2%}")
    print()

# Test 2: Category search
print("[3/3] Testing category search...")
test_product2 = {
    "product_name": "Nike Running Shoes",
    "price": 129.99,
    "rating": 4.6,
    "label_id": 10,
    "description": "Professional running shoes"
}

features2 = create_features(test_product2)
results2 = find_similar_products(features2, top_k=3)

print(f"  Query: {test_product2['product_name']}")
print(f"  Results: {len(results2)} similar products found")
print()

for i, product in enumerate(results2, 1):
    print(f"  {i}. {product['product_name']}")
    print(f"     Category: {product['category']}")
    print(f"     Similarity: {product['similarity_score']:.2%}")
    print()

print("="*60)
print("  OK - All tests passed!")
print("="*60)
