#!/usr/bin/env python3
"""
Improved Zero-Shot ABO Dataset Generator
Fixed: Priority-based classification to ensure electronics (Laptops/Phones) 
take precedence over furniture (Tables/Chairs) in lifestyle shots.
"""

import os
import csv
import random
import torch
import open_clip
import shutil
from PIL import Image
from tqdm import tqdm

# Setup paths
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
PROJECT_ROOT = os.path.dirname(BASE_DIR)
IMG_DIR = r"d:\FYP Project\fypapp\abo-images-small (1)\images\small"
OUTPUT_FILE = os.path.join(BASE_DIR, "data", "abo_dataset_6000.csv")
DEST_IMG_DIR = os.path.join(PROJECT_ROOT, "public", "product-images", "abo")

# Ensure destination directory exists
os.makedirs(DEST_IMG_DIR, exist_ok=True)

# Device configuration
DEVICE = "cuda" if torch.cuda.is_available() else "cpu"

# The 20 categories and their mock products
CATEGORIES = {
    "Smartphones": [("iPhone 14 Pro", 999.99), ("Samsung Galaxy S23", 899.99), ("Google Pixel 7", 799.99)],
    "Laptops": [("MacBook Pro 16", 2499.99), ("Dell XPS 15", 1999.99), ("Lenovo ThinkPad", 1299.99)],
    "Tablets": [("iPad Pro", 1099.99), ("Samsung Galaxy Tab", 699.99), ("Surface Pro", 999.99)],
    "Headphones": [("Sony WH-1000XM5", 399.99), ("Bose QuietComfort", 379.99), ("AirPods Pro", 249.99)],
    "Cameras": [("Canon EOS R5", 3899.99), ("Sony A7R V", 3198.00), ("GoPro Hero 11", 499.99)],
    
    "Shirts": [("Cotton T-Shirt", 29.99), ("Oxford Button-Down", 59.99), ("Polo Shirt", 49.99)],
    "Dresses": [("Casual Dress", 79.99), ("Cocktail Dress", 129.99), ("Maxi Dress", 99.99)],
    "Jeans": [("Skinny Jeans", 79.99), ("Straight Leg Jeans", 89.99), ("Bootcut Jeans", 84.99)],
    "Jackets": [("Leather Jacket", 199.99), ("Denim Jacket", 89.99), ("Puffer Jacket", 129.99)],
    "Shoes": [("Running Shoes", 129.99), ("Casual Sneakers", 89.99), ("Leather Boots", 179.99)],
    
    "Sofas": [("Sectional Sofa", 1299.99), ("Leather Sofa", 1599.99), ("Loveseat", 699.99)],
    "Chairs": [("Office Chair", 299.99), ("Dining Chair", 149.99), ("Accent Chair", 399.99)],
    "Tables": [("Dining Table", 799.99), ("Coffee Table", 299.99), ("Desk", 599.99)],
    "Beds": [("Queen Bed", 899.99), ("King Bed", 1199.99), ("Twin Bed", 499.99)],
    
    "Cookware": [("Non-Stick Pan", 49.99), ("Cast Iron Skillet", 39.99), ("Dutch Oven", 89.99)],
    "Appliances": [("Coffee Maker", 79.99), ("Blender", 99.99), ("Microwave", 149.99)],
    "Dinnerware": [("Dinner Set", 149.99), ("Ceramic Bowls", 29.99), ("Coffee Mugs", 34.99)],
    
    "Sports": [("Yoga Mat", 29.99), ("Dumbbells", 99.99), ("Resistance Bands", 19.99)],
    "Outdoors": [("Camping Tent", 199.99), ("Sleeping Bag", 89.99), ("Hiking Backpack", 149.99)],
    "Bicycles": [("Mountain Bike", 499.99), ("Road Bike", 799.99), ("Electric Bike", 1299.99)]
}

# PRIORITY: If these electronics are detected at >20% confidence, they win over background furniture
PRIORITY_CATEGORIES = ["Smartphones", "Laptops", "Tablets", "Cameras", "Headphones"]

