#!/usr/bin/env python3
"""
ShopSense - AI Search Service
Starts the Flask-based search service on port 5000 using Waitress
"""

import os
import sys
import logging
from flask import Flask, request, jsonify
from flask_cors import CORS
from waitress import serve
import json

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Create Flask app
app = Flask(__name__)
CORS(app)

# Try to import optional modules
try:
    from visual_search_api_clip_faiss import visual_search_bp, init_visual_search
    app.register_blueprint(visual_search_bp)
    init_visual_search()
    logger.info("Visual search (CLIP+FAISS) loaded")
except Exception as e:
    logger.warning(f"Visual search (CLIP+FAISS) not available: {e}")

try:
    from image_search_api import image_search_bp, init_image_search
    app.register_blueprint(image_search_bp)
    init_image_search()
    logger.info("Image search loaded")
except Exception as e:
    logger.warning(f"Image search not available: {e}")

try:
    from visual_search_api_tensorflow import tensorflow_search_bp, init_tensorflow_search
    app.register_blueprint(tensorflow_search_bp)
    init_tensorflow_search()
    logger.info("TensorFlow search loaded")
except Exception as e:
    logger.warning(f"TensorFlow search not available: {e}")

try:
    from batch_search import batch_search_bp, init_batch_search
    app.register_blueprint(batch_search_bp)
    init_batch_search()
    logger.info("Batch search loaded")
except Exception as e:
    logger.warning(f"Batch search not available: {e}")

try:
    from docs_api import docs_bp, init_docs
    app.register_blueprint(docs_bp)
    init_docs()
    logger.info("Docs API loaded")
except Exception as e:
    logger.warning(f"Docs API not available: {e}")

try:
    from alternative_models_api import alternative_models_bp, init_alternative_models
    app.register_blueprint(alternative_models_bp)
    init_alternative_models()
    logger.info("Alternative models loaded")
except Exception as e:
    logger.warning(f"Alternative models not available: {e}")

try:
    from model_registry import init_registry
    init_registry()
    logger.info("Model registry loaded")
except Exception as e:
    logger.warning(f"Model registry not available: {e}")

try:
    from model_versioning import init_versioning
    init_versioning()
    logger.info("Model versioning loaded")
except Exception as e:
    logger.warning(f"Model versioning not available: {e}")

# Mock product database
MOCK_PRODUCTS = [
    {"id": "1", "name": "Laptop", "price": 999, "category": "electronics", "rating": 4.5},
    {"id": "2", "name": "Mouse", "price": 29, "category": "electronics", "rating": 4.0},
    {"id": "3", "name": "Keyboard", "price": 79, "category": "electronics", "rating": 4.3},
    {"id": "4", "name": "Monitor", "price": 299, "category": "electronics", "rating": 4.6},
    {"id": "5", "name": "Desk", "price": 199, "category": "furniture", "rating": 4.2},
    {"id": "6", "name": "Chair", "price": 149, "category": "furniture", "rating": 4.1},
    {"id": "7", "name": "Headphones", "price": 149, "category": "electronics", "rating": 4.7},
    {"id": "8", "name": "Webcam", "price": 89, "category": "electronics", "rating": 4.4},
]

@app.route('/', methods=['GET'])
def health():
    """Health check endpoint"""
    return jsonify({
        "status": "online",
        "service": "ShopSense AI Search Service",
        "version": "1.0",
        "port": 5000
    }), 200

@app.route('/api/search', methods=['GET', 'POST'])
def search():
    """Search products endpoint"""
    try:
        if request.method == 'POST':
            data = request.get_json()
            query = data.get('q', '').lower() if data else ''
        else:
            query = request.args.get('q', '').lower()
        
        if not query:
            return jsonify({"products": MOCK_PRODUCTS}), 200
        
        # Simple search filter
        results = [
            p for p in MOCK_PRODUCTS 
            if query in p['name'].lower() or query in p['category'].lower()
        ]
        
        return jsonify({"products": results}), 200
    except Exception as e:
        logger.error(f"Error in search: {e}")
        return jsonify({"error": str(e), "products": []}), 200

@app.route('/api/search/advanced', methods=['POST'])
def advanced_search():
    """Advanced search with filters"""
    try:
        data = request.get_json()
        if not data:
            return jsonify({"products": MOCK_PRODUCTS}), 200
        
        query = data.get('q', '').lower()
        min_price = data.get('minPrice', 0)
        max_price = data.get('maxPrice', 10000)
        category = data.get('category', '')
        
        results = MOCK_PRODUCTS
        
        # Filter by query
        if query:
            results = [p for p in results if query in p['name'].lower()]
        
        # Filter by price
        results = [p for p in results if min_price <= p['price'] <= max_price]
        
        # Filter by category
        if category:
            results = [p for p in results if p['category'].lower() == category.lower()]
        
        return jsonify({"products": results}), 200
    except Exception as e:
        logger.error(f"Error in advanced search: {e}")
        return jsonify({"error": str(e), "products": []}), 200

@app.route('/api/products', methods=['GET'])
def get_products():
    """Get all products"""
    try:
        return jsonify({"products": MOCK_PRODUCTS}), 200
    except Exception as e:
        logger.error(f"Error getting products: {e}")
        return jsonify({"error": str(e), "products": []}), 200

