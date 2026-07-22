#!/usr/bin/env python3
"""
Comprehensive Test Suite
Unit tests, integration tests, and performance tests
"""

import unittest
import requests
import json
import time
import numpy as np
from io import BytesIO
from PIL import Image
import sys

BASE_URL = "http://localhost:5000"

class TestHealthEndpoints(unittest.TestCase):
    """Test health check endpoints"""
    
    def test_visual_search_health(self):
        """Test CLIP+FAISS health endpoint"""
        response = requests.get(f"{BASE_URL}/api/visual-search/health", timeout=5)
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertIn('status', data)
        self.assertIn('model_loaded', data)
    
    def test_image_search_health(self):
        """Test image search health endpoint"""
        response = requests.get(f"{BASE_URL}/api/image-search/health", timeout=5)
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertIn('status', data)
    
    def test_tensorflow_search_health(self):
        """Test TensorFlow search health endpoint"""
        response = requests.get(f"{BASE_URL}/api/tensorflow-search/health", timeout=5)
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertIn('status', data)

class TestTextSearch(unittest.TestCase):
    """Test text search functionality"""
    
    def test_text_search_valid_query(self):
        """Test text search with valid query"""
        payload = {'query': 'laptop', 'top_k': 5}
        response = requests.post(
            f"{BASE_URL}/api/visual-search/search",
            json=payload,
            timeout=30
        )
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertEqual(data['status'], 'success')
        self.assertIn('results', data)
    
    def test_text_search_missing_query(self):
        """Test text search without query"""
        payload = {'top_k': 5}
        response = requests.post(
            f"{BASE_URL}/api/visual-search/search",
            json=payload,
            timeout=30
        )
        self.assertEqual(response.status_code, 400)
    
    def test_text_search_empty_query(self):
        """Test text search with empty query"""
        payload = {'query': '', 'top_k': 5}
        response = requests.post(
            f"{BASE_URL}/api/visual-search/search",
            json=payload,
            timeout=30
        )
        # Should either return 200 with no results or 400
        self.assertIn(response.status_code, [200, 400])
    
    def test_text_search_top_k_parameter(self):
        """Test text search with different top_k values"""
        for top_k in [1, 5, 10, 20]:
            payload = {'query': 'laptop', 'top_k': top_k}
            response = requests.post(
                f"{BASE_URL}/api/visual-search/search",
                json=payload,
                timeout=30
            )
            self.assertEqual(response.status_code, 200)
            data = response.json()
            self.assertLessEqual(len(data['results']), top_k)

class TestProductSearch(unittest.TestCase):
    """Test product search functionality"""
    
    def test_product_search_valid(self):
        """Test product search with valid data"""
        payload = {
            'product': {
                'product_name': 'Wireless Mouse',
                'category': 'electronics'
            },
            'top_k': 5
        }
        response = requests.post(
            f"{BASE_URL}/api/visual-search/search/product",
            json=payload,
            timeout=30
        )
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertEqual(data['status'], 'success')
    
    def test_product_search_missing_product(self):
        """Test product search without product data"""
        payload = {'top_k': 5}
        response = requests.post(
            f"{BASE_URL}/api/visual-search/search/product",
            json=payload,
            timeout=30
        )
        self.assertEqual(response.status_code, 400)

class TestCategorySearch(unittest.TestCase):
    """Test category search functionality"""
    
    def test_category_search_valid(self):
        """Test category search with valid data"""
        payload = {
            'query': 'gaming',
            'category': 'electronics',
            'top_k': 5
        }
        response = requests.post(
            f"{BASE_URL}/api/visual-search/search/category",
            json=payload,
            timeout=30
        )
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertEqual(data['status'], 'success')
    
    def test_category_search_missing_category(self):
        """Test category search without category"""
        payload = {'query': 'gaming', 'top_k': 5}
        response = requests.post(
            f"{BASE_URL}/api/visual-search/search/category",
            json=payload,
            timeout=30
        )
        self.assertEqual(response.status_code, 400)

