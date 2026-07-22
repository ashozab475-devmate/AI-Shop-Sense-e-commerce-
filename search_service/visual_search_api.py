#!/usr/bin/env python3
"""
Visual Search API Integration
Integrates trained model with Flask search service
"""

import os
import numpy as np
import json
from flask import Blueprint, request, jsonify
from tensorflow.keras.models import load_model
from tensorflow.keras.preprocessing import image
from sklearn.metrics.pairwise import cosine_similarity
import logging

# Setup logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Visual Search Blueprint
visual_search_bp = Blueprint('visual_search', __name__, url_prefix='/api/visual-search')

# Global variables
MODEL = None
FEATURE_EXTRACTOR = None
TRAIN_FEATURES = None
TRAIN_METADATA = None
SIMILARITY_THRESHOLD = 0.7

def load_visual_search_model():
    """Load trained visual search model"""
    global MODEL, FEATURE_EXTRACTOR, TRAIN_FEATURES, TRAIN_METADATA
    
    try:
        logger.info("Loading visual search model...")
        
        # Load model
        model_path = 'visual_search_model.h5'
        if os.path.exists(model_path):
            MODEL = load_model(model_path)
            logger.info(f"Model loaded: {model_path}")
        else:
            logger.warning(f"Model not found: {model_path}")
            return False
        
        # Load features
        features_path = 'visual_search_model_train_features.npy'
        if os.path.exists(features_path):
            TRAIN_FEATURES = np.load(features_path)
            logger.info(f"Features loaded: {features_path}")
        else:
            logger.warning(f"Features not found: {features_path}")
        
        # Load metadata
        metadata_path = 'abo_dataset_6000.csv'
        if os.path.exists(metadata_path):
            import pandas as pd
            df = pd.read_csv(metadata_path)
            TRAIN_METADATA = df.to_dict('records')
            logger.info(f"Metadata loaded: {len(TRAIN_METADATA)} items")
        else:
            logger.warning(f"Metadata not found: {metadata_path}")
        
        return True
    
    except Exception as e:
        logger.error(f"Error loading model: {e}")
        return False

def extract_features(img_array):
    """Extract features from image"""
    try:
        # Preprocess image
        img_array = image.smart_resize(img_array, (224, 224))
        img_array = np.expand_dims(img_array, axis=0)
        img_array = img_array / 255.0
        
        # Extract features using feature extractor
        if FEATURE_EXTRACTOR is None:
            # Create feature extractor from model
            from tensorflow.keras.models import Model
            global FEATURE_EXTRACTOR
            FEATURE_EXTRACTOR = Model(
                inputs=MODEL.input,
                outputs=MODEL.layers[-2].output
            )
        
        features = FEATURE_EXTRACTOR.predict(img_array, verbose=0)
        return features[0]
    
    except Exception as e:
        logger.error(f"Error extracting features: {e}")
        return None

def find_similar_products(query_features, top_k=10):
    """Find similar products using cosine similarity"""
    try:
        if TRAIN_FEATURES is None or TRAIN_METADATA is None:
            return []
        
        # Calculate similarities
        similarities = cosine_similarity([query_features], TRAIN_FEATURES)[0]
        
        # Get top-k similar products
        top_indices = np.argsort(similarities)[::-1][:top_k]
        
        results = []
        for idx in top_indices:
            similarity_score = float(similarities[idx])
            
            if similarity_score >= SIMILARITY_THRESHOLD:
                product = TRAIN_METADATA[idx].copy()
                product['similarity_score'] = similarity_score
                results.append(product)
        
        return results
    
    except Exception as e:
        logger.error(f"Error finding similar products: {e}")
        return []

@visual_search_bp.route('/search', methods=['POST'])
def visual_search():
    """Visual search endpoint"""
    try:
        # Check if image is provided
        if 'image' not in request.files:
            return jsonify({"error": "No image provided"}), 400
        
        file = request.files['image']
        
        if file.filename == '':
            return jsonify({"error": "No image selected"}), 400
        
        # Read image
        img = image.load_img(file.stream, target_size=(224, 224))
        img_array = image.img_to_array(img)
        
        # Extract features
        query_features = extract_features(img_array)
        
        if query_features is None:
            return jsonify({"error": "Failed to extract features"}), 500
        
        # Find similar products
        top_k = request.args.get('top_k', 10, type=int)
        similar_products = find_similar_products(query_features, top_k=top_k)
        
        return jsonify({
            "status": "success",
            "query_image": file.filename,
            "results_count": len(similar_products),
            "products": similar_products
        }), 200
    
    except Exception as e:
        logger.error(f"Error in visual search: {e}")
        return jsonify({"error": str(e)}), 500

@visual_search_bp.route('/search/url', methods=['POST'])
def visual_search_url():
    """Visual search from URL"""
    try:
        data = request.get_json()
        
        if 'image_url' not in data:
            return jsonify({"error": "No image URL provided"}), 400
        
        image_url = data['image_url']
        
        # Download image from URL
        import requests
        from io import BytesIO
        
        response = requests.get(image_url, timeout=10)
        img = image.load_img(BytesIO(response.content), target_size=(224, 224))
        img_array = image.img_to_array(img)
        
        # Extract features
        query_features = extract_features(img_array)
        
        if query_features is None:
            return jsonify({"error": "Failed to extract features"}), 500
        
        # Find similar products
        top_k = data.get('top_k', 10)
        similar_products = find_similar_products(query_features, top_k=top_k)
        
        return jsonify({
            "status": "success",
            "query_image_url": image_url,
            "results_count": len(similar_products),
            "products": similar_products
        }), 200
    
    except Exception as e:
        logger.error(f"Error in visual search from URL: {e}")
        return jsonify({"error": str(e)}), 500

@visual_search_bp.route('/search/category', methods=['POST'])
def visual_search_by_category():
    """Visual search within specific category"""
    try:
        data = request.get_json()
        
        if 'image' not in request.files or 'category' not in data:
            return jsonify({"error": "Image and category required"}), 400
        
        file = request.files['image']
        category = data['category']
        
        # Read image
        img = image.load_img(file.stream, target_size=(224, 224))
        img_array = image.img_to_array(img)
        
        # Extract features
        query_features = extract_features(img_array)
        
        if query_features is None:
            return jsonify({"error": "Failed to extract features"}), 500
        
        # Find similar products in category
        similarities = cosine_similarity([query_features], TRAIN_FEATURES)[0]
        
        # Filter by category
        category_indices = [
            i for i, meta in enumerate(TRAIN_METADATA)
            if meta.get('category') == category
        ]
        
        # Get top-k from category
        top_k = data.get('top_k', 10)
        category_similarities = [(i, similarities[i]) for i in category_indices]
        category_similarities.sort(key=lambda x: x[1], reverse=True)
        
        results = []
        for idx, sim_score in category_similarities[:top_k]:
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
    """Health check endpoint"""
    model_loaded = MODEL is not None
    features_loaded = TRAIN_FEATURES is not None
    metadata_loaded = TRAIN_METADATA is not None
    
    return jsonify({
        "status": "online",
        "service": "Visual Search API",
        "model_loaded": model_loaded,
        "features_loaded": features_loaded,
        "metadata_loaded": metadata_loaded,
        "ready": model_loaded and features_loaded and metadata_loaded,
        "index_size": 2000
    }), 200

# Initialize model on startup
def init_visual_search():
    """Initialize visual search on startup"""
    logger.info("Initializing visual search...")
    success = load_visual_search_model()
    if success:
        logger.info("Visual search initialized successfully")
    else:
        logger.warning("Visual search initialization incomplete - some components missing")
    return success
