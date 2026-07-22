#!/usr/bin/env python3
"""
TensorFlow Visual Search API - ResNet50 Implementation
Feature extraction and similarity search using trained ResNet50 model
"""

import os
import numpy as np
try:
    import tensorflow as tf
    TF_AVAILABLE = True
except ImportError:
    TF_AVAILABLE = False
    tf = None
from flask import Blueprint, request, jsonify
from werkzeug.utils import secure_filename
import logging
from image_loader import ImageLoader
from sklearn.metrics.pairwise import cosine_similarity

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

tensorflow_search_bp = Blueprint('tensorflow_search', __name__, url_prefix='/api/tensorflow-search')

# Global variables
MODEL = None
TRAIN_FEATURES = None
TRAIN_METADATA = None
IMAGE_LOADER = None
SIMILARITY_THRESHOLD = 0.3
UPLOAD_FOLDER = 'uploads'
ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg', 'gif', 'webp'}
INPUT_SIZE = 224

# Create upload folder
os.makedirs(UPLOAD_FOLDER, exist_ok=True)

def allowed_file(filename):
    """Check if file extension is allowed"""
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

def load_tensorflow_model():
    """Load trained TensorFlow model and features"""
    global MODEL, TRAIN_FEATURES, TRAIN_METADATA, IMAGE_LOADER
    
    if not TF_AVAILABLE:
        logger.warning("TensorFlow not installed, skipping model load")
        return False
    
    try:
        logger.info("Loading TensorFlow ResNet50 model...")
        
        # Load model
        model_path = 'visual_search_model.h5'
        if not os.path.exists(model_path):
            logger.warning(f"Model not found: {model_path}")
            return False
        
        MODEL = tf.keras.models.load_model(model_path)
        logger.info(f"Model loaded: {model_path}")
        
        # Load training features
        features_path = 'visual_search_model_train_features.npy'
        if os.path.exists(features_path):
            TRAIN_FEATURES = np.load(features_path)
            logger.info(f"Training features loaded: {TRAIN_FEATURES.shape}")
        
        # Load metadata
        import pickle
        metadata_path = 'visual_search_train_metadata.pkl'
        if os.path.exists(metadata_path):
            with open(metadata_path, 'rb') as f:
                TRAIN_METADATA = pickle.load(f)
            logger.info(f"Metadata loaded: {len(TRAIN_METADATA)} items")
        
        # Initialize image loader
        IMAGE_LOADER = ImageLoader()
        
        return True
    
    except Exception as e:
        logger.error(f"Error loading model: {e}")
        return False

def extract_features(image_path):
    """Extract features from image using ResNet50"""
    try:
        # Load image
        image = IMAGE_LOADER.load_image(image_path)
        if image is None:
            return None
        
        # Prepare image for model
        image = np.expand_dims(image, axis=0)
        image = image / 255.0  # Normalize to 0-1
        
        # Extract features (remove classification layer)
        features = MODEL.predict(image, verbose=0)
        
        # Normalize features
        features = features / (np.linalg.norm(features) + 1e-8)
        
        return features[0]
    
    except Exception as e:
        logger.error(f"Error extracting features: {e}")
        return None

def find_similar_products(query_features, top_k=10):
    """Find similar products using cosine similarity"""
    try:
        if TRAIN_FEATURES is None or TRAIN_METADATA is None:
            return []
        
        # Calculate cosine similarity
        similarities = cosine_similarity([query_features], TRAIN_FEATURES)[0]
        
        # Get top-k indices
        top_indices = np.argsort(similarities)[::-1][:top_k]
        
        results = []
        for idx in top_indices:
            similarity = float(similarities[idx])
            
            if similarity >= SIMILARITY_THRESHOLD:
                product = TRAIN_METADATA[idx].copy()
                product['similarity_score'] = similarity
                results.append(product)
        
        return results
    
    except Exception as e:
        logger.error(f"Error finding similar products: {e}")
        return []