class TestImageSearch(unittest.TestCase):
    """Test image search functionality"""
    
    def create_test_image(self):
        """Create a test image"""
        img = Image.new('RGB', (224, 224), color='red')
        img_bytes = BytesIO()
        img.save(img_bytes, format='PNG')
        img_bytes.seek(0)
        return img_bytes
    
    def test_image_upload_search(self):
        """Test image upload search"""
        img_bytes = self.create_test_image()
        files = {'image': ('test.png', img_bytes, 'image/png')}
        data = {'top_k': '5'}
        
        response = requests.post(
            f"{BASE_URL}/api/image-search/search",
            files=files,
            data=data,
            timeout=30
        )
        self.assertEqual(response.status_code, 200)
        result = response.json()
        self.assertEqual(result['status'], 'success')
    
    def test_image_upload_missing_file(self):
        """Test image upload without file"""
        response = requests.post(
            f"{BASE_URL}/api/image-search/search",
            timeout=30
        )
        self.assertEqual(response.status_code, 400)

class TestPerformance(unittest.TestCase):
    """Test performance metrics"""
    
    def test_text_search_response_time(self):
        """Test text search response time"""
        payload = {'query': 'laptop', 'top_k': 5}
        
        start = time.time()
        response = requests.post(
            f"{BASE_URL}/api/visual-search/search",
            json=payload,
            timeout=30
        )
        elapsed = time.time() - start
        
        self.assertEqual(response.status_code, 200)
        # Should respond within 2 seconds (after model loads)
        self.assertLess(elapsed, 2.0)
    
    def test_multiple_requests(self):
        """Test multiple concurrent requests"""
        payload = {'query': 'laptop', 'top_k': 5}
        
        start = time.time()
        for _ in range(5):
            response = requests.post(
                f"{BASE_URL}/api/visual-search/search",
                json=payload,
                timeout=30
            )
            self.assertEqual(response.status_code, 200)
        elapsed = time.time() - start
        
        # 5 requests should complete within 10 seconds
        self.assertLess(elapsed, 10.0)

class TestErrorHandling(unittest.TestCase):
    """Test error handling"""
    
    def test_invalid_json(self):
        """Test invalid JSON request"""
        response = requests.post(
            f"{BASE_URL}/api/visual-search/search",
            data="invalid json",
            headers={'Content-Type': 'application/json'},
            timeout=30
        )
        self.assertIn(response.status_code, [400, 500])
    
    def test_missing_endpoint(self):
        """Test missing endpoint"""
        response = requests.get(
            f"{BASE_URL}/api/nonexistent",
            timeout=5
        )
        self.assertEqual(response.status_code, 404)
    
    def test_invalid_method(self):
        """Test invalid HTTP method"""
        response = requests.get(
            f"{BASE_URL}/api/visual-search/search",
            timeout=5
        )
        self.assertIn(response.status_code, [405, 400])

class TestResponseFormat(unittest.TestCase):
    """Test response format"""
    
    def test_text_search_response_format(self):
        """Test text search response format"""
        payload = {'query': 'laptop', 'top_k': 5}
        response = requests.post(
            f"{BASE_URL}/api/visual-search/search",
            json=payload,
            timeout=30
        )
        
        self.assertEqual(response.status_code, 200)
        data = response.json()
        
        # Check required fields
        self.assertIn('status', data)
        self.assertIn('query', data)
        self.assertIn('results_count', data)
        self.assertIn('products', data)
        
        # Check product format
        if data['products']:
            product = data['products'][0]
            self.assertIn('product_id', product)
            self.assertIn('product_name', product)
            self.assertIn('similarity_score', product)

def run_tests():
    """Run all tests"""
    loader = unittest.TestLoader()
    suite = unittest.TestSuite()
    
    # Add all test classes
    suite.addTests(loader.loadTestsFromTestCase(TestHealthEndpoints))
    suite.addTests(loader.loadTestsFromTestCase(TestTextSearch))
    suite.addTests(loader.loadTestsFromTestCase(TestProductSearch))
    suite.addTests(loader.loadTestsFromTestCase(TestCategorySearch))
    suite.addTests(loader.loadTestsFromTestCase(TestImageSearch))
    suite.addTests(loader.loadTestsFromTestCase(TestPerformance))
    suite.addTests(loader.loadTestsFromTestCase(TestErrorHandling))
    suite.addTests(loader.loadTestsFromTestCase(TestResponseFormat))
    
    runner = unittest.TextTestRunner(verbosity=2)
    result = runner.run(suite)
    
    return 0 if result.wasSuccessful() else 1

if __name__ == '__main__':
    sys.exit(run_tests())
