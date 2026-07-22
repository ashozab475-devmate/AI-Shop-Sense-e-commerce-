"""
Relabels both CSV files by running CLIP zero-shot classification on each
actual image to determine what it really contains.

Each image is compared against 20 category text prompts and assigned the
category with the highest cosine similarity — so the label matches the
actual visual content of the image.

Run from project root:
    python search_service/relabel_csv.py

Takes ~15-20 minutes on CPU for 4453 images.
"""

import sys, csv, json, torch
import open_clip
from PIL import Image
from pathlib import Path

if sys.platform == "win32":
    import io
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', errors='replace')

BASE_DIR     = Path(__file__).parent
PROJECT_ROOT = BASE_DIR.parent
CSV_FILES    = [
    BASE_DIR / "data" / "abo_dataset_combined.csv",
]
BATCH_SIZE = 64

# ── Category definitions with multiple descriptive prompts ────────────────────
# CLIP picks the category whose text prompt best matches the image
CATEGORIES = {
    "Smartphones":  ["a photo of a smartphone", "mobile phone screen", "iPhone Android phone"],
    "Tablets":      ["a photo of a tablet", "iPad tablet device", "digital tablet screen"],
    "Laptops":      ["a photo of a laptop computer", "notebook PC keyboard screen", "laptop open"],
    "Headphones":   ["a photo of headphones", "over-ear headphones", "wireless earbuds earphones"],
    "Cameras":      ["a photo of a camera", "digital camera lens", "DSLR photography camera"],
    "Appliances":   ["a photo of a kitchen appliance", "microwave blender toaster", "home appliance device"],
    "Sofas":        ["a photo of a sofa couch", "living room sofa furniture", "couch seating"],
    "Beds":         ["a photo of a bed", "bedroom bed mattress", "bed frame headboard"],
    "Tables":       ["a photo of a table", "dining table desk furniture", "wooden table surface"],
    "Chairs":       ["a photo of a chair", "office chair seat", "dining chair furniture"],
    "Shoes":        ["a photo of shoes", "sneakers footwear boots", "shoes pair"],
    "Jackets":      ["a photo of a jacket", "coat jacket clothing", "winter jacket outerwear"],
    "Shirts":       ["a photo of a shirt", "t-shirt clothing top", "dress shirt apparel"],
    "Dresses":      ["a photo of a dress", "women dress fashion", "floral dress clothing"],
    "Jeans":        ["a photo of jeans", "denim pants trousers", "blue jeans clothing"],
    "Cookware":     ["a photo of cookware", "pots pans cooking", "kitchen cookware set"],
    "Dinnerware":   ["a photo of dinnerware", "plates bowls cups", "ceramic dinnerware set"],
    "Sports":       ["a photo of sports equipment", "yoga mat fitness gear", "sports exercise equipment"],
    "Outdoors":     ["a photo of outdoor gear", "camping tent hiking", "outdoor adventure equipment"],
    "Bicycles":     ["a photo of a bicycle", "bike cycling", "mountain road bicycle"],
}

# Product name templates per category
PRODUCT_NAMES = {
    "Smartphones":  ["Smartphone", "Mobile Phone", "Android Phone", "iPhone"],
    "Tablets":      ["Tablet", "iPad", "Digital Tablet", "Android Tablet"],
    "Laptops":      ["Laptop", "Notebook PC", "Ultrabook", "Gaming Laptop"],
    "Headphones":   ["Headphones", "Wireless Earbuds", "Over-Ear Headphones", "Earphones"],
    "Cameras":      ["Digital Camera", "DSLR Camera", "Mirrorless Camera", "Action Camera"],
    "Appliances":   ["Kitchen Appliance", "Microwave", "Blender", "Coffee Maker"],
    "Sofas":        ["Sofa", "Couch", "Sectional Sofa", "Loveseat"],
    "Beds":         ["Bed Frame", "Queen Bed", "King Bed", "Platform Bed"],
    "Tables":       ["Dining Table", "Coffee Table", "Side Table", "Desk"],
    "Chairs":       ["Office Chair", "Dining Chair", "Accent Chair", "Recliner"],
    "Shoes":        ["Sneakers", "Running Shoes", "Casual Shoes", "Boots"],
    "Jackets":      ["Jacket", "Winter Coat", "Puffer Jacket", "Windbreaker"],
    "Shirts":       ["T-Shirt", "Dress Shirt", "Polo Shirt", "Casual Top"],
    "Dresses":      ["Dress", "Maxi Dress", "Summer Dress", "Floral Dress"],
    "Jeans":        ["Jeans", "Slim Jeans", "Straight Jeans", "Denim Pants"],
    "Cookware":     ["Cookware Set", "Non-Stick Pan", "Cooking Pot", "Skillet"],
    "Dinnerware":   ["Dinnerware Set", "Ceramic Plates", "Bowl Set", "Mug Set"],
    "Sports":       ["Yoga Mat", "Resistance Bands", "Fitness Equipment", "Exercise Gear"],
    "Outdoors":     ["Camping Tent", "Hiking Gear", "Outdoor Equipment", "Backpack"],
    "Bicycles":     ["Bicycle", "Mountain Bike", "Road Bike", "City Bike"],
}

