#!/usr/bin/env python3
"""
Alternative Models API
Support for Vision Transformer, DenseNet, EfficientNet, MobileNet
"""

import torch
import torchvision.models as models
from torchvision import transforms
import numpy as np
import pickle
import faiss
from flask import Blueprint, request, jsonify
from werkzeug.utils import secure_filename
import logging
import os
import threading
from image_loader import ImageLoader

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

alternative_models_bp = Blueprint('alternative_models', __name__, url_prefix='/api/alternative-models')

# Global variables
DEVICE = "cuda" if torch.cuda.is_available() else "cpu"
MODELS = {}
FAISS_INDEX = None
TRAIN_METADATA = None
IMAGE_LOADER = None
SIMILARITY_THRESHOLD = 0.3
UPLOAD_FOLDER = 'uploads'
ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg', 'gif', 'webp'}

os.makedirs(UPLOAD_FOLDER, exist_ok=True)

def allowed_file(filename):
    """Check if file extension is allowed"""
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

def load_alternative_models():
    """Load alternative model architectures"""
    global MODELS, FAISS_INDEX, TRAIN_METADATA, IMAGE_LOADER
    
    try:
        logger.info("Loading alternative models...")
        
        # Load DenseNet121
        try:
            densenet = models.densenet121(pretrained=True)
            densenet = densenet.to(DEVICE)
            densenet.eval()
            MODELS['densenet121'] = {
                'model': densenet,
                'name': 'DenseNet121',
                'input_size': 224,
                'feature_dim': 1024
            }
            logger.info("DenseNet121 loaded")
        except Exception as e:
            logger.warning(f"Failed to load DenseNet121: {e}")
        
        # Load EfficientNet-B0
        try:
            efficientnet = models.efficientnet_b0(pretrained=True)
            efficientnet = efficientnet.to(DEVICE)
            efficientnet.eval()
            MODELS['efficientnet_b0'] = {
                'model': efficientnet,
                'name': 'EfficientNet-B0',
                'input_size': 224,
                'feature_dim': 1280
            }
            logger.info("EfficientNet-B0 loaded")
        except Exception as e:
            logger.warning(f"Failed to load EfficientNet-B0: {e}")
        
        # Load MobileNetV2
        try:
            mobilenet = models.mobilenet_v2(pretrained=True)
            mobilenet = mobilenet.to(DEVICE)
            mobilenet.eval()
            MODELS['mobilenet_v2'] = {
                'model': mobilenet,
                'name': 'MobileNetV2',
                'input_size': 224,
                'feature_dim': 1280
            }
            logger.info("MobileNetV2 loaded")
        except Exception as e:
            logger.warning(f"Failed to load MobileNetV2: {e}")
        
        # Load Vision Transformer (ViT)
        try:
            vit = models.vit_b_16(pretrained=True)
            vit = vit.to(DEVICE)
            vit.eval()
            MODELS['vit_b_16'] = {
                'model': vit,
                'name': 'Vision Transformer B/16',
                'input_size': 224,
                'feature_dim': 768
            }
            logger.info("Vision Transformer loaded")
        except Exception as e:
            logger.warning(f"Failed to load Vision Transformer: {e}")
        
        # Load FAISS index
        if os.path.exists('visual_search_faiss_index.bin'):
            FAISS_INDEX = faiss.read_index('visual_search_faiss_index.bin')
        
        # Load metadata
        if os.path.exists('visual_search_train_metadata.pkl'):
            with open('visual_search_train_metadata.pkl', 'rb') as f:
                TRAIN_METADATA = pickle.load(f)
        
        # Initialize image loader
        IMAGE_LOADER = ImageLoader()
        
        logger.info(f"Loaded {len(MODELS)} alternative models")
        return len(MODELS) > 0
    
    except Exception as e:
        logger.error(f"Error loading alternative models: {e}")
        return False

def extract_features(image_path, model_name):
    """Extract features using specified model"""
    try:
        if model_name not in MODELS:
            return None
        
        model_info = MODELS[model_name]
        model = model_info['model']
        input_size = model_info['input_size']
        
        # Load image
        image = IMAGE_LOADER.load_image(image_path)
        if image is None:
            return None
        
        # Prepare image
        transform = transforms.Compose([
            transforms.Resize((input_size, input_size)),
            transforms.ToTensor(),
            transforms.Normalize(mean=[0.485, 0.456, 0.406],
                               std=[0.229, 0.224, 0.225])
        ])
        
        image_tensor = transform(image).unsqueeze(0).to(DEVICE)
        
        # Extract features
        with torch.no_grad():
            if model_name == 'vit_b_16':
                features = model._process_input(image_tensor)
                features = model._forward_impl(features)
            else:
                features = model.features(image_tensor)
                features = torch.nn.functional.adaptive_avg_pool2d(features, (1, 1))
                features = features.flatten(1)
        
        # Normalize
        features = features / (torch.norm(features) + 1e-8)
        
        return features.cpu().numpy()[0]
    
    except Exception as e:
        logger.error(f"Error extracting features: {e}")
        return None

