#!/usr/bin/env python3
"""
Visual Search API - Hybrid Approach
Uses enhanced metadata features and PCA embeddings
"""

import os
import numpy as np
import pandas as pd
import pickle
import json
from flask import Blueprint, request, jsonify
from sklearn.metrics.pairwise import cosine_similarity
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

visual_search_bp = Blueprint('visual_search', __name__, url_prefix='/api/visual-search')

# Global variables
SCALER = None
PCA = None
TRAIN_EMBEDDINGS = None
TRAIN_METADATA = None
SIMILARITY_THRESHOLD = 0.3

def load_visual_search_model():
    """Load trained visual search model"""
    global SCALER, PCA, TRAIN_EMBEDDINGS, TRAIN_METADATA
    
    try:
        logger.info("Loading visual search model...")
        
        # Load scaler
        if os.path.exists('visual_search_scaler.pkl'):
            with open('visual_search_scaler.pkl', 'rb') as f:
                SCALER = pickle.load(f)
            logger.info("Scaler loaded")
        
        # Load PCA
        if os.path.exists('visual_search_pca.pkl'):
            with open('visual_search_pca.pkl', 'rb') as f:
                PCA = pickle.load(f)
            logger.info("PCA loaded")
        
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

def create_features(product_data):
    """Create feature vector from product data"""
    try:
        # Normalize features
        price_norm = min(product_data.get('price', 0) / 5000, 1.0)
        rating_norm = product_data.get('rating', 3.5) / 5.0
        category_id = product_data.get('label_id', 1) / 20.0
        name_len = min(len(str(product_data.get('product_name', ''))) / 50.0, 1.0)
        desc_len = min(len(str(product_data.get('description', ''))) / 200.0, 1.0)
        
        # Brand, color, size encoding
        brand_hash = hash(str(product_data.get('brand', ''))) % 100 / 100.0
        color_hash = hash(str(product_data.get('color', ''))) % 100 / 100.0
        size_hash = hash(str(product_data.get('size', ''))) % 100 / 100.0
        
        # Create 512-dimensional feature vector
        feature = np.array([
            price_norm, rating_norm, category_id, name_len, desc_len,
            brand_hash, color_hash, size_hash,
            price_norm * 0.9, rating_norm * 0.8, category_id * 1.1,
            name_len * 0.95, desc_len * 1.05, brand_hash * 0.85,
            color_hash * 1.15, size_hash * 0.9,
        ])
        
        # Expand to 512 dimensions
        expanded = np.tile(feature, 32)[:512]
        
        return expanded.reshape(1, -1)
    
    except Exception as e:
        logger.error(f"Error creating features: {e}")
        return None

def find_similar_products(query_features, top_k=10):
    """Find similar products"""
    try:
        if TRAIN_EMBEDDINGS is None or TRAIN_METADATA is None:
            return []
        
        # Scale features
        if SCALER is not None:
            query_features_scaled = SCALER.transform(query_features)
        else:
            query_features_scaled = query_features
        
        # Apply PCA
        if PCA is not None:
            query_features_pca = PCA.transform(query_features_scaled)
        else:
            query_features_pca = query_features_scaled
        
        # Calculate similarities
        similarities = cosine_similarity(query_features_pca, TRAIN_EMBEDDINGS)[0]
        
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

@visual_search_bp.route('/search', methods=['POST'])
def visual_search():
    """Visual search endpoint"""
    try:
        data = request.get_json()
        
        if not data or 'product' not in data:
            return jsonify({"error": "Product data required"}), 400
        
        product = data['product']
        top_k = data.get('top_k', 10)
        
        # Create features
        query_features = create_features(product)
        if query_features is None:
            return jsonify({"error": "Failed to create features"}), 500
        
        # Find similar products
        similar_products = find_similar_products(query_features, top_k=top_k)
        
        return jsonify({
            "status": "success",
            "query_product": product.get('product_name'),
            "results_count": len(similar_products),
            "products": similar_products
        }), 200
    
    except Exception as e:
        logger.error(f"Error in visual search: {e}")
        return jsonify({"error": str(e)}), 500

@visual_search_bp.route('/search/category', methods=['POST'])
def visual_search_category():
    """Search within category"""
    try:
        data = request.get_json()
        
        if not data or 'product' not in data or 'category' not in data:
            return jsonify({"error": "Product and category required"}), 400
        
        product = data['product']
        category = data['category']
        top_k = data.get('top_k', 10)
        
        # Create features
        query_features = create_features(product)
        if query_features is None:
            return jsonify({"error": "Failed to create features"}), 500
        
        # Scale and PCA
        if SCALER is not None:
            query_features_scaled = SCALER.transform(query_features)
        else:
            query_features_scaled = query_features
        
        if PCA is not None:
            query_features_pca = PCA.transform(query_features_scaled)
        else:
            query_features_pca = query_features_scaled
        
        # Calculate similarities
        similarities = cosine_similarity(query_features_pca, TRAIN_EMBEDDINGS)[0]
        
        # Filter by category
        category_results = []
        for i, meta in enumerate(TRAIN_METADATA):
            if meta.get('category') == category:
                category_results.append((i, similarities[i]))
        
        # Sort and get top-k
        category_results.sort(key=lambda x: x[1], reverse=True)
        
        results = []
        for idx, sim_score in category_results[:top_k]:
            if sim_score >= SIMILARITY_THRESHOLD:
                product = TRAIN_METADATA[idx].copy()
                product['similarity_score'] = float(sim_score)
                results.append(product)
        
        return jsonify({
            "status": "success",
            "category": category,
            "results_count": len(results),
            "products": results
        }), 200
    
    except Exception as e:
        logger.error(f"Error in category search: {e}")
        return jsonify({"error": str(e)}), 500

@visual_search_bp.route('/health', methods=['GET'])
def health():
    """Health check"""
    model_loaded = SCALER is not None and PCA is not None
    embeddings_loaded = TRAIN_EMBEDDINGS is not None
    metadata_loaded = TRAIN_METADATA is not None
    
    return jsonify({
        "status": "online",
        "service": "Visual Search API - Hybrid",
        "model_loaded": model_loaded,
        "embeddings_loaded": embeddings_loaded,
        "metadata_loaded": metadata_loaded,
        "ready": model_loaded and embeddings_loaded and metadata_loaded
    }), 200

def init_visual_search():
    """Initialize visual search"""
    logger.info("Initializing visual search...")
    success = load_visual_search_model()
    if success:
        logger.info("Visual search initialized successfully")
    else:
        logger.warning("Visual search initialization incomplete")
    return success
