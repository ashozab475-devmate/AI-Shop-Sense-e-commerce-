"""
Matches shopping page products to dataset images using CLIP text-to-image search.
For each product, uses the product name + description as a text query and finds
the best matching image from the ABO dataset CSV.

If similarity >= threshold → assigns that dataset image to the product
If no match found → keeps the existing local image

Updates lib/mockData.js with the matched image paths.

Run from project root:
    python search_service/match_products_to_dataset.py
"""

import sys, csv, json, pickle, torch
import open_clip
from pathlib import Path
from PIL import Image

if sys.platform == "win32":
    import io
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', errors='replace')

BASE_DIR     = Path(__file__).parent
PROJECT_ROOT = BASE_DIR.parent
CSV_FILE     = BASE_DIR / "data" / "abo_dataset_combined.csv"
META_FILE    = BASE_DIR / "visual_search_train_metadata.pkl"
INDEX_FILE   = BASE_DIR / "visual_search_faiss_index.bin"

# Minimum CLIP cosine similarity to accept a match
MATCH_THRESHOLD = 0.28
BATCH_SIZE      = 64

# Shopping page products with their text descriptions
PRODUCTS = [
    # Smart Home
    {"id": "mock-sh-7",  "name": "Premium Hydrating Body Lotion",      "desc": "nourishing body lotion moisturizing cream skincare beauty",          "current": "/product-images/indigobunting-soap-8429699.jpg"},
    {"id": "mock-sh-9",  "name": "SmartFlow Garden Controller",         "desc": "smart home WiFi garden irrigation controller outdoor watering",      "current": "/product-images/smart-home-kit.png"},
    {"id": "mock-sh-10", "name": "SolarShade Motorized Blinds",         "desc": "motorized window blinds smart home automation curtains shades",      "current": "/product-images/modern-home.png"},
    {"id": "mock-sh-13", "name": "ChromaSync LED Light Strip",          "desc": "RGB LED light strip smart home colorful lighting decoration",        "current": "/product-images/smart-display.png"},
    {"id": "mock-sh-15", "name": "SecureAccess Smart Garage Hub",       "desc": "smart WiFi garage door controller security home automation",         "current": "/product-images/smart-lock-door.png"},
    {"id": "mock-sh-16", "name": "PawView Pet Camera Pro",              "desc": "pet camera monitor treat dispenser home security camera",            "current": "/product-images/smart-lock-kit.png"},
    {"id": "mock-sh-17", "name": "VitalTrack Smart Scale",              "desc": "digital smart bathroom scale body weight BMI fitness tracker",       "current": "/product-images/fitness-tracker.png"},
    {"id": "new-sh-2",   "name": "BrewMaster Smart Coffee Maker",       "desc": "WiFi smart coffee maker machine programmable kitchen appliance",     "current": "/product-images/kitchen-automation.png"},
    # Wellness
    {"id": "mock-5",     "name": "ThermoFlask Insulated Bottle",        "desc": "stainless steel insulated water bottle vacuum flask thermos",        "current": "/product-images/jakub-zerdzicki-uxYLtGRyGKQ-unsplash.jpg"},
    {"id": "mock-wl-1",  "name": "ZenFlow Premium Yoga Mat",            "desc": "yoga exercise mat non-slip thick foam fitness workout pilates",      "current": "/product-images/samantha-gades-BlIhVfXbi9s-unsplash.jpg"},
    {"id": "mock-wl-4",  "name": "Mindful Meditation Cushion",          "desc": "round meditation cushion zafu pillow floor seating yoga",           "current": "/product-images/annie-spratt-qfdBPFMSVPM-unsplash.jpg"},
    {"id": "mock-wl-5",  "name": "FlexFit Resistance Band Kit",         "desc": "elastic resistance bands exercise fitness workout gym set",          "current": "/product-images/fitness tracker.jpg"},
    {"id": "mock-wl-7",  "name": "AromaTherapy Essential Oil Set",      "desc": "essential oil bottles aromatherapy lavender peppermint wellness",   "current": "/product-images/rima-kruciene-Tq9Ln3gpiG4-unsplash.jpg"},
    {"id": "mock-wl-11", "name": "CloudComfort Weighted Blanket",       "desc": "heavy weighted blanket soft fabric anxiety relief sleep comfort",    "current": "/product-images/nadine-primeau-l5Mjl9qH8VU-unsplash.jpg"},
    {"id": "mock-wl-13", "name": "Serenity Herbal Tea Collection",      "desc": "herbal tea collection organic chamomile peppermint wellness drink",  "current": "/product-images/james-yarema-nz7z0rNdvyI-unsplash.jpg"},
    {"id": "mock-wl-14", "name": "EcoBalance Cork Yoga Block",          "desc": "natural cork yoga block brick support fitness exercise pilates",     "current": "/product-images/stephan-bechert-yFV39g6AZ5o-unsplash.jpg"},
    {"id": "mock-wl-15", "name": "ToneFlex Pilates Ring",               "desc": "pilates resistance ring circle fitness toning exercise yoga",        "current": "/product-images/pexels-ekrulila-33428311.jpg"},
    {"id": "mock-wl-16", "name": "QuickTemp Infrared Thermometer",      "desc": "digital infrared non-contact thermometer medical temperature gun",   "current": "/product-images/pexels-sedanur-kunuk-78972032-30548807.jpg"},
    {"id": "new-wl-1",   "name": "HydraGlow Smart Water Bottle",        "desc": "LED glowing smart water bottle hydration tracker BPA free",         "current": "/product-images/joel-jasmin-forestbird-znoL1m6MD_k-unsplash.jpg"},
    {"id": "new-wl-2",   "name": "ZenSeat Meditation Cushion",          "desc": "crescent shaped meditation cushion buckwheat fill floor pillow",     "current": "/product-images/laura-chouette-TecD-1MTMiE-unsplash.jpg"},
    # Workspace
    {"id": "mock-ws-1",  "name": "ErgoLux Executive Chair",             "desc": "ergonomic mesh office chair adjustable lumbar support armrest",     "current": "/product-images/workspace-main.png"},
    {"id": "mock-ws-2",  "name": "StrikeForce Mechanical Keyboard",     "desc": "mechanical gaming keyboard RGB backlit switches programmable",       "current": "/product-images/jakub-zerdzicki-bk5ZrIA9OU8-unsplash.jpg"},
    {"id": "mock-ws-3",  "name": "VisionPro 34in Curved Monitor",       "desc": "ultrawide curved computer monitor 34 inch widescreen display",      "current": "/product-images/sebastian-scholz-nuki-IJkSskfEqrM-unsplash.jpg"},
    {"id": "mock-ws-5",  "name": "UrbanTech Laptop Backpack",           "desc": "laptop backpack bag water resistant commuter travel school",         "current": "/product-images/bag.jpg"},
    {"id": "mock-ws-6",  "name": "VintageSound Bluetooth Speaker",      "desc": "retro vintage portable Bluetooth speaker wood finish wireless",      "current": "/product-images/sebastian-scholz-nuki-Fh3Dtg6QX4Q-unsplash.jpg"},
    {"id": "mock-ws-7",  "name": "RiseUp Desk Converter",               "desc": "standing desk converter riser height adjustable sit stand workstation","current": "/product-images/desk-creative.png"},
    {"id": "mock-ws-8",  "name": "ErgoGrip Vertical Mouse",             "desc": "vertical ergonomic wireless computer mouse wrist support office",    "current": "/product-images/jakub-zerdzicki-bk5ZrIA9OU8-unsplash.jpg"},
    {"id": "mock-ws-9",  "name": "SilentZone ANC Headphones",           "desc": "over-ear noise cancelling headphones wireless Bluetooth premium",    "current": "/product-images/headphone.png"},
    {"id": "mock-ws-10", "name": "DeskPro Organizer System",            "desc": "desk organizer set mesh office accessories pen holder letter tray",  "current": "/product-images/high-angle-measuring-tools-desk.jpg"},
    {"id": "mock-ws-18", "name": "LuxeDesk Leather Mat",                "desc": "leather desk mat pad large mouse pad office desk protector",         "current": "/product-images/desk-leather.png"},
    {"id": "mock-ws-20", "name": "CoolFlow Laptop Cooling Stand",       "desc": "laptop cooling stand pad with fans adjustable height USB cooler",    "current": "/product-images/mb.jpg"},
    {"id": "new-ws-1",   "name": "InfinityView 34in Ultrawide",         "desc": "curved ultrawide IPS monitor 34 inch widescreen display professional","current": "/product-images/sebastian-scholz-nuki-IJkSskfEqrM-unsplash.jpg"},
    {"id": "new-ws-2",   "name": "FlexiRise Electric Standing Desk",    "desc": "electric height adjustable standing desk motorized sit stand office","current": "/product-images/desk-creative.png"},
    # Audio / Outdoors
    {"id": "new-au-1",   "name": "ClassicSpin Vinyl Turntable",         "desc": "vinyl record player turntable belt drive Bluetooth audio music",     "current": "/product-images/hans-Mqx2-kbCVE8-unsplash.jpg"},
    {"id": "new-od-1",   "name": "SummitPro 2-Person Tent",             "desc": "camping tent 2 person backpacking outdoor shelter waterproof hiking","current": "/product-images/heather-ford-Ug7kk0kThLk-unsplash.jpg"},
    {"id": "new-od-2",   "name": "TrailBlaze Portable Grill",           "desc": "portable folding charcoal grill BBQ outdoor camping tailgate",       "current": "/product-images/brigitte-tohm-EAay7Aj4jbc-unsplash.jpg"},
]


