#!/usr/bin/env python3
"""
Batch Search Processing
Handle multiple search queries efficiently
"""

import os
import numpy as np
import pickle
import torch
import open_clip
import faiss
from flask import Blueprint, request, jsonify
import logging
import threading
from concurrent.futures import ThreadPoolExecutor, as_completed
import time

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

batch_search_bp = Blueprint('batch_search', __name__, url_prefix='/api/batch-search')

# Global variables
DEVICE = "cuda" if torch.cuda.is_available() else "cpu"
MODEL = None
TOKENIZER = None
FAISS_INDEX = None
TRAIN_METADATA = None
SIMILARITY_THRESHOLD = 0.3
MAX_WORKERS = 4

def load_batch_search_model():
    """Load CLIP model and FAISS index"""
    global MODEL, TOKENIZER, FAISS_INDEX, TRAIN_METADATA
    
    try:
        logger.info("Loading batch search model...")
        
        # Load CLIP model
        model_name = "ViT-B-32"
        pretrained = "openai"
        MODEL, _, _ = open_clip.create_model_and_transforms(model_name, pretrained=pretrained)
        TOKENIZER = open_clip.get_tokenizer(model_name)
        MODEL = MODEL.to(DEVICE)
        MODEL.eval()
        
        # Load FAISS index
        if os.path.exists('visual_search_faiss_index.bin'):
            FAISS_INDEX = faiss.read_index('visual_search_faiss_index.bin')
        
        # Load metadata
        if os.path.exists('visual_search_train_metadata.pkl'):
            with open('visual_search_train_metadata.pkl', 'rb') as f:
                TRAIN_METADATA = pickle.load(f)
        
        return True
    except Exception as e:
        logger.error(f"Error loading model: {e}")
        return False

def create_text_embedding(text):
    """Create CLIP text embedding"""
    try:
        with torch.no_grad():
            tokens = TOKENIZER(text).to(DEVICE)
            text_features = MODEL.encode_text(tokens)
            text_features /= text_features.norm(dim=-1, keepdim=True)
        return text_features.cpu().numpy().astype('float32')[0]
    except Exception as e:
        logger.error(f"Error creating embedding: {e}")
        return None

def find_similar_products(query_embedding, top_k=10):
    """Find similar products using FAISS"""
    try:
        if FAISS_INDEX is None or TRAIN_METADATA is None:
            return []
        
        query_embedding = query_embedding.reshape(1, -1).astype('float32')
        distances, indices = FAISS_INDEX.search(query_embedding, k=top_k)
        
        results = []
        for idx, distance in zip(indices[0], distances[0]):
            similarity = 1.0 / (1.0 + distance)
            if similarity >= SIMILARITY_THRESHOLD:
                product = TRAIN_METADATA[idx].copy()
                product['similarity_score'] = float(similarity)
                results.append(product)
        
        return results
    except Exception as e:
        logger.error(f"Error finding similar products: {e}")
        return []

def process_single_query(query_data):
    """Process a single query"""
    try:
        query = query_data.get('query', '')
        top_k = query_data.get('top_k', 10)
        
        embedding = create_text_embedding(query)
        if embedding is None:
            return {'query': query, 'error': 'Failed to create embedding', 'results': []}
        
        results = find_similar_products(embedding, top_k=top_k)
        return {'query': query, 'results_count': len(results), 'results': results}
    except Exception as e:
        logger.error(f"Error processing query: {e}")
        return {'query': query_data.get('query', ''), 'error': str(e), 'results': []}

@batch_search_bp.route('/text-search', methods=['POST'])
def batch_text_search():
    """Batch text search"""
    try:
        if MODEL is None:
            return jsonify({"error": "Model not loaded"}), 503
        
        data = request.get_json()
        if not data or 'queries' not in data:
            return jsonify({"error": "Queries array required"}), 400
        
        queries = data['queries']
        if not isinstance(queries, list):
            return jsonify({"error": "Queries must be an array"}), 400
        
        if len(queries) > 100:
            return jsonify({"error": "Maximum 100 queries allowed"}), 400
        
        start_time = time.time()
        results = []
        
        with ThreadPoolExecutor(max_workers=MAX_WORKERS) as executor:
            futures = [executor.submit(process_single_query, q) for q in queries]
            for future in as_completed(futures):
                results.append(future.result())
        
        elapsed_time = time.time() - start_time
        
        return jsonify({
            "status": "success",
            "batch_count": len(queries),
            "processed": len(results),
            "elapsed_time": elapsed_time,
            "results": results
        }), 200
    
    except Exception as e:
        logger.error(f"Error in batch text search: {e}")
        return jsonify({"error": str(e)}), 500

@batch_search_bp.route('/product-search', methods=['POST'])
def batch_product_search():
    """Batch product search"""
    try:
        if MODEL is None:
            return jsonify({"error": "Model not loaded"}), 503
        
        data = request.get_json()
        if not data or 'products' not in data:
            return jsonify({"error": "Products array required"}), 400
        
        products = data['products']
        if not isinstance(products, list):
            return jsonify({"error": "Products must be an array"}), 400
        
        if len(products) > 100:
            return jsonify({"error": "Maximum 100 products allowed"}), 400
        
        start_time = time.time()
        results = []
        
        for product in products:
            try:
                text = f"{product.get('product_name', '')} {product.get('category', '')} "
                text += f"{product.get('description', '')} {product.get('brand', '')}"
                
                embedding = create_text_embedding(text)
                if embedding is None:
                    results.append({
                        'product': product.get('product_name', ''),
                        'error': 'Failed to create embedding',
                        'results': []
                    })
                    continue
                
                similar = find_similar_products(embedding, top_k=data.get('top_k', 10))
                results.append({
                    'product': product.get('product_name', ''),
                    'results_count': len(similar),
                    'results': similar
                })
            except Exception as e:
                results.append({
                    'product': product.get('product_name', ''),
                    'error': str(e),
                    'results': []
                })
        
        elapsed_time = time.time() - start_time
        
        return jsonify({
            "status": "success",
            "batch_count": len(products),
            "processed": len(results),
            "elapsed_time": elapsed_time,
            "results": results
        }), 200
    
    except Exception as e:
        logger.error(f"Error in batch product search: {e}")
        return jsonify({"error": str(e)}), 500

@batch_search_bp.route('/health', methods=['GET'])
def health():
    """Health check"""
    return jsonify({
        "status": "online" if MODEL is not None else "offline",
        "service": "Batch Search API",
        "model_loaded": MODEL is not None,
        "ready": MODEL is not None
    }), 200

def init_batch_search():
    """Initialize batch search"""
    def load_in_background():
        try:
            load_batch_search_model()
        except Exception as e:
            logger.error(f"Error loading batch search model: {e}")
    
    logger.info("Initializing batch search...")
    thread = threading.Thread(target=load_in_background, daemon=True)
    thread.start()
    logger.info("Batch search background thread started")
    return True