@tensorflow_search_bp.route('/search', methods=['POST'])
def tensorflow_search():
    """Search by uploading an image"""
    try:
        if MODEL is None:
            return jsonify({"error": "Model not loaded"}), 503
        
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
            # Extract features
            query_features = extract_features(filepath)
            if query_features is None:
                return jsonify({"error": "Failed to process image"}), 500
            
            # Get top_k parameter
            top_k = request.form.get('top_k', 10, type=int)
            
            # Find similar products
            similar_products = find_similar_products(query_features, top_k=top_k)
            
            return jsonify({
                "status": "success",
                "filename": filename,
                "model": "ResNet50",
                "results_count": len(similar_products),
                "products": similar_products
            }), 200
        
        finally:
            # Clean up uploaded file
            if os.path.exists(filepath):
                os.remove(filepath)
    
    except Exception as e:
        logger.error(f"Error in TensorFlow search: {e}")
        return jsonify({"error": str(e)}), 500

@tensorflow_search_bp.route('/search/url', methods=['POST'])
def tensorflow_search_url():
    """Search by image URL"""
    try:
        if MODEL is None:
            return jsonify({"error": "Model not loaded"}), 503
        
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
            # Extract features
            query_features = extract_features(image_path)
            if query_features is None:
                return jsonify({"error": "Failed to process image"}), 500
            
            # Find similar products
            similar_products = find_similar_products(query_features, top_k=top_k)
            
            return jsonify({
                "status": "success",
                "image_url": image_url,
                "model": "ResNet50",
                "results_count": len(similar_products),
                "products": similar_products
            }), 200
        
        finally:
            # Clean up downloaded file
            if os.path.exists(image_path):
                os.remove(image_path)
    
    except Exception as e:
        logger.error(f"Error in TensorFlow URL search: {e}")
        return jsonify({"error": str(e)}), 500

@tensorflow_search_bp.route('/compare', methods=['POST'])
def compare_images():
    """Compare two images and get similarity score"""
    try:
        if MODEL is None:
            return jsonify({"error": "Model not loaded"}), 503
        
        # Check if both images are present
        if 'image1' not in request.files or 'image2' not in request.files:
            return jsonify({"error": "Two images required"}), 400
        
        file1 = request.files['image1']
        file2 = request.files['image2']
        
        if file1.filename == '' or file2.filename == '':
            return jsonify({"error": "Both files must be selected"}), 400
        
        if not allowed_file(file1.filename) or not allowed_file(file2.filename):
            return jsonify({"error": "File type not allowed"}), 400
        
        # Save uploaded files
        filename1 = secure_filename(file1.filename)
        filename2 = secure_filename(file2.filename)
        filepath1 = os.path.join(UPLOAD_FOLDER, filename1)
        filepath2 = os.path.join(UPLOAD_FOLDER, filename2)
        file1.save(filepath1)
        file2.save(filepath2)
        
        try:
            # Extract features
            features1 = extract_features(filepath1)
            features2 = extract_features(filepath2)
            
            if features1 is None or features2 is None:
                return jsonify({"error": "Failed to process images"}), 500
            
            # Calculate similarity
            similarity = float(cosine_similarity([features1], [features2])[0][0])
            
            return jsonify({
                "status": "success",
                "image1": filename1,
                "image2": filename2,
                "similarity_score": similarity,
                "model": "ResNet50"
            }), 200
        
        finally:
            # Clean up uploaded files
            if os.path.exists(filepath1):
                os.remove(filepath1)
            if os.path.exists(filepath2):
                os.remove(filepath2)
    
    except Exception as e:
        logger.error(f"Error comparing images: {e}")
        return jsonify({"error": str(e)}), 500

@tensorflow_search_bp.route('/health', methods=['GET'])
def health():
    """Health check"""
    model_loaded = MODEL is not None
    features_loaded = TRAIN_FEATURES is not None
    metadata_loaded = TRAIN_METADATA is not None
    
    return jsonify({
        "status": "online" if model_loaded else "offline",
        "service": "TensorFlow Search API - ResNet50",
        "model_loaded": model_loaded,
        "features_loaded": features_loaded,
        "metadata_loaded": metadata_loaded,
        "ready": model_loaded and features_loaded and metadata_loaded,
        "model_type": "ResNet50",
        "feature_dimension": TRAIN_FEATURES.shape[1] if TRAIN_FEATURES is not None else 0,
        "training_samples": len(TRAIN_METADATA) if TRAIN_METADATA is not None else 0
    }), 200

def init_tensorflow_search():
    """Initialize TensorFlow search"""
    logger.info("Initializing TensorFlow search...")
    success = load_tensorflow_model()
    if success:
        logger.info("TensorFlow search initialized successfully")
    else:
        logger.warning("TensorFlow search initialization incomplete")
    return success
