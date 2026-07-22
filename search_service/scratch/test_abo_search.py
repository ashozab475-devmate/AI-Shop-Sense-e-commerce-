import requests

test_image = r'd:\FYP Project\fypapp\public\product-images\abo\abo_f203c59a.jpg'

with open(test_image, 'rb') as f:
    response = requests.post(
        'http://localhost:5000/api/image-search/search',
        files={'image': ('test.jpg', f, 'image/jpeg')}
    )

if response.status_code == 200:
    data = response.json()
    products = data.get('products', [])
    print(f'Results found: {len(products)}')
    for p in products[:5]:
        print(f'  Name: {p["product_name"]}')
        print(f'  Category: {p["category"]}')
        print(f'  Price: ${p["price"]}')
        print(f'  Score: {p["similarity_score"]:.4f}')
        print(f'  image_url: {p.get("image_url", "N/A")}')
        print()
else:
    print(f'Error {response.status_code}:')
    print(response.text[:500])
