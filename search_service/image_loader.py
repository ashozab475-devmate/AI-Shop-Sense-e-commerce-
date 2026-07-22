#!/usr/bin/env python3
"""
Image Loading and Preprocessing Utilities
Handles downloading, loading, caching, and preprocessing product images
"""

import os
import numpy as np
from PIL import Image
import requests
from io import BytesIO
import logging
from pathlib import Path
import hashlib

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


class ImageLoader:
    """Load, preprocess, and cache product images"""
    
    def __init__(self, cache_dir='image_cache', size=224):
        """
        Initialize ImageLoader
        
        Args:
            cache_dir: Directory to cache downloaded images
            size: Target image size (height, width)
        """
        self.cache_dir = cache_dir
        self.size = size
        os.makedirs(cache_dir, exist_ok=True)
        logger.info(f"ImageLoader initialized with cache_dir={cache_dir}, size={size}")
    
    def _get_cache_path(self, image_id):
        """Get cache file path for image"""
        return os.path.join(self.cache_dir, f"{image_id}.jpg")
    
    def _url_to_filename(self, url):
        """Convert URL to safe filename"""
        hash_obj = hashlib.md5(url.encode())
        return hash_obj.hexdigest()
    
    def download_image(self, url, image_id=None, timeout=10):
        """
        Download image from URL and cache it
        
        Args:
            url: Image URL
            image_id: Optional image ID for caching
            timeout: Request timeout in seconds
            
        Returns:
            Path to cached image or None if failed
        """
        try:
            if image_id is None:
                image_id = self._url_to_filename(url)
            
            cache_path = self._get_cache_path(image_id)
            
            # Return cached image if exists
            if os.path.exists(cache_path):
                logger.debug(f"Image {image_id} found in cache")
                return cache_path
            
            # Download image
            logger.info(f"Downloading image from {url}")
            response = requests.get(url, timeout=timeout)
            response.raise_for_status()
            
            # Open and convert image
            image = Image.open(BytesIO(response.content))
            image = image.convert('RGB')
            
            # Save to cache
            image.save(cache_path, 'JPEG', quality=95)
            logger.info(f"Image {image_id} cached at {cache_path}")
            
            return cache_path
        
        except requests.exceptions.RequestException as e:
            logger.error(f"Failed to download image from {url}: {e}")
            return None
        except Exception as e:
            logger.error(f"Error processing image from {url}: {e}")
            return None
    
    def load_image(self, image_path):
        """
        Load and preprocess image
        
        Args:
            image_path: Path to image file
            
        Returns:
            Preprocessed image as numpy array (normalized 0-1) or None if failed
        """
        try:
            if not os.path.exists(image_path):
                logger.error(f"Image file not found: {image_path}")
                return None
            
            # Load image
            image = Image.open(image_path)
            image = image.convert('RGB')
            
            # Resize
            image = image.resize((self.size, self.size), Image.Resampling.LANCZOS)
            
            # Convert to numpy array and normalize
            image_array = np.array(image, dtype=np.float32) / 255.0
            
            return image_array
        
        except Exception as e:
            logger.error(f"Error loading image {image_path}: {e}")
            return None
    
    def load_batch(self, image_paths, skip_errors=True):
        """
        Load batch of images
        
        Args:
            image_paths: List of image file paths
            skip_errors: Skip images that fail to load
            
        Returns:
            Numpy array of shape (batch_size, height, width, 3) or None if all failed
        """
        images = []
        failed_count = 0
        
        for i, path in enumerate(image_paths):
            if i % 100 == 0:
                logger.info(f"Loading batch: {i}/{len(image_paths)}")
            
            img = self.load_image(path)
            
            if img is not None:
                images.append(img)
            else:
                failed_count += 1
                if not skip_errors:
                    return None
        
        if failed_count > 0:
            logger.warning(f"Failed to load {failed_count}/{len(image_paths)} images")
        
        if not images:
            logger.error("No images loaded successfully")
            return None
        
        return np.array(images)
    
    def preprocess_image(self, image_array, normalize=True):
        """
        Preprocess image array
        
        Args:
            image_array: Numpy array of image
            normalize: Whether to normalize to 0-1 range
            
        Returns:
            Preprocessed image array
        """
        if normalize and image_array.max() > 1.0:
            image_array = image_array / 255.0
        
        return image_array
    
    def augment_image(self, image_array, rotation=0, flip_h=False, flip_v=False):
        """
        Apply data augmentation to image
        
        Args:
            image_array: Numpy array of image
            rotation: Rotation angle in degrees
            flip_h: Horizontal flip
            flip_v: Vertical flip
            
        Returns:
            Augmented image array
        """
        try:
            # Convert to PIL Image
            image = Image.fromarray((image_array * 255).astype(np.uint8))
            
            # Apply rotation
            if rotation != 0:
                image = image.rotate(rotation, expand=False)
            
            # Apply flips
            if flip_h:
                image = image.transpose(Image.Transpose.FLIP_LEFT_RIGHT)
            if flip_v:
                image = image.transpose(Image.Transpose.FLIP_TOP_BOTTOM)
            
            # Convert back to numpy
            augmented = np.array(image, dtype=np.float32) / 255.0
            
            return augmented
        
        except Exception as e:
            logger.error(f"Error augmenting image: {e}")
            return image_array
    
    def get_cache_stats(self):
        """Get cache statistics"""
        try:
            cache_files = os.listdir(self.cache_dir)
            total_size = sum(
                os.path.getsize(os.path.join(self.cache_dir, f))
                for f in cache_files
            )
            
            return {
                "cached_images": len(cache_files),
                "cache_size_mb": total_size / (1024 * 1024),
                "cache_dir": self.cache_dir
            }
        except Exception as e:
            logger.error(f"Error getting cache stats: {e}")
            return None
    
    def clear_cache(self):
        """Clear image cache"""
        try:
            for file in os.listdir(self.cache_dir):
                file_path = os.path.join(self.cache_dir, file)
                if os.path.isfile(file_path):
                    os.remove(file_path)
            logger.info("Cache cleared")
            return True
        except Exception as e:
            logger.error(f"Error clearing cache: {e}")
            return False


