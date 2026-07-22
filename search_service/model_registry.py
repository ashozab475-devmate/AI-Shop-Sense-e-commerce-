#!/usr/bin/env python3
"""
Model Registry
Manage and switch between multiple AI models
"""

import json
import os
import logging
from datetime import datetime
from typing import Dict, List, Optional

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class ModelRegistry:
    """Registry for managing multiple models"""
    
    def __init__(self):
        self.models = {}
        self.active_model = None
        self.registry_file = 'model_registry.json'
        self.load_registry()
    
    def register_model(self, model_id: str, model_config: Dict) -> bool:
        """Register a new model"""
        try:
            if model_id in self.models:
                logger.warning(f"Model {model_id} already registered, updating...")
            
            self.models[model_id] = {
                'id': model_id,
                'name': model_config.get('name', model_id),
                'type': model_config.get('type', 'unknown'),
                'version': model_config.get('version', '1.0'),
                'status': model_config.get('status', 'active'),
                'accuracy': model_config.get('accuracy', 0.0),
                'response_time': model_config.get('response_time', 0),
                'model_size': model_config.get('model_size', 0),
                'registered_at': datetime.now().isoformat(),
                'config': model_config.get('config', {}),
                'metadata': model_config.get('metadata', {})
            }
            
            logger.info(f"Model {model_id} registered successfully")
            self.save_registry()
            return True
        except Exception as e:
            logger.error(f"Error registering model: {e}")
            return False
    
    def unregister_model(self, model_id: str) -> bool:
        """Unregister a model"""
        try:
            if model_id not in self.models:
                logger.warning(f"Model {model_id} not found")
                return False
            
            if self.active_model == model_id:
                logger.warning(f"Cannot unregister active model {model_id}")
                return False
            
            del self.models[model_id]
            logger.info(f"Model {model_id} unregistered")
            self.save_registry()
            return True
        except Exception as e:
            logger.error(f"Error unregistering model: {e}")
            return False
    
    def get_model(self, model_id: str) -> Optional[Dict]:
        """Get model configuration"""
        return self.models.get(model_id)
    
    def list_models(self) -> List[Dict]:
        """List all registered models"""
        return list(self.models.values())
    
    def list_active_models(self) -> List[Dict]:
        """List all active models"""
        return [m for m in self.models.values() if m['status'] == 'active']
    
    def set_active_model(self, model_id: str) -> bool:
        """Set active model"""
        try:
            if model_id not in self.models:
                logger.warning(f"Model {model_id} not found")
                return False
            
            if self.models[model_id]['status'] != 'active':
                logger.warning(f"Model {model_id} is not active")
                return False
            
            self.active_model = model_id
            logger.info(f"Active model set to {model_id}")
            return True
        except Exception as e:
            logger.error(f"Error setting active model: {e}")
            return False
    
    def get_active_model(self) -> Optional[Dict]:
        """Get active model"""
        if self.active_model is None:
            return None
        return self.models.get(self.active_model)
    
    def update_model_status(self, model_id: str, status: str) -> bool:
        """Update model status"""
        try:
            if model_id not in self.models:
                logger.warning(f"Model {model_id} not found")
                return False
            
            self.models[model_id]['status'] = status
            logger.info(f"Model {model_id} status updated to {status}")
            self.save_registry()
            return True
        except Exception as e:
            logger.error(f"Error updating model status: {e}")
            return False
    
    def update_model_metrics(self, model_id: str, metrics: Dict) -> bool:
        """Update model performance metrics"""
        try:
            if model_id not in self.models:
                logger.warning(f"Model {model_id} not found")
                return False
            
            if 'accuracy' in metrics:
                self.models[model_id]['accuracy'] = metrics['accuracy']
            if 'response_time' in metrics:
                self.models[model_id]['response_time'] = metrics['response_time']
            if 'model_size' in metrics:
                self.models[model_id]['model_size'] = metrics['model_size']
            
            logger.info(f"Model {model_id} metrics updated")
            self.save_registry()
            return True
        except Exception as e:
            logger.error(f"Error updating model metrics: {e}")
            return False
    
    def compare_models(self, model_ids: List[str]) -> Dict:
        """Compare multiple models"""
        try:
            comparison = {}
            for model_id in model_ids:
                if model_id in self.models:
                    model = self.models[model_id]
                    comparison[model_id] = {
                        'name': model['name'],
                        'type': model['type'],
                        'version': model['version'],
                        'accuracy': model['accuracy'],
                        'response_time': model['response_time'],
                        'model_size': model['model_size'],
                        'status': model['status']
                    }
            return comparison
        except Exception as e:
            logger.error(f"Error comparing models: {e}")
            return {}
    
    def get_best_model(self, metric: str = 'accuracy') -> Optional[Dict]:
        """Get best model by metric"""
        try:
            if not self.models:
                return None
            
            active_models = self.list_active_models()
            if not active_models:
                return None
            
            if metric == 'accuracy':
                best = max(active_models, key=lambda x: x['accuracy'])
            elif metric == 'response_time':
                best = min(active_models, key=lambda x: x['response_time'])
            elif metric == 'model_size':
                best = min(active_models, key=lambda x: x['model_size'])
            else:
                best = active_models[0]
            
            return best
        except Exception as e:
            logger.error(f"Error getting best model: {e}")
            return None
    
    def save_registry(self) -> bool:
        """Save registry to file"""
        try:
            with open(self.registry_file, 'w') as f:
                json.dump({
                    'models': self.models,
                    'active_model': self.active_model,
                    'last_updated': datetime.now().isoformat()
                }, f, indent=2)
            logger.info("Registry saved")
            return True
        except Exception as e:
            logger.error(f"Error saving registry: {e}")
            return False
    
    def load_registry(self) -> bool:
        """Load registry from file"""
        try:
            if not os.path.exists(self.registry_file):
                logger.info("Registry file not found, creating new")
                return True
            
            with open(self.registry_file, 'r') as f:
                data = json.load(f)
                self.models = data.get('models', {})
                self.active_model = data.get('active_model')
            
            logger.info(f"Registry loaded with {len(self.models)} models")
            return True
        except Exception as e:
            logger.error(f"Error loading registry: {e}")
            return False
    
    def export_registry(self, filename: str) -> bool:
        """Export registry to file"""
        try:
            with open(filename, 'w') as f:
                json.dump({
                    'models': self.models,
                    'active_model': self.active_model,
                    'exported_at': datetime.now().isoformat()
                }, f, indent=2)
            logger.info(f"Registry exported to {filename}")
            return True
        except Exception as e:
            logger.error(f"Error exporting registry: {e}")
            return False
    
    def import_registry(self, filename: str) -> bool:
        """Import registry from file"""
        try:
            with open(filename, 'r') as f:
                data = json.load(f)
                self.models = data.get('models', {})
                self.active_model = data.get('active_model')
            
            logger.info(f"Registry imported from {filename}")
            self.save_registry()
            return True
        except Exception as e:
            logger.error(f"Error importing registry: {e}")
            return False
    
    def get_registry_stats(self) -> Dict:
        """Get registry statistics"""
        try:
            total_models = len(self.models)
            active_models = len(self.list_active_models())
            inactive_models = total_models - active_models
            
            avg_accuracy = 0
            if active_models > 0:
                avg_accuracy = sum(m['accuracy'] for m in self.list_active_models()) / active_models
            
            return {
                'total_models': total_models,
                'active_models': active_models,
                'inactive_models': inactive_models,
                'average_accuracy': avg_accuracy,
                'active_model': self.active_model
            }
        except Exception as e:
            logger.error(f"Error getting registry stats: {e}")
            return {}

