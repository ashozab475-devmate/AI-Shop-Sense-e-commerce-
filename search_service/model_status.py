import json
from pathlib import Path

model_dir = Path('search_service/model_data')
feat_file = model_dir / 'clip_features.pt'
data_file = model_dir / 'product_data.json'

print('=== MODEL FILES ===')
if feat_file.exists():
    size = feat_file.stat().st_size / (1024 * 1024)
    print(f'clip_features.pt  : {size:.2f} MB')
else:
    print('clip_features.pt  : NOT FOUND')

if not data_file.exists():
    print('product_data.json : NOT FOUND')
    exit()

with open(data_file, encoding='utf-8') as f:
    data = json.load(f)

shop     = [p for p in data if p['id'].startswith('mock-') or p['id'].startswith('new-')]
csv_all  = [p for p in data if p['id'].startswith('csv-')]
generic  = [p for p in csv_all if p['name'].startswith('Product ')]
labelled = [p for p in csv_all if not p['name'].startswith('Product ')]

print(f'product_data.json : {len(data)} total indexed products')
print()
print('=== BREAKDOWN ===')
print(f'  Shopping page products (36 local images) : {len(shop)}')
print(f'  CSV dataset products                     : {len(csv_all)}')
print(f'    Still generic (Product XXXXXXXX)       : {len(generic)}')
print(f'    Auto-labelled with category name       : {len(labelled)}')

if labelled:
    cats = {}
    for p in labelled:
        cats[p['name']] = cats.get(p['name'], 0) + 1
    print(f'    Auto-label categories ({len(cats)} total):')
    for cat, count in sorted(cats.items(), key=lambda x: -x[1]):
        print(f'      {cat.ljust(35)} : {count} images')

print()
print('=== SHOPPING PAGE PRODUCTS IN MODEL ===')
for p in shop:
    has_desc = bool(p.get('description', '').strip())
    img = p.get('imageUrl', '')[-40:]
    print(f'  {p["id"][:15].ljust(16)} {p["name"][:35].ljust(36)} desc={has_desc}  img=...{img}')

print()
print('=== SEARCH CONFIG (app.py) ===')
app_py = Path('search_service/app.py').read_text(encoding='utf-8')
for line in app_py.splitlines():
    if any(k in line for k in ['BEST_MATCH_RAW', 'SIMILAR_RAW', 'SCAN_TOP_K', 'IMG_WEIGHT', 'TEXT_WEIGHT']):
        print(' ', line.strip())