def find_similar_products(query_features, top_k=10):
    """Find similar products using FAISS"""
    try:
        if FAISS_INDEX is None or TRAIN_METADATA is None:
            return []
        
        query_features = query_features.reshape(1, -1).astype('float32')
        distances, indices = FAISS_INDEX.search(query_features, k=top_k)
        
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

@alternative_models_bp.route('/models', methods=['GET'])
def get_models():
    """Get available alternative models"""
    models_list = []
    for model_id, model_info in MODELS.items():
        models_list.append({
            'id': model_id,
            'name': model_info['name'],
            'input_size': model_info['input_size'],
            'feature_dim': model_info['feature_dim']
        })
    
    return jsonify({
        'status': 'success',
        'models': models_list,
        'count': len(models_list)
    }), 200

@alternative_models_bp.route('/search/<model_name>', methods=['POST'])
def search_with_model(model_name):
    """Search using specific model"""
    try:
        if model_name not in MODELS:
            return jsonify({"error": f"Model {model_name} not found"}), 404
        
        if 'image' not in request.files:
            return jsonify({"error": "No image file provided"}), 400
        
        file = request.files['image']
        
        if file.filename == '' or not allowed_file(file.filename):
            return jsonify({"error": "Invalid file"}), 400
        
        filename = secure_filename(file.filename)
        filepath = os.path.join(UPLOAD_FOLDER, filename)
        file.save(filepath)
        
        try:
            top_k = request.form.get('top_k', 10, type=int)
            
            features = extract_features(filepath, model_name)
            if features is None:
                return jsonify({"error": "Failed to extract features"}), 500
            
            similar_products = find_similar_products(features, top_k=top_k)
            
            return jsonify({
                "status": "success",
                "model": model_name,
                "filename": filename,
                "results_count": len(similar_products),
                "products": similar_products
            }), 200
        
        finally:
            if os.path.exists(filepath):
                os.remove(filepath)
    
    except Exception as e:
        logger.error(f"Error in model search: {e}")
        return jsonify({"error": str(e)}), 500

@alternative_models_bp.route('/compare', methods=['POST'])
def compare_models():
    """Compare results from multiple models"""
    try:
        if 'image' not in request.files:
            return jsonify({"error": "No image file provided"}), 400
        
        file = request.files['image']
        
        if file.filename == '' or not allowed_file(file.filename):
            return jsonify({"error": "Invalid file"}), 400
        
        filename = secure_filename(file.filename)
        filepath = os.path.join(UPLOAD_FOLDER, filename)
        file.save(filepath)
        
        try:
            top_k = request.form.get('top_k', 5, type=int)
            results = {}
            
            for model_name in MODELS.keys():
                features = extract_features(filepath, model_name)
                if features is not None:
                    similar = find_similar_products(features, top_k=top_k)
                    results[model_name] = {
                        'results_count': len(similar),
                        'products': similar
                    }
            
            return jsonify({
                "status": "success",
                "filename": filename,
                "models_compared": len(results),
                "results": results
            }), 200
        
        finally:
            if os.path.exists(filepath):
                os.remove(filepath)
    
    except Exception as e:
        logger.error(f"Error comparing models: {e}")
        return jsonify({"error": str(e)}), 500

@alternative_models_bp.route('/health', methods=['GET'])
def health():
    """Health check"""
    return jsonify({
        "status": "online" if MODELS else "offline",
        "service": "Alternative Models API",
        "models_loaded": len(MODELS),
        "available_models": list(MODELS.keys())
    }), 200

def init_alternative_models():
    """Initialize alternative models"""
    def load_in_background():
        try:
            load_alternative_models()
        except Exception as e:
            logger.error(f"Error loading alternative models: {e}")
    
    logger.info("Initializing alternative models...")
    thread = threading.Thread(target=load_in_background, daemon=True)
    thread.start()
    logger.info("Alternative models background thread started")
    return True
