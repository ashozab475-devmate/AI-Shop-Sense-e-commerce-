"""
Verifies label accuracy by checking CLIP confidence scores for each image.
- High confidence (>0.35) = label likely correct
- Low confidence (<0.20)  = label likely wrong
- Shows per-category accuracy estimate
"""
import csv, torch, sys
import open_clip
from PIL import Image
from pathlib import Path

if sys.platform == "win32":
    import io
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', errors='replace')

BASE_DIR     = Path(__file__).parent
PROJECT_ROOT = BASE_DIR.parent
CSV_FILE     = BASE_DIR / "data" / "abo_dataset_combined.csv"
SAMPLE_PER_CAT = 30   # check 30 images per category
BATCH_SIZE     = 32

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
print("Loading CLIP...")
model, _, preprocess = open_clip.create_model_and_transforms("ViT-B-32", pretrained="openai")
tokenizer = open_clip.get_tokenizer("ViT-B-32")
model = model.to(DEVICE)
model.eval()
print("Model loaded.\n")

with torch.no_grad():
    tokens     = tokenizer(all_prompts).to(DEVICE)
    text_feats = model.encode_text(tokens)
    text_feats = text_feats / text_feats.norm(dim=-1, keepdim=True)

# Load CSV and group by category
with open(CSV_FILE, newline='', encoding='utf-8') as f:
    rows = list(csv.DictReader(f))

import random
random.seed(42)
by_cat = {}
for r in rows:
    cat = r['category']
    by_cat.setdefault(cat, []).append(r)

# Sample and verify
print(f"Verifying {SAMPLE_PER_CAT} images per category...\n")
cat_results = {}

for cat, cat_rows in sorted(by_cat.items()):
    sample = random.sample(cat_rows, min(SAMPLE_PER_CAT, len(cat_rows)))
    correct = 0
    high_conf = 0
    low_conf  = 0
    total     = 0

    for i in range(0, len(sample), BATCH_SIZE):
        batch  = sample[i:i + BATCH_SIZE]
        images = []
        valid  = []
        for row in batch:
            p = Path(row['image_path'].strip())
            if not p.exists():
                continue
            try:
                img = Image.open(p).convert("RGB")
                images.append(preprocess(img))
                valid.append(row)
            except:
                continue

        if not images:
            continue

        with torch.no_grad():
            tensor    = torch.stack(images).to(DEVICE)
            img_feats = model.encode_image(tensor)
            img_feats = img_feats / img_feats.norm(dim=-1, keepdim=True)
            sims      = torch.mm(img_feats.cpu(), text_feats.cpu().t())  # [B, prompts]

        for j in range(len(valid)):
            best_idx    = sims[j].argmax().item()
            best_prompt = all_prompts[best_idx]
            pred_cat    = prompt_to_cat[best_prompt]
            conf        = float(sims[j].max().item())

            total += 1
            if pred_cat == cat:
                correct += 1
            if conf >= 0.25:
                high_conf += 1
            elif conf < 0.18:
                low_conf += 1

    acc = (correct / total * 100) if total > 0 else 0
    cat_results[cat] = {'total': total, 'correct': correct, 'acc': acc,
                        'high_conf': high_conf, 'low_conf': low_conf}

# Print results
print("=" * 65)
print(f"{'Category':<20} {'Samples':>7} {'Correct':>8} {'Accuracy':>9} {'Status'}")
print("=" * 65)
total_correct = 0
total_samples = 0
for cat, res in sorted(cat_results.items(), key=lambda x: -x[1]['acc']):
    status = "GOOD" if res['acc'] >= 60 else ("FAIR" if res['acc'] >= 40 else "POOR")
    print(f"{cat:<20} {res['total']:>7} {res['correct']:>8} {res['acc']:>8.1f}%  {status}")
    total_correct += res['correct']
    total_samples += res['total']

overall = (total_correct / total_samples * 100) if total_samples > 0 else 0
print("=" * 65)
print(f"{'OVERALL':<20} {total_samples:>7} {total_correct:>8} {overall:>8.1f}%")
print()
if overall >= 70:
    print("Labels are GOOD — model should perform well.")
elif overall >= 50:
    print("Labels are FAIR — some categories may give wrong results.")
else:
    print("Labels are POOR — significant mislabelling detected.")
