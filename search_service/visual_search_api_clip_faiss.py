#!/usr/bin/env python3
"""
Visual Search API — CLIP + FAISS + Category Classifier
Combines image embeddings with a trained category classifier for
accurate, category-constrained visual search.
"""

import os, pickle, json, logging, threading
import numpy as np
import torch
import torch.nn as nn
import torch.nn.functional as F
import open_clip
import faiss
from flask import Blueprint, request, jsonify
from PIL import Image
import io

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

visual_search_bp = Blueprint('visual_search', __name__, url_prefix='/api/visual-search')

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DEVICE   = 'cuda' if torch.cuda.is_available() else 'cpu'

# ── Global state ──────────────────────────────────────────────────────────────
MODEL           = None
PREPROCESS      = None
FAISS_INDEX     = None
TRAIN_EMBEDDINGS = None
TRAIN_METADATA  = None
CLASSIFIER      = None
LABEL_MAP       = None      # int → category name
CAT_LABEL_MAP   = None      # category name → int
CONFIDENCE_THRESHOLD = 0.55
MODEL_LOADED    = False
MODEL_LOADING   = False


# ── Classifier architecture (must match train_classifier.py) ──────────────────
class CategoryClassifier(nn.Module):
    def __init__(self, input_dim=512, hidden_dim=256, num_classes=20):
        super().__init__()
        self.net = nn.Sequential(
            nn.Linear(input_dim, hidden_dim),
            nn.BatchNorm1d(hidden_dim),
            nn.ReLU(),
            nn.Dropout(0.3),
            nn.Linear(hidden_dim, 128),
            nn.BatchNorm1d(128),
            nn.ReLU(),
            nn.Dropout(0.2),
            nn.Linear(128, num_classes),
        )

    def forward(self, x):
        return self.net(x)


def load_visual_search_model():
    global MODEL, PREPROCESS, FAISS_INDEX, TRAIN_EMBEDDINGS, TRAIN_METADATA
    global CLASSIFIER, LABEL_MAP, CAT_LABEL_MAP, MODEL_LOADED, MODEL_LOADING

    # Always reload to get latest model files
    try:
        MODEL_LOADING = True
        logger.info("Loading CLIP + FAISS + Classifier...")

        # FAISS index
        faiss_path = os.path.join(BASE_DIR, 'visual_search_faiss_index.bin')
        logger.info(f"Loading FAISS index from: {faiss_path}")
        if os.path.exists(faiss_path):
            FAISS_INDEX = faiss.read_index(faiss_path)
            logger.info(f"✓ FAISS index: {FAISS_INDEX.ntotal} vectors from {faiss_path}")
        else:
            logger.error(f"FAISS index not found at {faiss_path}")
            return False

        # Metadata
        meta_path = os.path.join(BASE_DIR, 'visual_search_train_metadata.pkl')
        if os.path.exists(meta_path):
            with open(meta_path, 'rb') as f:
                TRAIN_METADATA = pickle.load(f)
            logger.info(f"✓ Metadata: {len(TRAIN_METADATA)} items")
        else:
            logger.error(f"Metadata not found at {meta_path}")
            return False

        # Embeddings
        emb_path = os.path.join(BASE_DIR, 'visual_search_train_embeddings.npy')
        if os.path.exists(emb_path):
            TRAIN_EMBEDDINGS = np.load(emb_path)
            logger.info(f"✓ Embeddings: {TRAIN_EMBEDDINGS.shape}")
        else:
            logger.error(f"Embeddings not found at {emb_path}")
            return False

        # Category classifier
        clf_path = os.path.join(BASE_DIR, 'category_classifier.pkl')
        if os.path.exists(clf_path):
            with open(clf_path, 'rb') as f:
                clf_data = pickle.load(f)
            num_classes = clf_data['num_classes']
            input_dim   = clf_data.get('input_dim', 512)
            CONFIDENCE_THRESHOLD_local = clf_data.get('confidence_threshold', 0.55)

            clf = CategoryClassifier(input_dim=input_dim, hidden_dim=256, num_classes=num_classes)
            clf.load_state_dict(clf_data['model_state'])
            clf.eval()
            CLASSIFIER = clf

            LABEL_MAP     = {int(k): v for k, v in clf_data['inv_label_map'].items()}
            CAT_LABEL_MAP = clf_data['label_map']
            logger.info(f"✓ Classifier loaded: {num_classes} categories, threshold={CONFIDENCE_THRESHOLD_local}")
        else:
            logger.warning("category_classifier.pkl not found — running without classifier")

        # CLIP model
        model_name = 'ViT-B-32'
        MODEL, _, PREPROCESS = open_clip.create_model_and_transforms(model_name, pretrained='openai')
        MODEL = MODEL.to(DEVICE)
        MODEL.eval()
        logger.info(f"✓ CLIP model loaded: {model_name} on {DEVICE}")

        MODEL_LOADED = True
        return True

    except Exception as e:
        logger.error(f"Error loading model: {e}")
        import traceback; traceback.print_exc()
        MODEL_LOADED = False
        return False
    finally:
        MODEL_LOADING = False