# Global registry instance
_registry = None

def get_registry() -> ModelRegistry:
    """Get global registry instance"""
    global _registry
    if _registry is None:
        _registry = ModelRegistry()
    return _registry

def init_registry():
    """Initialize registry"""
    registry = get_registry()
    
    # Register default models
    registry.register_model('clip_faiss', {
        'name': 'CLIP+FAISS',
        'type': 'text_search',
        'version': '1.0',
        'status': 'active',
        'accuracy': 0.9970,
        'response_time': 1,
        'model_size': 15.8,
        'config': {
            'model': 'ViT-B-32',
            'pretrained': 'openai',
            'device': 'cpu'
        }
    })
    
    registry.register_model('image_search', {
        'name': 'Image Search',
        'type': 'image_search',
        'version': '1.0',
        'status': 'active',
        'accuracy': 0.9970,
        'response_time': 1,
        'model_size': 15.8,
        'config': {
            'model': 'ViT-B-32',
            'pretrained': 'openai',
            'device': 'cpu'
        }
    })
    
    registry.register_model('tensorflow_resnet50', {
        'name': 'TensorFlow ResNet50',
        'type': 'image_search',
        'version': '1.0',
        'status': 'active',
        'accuracy': 0.85,
        'response_time': 250,
        'model_size': 100,
        'config': {
            'model': 'ResNet50',
            'pretrained': 'imagenet',
            'device': 'cpu'
        }
    })
    
    registry.set_active_model('clip_faiss')
    logger.info("Registry initialized with default models")
