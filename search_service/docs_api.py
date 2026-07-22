#!/usr/bin/env python3
"""
Documentation API
Serve API documentation and help endpoints
"""

from flask import Blueprint, jsonify
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

docs_bp = Blueprint('docs', __name__, url_prefix='/api/docs')

@docs_bp.route('/endpoints', methods=['GET'])
def get_endpoints():
    """Get all available endpoints"""
    endpoints = {
        "visual_search": {
            "description": "CLIP+FAISS text-based visual search",
            "endpoints": [
                {
                    "method": "GET",
                    "path": "/api/visual-search/health",
                    "description": "Health check"
                },
                {
                    "method": "POST",
                    "path": "/api/visual-search/search",
                    "description": "Text search",
                    "parameters": {
                        "query": "string (required)",
                        "top_k": "integer (optional, default: 10)"
                    }
                },
                {
                    "method": "POST",
                    "path": "/api/visual-search/search/product",
                    "description": "Product search",
                    "parameters": {
                        "product": "object (required)",
                        "top_k": "integer (optional)"
                    }
                },
                {
                    "method": "POST",
                    "path": "/api/visual-search/search/category",
                    "description": "Category search",
                    "parameters": {
                        "query": "string (required)",
                        "category": "string (required)",
                        "top_k": "integer (optional)"
                    }
                }
            ]
        },
        "image_search": {
            "description": "Image-based visual search using CLIP+FAISS",
            "endpoints": [
                {
                    "method": "GET",
                    "path": "/api/image-search/health",
                    "description": "Health check"
                },
                {
                    "method": "POST",
                    "path": "/api/image-search/search",
                    "description": "Upload image search",
                    "parameters": {
                        "image": "file (required)",
                        "top_k": "integer (optional)"
                    }
                },
                {
                    "method": "POST",
                    "path": "/api/image-search/search/url",
                    "description": "URL-based image search",
                    "parameters": {
                        "image_url": "string (required)",
                        "top_k": "integer (optional)"
                    }
                },
                {
                    "method": "POST",
                    "path": "/api/image-search/search/batch",
                    "description": "Batch image search",
                    "parameters": {
                        "images": "files (required)",
                        "top_k": "integer (optional)"
                    }
                }
            ]
        },
        "tensorflow_search": {
            "description": "TensorFlow/ResNet50 image search",
            "endpoints": [
                {
                    "method": "GET",
                    "path": "/api/tensorflow-search/health",
                    "description": "Health check"
                },
                {
                    "method": "POST",
                    "path": "/api/tensorflow-search/search",
                    "description": "Upload image search",
                    "parameters": {
                        "image": "file (required)",
                        "top_k": "integer (optional)"
                    }
                },
                {
                    "method": "POST",
                    "path": "/api/tensorflow-search/search/url",
                    "description": "URL-based image search",
                    "parameters": {
                        "image_url": "string (required)",
                        "top_k": "integer (optional)"
                    }
                },
                {
                    "method": "POST",
                    "path": "/api/tensorflow-search/compare",
                    "description": "Compare two images",
                    "parameters": {
                        "image1": "file (required)",
                        "image2": "file (required)"
                    }
                }
            ]
        },
        "batch_search": {
            "description": "Batch processing for multiple queries",
            "endpoints": [
                {
                    "method": "GET",
                    "path": "/api/batch-search/health",
                    "description": "Health check"
                },
                {
                    "method": "POST",
                    "path": "/api/batch-search/text-search",
                    "description": "Batch text search",
                    "parameters": {
                        "queries": "array of objects (required)",
                        "top_k": "integer (optional)"
                    }
                },
                {
                    "method": "POST",
                    "path": "/api/batch-search/product-search",
                    "description": "Batch product search",
                    "parameters": {
                        "products": "array of objects (required)",
                        "top_k": "integer (optional)"
                    }
                }
            ]
        }
    }
    
    return jsonify(endpoints), 200

