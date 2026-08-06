import pandas as pd
from pathlib import Path

root = Path('.')
cm = Path('search_service/data/abo_dataset_6000_cleaned.csv')
print('CSV exists:', cm.exists())
df = pd.read_csv(cm)
print('CSV columns:', list(df.columns))
print('Total rows:', len(df))

# sample names
sample_names = [Path(p).name for p in df['image_path'].head(20)]
print('Sample basenames:', sample_names)

# local ABO files
local_abo_dir = Path('public/product-images/abo')
local_abo = {p.name: str(p) for p in local_abo_dir.glob('*.jpg')}
print('Local ABO count:', len(local_abo))

exact = sum(Path(p).name in local_abo for p in df['image_path'])
prefixed = sum(('abo_' + Path(p).name) in local_abo for p in df['image_path'])
print('Exact basename matches:', exact)
print('Prefixed abo_ matches:', prefixed)

# search all workspace jpg names for the first 20 sample basenames
all_jpgs = {p.name: str(p) for p in root.rglob('*.jpg')}
for name in sample_names[:20]:
    print(name, 'exact->', name in all_jpgs, 'abo_->', 'abo_' + name in all_jpgs)

# show some sample local files for the first few csv names
for name in sample_names[:10]:
    if 'abo_' + name in all_jpgs:
        print('found prefixed', name, all_jpgs['abo_' + name])
    elif name in all_jpgs:
        print('found exact', name, all_jpgs[name])
    else:
        print('not found', name)
