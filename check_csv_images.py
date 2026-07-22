import csv
from pathlib import Path

CSV = Path("search_service/data/abo_dataset_6000.csv")
ABO_DIR = Path("public/product-images/abo")

rows = list(csv.DictReader(open(CSV, encoding='utf-8')))
print(f"CSV rows: {len(rows)}")
print(f"ABO images on disk: {len(list(ABO_DIR.glob('*.jpg')))}")

# Check first 5 rows
print("\nFirst 5 CSV image_path values:")
for r in rows[:5]:
    fname = Path(r['image_path']).name
    exists = (ABO_DIR / fname).exists()
    print(f"  {fname}  exists={exists}")

# Check how many CSV filenames match disk
matched = sum(1 for r in rows if (ABO_DIR / Path(r['image_path']).name).exists())
print(f"\nCSV rows with matching disk file: {matched}/{len(rows)}")

# Show disk filenames sample
disk_files = sorted(ABO_DIR.glob('*.jpg'))[:5]
print("\nFirst 5 disk filenames:")
for f in disk_files:
    print(f"  {f.name}")