@docs_bp.route('/models', methods=['GET'])
def get_models():
    """Get available models"""
    models = {
        "models": [
            {
                "id": "clip_faiss",
                "name": "CLIP+FAISS",
                "type": "text_search",
                "accuracy": 0.9970,
                "response_time": "< 1ms",
                "description": "Fast text-based visual search with 99.70% accuracy"
            },
            {
                "id": "image_search",
                "name": "Image Search",
                "type": "image_search",
                "accuracy": 0.9970,
                "response_time": "< 1ms",
                "description": "Image-based search using CLIP embeddings"
            },
            {
                "id": "tensorflow_resnet50",
                "name": "TensorFlow ResNet50",
                "type": "image_search",
                "accuracy": 0.85,
                "response_time": "100-500ms",
                "description": "Deep learning-based image search"
            }
        ]
    }
    
    return jsonify(models), 200

@docs_bp.route('/examples', methods=['GET'])
def get_examples():
    """Get usage examples"""
    examples = {
        "text_search": {
            "description": "Search products by text query",
            "request": {
                "method": "POST",
                "url": "http://localhost:5000/api/visual-search/search",
                "headers": {"Content-Type": "application/json"},
                "body": {
                    "query": "laptop computer",
                    "top_k": 5
                }
            },
            "response": {
                "status": "success",
                "query": "laptop computer",
                "results_count": 5,
                "products": [
                    {
                        "product_id": "123",
                        "product_name": "Dell XPS 13",
                        "category": "electronics",
                        "similarity_score": 0.95
                    }
                ]
            }
        },
        "image_search": {
            "description": "Search products by image",
            "request": {
                "method": "POST",
                "url": "http://localhost:5000/api/image-search/search",
                "headers": {"Content-Type": "multipart/form-data"},
                "body": {
                    "image": "file",
                    "top_k": 5
                }
            },
            "response": {
                "status": "success",
                "filename": "product.jpg",
                "results_count": 5,
                "products": []
            }
        },
        "batch_search": {
            "description": "Search multiple queries at once",
            "request": {
                "method": "POST",
                "url": "http://localhost:5000/api/batch-search/text-search",
                "headers": {"Content-Type": "application/json"},
                "body": {
                    "queries": [
                        {"query": "laptop", "top_k": 5},
                        {"query": "mouse", "top_k": 5}
                    ]
                }
            },
            "response": {
                "status": "success",
                "batch_count": 2,
                "processed": 2,
                "elapsed_time": 0.5,
                "results": []
            }
        }
    }
    
    return jsonify(examples), 200

@docs_bp.route('/errors', methods=['GET'])
def get_errors():
    """Get error codes and descriptions"""
    errors = {
        "400": {
            "description": "Bad Request",
            "causes": [
                "Missing required parameters",
                "Invalid parameter format",
                "Empty query or file"
            ]
        },
        "404": {
            "description": "Not Found",
            "causes": [
                "Endpoint does not exist",
                "Resource not found"
            ]
        },
        "405": {
            "description": "Method Not Allowed",
            "causes": [
                "Wrong HTTP method (GET instead of POST, etc.)"
            ]
        },
        "500": {
            "description": "Internal Server Error",
            "causes": [
                "Model inference failed",
                "Database error",
                "Unexpected server error"
            ]
        },
        "503": {
            "description": "Service Unavailable",
            "causes": [
                "Model not loaded yet",
                "Server starting up",
                "Model loading in progress"
            ]
        }
    }
    
    return jsonify(errors), 200

@docs_bp.route('/performance', methods=['GET'])
def get_performance():
    """Get performance metrics"""
    performance = {
        "models": {
            "clip_faiss": {
                "accuracy": {
                    "top_1": 0.9970,
                    "top_5": 1.0
                },
                "response_time": "< 1ms",
                "model_size": "15.8 MB",
                "training_samples": 3810,
                "index_size": 3810
            },
            "tensorflow_resnet50": {
                "accuracy": 0.85,
                "response_time": "100-500ms",
                "model_size": "~100 MB",
                "training_samples": 3810,
                "feature_dimension": 256
            }
        },
        "server": {
            "startup_time": "< 1 second",
            "model_load_time": "5-10 minutes (first time)",
            "max_concurrent_requests": 4,
            "batch_processing": {
                "max_queries": 100,
                "max_images": 100
            }
        }
    }
    
    return jsonify(performance), 200

@docs_bp.route('/health', methods=['GET'])
def health():
    """Documentation API health check"""
    return jsonify({
        "status": "online",
        "service": "Documentation API",
        "version": "1.0"
    }), 200

def init_docs():
    """Initialize documentation API"""
    logger.info("Documentation API initialized")