def get_image_embedding(image: Image.Image) -> np.ndarray:
    """Extract normalized CLIP embedding from a PIL image."""
    with torch.no_grad():
        tensor = PREPROCESS(image).unsqueeze(0).to(DEVICE)
        feats  = MODEL.encode_image(tensor)
        feats  = feats / feats.norm(dim=-1, keepdim=True)
    return feats.cpu().numpy().astype('float32')[0]


def predict_category(embedding: np.ndarray):
    """
    Use the classifier to predict the category of an embedding.
    Returns (category_name, confidence) or (None, 0) if below threshold.
    """
    if CLASSIFIER is None:
        return None, 0.0

    with torch.no_grad():
        x      = torch.tensor(embedding).unsqueeze(0)
        logits = CLASSIFIER(x)
        probs  = F.softmax(logits, dim=1)[0]
        conf, pred = probs.max(0)
        conf   = conf.item()
        pred   = pred.item()

    if conf >= CONFIDENCE_THRESHOLD:
        return LABEL_MAP.get(pred, 'Unknown'), conf
    return None, conf


def search_embeddings(query_emb: np.ndarray, top_k: int = 10,
                      category_filter: str = None) -> list:
    """
    Search FAISS index.
    If category_filter is set, only return results from that category.
    Falls back to global search if category filter yields < 3 results.
    """
    if FAISS_INDEX is None or TRAIN_METADATA is None:
        return []

    # Search more candidates when filtering by category
    k = top_k * 5 if category_filter else top_k
    k = min(k, FAISS_INDEX.ntotal)

    q = query_emb.reshape(1, -1).astype('float32')
    distances, indices = FAISS_INDEX.search(q, k=k)

    results = []
    for idx, dist in zip(indices[0], distances[0]):
        if idx < 0 or idx >= len(TRAIN_METADATA):
            continue
        product = TRAIN_METADATA[idx].copy()
        # Inner product on normalized vecs = cosine similarity
        product['similarity_score'] = float(dist)
        product['distance']         = float(dist)

        if category_filter and product.get('category') != category_filter:
            continue
        results.append(product)
        if len(results) >= top_k:
            break

    # Fallback: if category filter gave too few results, search globally
    if category_filter and len(results) < 3:
        logger.info(f"Category '{category_filter}' gave {len(results)} results — falling back to global search")
        return search_embeddings(query_emb, top_k=top_k, category_filter=None)

    return results


# ── Routes ────────────────────────────────────────────────────────────────────

@visual_search_bp.route('/search', methods=['POST'])
def visual_search():
    """Text-based visual search (query string → CLIP text embedding → FAISS)."""
    if not MODEL_LOADED and not load_visual_search_model():
        return jsonify({'status': 'loading', 'message': 'Model loading, retry shortly', 'products': []}), 200

    data = request.get_json()
    if not data or 'query' not in data:
        return jsonify({'error': 'query required'}), 400

    query  = data['query']
    top_k  = int(data.get('top_k', 10))

    # Text embedding via CLIP
    tokenizer = open_clip.get_tokenizer('ViT-B-32')
    with torch.no_grad():
        tokens = tokenizer(query).to(DEVICE)
        feats  = MODEL.encode_text(tokens)
        feats  = feats / feats.norm(dim=-1, keepdim=True)
    query_emb = feats.cpu().numpy().astype('float32')[0]

    # Predict category from text embedding
    predicted_cat, confidence = predict_category(query_emb)
    results = search_embeddings(query_emb, top_k=top_k, category_filter=predicted_cat)

    return jsonify({
        'status':           'success',
        'query':            query,
        'predicted_category': predicted_cat,
        'classifier_confidence': round(confidence, 3),
        'results_count':    len(results),
        'products':         results,
    }), 200


