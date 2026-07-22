import csv
from pathlib import Path

f = Path('search_service/data/abo_dataset_combined.csv')
with open(f, newline='', encoding='utf-8') as fp:
    rows = list(csv.DictReader(fp))

print('Total rows:', len(rows))
print()
print('First 15 rows:')
for r in rows[:15]:
    img  = Path(r['image_path']).name
    cat  = r['category']
    name = r['product_name']
    desc = r['description'][:50]
    print(f'  {img[:20].ljust(20)} | {cat.ljust(15)} | {name.ljust(25)} | {desc}')

print()
print('Category distribution:')
cats = {}
for r in rows:
    cats[r['category']] = cats.get(r['category'], 0) + 1
for cat, count in sorted(cats.items(), key=lambda x: -x[1]):
    print(f'  {cat.ljust(20)}: {count}')

# Check if descriptions are still generic
generic_desc = sum(1 for r in rows if r['description'].startswith('A premium'))
relabelled_desc = sum(1 for r in rows if r['description'].startswith('A high-quality'))
print()
print('Description check:')
print(f'  Still generic ("A premium..."): {generic_desc}')
print(f'  Relabelled ("A high-quality..."): {relabelled_desc}')
print(f'  Other: {len(rows) - generic_desc - relabelled_desc}')
