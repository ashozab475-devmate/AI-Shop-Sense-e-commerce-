import pickle

# Load metadata
with open('search_service/visual_search_train_metadata.pkl', 'rb') as f:
    data = pickle.load(f)

# Filter appliances
appliances = [p for p in data if p['category'] == 'Appliances']

print(f"\n{'='*60}")
print(f"APPLIANCES IN DATABASE ({len(appliances)} items)")
print(f"{'='*60}\n")

for i, product in enumerate(appliances, 1):
    print(f"{i}. {product['product_name']}")
    print(f"   Price: ${product['price']}")
    print(f"   Image: {product.get('image_path', 'N/A')}")
    print()
