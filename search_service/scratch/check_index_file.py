import os
import faiss
import pickle

path = r"D:\FYP Project\fypapp\search_service\visual_search_faiss_index.bin"
size = os.path.getsize(path)
print(f"File Size: {size} bytes")

index = faiss.read_index(path)
print(f"Index size (ntotal): {index.ntotal}")

meta_path = r"D:\FYP Project\fypapp\search_service\visual_search_train_metadata.pkl"
with open(meta_path, 'rb') as f:
    meta = pickle.load(f)
print(f"Metadata size: {len(meta)}")
if len(meta) > 0:
    print(f"First item: {meta[0].get('name') or meta[0].get('product_name')}")