def download_dataset_images(df, url_column='image_url', image_id_column='image_id', 
                           cache_dir='image_cache', max_workers=4):
    """
    Download all images from dataset
    
    Args:
        df: Pandas DataFrame with image URLs
        url_column: Column name containing image URLs
        image_id_column: Column name containing image IDs
        cache_dir: Directory to cache images
        max_workers: Number of parallel download workers
        
    Returns:
        List of cached image paths
    """
    loader = ImageLoader(cache_dir=cache_dir)
    image_paths = []
    
    logger.info(f"Downloading {len(df)} images...")
    
    for idx, row in df.iterrows():
        if idx % 100 == 0:
            logger.info(f"Progress: {idx}/{len(df)}")
        
        url = row[url_column]
        image_id = row[image_id_column]
        
        path = loader.download_image(url, image_id=image_id)
        if path:
            image_paths.append(path)
    
    logger.info(f"Downloaded {len(image_paths)}/{len(df)} images")
    return image_paths


if __name__ == "__main__":
    # Example usage
    loader = ImageLoader(cache_dir='test_cache', size=224)
    
    # Test with a sample image URL
    test_url = "https://via.placeholder.com/224"
    path = loader.download_image(test_url, image_id="test_image")
    
    if path:
        img = loader.load_image(path)
        print(f"Image shape: {img.shape}")
        print(f"Image dtype: {img.dtype}")
        print(f"Image range: [{img.min():.2f}, {img.max():.2f}]")
        
        # Get cache stats
        stats = loader.get_cache_stats()
        print(f"Cache stats: {stats}")
