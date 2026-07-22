#!/usr/bin/env python3
"""
Generate dataset CSV from actual images in public/product-images/abo/
This will create a CSV with 2000 products using the images that actually exist
"""

import os
import csv
import random
from pathlib import Path

# Paths
BASE_DIR = Path(__file__).parent
PUBLIC_DIR = BASE_DIR.parent / 'public'
ABO_DIR = PUBLIC_DIR / 'product-images' / 'abo'
OUTPUT_CSV = BASE_DIR / 'data' / 'abo_dataset_2000_actual.csv'

# Categories and their product names
CATEGORIES = {
    'Smartphones': ['iPhone 14', 'Samsung Galaxy S23', 'Google Pixel 7', 'OnePlus 11'],
    'Laptops': ['MacBook Pro', 'Dell XPS 15', 'HP Spectre', 'Lenovo ThinkPad'],
    'Tablets': ['iPad Pro', 'Samsung Galaxy Tab', 'Microsoft Surface', 'Amazon Fire HD'],
    'Cameras': ['Canon EOS R6', 'Sony A7 IV', 'Nikon Z6', 'Fujifilm X-T4'],
    'Headphones': ['Sony WH-1000XM5', 'Bose QuietComfort', 'AirPods Max', 'Sennheiser HD 660S'],
    'Shoes': ['Nike Air Max', 'Adidas Ultraboost', 'New Balance 990', 'Casual Sneakers'],
    'Jeans': ['Levi 501', 'Wrangler Jeans', 'Diesel Jeans', 'Calvin Klein Jeans'],
    'Shirts': ['Cotton T-Shirt', 'Polo Shirt', 'Dress Shirt', 'Flannel Shirt'],
    'Dresses': ['Summer Dress', 'Evening Gown', 'Casual Dress', 'Maxi Dress'],
    'Jackets': ['Leather Jacket', 'Denim Jacket', 'Bomber Jacket', 'Winter Coat'],
    'Appliances': ['Microwave', 'Blender', 'Coffee Maker', 'Toaster'],
    'Cookware': ['Frying Pan', 'Pot Set', 'Wok', 'Dutch Oven'],
    'Dinnerware': ['Plate Set', 'Coffee Mugs', 'Bowl Set', 'Cutlery Set'],
    'Chairs': ['Office Chair', 'Dining Chair', 'Lounge Chair', 'Gaming Chair'],
    'Tables': ['Coffee Table', 'Dining Table', 'Desk', 'Side Table'],
    'Sofas': ['3-Seater Sofa', 'Sectional Sofa', 'Loveseat', 'Sleeper Sofa'],
    'Beds': ['Queen Bed', 'King Bed', 'Twin Bed', 'Bunk Bed'],
    'Bicycles': ['Mountain Bike', 'Road Bike', 'Hybrid Bike', 'Electric Bike'],
    'Sports': ['Yoga Mat', 'Dumbbells', 'Tennis Racket', 'Basketball'],
    'Outdoors': ['Camping Tent', 'Sleeping Bag', 'Backpack', 'Hiking Boots'],
}

# Price ranges for each category
PRICE_RANGES = {
    'Smartphones': (699, 1299),
    'Laptops': (899, 2499),
    'Tablets': (329, 1099),
    'Cameras': (799, 2999),
    'Headphones': (149, 399),
    'Shoes': (59, 189),
    'Jeans': (49, 149),
    'Shirts': (19, 79),
    'Dresses': (39, 199),
    'Jackets': (79, 299),
    'Appliances': (49, 299),
    'Cookware': (29, 199),
    'Dinnerware': (19, 99),
    'Chairs': (99, 599),
    'Tables': (149, 899),
    'Sofas': (499, 1999),
    'Beds': (299, 1499),
    'Bicycles': (299, 1999),
    'Sports': (19, 199),
    'Outdoors': (49, 299),
}

def main():
    print("=" * 80)
    print("Generating Dataset from Actual Images")
    print("=" * 80)
    print()
    
    # Get all JPG files in abo directory
    if not ABO_DIR.exists():
        print(f"ERROR: Directory not found: {ABO_DIR}")
        return
    
    image_files = list(ABO_DIR.glob('*.jpg'))
    print(f"Found {len(image_files)} images in {ABO_DIR}")
    
    if len(image_files) == 0:
        print("ERROR: No images found!")
        return
    
    # Randomly sample 2000 images (or all if less than 2000)
    num_samples = min(2000, len(image_files))
    random.seed(42)  # For reproducibility
    sampled_images = random.sample(image_files, num_samples)
    print(f"Sampled {num_samples} images for dataset")
    print()
    
    # Create CSV
    rows = []
    for img_path in sampled_images:
        # Randomly assign a category
        category = random.choice(list(CATEGORIES.keys()))
        
        # Randomly pick a product name from that category
        product_name = random.choice(CATEGORIES[category])
        
        # Random price within category range
        min_price, max_price = PRICE_RANGES[category]
        price = round(random.uniform(min_price, max_price), 2)
        
        # Description
        description = f"A premium {category.lower()}"
        
        # Image URL (relative path for web)
        image_url = f"/product-images/abo/{img_path.name}"
        
        # Absolute path (for training script)
        abs_path = str(img_path.absolute())
        
        rows.append({
            'image_path': abs_path,
            'product_name': product_name,
            'category': category,
            'price': price,
            'description': description,
            'image_url': image_url
        })
    
    # Write CSV
    OUTPUT_CSV.parent.mkdir(parents=True, exist_ok=True)
    with open(OUTPUT_CSV, 'w', newline='', encoding='utf-8') as f:
        writer = csv.DictWriter(f, fieldnames=['image_path', 'product_name', 'category', 'price', 'description', 'image_url'])
        writer.writeheader()
        writer.writerows(rows)
    
    print(f"✓ Dataset CSV created: {OUTPUT_CSV}")
    print(f"  Total products: {len(rows)}")
    print()
    
    # Show category distribution
    from collections import Counter
    cat_counts = Counter(row['category'] for row in rows)
    print("Category distribution:")
    for cat, count in sorted(cat_counts.items()):
        print(f"  {cat:<15} {count:>4} products")
    
    print()
    print("=" * 80)
    print("Next step: Run training script")
    print("  python search_service/train_classifier_actual.py")
    print("=" * 80)

if __name__ == '__main__':
    main()
