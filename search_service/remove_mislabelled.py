"""
Removes mislabelled rows from abo_dataset_combined.csv.
For each image, CLIP predicts the actual category.
If the predicted category != assigned category, the row is removed.

Run from project root:
    python search_service/remove_mislabelled.py
"""
import csv, sys, torch
import open_clip
from PIL import Image
from pathlib import Path

if sys.platform == "win32":
    import io
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', errors='replace')

BASE_DIR  = Path(__file__).parent
CSV_FILE  = BASE_DIR / "data" / "abo_dataset_combined.csv"
BATCH_SIZE = 64

CATEGORIES = {
    "Smartphones":  ["a photo of a smartphone", "mobile phone screen", "iPhone Android phone"],
    "Tablets":      ["a photo of a tablet", "iPad tablet device", "digital tablet screen"],
    "Laptops":      ["a photo of a laptop computer", "notebook PC keyboard screen"],
    "Headphones":   ["a photo of headphones", "over-ear headphones", "wireless earbuds"],
    "Cameras":      ["a photo of a camera", "digital camera lens", "DSLR camera"],
    "Appliances":   ["a photo of a kitchen appliance", "microwave blender toaster"],
    "Sofas":        ["a photo of a sofa couch", "living room sofa furniture"],
    "Beds":         ["a photo of a bed", "bedroom bed mattress"],
    "Tables":       ["a photo of a table", "dining table desk furniture"],
    "Chairs":       ["a photo of a chair", "office chair seat"],
    "Shoes":        ["a photo of shoes", "sneakers footwear boots"],
    "Jackets":      ["a photo of a jacket", "coat jacket clothing"],
    "Shirts":       ["a photo of a shirt", "t-shirt clothing top"],
    "Dresses":      ["a photo of a dress", "women dress fashion"],
    "Jeans":        ["a photo of jeans", "denim pants trousers"],
    "Cookware":     ["a photo of cookware", "pots pans cooking"],
    "Dinnerware":   ["a photo of dinnerware", "plates bowls cups"],
    "Sports":       ["a photo of sports equipment", "yoga mat fitness gear"],
    "Outdoors":     ["a photo of outdoor gear", "camping tent hiking"],
    "Bicycles":     ["a photo of a bicycle", "bike cycling"],
}

all_prompts   = []
prompt_to_cat = {}
for cat, prompts in CATEGORIES.items():
    for p in prompts:
        all_prompts.append(p)
        prompt_to_cat[p] = cat

DEVICE = "cuda" if torch.cuda.is_available() else "cpu"
print(f"Device: {DEVICE}")
print("Loading CLIP ViT-B-32...")
model, _, preprocess = open_clip.create_model_and_transforms("ViT-B-32", pretrained="openai")
tokenizer = open_clip.get_tokenizer("ViT-B-32")
model = model.to(DEVICE)
model.eval()
print("Model loaded.\n")

# Encode all text prompts once
with torch.no_grad():
    tokens     = tokenizer(all_prompts).to(DEVICE)
    text_feats = model.encode_text(tokens)
    text_feats = text_feats / text_feats.norm(dim=-1, keepdim=True)
print(f"Encoded {len(all_prompts)} category prompts.\n")

# Load CSV
with open(CSV_FILE, newline='', encoding='utf-8') as f:
    rows = list(csv.DictReader(f))
    fieldnames = list(rows[0].keys())

print(f"Total rows to check: {len(rows)}")
print("Classifying all images...\n")

kept    = []
removed = 0
errors  = 0
total   = len(rows)

for i in range(0, total, BATCH_SIZE):
    batch  = rows[i:i + BATCH_SIZE]
    images = []
    valid  = []

    for row in batch:
        p = Path(row['image_path'].strip())
        if not p.exists():
            errors += 1
            continue
        try:
            img = Image.open(p).convert("RGB")
            images.append(preprocess(img))
            valid.append(row)
        except Exception:
            errors += 1
            continue

    if not images:
        continue

    with torch.no_grad():
        tensor    = torch.stack(images).to(DEVICE)
        img_feats = model.encode_image(tensor)
        img_feats = img_feats / img_feats.norm(dim=-1, keepdim=True)
        sims      = torch.mm(img_feats.cpu(), text_feats.cpu().t())

    for j, row in enumerate(valid):
        best_idx   = sims[j].argmax().item()
        pred_cat   = prompt_to_cat[all_prompts[best_idx]]
        assigned   = row['category']

        if pred_cat == assigned:
            kept.append(row)
        else:
            removed += 1

    done = min(i + BATCH_SIZE, total)
    if done % 500 == 0 or done == total:
        print(f"  {done}/{total} checked — kept: {len(kept)}, removed: {removed}, errors: {errors}")

# Write cleaned CSV
with open(CSV_FILE, 'w', newline='', encoding='utf-8') as f:
    writer = csv.DictWriter(f, fieldnames=fieldnames)
    writer.writeheader()
    writer.writerows(kept)

print(f"\nDone.")
print(f"  Original rows : {total}")
print(f"  Kept (correct): {len(kept)}")
print(f"  Removed (wrong): {removed}")
print(f"  Errors (missing): {errors}")
print(f"\nCategory distribution after cleaning:")
cats = {}
for r in kept:
    cats[r['category']] = cats.get(r['category'], 0) + 1
for cat, count in sorted(cats.items(), key=lambda x: -x[1]):
    print(f"  {cat.ljust(20)}: {count}")
print(f"\nCSV saved: {CSV_FILE}")
print("Now re-run: python search_service/train_csv_only.py")