# Corresponding text prompts for CLIP
CATEGORY_PROMPTS = [
    "a photo of a smartphone", "a photo of a laptop computer", "a photo of a tablet", "a photo of headphones", "a photo of a camera",
    "a photo of a shirt", "a photo of a dress", "a photo of jeans", "a photo of a jacket", "a photo of a shoe",
    "a photo of a sofa or couch", "a photo of a chair", "a photo of a dining table or office desk", "a photo of a bed",
    "a photo of a cooking pan or pot", "a photo of a home appliance", "a photo of a mug, bowl, or plate",
    "a photo of exercise or sports equipment", "a photo of outdoor camping gear", "a photo of a bicycle"
]

CATEGORY_NAMES = list(CATEGORIES.keys())

def generate_dataset():
    print("Loading CLIP model (ViT-B-32)...")
    model, _, preprocess = open_clip.create_model_and_transforms('ViT-B-32', pretrained='openai')
    tokenizer = open_clip.get_tokenizer('ViT-B-32')
    model = model.to(DEVICE)
    model.eval()

    print("Encoding category text prompts...")
    text_tokens = tokenizer(CATEGORY_PROMPTS).to(DEVICE)
    with torch.no_grad():
        text_features = model.encode_text(text_tokens)
        text_features /= text_features.norm(dim=-1, keepdim=True)

    print(f"Finding all images in {IMG_DIR}...")
    all_images = []
    for root, _, files in os.walk(IMG_DIR):
        for f in files:
            if f.lower().endswith(('.png', '.jpg', '.jpeg')):
                all_images.append(os.path.join(root, f))
    
    print(f"Found {len(all_images)} total images.")
    # We use a fixed seed so we re-process the SAME 6,000 images we already copied
    random.seed(42)
    if len(all_images) < 6000:
        selected_images = all_images
    else:
        selected_images = random.sample(all_images, 6000)
        
    print("Starting Improved Zero-Shot Classification...")
    
    with open(OUTPUT_FILE, 'w', newline='', encoding='utf-8') as csvfile:
        writer = csv.writer(csvfile)
        writer.writerow(["image_path", "product_name", "category", "price", "description", "image_url"])
        
        for img_path in tqdm(selected_images):
            try:
                # Load and preprocess image
                image = preprocess(Image.open(img_path).convert("RGB")).unsqueeze(0).to(DEVICE)
                
                # Predict category
                with torch.no_grad():
                    image_features = model.encode_image(image)
                    image_features /= image_features.norm(dim=-1, keepdim=True)
                    
                    # Compute similarities
                    similarity = (100.0 * image_features @ text_features.T).softmax(dim=-1)
                    probs = similarity[0].cpu().numpy()
                    
                    # Log probabilities to CATEGORY_NAMES
                    scored_categories = sorted(zip(CATEGORY_NAMES, probs), key=lambda x: x[1], reverse=True)
                    
                    # IMPROVED LOGIC:
                    # If any PRIORITY electronics category has > 15% probability, 
                    # and the top result is background furniture (Tables/Chairs/Sofas),
                    # we override the result to the electronic device.
                    
                    final_category = scored_categories[0][0]
                    top_prob = scored_categories[0][1]
                    
                    if final_category in ["Tables", "Chairs", "Sofas", "Beds"]:
                        # Check for priority electronics in the top 5 matches
                        for cat, prob in scored_categories[1:5]:
                            if cat in PRIORITY_CATEGORIES and prob > 0.15:
                                final_category = cat
                                break
                
                category_name = final_category
                
                # Assign fake data from predicted category
                product_name, price = random.choice(CATEGORIES[category_name])
                
                # Image path handling (already copied previously, so we just use the dest_path)
                dest_filename = f"abo_{os.path.basename(img_path)}"
                dest_path = os.path.join(DEST_IMG_DIR, dest_filename)
                
                # The image URL for the frontend
                image_url = f"/product-images/abo/{dest_filename}"
                
                writer.writerow([dest_path, product_name, category_name, price, f"A premium {category_name.lower()}", image_url])
                
            except Exception as e:
                continue

    print(f"\nImproved dataset generation complete! Saved to: {OUTPUT_FILE}")

if __name__ == "__main__":
    generate_dataset()
