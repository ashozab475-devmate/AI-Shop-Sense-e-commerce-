#!/usr/bin/env python3
"""
Visual Search API - CLIP Based
Supports image and text-based search
"""

import os
import numpy as np
import pandas as pd
import json
import logging
from flask import Blueprint, request, jsonify
from sklearn.metrics.pairwise import cosine_similarity
from PIL import Image
from io import BytesIO
import requests

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

visual_search_bp = Blueprint('visual_search', __name__, url_prefix='/api/visual-search')

# Global variables
CLIP_MODEL = None
CLIP_PREPROCESS = None
DEVICE = None
TRAIN_EMBEDDINGS = None
TRAIN_METADATA = None
SIMILARITY_THRESHOLD = 0.5

def load_visual_search_model():
    """Load CLIP model and embeddings"""
    global CLIP_MODEL, CLIP_PREPROCESS, DEVICE, TRAIN_EMBEDDINGS, TRAIN_METADATA
    
    try:
        logger.info("Loading CLIP visual search model...")
        
        import clip
        import torch
        
        # Set device
        DEVICE = "cuda" if torch.cuda.is_available() else "cpu"
        logger.info(f"Using device: {DEVICE}")
        
        # Load CLIP model
        CLIP_MODEL, CLIP_PREPROCESS = clip.load("ViT-B/32", device=DEVICE)
        logger.info("CLIP model loaded: ViT-B/32")
        
        # Load embeddings
        if os.path.exists('visual_search_model_train_embeddings.npy'):
            TRAIN_EMBEDDINGS = np.load('visual_search_model_train_embeddings.npy')
            logger.info(f"Embeddings loaded: {TRAIN_EMBEDDINGS.shape}")
        
        # Load metadata
        if os.path.exists('data/abo_dataset_6000.csv'):
            df = pd.read_csv('data/abo_dataset_6000.csv')
            train_df = df[df['split'] == 'train'].reset_index(drop=True)
            TRAIN_METADATA = train_df.to_dict('records')
            logger.info(f"Metadata loaded: {len(TRAIN_METADATA)} items")
        
        return True
    
    except Exception as e:
        logger.error(f"Error loading model: {e}")
        return False

def get_image_embedding(image):
    """Get CLIP embedding for image"""
    try:
        import torch
        
        if isinstance(image, str):
            # URL
            response = requests.get(image, timeout=10)
            image = Image.open(BytesIO(response.content))
        elif isinstance(image, bytes):
            # Bytes
            image = Image.open(BytesIO(image))
        
        # Preprocess and get embedding
        image_input = CLIP_PREPROCESS(image).unsqueeze(0).to(DEVICE)
        
        with torch.no_grad():
            image_embedding = CLIP_MODEL.encode_image(image_input)
        
        return image_embedding.cpu().numpy()[0]
    
    except Exception as e:
        logger.error(f"Error getting image embedding: {e}")
        return None

def get_text_embedding(text):
    """Get CLIP embedding for text"""
    try:
        import torch
        import clip
        
        with torch.no_grad():
            text_tokens = clip.tokenize(text).to(DEVICE)
            text_embedding = CLIP_MODEL.encode_text(text_tokens)
        
        return text_embedding.cpu().numpy()[0]
    
    except Exception as e:
        logger.error(f"Error getting text embedding: {e}")
        return None

def find_similar_products(query_embedding, top_k=10):
    """Find similar products using cosine similarity"""
    try:
        if TRAIN_EMBEDDINGS is None or TRAIN_METADATA is None:
            return []
        
        # Normalize embeddings
        query_norm = query_embedding / np.linalg.norm(query_embedding)
        
        # Calculate similarities
        similarities = cosine_similarity([query_norm], TRAIN_EMBEDDINGS)[0]
        
        # Get top-k
        top_indices = np.argsort(similarities)[::-1][:top_k]
        
        results = []
        for idx in top_indices:
            sim_score = float(similarities[idx])
            if sim_score >= SIMILARITY_THRESHOLD:
                product = TRAIN_METADATA[idx].copy()
                product['similarity_score'] = sim_score
                results.append(product)
        
        return results
    
    except Exception as e:
        logger.error(f"Error finding similar products: {e}")
        return []

@visual_search_bp.route('/search/image', methods=['POST'])
def search_by_image():
    """Search by image upload"""
    try:
        if 'image' not in request.files:
            return jsonify({"error": "No image provided"}), 400
        
        file = request.files['image']
        image_data = file.read()
        
        # Get embedding
        embedding = get_image_embedding(image_data)
        if embedding is None:
            return jsonify({"error": "Failed to process image"}), 500
        
        # Find similar products
        top_k = request.args.get('top_k', 10, type=int)
        similar_products = find_similar_products(embedding, top_k=top_k)
        
        return jsonify({
            "status": "success",
            "search_type": "image",
            "results_count": len(similar_products),
            "products": similar_products
        }), 200
    
    except Exception as e:
        logger.error(f"Error in image search: {e}")
        return jsonify({"error": str(e)}), 500

@visual_search_bp.route('/search/text', methods=['POST'])
def search_by_text():
    """Search by text query"""
    try:
        data = request.get_json()
        
        if not data or 'query' not in data:
            return jsonify({"error": "Query required"}), 400
        
        query = data['query']
        top_k = data.get('top_k', 10)
        
        # Get embedding
        embedding = get_text_embedding(query)
        if embedding is None:
            return jsonify({"error": "Failed to process query"}), 500
        
        # Find similar products
        similar_products = find_similar_products(embedding, top_k=top_k)
        
        return jsonify({
            "status": "success",
            "search_type": "text",
            "query": query,
            "results_count": len(similar_products),
            "products": similar_products
        }), 200
    
    except Exception as e:
        logger.error(f"Error in text search: {e}")
        return jsonify({"error": str(e)}), 500

@visual_search_bp.route('/search/url', methods=['POST'])
def search_by_url():
    """Search by image URL"""
    try:
        data = request.get_json()
        
        if not data or 'image_url' not in data:
            return jsonify({"error": "Image URL required"}), 400
        
        image_url = data['image_url']
        top_k = data.get('top_k', 10)
        
        # Get embedding
        embedding = get_image_embedding(image_url)
        if embedding is None:
            return jsonify({"error": "Failed to process image"}), 500
        
        # Find similar products
        similar_products = find_similar_products(embedding, top_k=top_k)
        
        return jsonify({
            "status": "success",
            "search_type": "url",
            "image_url": image_url,
            "results_count": len(similar_products),
            "products": similar_products
        }), 200
    
    except Exception as e:
        logger.error(f"Error in URL search: {e}")
        return jsonify({"error": str(e)}), 500

@visual_search_bp.route('/health', methods=['GET'])
def health():
    """Health check"""
    model_loaded = CLIP_MODEL is not None
    embeddings_loaded = TRAIN_EMBEDDINGS is not None
    metadata_loaded = TRAIN_METADATA is not None
    
    return jsonify({
        "status": "online",
        "service": "Visual Search API - CLIP",
        "model_loaded": model_loaded,
        "embeddings_loaded": embeddings_loaded,
        "metadata_loaded": metadata_loaded,
        "device": DEVICE,
        "ready": model_loaded and embeddings_loaded and metadata_loaded
    }), 200

def init_visual_search():
    """Initialize visual search"""
    logger.info("Initializing CLIP visual search...")
    success = load_visual_search_model()
    if success:
        logger.info("CLIP visual search initialized successfully")
    else:
        logger.warning("CLIP visual search initialization incomplete")
    return success
