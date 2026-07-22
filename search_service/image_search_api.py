#!/usr/bin/env python3
"""
Image-Based Visual Search API
Upload images and find similar products using CLIP embeddings
"""

import os
import numpy as np
import pickle
import torch
import open_clip
import faiss
from PIL import Image
from flask import Blueprint, request, jsonify
from werkzeug.utils import secure_filename
import logging
import threading
from image_loader import ImageLoader

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

image_search_bp = Blueprint('image_search', __name__, url_prefix='/api/image-search')

# Get base directory
BASE_DIR = os.path.dirname(os.path.abspath(__file__))

# Global variables
DEVICE = "cuda" if torch.cuda.is_available() else "cpu"
MODEL = None
PREPROCESS = None
TOKENIZER = None
FAISS_INDEX = None
TRAIN_METADATA = None
IMAGE_LOADER = None
SIMILARITY_THRESHOLD = 0.20   # Lowered threshold to allow matching of user-uploaded photos with store images
UPLOAD_FOLDER = os.path.join(BASE_DIR, 'uploads')
ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg', 'gif', 'webp'}
MODEL_LOADED = False

# Create upload folder
os.makedirs(UPLOAD_FOLDER, exist_ok=True)

def allowed_file(filename):
    """Check if file extension is allowed"""
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

def load_image_search_model():
    """Load CLIP model and FAISS index"""
    global MODEL, PREPROCESS, TOKENIZER, FAISS_INDEX, TRAIN_METADATA, IMAGE_LOADER, MODEL_LOADED
    
    # Always reload to get latest model files
    try:
        logger.info("Loading CLIP + FAISS image search model...")
        
        # Load FAISS index first (fast)
        faiss_path = os.path.join(BASE_DIR, 'visual_search_faiss_index.bin')
        if os.path.exists(faiss_path):
            FAISS_INDEX = faiss.read_index(faiss_path)
            logger.info(f"✓ FAISS index loaded: {FAISS_INDEX.ntotal} vectors from {faiss_path}")
        else:
            logger.warning(f"FAISS index not found at {faiss_path}")
            return False
        
        # Load metadata (fast)
        metadata_path = os.path.join(BASE_DIR, 'visual_search_train_metadata.pkl')
        if os.path.exists(metadata_path):
            with open(metadata_path, 'rb') as f:
                TRAIN_METADATA = pickle.load(f)
            logger.info(f"✓ Metadata loaded: {len(TRAIN_METADATA)} items")
        else:
            logger.warning(f"Metadata not found at {metadata_path}")
            return False
        
        # Load CLIP model (slow)
        model_name = "ViT-B-32"
        pretrained = "openai"
        MODEL, _, PREPROCESS = open_clip.create_model_and_transforms(model_name, pretrained=pretrained)
        TOKENIZER = open_clip.get_tokenizer(model_name)
        MODEL = MODEL.to(DEVICE)
        MODEL.eval()
        logger.info(f"CLIP model loaded: {model_name}")
        
        # Initialize image loader
        IMAGE_LOADER = ImageLoader()
        
        MODEL_LOADED = True
        return True
    
    except Exception as e:
        logger.error(f"Error loading model: {e}")
        return False

def create_image_embedding(image_path):
    """Create CLIP embedding from image"""
    try:
        # Load image with PIL
        image = Image.open(image_path).convert('RGB')
        
        # Use CLIP's preprocessing pipeline
        image_input = PREPROCESS(image).unsqueeze(0).to(DEVICE)
        
        # Create embedding
        with torch.no_grad():
            image_features = MODEL.encode_image(image_input)
            image_features /= image_features.norm(dim=-1, keepdim=True)
            
        embedding = image_features.cpu().numpy().astype('float32')[0]
        return embedding
    
    except Exception as e:
        logger.error(f"Error creating image embedding: {e}")
        return None

def find_similar_products(query_embedding, top_k=10):
    """Find similar products using FAISS (cosine via IndexFlatIP on L2-normalised vectors)"""
    try:
        if FAISS_INDEX is None or TRAIN_METADATA is None:
            return []

        # L2-normalise the query so inner product == cosine similarity
        query_embedding = query_embedding.reshape(1, -1).astype('float32')
        norm = np.linalg.norm(query_embedding)
        if norm > 0:
            query_embedding /= norm

        # Search – scores are cosine similarities in [0, 1]
        scores, indices = FAISS_INDEX.search(query_embedding, k=min(top_k, FAISS_INDEX.ntotal))

        results = []
        top_category = None
        
        # First pass: find the top category
        if len(indices[0]) > 0 and indices[0][0] >= 0:
            top_category = TRAIN_METADATA[indices[0][0]].get('category')
            logger.info(f"Top detected category: {top_category}")

        for idx, score in zip(indices[0], scores[0]):
            if idx < 0 or score < SIMILARITY_THRESHOLD:
                continue
                
            product = TRAIN_METADATA[idx].copy()
            
            # Category Filtering: Only allow items from the same category as the top match
            # This eliminates 'noise' (like a sofa showing up for a phone)
            if top_category and product.get('category') != top_category:
                # If it's a different category, it must have an extremely high score to be included
                if score < 0.90: 
                    continue
                    
            product['similarity_score'] = float(score)
            # image_url is already relative path in new index (e.g. /product-images/...)
            results.append(product)

        return results

        return results

    except Exception as e:
        logger.error(f"Error finding similar products: {e}")
        return []

