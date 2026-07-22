import requests

# Test 1: Headphone image
print("=== TEST 1: headphone.png ===")
with open(r'd:\FYP Project\fypapp\public\product-images\headphone.png', 'rb') as f:
    r = requests.post('http://127.0.0.1:5000/api/image-search/search',
                      files={'image': ('headphone.png', f, 'image/png')})
    data = r.json()
    print('STATUS:', data.get('status'))
    print('RESULTS:', data.get('results_count'))
    for p in data.get('products', [])[:5]:
        score = p["similarity_score"]
        name  = p["product_name"]
        url   = p.get("image_url", "")
        print(f"  {score:.2%}  {name:40s}  {url}")

# Test 2: Desk image
print("\n=== TEST 2: desk-creative.png ===")
with open(r'd:\FYP Project\fypapp\public\product-images\desk-creative.png', 'rb') as f:
    r = requests.post('http://127.0.0.1:5000/api/image-search/search',
                      files={'image': ('desk.png', f, 'image/png')})
    data = r.json()
    print('STATUS:', data.get('status'))
    print('RESULTS:', data.get('results_count'))
    for p in data.get('products', [])[:5]:
        score = p["similarity_score"]
        name  = p["product_name"]
        url   = p.get("image_url", "")
        print(f"  {score:.2%}  {name:40s}  {url}")

# Test 3: Yoga mat image
print("\n=== TEST 3: yoga mat ===")
with open(r'd:\FYP Project\fypapp\public\product-images\samantha-gades-BlIhVfXbi9s-unsplash.jpg', 'rb') as f:
    r = requests.post('http://127.0.0.1:5000/api/image-search/search',
                      files={'image': ('yoga.jpg', f, 'image/jpeg')})
    data = r.json()
    print('STATUS:', data.get('status'))
    print('RESULTS:', data.get('results_count'))
    for p in data.get('products', [])[:5]:
        score = p["similarity_score"]
        name  = p["product_name"]
        url   = p.get("image_url", "")
        print(f"  {score:.2%}  {name:40s}  {url}")

# Test 4: Backpack image
print("\n=== TEST 4: bag.jpg ===")
with open(r'd:\FYP Project\fypapp\public\product-images\bag.jpg', 'rb') as f:
    r = requests.post('http://127.0.0.1:5000/api/image-search/search',
                      files={'image': ('bag.jpg', f, 'image/jpeg')})
    data = r.json()
    print('STATUS:', data.get('status'))
    print('RESULTS:', data.get('results_count'))
    for p in data.get('products', [])[:5]:
        score = p["similarity_score"]
        name  = p["product_name"]
        url   = p.get("image_url", "")
        print(f"  {score:.2%}  {name:40s}  {url}")
