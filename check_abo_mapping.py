import pandas as pd
from pathlib import Path

df = pd.read_csv("search_service/data/abo_dataset_6000_cleaned.csv")
im_names = {p.name for p in Path("public/product-images/abo").glob("*.jpg")}
total = len(df)
count = sum(("abo_" + Path(p).name) in im_names for p in df["image_path"])
print(total, count, count/total if total else 0)
