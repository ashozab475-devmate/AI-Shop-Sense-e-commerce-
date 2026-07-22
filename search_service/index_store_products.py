import os
import json
import pickle
import numpy as np
import torch
import open_clip
import faiss
from PIL import Image
import sys

# Add the parent directory to sys.path to import mockData if needed
# But since mockData.js is ES module, we'll read it as a raw file or use a JSON version
# For now, let's assume we have a way to get the product list.
# I'll read mockData.js and extract the array using a simple regex/parser or just convert it to JSON.

def extract_products_from_js(file_path):
    print(f"Extracting products from {file_path}...")
    # Convert ES module to a temporary CommonJS file for Node to read
    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # Simple transform: export const -> const
    cjs_content = content.replace('export const', 'const')
    cjs_content += "\nmodule.exports = { mockProducts };"
    
    temp_cjs = 'search_service/temp_mockData.js'
    with open(temp_cjs, 'w', encoding='utf-8') as f:
        f.write(cjs_content)
    
    try:
        # Run node to get JSON
        cmd = f'node -e "const {{ mockProducts }} = require(\'./temp_mockData.js\'); console.log(JSON.stringify(mockProducts))"'
        import subprocess
        result = subprocess.run(cmd, shell=True, capture_output=True, text=True, cwd='search_service')
        if result.returncode != 0:
            print(f"Node error: {result.stderr}")
            return None
        return json.loads(result.stdout)
    finally:
        if os.path.exists(temp_cjs):
            os.remove(temp_cjs)

def generate_store_index():
    print("Generating FAISS index for store products...")
    
    products = extract_products_from_js('lib/mockData.js')
    if not products:
        print("Failed to extract products.")
        return
    
    print(f"Loaded {len(products)} products from mockData.js")
    
    # 2. Setup CLIP
    device = "cuda" if torch.cuda.is_available() else "cpu"
    model, _, preprocess = open_clip.create_model_and_transforms('ViT-B-32', pretrained='openai')
    model = model.to(device)
    model.eval()
    
    embeddings = []
    metadata = []
    
    # 3. Process each product
    public_dir = os.path.join(os.getcwd(), 'public')
    
    for p in products:
        img_path = p.get('imageUrl', '')
        if not img_path:
            continue
            
        full_img_path = os.path.join(public_dir, img_path.lstrip('/'))
        
        if not os.path.exists(full_img_path):
            print(f"Warning: Image not found: {full_img_path}")
            continue
            
        try:
            image = preprocess(Image.open(full_img_path)).unsqueeze(0).to(device)
            with torch.no_grad():
                emb = model.encode_image(image)
                emb /= emb.norm(dim=-1, keepdim=True)
                embeddings.append(emb.cpu().numpy().flatten())
            
            # Store metadata with relative path for frontend
            metadata.append({
                'id': p['id'],
                'name': p['name'],
                'category': p['category'],
                'description': p['description'],
                'image_url': img_path, # Keep relative path
                'price': p['price']
            })
        except Exception as e:
            print(f"Error processing {full_img_path}: {e}")
            
    if not embeddings:
        print("No embeddings generated. Check image paths.")
        return

    # 4. Create FAISS index
    embeddings = np.array(embeddings).astype('float32')
    dim = embeddings.shape[1]
    index = faiss.IndexFlatIP(dim) # Inner product on normalized vecs = Cosine Similarity
    index.add(embeddings)
    
    # 5. Save files
    faiss_path = 'search_service/visual_search_faiss_index.bin'
    meta_path = 'search_service/visual_search_train_metadata.pkl'
    emb_path = 'search_service/visual_search_train_embeddings.npy'
    
    faiss.write_index(index, faiss_path)
    with open(meta_path, 'wb') as f:
        pickle.dump(metadata, f)
    np.save(emb_path, embeddings)
    
    print(f"Success! Indexed {len(metadata)} products.")
    print(f"Saved to {faiss_path} and {meta_path}")
    
    # Cleanup
    if os.path.exists('search_service/temp_products.json'):
        os.remove('search_service/temp_products.json')

if __name__ == "__main__":
    generate_store_index()
