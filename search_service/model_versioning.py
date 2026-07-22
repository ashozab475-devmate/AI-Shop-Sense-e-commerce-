#!/usr/bin/env python3
"""
Model Versioning System
Manage model versions, rollback, and A/B testing
"""

import json
import os
import shutil
import logging
from datetime import datetime
from typing import Dict, List, Optional

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class ModelVersion:
    """Represents a model version"""
    
    def __init__(self, model_id: str, version: str, model_path: str, metadata: Dict):
        self.model_id = model_id
        self.version = version
        self.model_path = model_path
        self.metadata = metadata
        self.created_at = datetime.now().isoformat()
        self.status = 'active'
        self.performance_metrics = {}
    
    def to_dict(self) -> Dict:
        """Convert to dictionary"""
        return {
            'model_id': self.model_id,
            'version': self.version,
            'model_path': self.model_path,
            'created_at': self.created_at,
            'status': self.status,
            'metadata': self.metadata,
            'performance_metrics': self.performance_metrics
        }

class ModelVersionManager:
    """Manage model versions"""
    
    def __init__(self, versions_dir: str = 'model_versions'):
        self.versions_dir = versions_dir
        self.versions = {}
        self.active_versions = {}
        self.version_history = []
        
        os.makedirs(versions_dir, exist_ok=True)
        self.load_versions()
    
    def create_version(self, model_id: str, version: str, model_path: str, 
                      metadata: Dict) -> bool:
        """Create a new model version"""
        try:
            version_dir = os.path.join(self.versions_dir, model_id, version)
            os.makedirs(version_dir, exist_ok=True)
            
            if os.path.isfile(model_path):
                shutil.copy(model_path, version_dir)
            elif os.path.isdir(model_path):
                shutil.copytree(model_path, os.path.join(version_dir, 'model'))
            
            model_version = ModelVersion(model_id, version, version_dir, metadata)
            
            if model_id not in self.versions:
                self.versions[model_id] = {}
            
            self.versions[model_id][version] = model_version
            
            self.version_history.append({
                'action': 'create',
                'model_id': model_id,
                'version': version,
                'timestamp': datetime.now().isoformat()
            })
            
            logger.info(f"Version {version} created for model {model_id}")
            self.save_versions()
            return True
        
        except Exception as e:
            logger.error(f"Error creating version: {e}")
            return False
    
    def get_version(self, model_id: str, version: str) -> Optional[ModelVersion]:
        """Get specific model version"""
        try:
            return self.versions.get(model_id, {}).get(version)
        except Exception as e:
            logger.error(f"Error getting version: {e}")
            return None
    
    def list_versions(self, model_id: str) -> List[Dict]:
        """List all versions of a model"""
        try:
            versions = self.versions.get(model_id, {})
            return [v.to_dict() for v in versions.values()]
        except Exception as e:
            logger.error(f"Error listing versions: {e}")
            return []
    
    def set_active_version(self, model_id: str, version: str) -> bool:
        """Set active version for a model"""
        try:
            model_version = self.get_version(model_id, version)
            if model_version is None:
                logger.warning(f"Version {version} not found for model {model_id}")
                return False
            
            self.active_versions[model_id] = version
            
            self.version_history.append({
                'action': 'activate',
                'model_id': model_id,
                'version': version,
                'timestamp': datetime.now().isoformat()
            })
            
            logger.info(f"Active version for {model_id} set to {version}")
            self.save_versions()
            return True
        
        except Exception as e:
            logger.error(f"Error setting active version: {e}")
            return False
    
    def get_active_version(self, model_id: str) -> Optional[ModelVersion]:
        """Get active version of a model"""
        try:
            version = self.active_versions.get(model_id)
            if version is None:
                return None
            return self.get_version(model_id, version)
        except Exception as e:
            logger.error(f"Error getting active version: {e}")
            return None
    
    def rollback_version(self, model_id: str, version: str) -> bool:
        """Rollback to previous version"""
        try:
            model_version = self.get_version(model_id, version)
            if model_version is None:
                logger.warning(f"Version {version} not found")
                return False
            
            self.active_versions[model_id] = version
            
            self.version_history.append({
                'action': 'rollback',
                'model_id': model_id,
                'version': version,
                'timestamp': datetime.now().isoformat()
            })
            
            logger.info(f"Rolled back {model_id} to version {version}")
            self.save_versions()
            return True
        
        except Exception as e:
            logger.error(f"Error rolling back version: {e}")
            return False
    
    def delete_version(self, model_id: str, version: str) -> bool:
        """Delete a model version"""
        try:
            if self.active_versions.get(model_id) == version:
                logger.warning(f"Cannot delete active version {version}")
                return False
            
            model_version = self.get_version(model_id, version)
            if model_version is None:
                return False
            
            shutil.rmtree(model_version.model_path)
            del self.versions[model_id][version]
            
            self.version_history.append({
                'action': 'delete',
                'model_id': model_id,
                'version': version,
                'timestamp': datetime.now().isoformat()
            })
            
            logger.info(f"Version {version} deleted for model {model_id}")
            self.save_versions()
            return True
        
        except Exception as e:
            logger.error(f"Error deleting version: {e}")
            return False
    
    def update_performance_metrics(self, model_id: str, version: str, 
                                  metrics: Dict) -> bool:
        """Update performance metrics for a version"""
        try:
            model_version = self.get_version(model_id, version)
            if model_version is None:
                return False
            
            model_version.performance_metrics = metrics
            logger.info(f"Performance metrics updated for {model_id} v{version}")
            self.save_versions()
            return True
        
        except Exception as e:
            logger.error(f"Error updating metrics: {e}")
            return False
    
    def compare_versions(self, model_id: str, versions: List[str]) -> Dict:
        """Compare multiple versions"""
        try:
            comparison = {}
            for version in versions:
                model_version = self.get_version(model_id, version)
                if model_version:
                    comparison[version] = model_version.to_dict()
            return comparison
        except Exception as e:
            logger.error(f"Error comparing versions: {e}")
            return {}
    
    def get_version_history(self, model_id: Optional[str] = None) -> List[Dict]:
        """Get version history"""
        try:
            if model_id:
                return [h for h in self.version_history if h['model_id'] == model_id]
            return self.version_history
        except Exception as e:
            logger.error(f"Error getting history: {e}")
            return []
    
    def save_versions(self) -> bool:
        """Save versions to file"""
        try:
            data = {
                'versions': {},
                'active_versions': self.active_versions,
                'history': self.version_history,
                'last_updated': datetime.now().isoformat()
            }
            
            for model_id, versions in self.versions.items():
                data['versions'][model_id] = {
                    v: version.to_dict() for v, version in versions.items()
                }
            
            with open(os.path.join(self.versions_dir, 'versions.json'), 'w') as f:
                json.dump(data, f, indent=2)
            
            logger.info("Versions saved")
            return True
        
        except Exception as e:
            logger.error(f"Error saving versions: {e}")
            return False
    
    def load_versions(self) -> bool:
        """Load versions from file"""
        try:
            versions_file = os.path.join(self.versions_dir, 'versions.json')
            if not os.path.exists(versions_file):
                logger.info("No versions file found")
                return True
            
            with open(versions_file, 'r') as f:
                data = json.load(f)
            
            self.active_versions = data.get('active_versions', {})
            self.version_history = data.get('history', [])
            
            logger.info("Versions loaded")
            return True
        
        except Exception as e:
            logger.error(f"Error loading versions: {e}")
            return False

_version_manager = None

def get_version_manager() -> ModelVersionManager:
    """Get global version manager"""
    global _version_manager
    if _version_manager is None:
        _version_manager = ModelVersionManager()
    return _version_manager

def init_versioning():
    """Initialize versioning system"""
    manager = get_version_manager()
    logger.info("Model versioning system initialized")
    return manager