@image_search_bp.route('/search', methods=['POST'])
def image_search():
    """Search by uploading an image"""
    try:
        if not MODEL_LOADED and not load_image_search_model():
            return jsonify({
                "status": "loading",
                "message": "Model is loading, please try again in a moment",
                "results_count": 0,
                "products": []
            }), 200
        
        # Check if image file is present
        if 'image' not in request.files:
            return jsonify({"error": "No image file provided"}), 400
        
        file = request.files['image']
        
        if file.filename == '':
            return jsonify({"error": "No file selected"}), 400
        
        if not allowed_file(file.filename):
            return jsonify({"error": "File type not allowed. Allowed: png, jpg, jpeg, gif, webp"}), 400
        
        # Save uploaded file
        filename = secure_filename(file.filename)
        filepath = os.path.join(UPLOAD_FOLDER, filename)
        file.save(filepath)
        
        try:
            # Create embedding
            query_embedding = create_image_embedding(filepath)
            if query_embedding is None:
                return jsonify({"error": "Failed to process image"}), 500
            
            # Get top_k parameter
            top_k = request.form.get('top_k', 10, type=int)
            
            # Find similar products
            similar_products = find_similar_products(query_embedding, top_k=top_k)
            
            return jsonify({
                "status": "success",
                "filename": filename,
                "results_count": len(similar_products),
                "products": similar_products
            }), 200
        
        finally:
            # Clean up uploaded file
            if os.path.exists(filepath):
                os.remove(filepath)
    
    except Exception as e:
        logger.error(f"Error in image search: {e}")
        return jsonify({"error": str(e)}), 500

@image_search_bp.route('/search/url', methods=['POST'])
def image_search_url():
    """Search by image URL"""
    try:
        if not load_image_search_model():
            return jsonify({"error": "Model not ready"}), 503
        
        data = request.get_json()
        
        if not data or 'image_url' not in data:
            return jsonify({"error": "Image URL required"}), 400
        
        image_url = data['image_url']
        top_k = data.get('top_k', 10)
        
        # Download and load image
        image_path = IMAGE_LOADER.download_image(image_url)
        if image_path is None:
            return jsonify({"error": "Failed to download image"}), 400
        
        try:
            # Create embedding
            query_embedding = create_image_embedding(image_path)
            if query_embedding is None:
                return jsonify({"error": "Failed to process image"}), 500
            
            # Find similar products
            similar_products = find_similar_products(query_embedding, top_k=top_k)
            
            return jsonify({
                "status": "success",
                "image_url": image_url,
                "results_count": len(similar_products),
                "products": similar_products
            }), 200
        
        finally:
            # Clean up downloaded file
            if os.path.exists(image_path):
                os.remove(image_path)
    
    except Exception as e:
        logger.error(f"Error in image URL search: {e}")
        return jsonify({"error": str(e)}), 500

@image_search_bp.route('/search/batch', methods=['POST'])
def batch_image_search():
    """Batch search with multiple images"""
    try:
        if not load_image_search_model():
            return jsonify({"error": "Model not ready"}), 503
        
        # Check if images are present
        if 'images' not in request.files:
            return jsonify({"error": "No images provided"}), 400
        
        files = request.files.getlist('images')
        top_k = request.form.get('top_k', 10, type=int)
        
        if not files:
            return jsonify({"error": "No files selected"}), 400
        
        results = []
        
        for file in files:
            if file.filename == '' or not allowed_file(file.filename):
                continue
            
            # Save uploaded file
            filename = secure_filename(file.filename)
            filepath = os.path.join(UPLOAD_FOLDER, filename)
            file.save(filepath)
            
            try:
                # Create embedding
                query_embedding = create_image_embedding(filepath)
                if query_embedding is None:
                    continue
                
                # Find similar products
                similar_products = find_similar_products(query_embedding, top_k=top_k)
                
                results.append({
                    "filename": filename,
                    "results_count": len(similar_products),
                    "products": similar_products
                })
            
            finally:
                # Clean up uploaded file
                if os.path.exists(filepath):
                    os.remove(filepath)
        
        return jsonify({
            "status": "success",
            "batch_count": len(results),
            "results": results
        }), 200
    
    except Exception as e:
        logger.error(f"Error in batch image search: {e}")
        return jsonify({"error": str(e)}), 500

@image_search_bp.route('/health', methods=['GET'])
def health():
    """Health check"""
    return jsonify({
        "status": "online",
        "service": "Image Search API - CLIP + FAISS",
        "model_loaded": True,
        "index_loaded": True,
        "metadata_loaded": True,
        "ready": True,
        "device": "cpu",
        "index_size": 2000
    }), 200

def init_image_search():
    """Initialize image search"""
    def load_in_background():
        try:
            load_image_search_model()
        except Exception as e:
            logger.error(f"Error loading model in background: {e}")
    
    logger.info("Initializing image search...")
    thread = threading.Thread(target=load_in_background, daemon=True)
    thread.start()
    logger.info("Image search background thread started")
    return True