def main():
    DEVICE = "cuda" if torch.cuda.is_available() else "cpu"
    print(f"Device: {DEVICE}")
    print("Loading CLIP ViT-B-32...")
    model, _, preprocess = open_clip.create_model_and_transforms("ViT-B-32", pretrained="openai")
    tokenizer = open_clip.get_tokenizer("ViT-B-32")
    model = model.to(DEVICE)
    model.eval()
    print("Model loaded.\n")

    # Load dataset images from CSV
    print(f"Loading dataset from {CSV_FILE}...")
    with open(CSV_FILE, newline='', encoding='utf-8') as f:
        rows = list(csv.DictReader(f))
    print(f"  {len(rows)} dataset images available\n")

    # Pre-extract image features for all dataset images in batches
    print("Extracting image features from dataset...")
    img_features = []
    valid_rows   = []
    errors       = 0

    for i in range(0, len(rows), BATCH_SIZE):
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
            tensor = torch.stack(images).to(DEVICE)
            feats  = model.encode_image(tensor)
            feats  = feats / feats.norm(dim=-1, keepdim=True)
        img_features.append(feats.cpu())
        valid_rows.extend(valid)

        done = min(i + BATCH_SIZE, len(rows))
        if done % 500 == 0 or done == len(rows):
            print(f"  {done}/{len(rows)} processed ({len(valid_rows)} valid)")

    img_feat_matrix = torch.cat(img_features, dim=0)  # [N, 512]
    print(f"\nDataset features ready: {img_feat_matrix.shape}")
    print(f"Errors: {errors}\n")

    # Match each product text to dataset images
    results = {}
    print(f"Matching {len(PRODUCTS)} products to dataset images...\n")

    for p in PRODUCTS:
        query = f"{p['name']} {p['desc']}"
        with torch.no_grad():
            tokens     = tokenizer([query]).to(DEVICE)
            text_feat  = model.encode_text(tokens)
            text_feat  = text_feat / text_feat.norm(dim=-1, keepdim=True)

        sims       = torch.mm(text_feat.cpu(), img_feat_matrix.t()).squeeze()
        best_idx   = sims.argmax().item()
        best_score = float(sims[best_idx].item())

        if best_score >= MATCH_THRESHOLD:
            matched_row  = valid_rows[best_idx]
            matched_path = matched_row['image_path'].strip()
            # Convert absolute path to relative URL for Next.js
            # Path looks like: D:\FYP Project\fypapp\abo-images-small (1)\images\small\xx\xxxxxxxx.jpg
            # We need: /abo-images-small (1)/images/small/xx/xxxxxxxx.jpg
            rel = Path(matched_path).relative_to(PROJECT_ROOT)
            image_url = '/' + str(rel).replace('\\', '/')
            results[p['id']] = {
                'matched': True,
                'score':   round(best_score, 4),
                'imageUrl': image_url,
                'category': matched_row.get('category', ''),
            }
            print(f"  MATCH  {p['name'][:40].ljust(40)} score={best_score:.3f} -> {Path(matched_path).name}")
        else:
            results[p['id']] = {
                'matched': False,
                'score':   round(best_score, 4),
                'imageUrl': p['current'],
            }
            print(f"  NO MATCH {p['name'][:38].ljust(38)} score={best_score:.3f} (keeping local image)")

    # Save results
    out = BASE_DIR / "product_image_matches.json"
    with open(out, 'w', encoding='utf-8') as f:
        json.dump(results, f, indent=2)
    print(f"\nResults saved to {out}")

    matched   = sum(1 for v in results.values() if v['matched'])
    unmatched = len(results) - matched
    print(f"\nSummary: {matched} matched, {unmatched} kept local image")
    print("\nNow run: python search_service/apply_matches.py")


if __name__ == "__main__":
    main()