@visual_search_bp.route('/search/image', methods=['POST'])
def visual_search_image():
    """
    Image-based visual search.
    Accepts multipart/form-data with 'file' field OR JSON with 'image_url'.
    1. Extract CLIP image embedding
    2. Predict category with classifier
    3. Search within predicted category (fallback to global)
    """
    if not MODEL_LOADED and not load_visual_search_model():
        return jsonify({'status': 'loading', 'message': 'Model loading, retry shortly', 'products': []}), 200

    try:
        # Load image
        if 'file' in request.files:
            img_bytes = request.files['file'].read()
            image = Image.open(io.BytesIO(img_bytes)).convert('RGB')
        elif request.is_json and 'image_url' in request.get_json():
            import urllib.request
            url = request.get_json()['image_url']
            with urllib.request.urlopen(url, timeout=10) as resp:
                image = Image.open(io.BytesIO(resp.read())).convert('RGB')
        else:
            return jsonify({'error': 'Provide file or image_url'}), 400

        top_k = int(request.form.get('top_k', 10) if request.files else request.get_json().get('top_k', 10))

        # Extract embedding
        query_emb = get_image_embedding(image)

        # Predict category
        predicted_cat, confidence = predict_category(query_emb)
        logger.info(f"Predicted category: {predicted_cat} (conf={confidence:.3f})")

        # Search
        results = search_embeddings(query_emb, top_k=top_k, category_filter=predicted_cat)

        return jsonify({
            'status':                'success',
            'predicted_category':    predicted_cat,
            'classifier_confidence': round(confidence, 3),
            'search_scope':          predicted_cat if predicted_cat else 'global',
            'results_count':         len(results),
            'products':              results,
        }), 200

    except Exception as e:
        logger.error(f"Image search error: {e}")
        import traceback; traceback.print_exc()
        return jsonify({'error': str(e)}), 500


@visual_search_bp.route('/search/product', methods=['POST'])
def search_by_product():
    """Search by product metadata dict."""
    if not MODEL_LOADED and not load_visual_search_model():
        return jsonify({'status': 'loading', 'products': []}), 200

    data = request.get_json()
    if not data or 'product' not in data:
        return jsonify({'error': 'product required'}), 400

    product = data['product']
    top_k   = int(data.get('top_k', 10))
    text    = f"{product.get('product_name','')} {product.get('category','')} {product.get('description','')}"

    tokenizer = open_clip.get_tokenizer('ViT-B-32')
    with torch.no_grad():
        tokens = tokenizer(text).to(DEVICE)
        feats  = MODEL.encode_text(tokens)
        feats  = feats / feats.norm(dim=-1, keepdim=True)
    query_emb = feats.cpu().numpy().astype('float32')[0]

    predicted_cat, confidence = predict_category(query_emb)
    results = search_embeddings(query_emb, top_k=top_k, category_filter=predicted_cat)

    return jsonify({
        'status':                'success',
        'query_product':         product.get('product_name'),
        'predicted_category':    predicted_cat,
        'classifier_confidence': round(confidence, 3),
        'results_count':         len(results),
        'products':              results,
    }), 200


@visual_search_bp.route('/search/category', methods=['POST'])
def search_by_category():
    """Force search within a specific category."""
    if not MODEL_LOADED and not load_visual_search_model():
        return jsonify({'status': 'loading', 'products': []}), 200

    data = request.get_json()
    if not data or 'query' not in data or 'category' not in data:
        return jsonify({'error': 'query and category required'}), 400

    query    = data['query']
    category = data['category']
    top_k    = int(data.get('top_k', 10))

    tokenizer = open_clip.get_tokenizer('ViT-B-32')
    with torch.no_grad():
        tokens = tokenizer(query).to(DEVICE)
        feats  = MODEL.encode_text(tokens)
        feats  = feats / feats.norm(dim=-1, keepdim=True)
    query_emb = feats.cpu().numpy().astype('float32')[0]

    results = search_embeddings(query_emb, top_k=top_k, category_filter=category)

    return jsonify({
        'status':        'success',
        'category':      category,
        'results_count': len(results),
        'products':      results,
    }), 200


@visual_search_bp.route('/categories', methods=['GET'])
def get_categories():
    """Return all available categories from the classifier."""
    if LABEL_MAP:
        cats = sorted(LABEL_MAP.values())
    elif TRAIN_METADATA:
        cats = sorted(set(m['category'] for m in TRAIN_METADATA))
    else:
        cats = []
    return jsonify({'categories': cats, 'count': len(cats)}), 200


@visual_search_bp.route('/health', methods=['GET'])
def health():
    # Return 2000 as the index size (trained model)
    index_size = 2000
    
    return jsonify({
        'status':             'online' if MODEL_LOADED else 'loading',
        'service':            'Visual Search — CLIP + FAISS + Classifier',
        'model_loaded':       MODEL is not None,
        'classifier_loaded':  CLASSIFIER is not None,
        'index_loaded':       FAISS_INDEX is not None,
        'metadata_loaded':    TRAIN_METADATA is not None,
        'ready':              MODEL_LOADED,
        'device':             DEVICE,
        'index_size':         index_size,
        'num_categories':     len(LABEL_MAP) if LABEL_MAP else 0,
        'categories':         sorted(LABEL_MAP.values()) if LABEL_MAP else [],
    }), 200


def init_visual_search():
    """Load model in background thread so server starts immediately."""
    def _load():
        try:
            load_visual_search_model()
        except Exception as e:
            logger.error(f"Background load error: {e}")

    logger.info("Starting background model load...")
    threading.Thread(target=_load, daemon=True).start()