PRICES = {
    "Smartphones": 699.99, "Tablets": 449.99, "Laptops": 899.99,
    "Headphones": 149.99,  "Cameras": 549.99,  "Appliances": 129.99,
    "Sofas": 799.99,       "Beds": 499.99,      "Tables": 299.99,
    "Chairs": 199.99,      "Shoes": 89.99,      "Jackets": 119.99,
    "Shirts": 39.99,       "Dresses": 59.99,    "Jeans": 69.99,
    "Cookware": 89.99,     "Dinnerware": 49.99, "Sports": 34.99,
    "Outdoors": 149.99,    "Bicycles": 399.99,
}


def main():
    DEVICE = "cuda" if torch.cuda.is_available() else "cpu"
    print(f"Device: {DEVICE}")
    print("Loading CLIP ViT-B-32...")
    model, _, preprocess = open_clip.create_model_and_transforms("ViT-B-32", pretrained="openai")
    tokenizer = open_clip.get_tokenizer("ViT-B-32")
    model = model.to(DEVICE)
    model.eval()
    print("Model loaded.\n")

    # Pre-encode all category text prompts
    print("Encoding category prompts...")
    cat_names   = list(CATEGORIES.keys())
    all_prompts = []
    prompt_to_cat = {}
    for cat, prompts in CATEGORIES.items():
        for p in prompts:
            all_prompts.append(p)
            prompt_to_cat[p] = cat

    with torch.no_grad():
        tokens     = tokenizer(all_prompts).to(DEVICE)
        text_feats = model.encode_text(tokens)
        text_feats = text_feats / text_feats.norm(dim=-1, keepdim=True)
    print(f"  {len(all_prompts)} prompts encoded for {len(cat_names)} categories.\n")

    import random
    random.seed(42)

    for csv_path in CSV_FILES:
        if not csv_path.exists():
            print(f"SKIP: {csv_path.name} not found")
            continue

        print(f"Processing {csv_path.name}...")
        with open(csv_path, newline='', encoding='utf-8') as f:
            rows = list(csv.DictReader(f))
            fieldnames = list(rows[0].keys())

        updated   = 0
        skipped   = 0
        cat_counts = {}

        for i in range(0, len(rows), BATCH_SIZE):
            batch = rows[i:i + BATCH_SIZE]
            images = []
            valid  = []

            for row in batch:
                img_path = Path(row['image_path'].strip())
                if not img_path.exists():
                    skipped += 1
                    continue
                try:
                    img = Image.open(img_path).convert("RGB")
                    images.append(preprocess(img))
                    valid.append(row)
                except Exception:
                    skipped += 1
                    continue

            if not images:
                continue

            with torch.no_grad():
                img_tensor = torch.stack(images).to(DEVICE)
                img_feats  = model.encode_image(img_tensor)
                img_feats  = img_feats / img_feats.norm(dim=-1, keepdim=True)
                sims       = torch.mm(img_feats.cpu(), text_feats.cpu().t())  # [B, num_prompts]

            for j, row in enumerate(valid):
                best_prompt_idx = sims[j].argmax().item()
                best_prompt     = all_prompts[best_prompt_idx]
                category        = prompt_to_cat[best_prompt]

                # Pick a product name from the category
                names = PRODUCT_NAMES[category]
                product_name = names[updated % len(names)]

                # Update row with correct labels
                row['category']     = category
                row['product_name'] = product_name
                row['price']        = PRICES[category]
                row['description']  = (
                    f"A high-quality {product_name.lower()} — {category.lower()} product "
                    f"with excellent build quality and modern design."
                )

                cat_counts[category] = cat_counts.get(category, 0) + 1
                updated += 1

            done = min(i + BATCH_SIZE, len(rows))
            if done % 500 == 0 or done == len(rows):
                print(f"  {done}/{len(rows)} processed ({updated} labelled, {skipped} skipped)")

        # Write back
        with open(csv_path, 'w', newline='', encoding='utf-8') as f:
            writer = csv.DictWriter(f, fieldnames=fieldnames)
            writer.writeheader()
            writer.writerows(rows)

        print(f"\n  Done: {updated} rows relabelled, {skipped} skipped")
        print(f"  Category distribution:")
        for cat, count in sorted(cat_counts.items(), key=lambda x: -x[1]):
            print(f"    {cat.ljust(15)}: {count}")
        print()

    print("All CSV files relabelled with correct image-based categories.")
    print("Now re-run: python search_service/train_csv_only.py")


if __name__ == "__main__":
    main()
