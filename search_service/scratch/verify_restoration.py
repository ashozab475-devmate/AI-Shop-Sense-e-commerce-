import requests
import json

def test_health():
    print("--- Testing Service Health ---")
    try:
        resp = requests.get("http://localhost:5000/api/visual-search/health")
        print(json.dumps(resp.json(), indent=2))
        return resp.json()
    except Exception as e:
        print(f"Error: {e}")
        return None

def test_search_accuracy():
    print("\n--- Testing Search Accuracy (Simulating 'Headphones' query) ---")
    # Using text-based search endpoint to verify metadata content
    # Note: the text search is on visual_search_bp (visual_search_api_clip_faiss.py)
    try:
        resp = requests.post("http://localhost:5000/api/visual-search/search", json={
            "query": "noise cancelling headphones",
            "top_k": 3
        })
        data = resp.json()
        print(f"Status: {data.get('status')}")
        print(f"Predicted Category: {data.get('predicted_category')}")
        print("Top Results:")
        for p in data.get('products', []):
            print(f" - {p.get('name')} [ID: {p.get('id')}] (Score: {p.get('similarity_score', 0):.3f})")
            print(f"   Image: {p.get('image_url')}")
        
        # Check if we got store products (IDs start with 'mock' or 'new')
        products = data.get('products', [])
        if any(p.get('id', '').startswith(('mock', 'new')) for p in products):
            print("\n✅ SUCCESS: Search returned store products from mockData.js!")
        else:
            print("\n❌ FAILURE: Search still returning external products (ABO)?")
            
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    health = test_health()
    if health and health.get('ready'):
        test_search_accuracy()
    else:
        print("Service not ready yet, skipping accuracy test.")
