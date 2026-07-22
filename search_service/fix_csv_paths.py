"""
Fixes image_path and image_url in both CSV files to point to the correct
ABO dataset location: "abo-images-small (1)/images/small/<prefix>/<hex>.jpg"

Run from project root:
    python search_service/fix_csv_paths.py
"""

import csv
import os
from pathlib import Path

PROJECT_ROOT = Path(__file__).parent.parent
ABO_ROOT     = PROJECT_ROOT / "abo-images-small (1)" / "images" / "small"
CSV_FILES    = [
    PROJECT_ROOT / "search_service" / "data" / "abo_dataset_6000.csv",
    PROJECT_ROOT / "search_service" / "data" / "abo_dataset_2000_actual.csv",
]


def fix_csv(csv_path: Path):
    with open(csv_path, newline='', encoding='utf-8') as f:
        rows = list(csv.DictReader(f))
        fieldnames = list(rows[0].keys()) if rows else []

    fixed   = 0
    missing = 0
    removed = []

    new_rows = []
    for row in rows:
        # Extract hex id from filename like 'abo_dda3104e.jpg' -> 'dda3104e'
        old_path = row.get('image_path', '')
        fname    = Path(old_path).name                        # abo_dda3104e.jpg
        hex_id   = fname.replace('abo_', '').replace('.jpg', '')  # dda3104e
        prefix   = hex_id[:2]                                 # dd

        actual_path = ABO_ROOT / prefix / (hex_id + '.jpg')

        if actual_path.exists():
            # Fix both columns
            row['image_path'] = str(actual_path)
            row['image_url']  = f"/abo-images-small (1)/images/small/{prefix}/{hex_id}.jpg"
            new_rows.append(row)
            fixed += 1
        else:
            missing += 1
            removed.append(hex_id)

    # Write back
    with open(csv_path, 'w', newline='', encoding='utf-8') as f:
        writer = csv.DictWriter(f, fieldnames=fieldnames)
        writer.writeheader()
        writer.writerows(new_rows)

    print(f"\n{csv_path.name}")
    print(f"  Fixed  : {fixed} rows with valid image paths")
    print(f"  Removed: {missing} rows (images not found in dataset)")
    if removed[:5]:
        print(f"  Sample missing hex IDs: {removed[:5]}")
    return fixed


def main():
    print("Checking ABO dataset root...")
    if not ABO_ROOT.exists():
        print(f"ERROR: ABO dataset not found at: {ABO_ROOT}")
        return

    # Count total images available
    total_imgs = sum(1 for _ in ABO_ROOT.rglob("*.jpg"))
    print(f"ABO dataset found: {total_imgs:,} images in {ABO_ROOT}")

    total_fixed = 0
    for csv_file in CSV_FILES:
        if csv_file.exists():
            total_fixed += fix_csv(csv_file)
        else:
            print(f"\nSkipping (not found): {csv_file}")

    print(f"\nDone. Total rows fixed: {total_fixed}")
    print("CSV files are ready for training.")


if __name__ == "__main__":
    main()
