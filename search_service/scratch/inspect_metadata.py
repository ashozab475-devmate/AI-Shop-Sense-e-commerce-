import pickle
import os

metadata_path = r'd:\FYP Project\fypapp\search_service\visual_search_train_metadata.pkl'
if os.path.exists(metadata_path):
    with open(metadata_path, 'rb') as f:
        metadata = pickle.load(f)
    
    print(f"Total items: {len(metadata)}")
    print("First 10 items:")
    for i in range(min(10, len(metadata))):
        print(metadata[i])
else:
    print("Metadata file not found")