@app.route('/api/products/<product_id>', methods=['GET'])
def get_product(product_id):
    """Get specific product"""
    try:
        product = next((p for p in MOCK_PRODUCTS if p['id'] == product_id), None)
        if product:
            return jsonify(product), 200
        return jsonify({"error": "Product not found"}), 404
    except Exception as e:
        logger.error(f"Error getting product: {e}")
        return jsonify({"error": str(e)}), 200

@app.route('/api/recommendations', methods=['GET', 'POST'])
def recommendations():
    """Get product recommendations"""
    try:
        # Return top rated products
        top_products = sorted(MOCK_PRODUCTS, key=lambda x: x['rating'], reverse=True)[:5]
        return jsonify({"products": top_products}), 200
    except Exception as e:
        logger.error(f"Error getting recommendations: {e}")
        return jsonify({"error": str(e), "products": []}), 200

@app.route('/api/categories', methods=['GET'])
def get_categories():
    """Get all categories"""
    try:
        categories = list(set(p['category'] for p in MOCK_PRODUCTS))
        return jsonify({"categories": categories}), 200
    except Exception as e:
        logger.error(f"Error getting categories: {e}")
        return jsonify({"error": str(e), "categories": []}), 200

@app.errorhandler(404)
def not_found(error):
    """Handle 404 errors"""
    return jsonify({"error": "Endpoint not found", "status": 404}), 404

@app.errorhandler(500)
def server_error(error):
    """Handle 500 errors"""
    import traceback
    error_trace = traceback.format_exc()
    logger.error(f"Internal Server Error: {error_trace}")
    return jsonify({
        "error": "Internal server error",
        "status": 500,
        "message": str(error)
    }), 500

@app.errorhandler(Exception)
def handle_exception(error):
    """Handle all uncaught exceptions"""
    import traceback
    error_trace = traceback.format_exc()
    logger.error(f"Unhandled Exception: {error_trace}")
    return jsonify({
        "error": "An unexpected error occurred",
        "status": 500,
        "message": str(error)
    }), 500

if __name__ == '__main__':
    print("=" * 80)
    print("                    ShopSense - AI Search Service")
    print("=" * 80)
    print()
    print("Starting AI Search Service with Waitress (Production WSGI Server)...")
    print()
    print("Service Information:")
    print("  - URL: http://localhost:5000")
    print("  - Health Check: http://localhost:5000/")
    print("  - Search API: http://localhost:5000/api/search?q=laptop")
    print("  - Advanced Search: POST http://localhost:5000/api/search/advanced")
    print("  - Products: http://localhost:5000/api/products")
    print("  - Categories: http://localhost:5000/api/categories")
    print("  - Recommendations: http://localhost:5000/api/recommendations")
    print()
    print("Available Endpoints:")
    print("  GET  /                          - Health check")
    print("  GET  /api/search?q=query        - Search products")
    print("  POST /api/search/advanced       - Advanced search with filters")
    print("  GET  /api/products              - Get all products")
    print("  GET  /api/products/<id>         - Get specific product")
    print("  GET  /api/categories            - Get all categories")
    print("  GET  /api/recommendations       - Get recommendations")
    print()
    print("Visual Search (CLIP+FAISS):")
    print("  GET  /api/visual-search/health                - Health check")
    print("  POST /api/visual-search/search                - Text search")
    print("  POST /api/visual-search/search/product        - Product search")
    print("  POST /api/visual-search/search/category       - Category search")
    print()
    print("Image Search (CLIP+FAISS):")
    print("  GET  /api/image-search/health                 - Health check")
    print("  POST /api/image-search/search                 - Upload image search")
    print("  POST /api/image-search/search/url             - URL image search")
    print("  POST /api/image-search/search/batch           - Batch image search")
    print()
    print("TensorFlow Search (ResNet50):")
    print("  GET  /api/tensorflow-search/health            - Health check")
    print("  POST /api/tensorflow-search/search            - Upload image search")
    print("  POST /api/tensorflow-search/search/url        - URL image search")
    print("  POST /api/tensorflow-search/compare           - Compare two images")
    print()
    print("Batch Search:")
    print("  GET  /api/batch-search/health                 - Health check")
    print("  POST /api/batch-search/text-search            - Batch text search")
    print("  POST /api/batch-search/product-search         - Batch product search")
    print()
    print("Alternative Models (ViT, DenseNet, EfficientNet, MobileNet):")
    print("  GET  /api/alternative-models/health           - Health check")
    print("  GET  /api/alternative-models/models           - List available models")
    print("  POST /api/alternative-models/search/<model>   - Search with specific model")
    print("  POST /api/alternative-models/compare          - Compare multiple models")
    print()
    print("Documentation:")
    print("  GET  /api/docs/endpoints                      - List all endpoints")
    print("  GET  /api/docs/models                         - List available models")
    print("  GET  /api/docs/examples                       - Usage examples")
    print("  GET  /api/docs/errors                         - Error codes")
    print("  GET  /api/docs/performance                    - Performance metrics")
    print()
    print("=" * 80)
    print()
    
    try:
        print("Server is running on http://localhost:5000")
        print("Press Ctrl+C to stop the server")
        print()
        serve(app, host='0.0.0.0', port=5000, threads=4)
    except KeyboardInterrupt:
        print("\nServer stopped.")
        sys.exit(0)
    except Exception as e:
        print(f"Error starting service: {e}")
        sys.exit(1)
