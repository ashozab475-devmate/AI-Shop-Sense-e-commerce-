#!/usr/bin/env python3
"""
Test script for Visual Search API endpoints
"""

import requests
import json
import time
import sys

BASE_URL = "http://localhost:5000"
VISUAL_SEARCH_URL = f"{BASE_URL}/api/visual-search"

def test_health():
    """Test health endpoint"""
    print("\n" + "="*60)
    print("TEST 1: Health Check")
    print("="*60)
    try:
        response = requests.get(f"{VISUAL_SEARCH_URL}/health", timeout=5)
        print(f"Status: {response.status_code}")
        print(f"Response: {json.dumps(response.json(), indent=2)}")
        return response.status_code == 200
    except Exception as e:
        print(f"Error: {e}")
        return False

def test_text_search():
    """Test text search endpoint"""
    print("\n" + "="*60)
    print("TEST 2: Text Search")
    print("="*60)
    try:
        payload = {
            "query": "laptop computer",
            "top_k": 5
        }
        response = requests.post(f"{VISUAL_SEARCH_URL}/search", json=payload, timeout=30)
        print(f"Status: {response.status_code}")
        print(f"Response: {json.dumps(response.json(), indent=2)}")
        return response.status_code == 200
    except Exception as e:
        print(f"Error: {e}")
        return False

def test_product_search():
    """Test product search endpoint"""
    print("\n" + "="*60)
    print("TEST 3: Product Search")
    print("="*60)
    try:
        payload = {
            "product": {
                "product_name": "Wireless Mouse",
                "category": "electronics",
                "description": "Ergonomic wireless mouse",
                "brand": "Logitech"
            },
            "top_k": 5
        }
        response = requests.post(f"{VISUAL_SEARCH_URL}/search/product", json=payload, timeout=30)
        print(f"Status: {response.status_code}")
        print(f"Response: {json.dumps(response.json(), indent=2)}")
        return response.status_code == 200
    except Exception as e:
        print(f"Error: {e}")
        return False

def test_category_search():
    """Test category search endpoint"""
    print("\n" + "="*60)
    print("TEST 4: Category Search")
    print("="*60)
    try:
        payload = {
            "query": "gaming",
            "category": "electronics",
            "top_k": 5
        }
        response = requests.post(f"{VISUAL_SEARCH_URL}/search/category", json=payload, timeout=30)
        print(f"Status: {response.status_code}")
        print(f"Response: {json.dumps(response.json(), indent=2)}")
        return response.status_code == 200
    except Exception as e:
        print(f"Error: {e}")
        return False

def main():
    print("\n" + "="*60)
    print("Visual Search API - Endpoint Testing")
    print("="*60)
    print(f"Base URL: {BASE_URL}")
    print(f"Visual Search URL: {VISUAL_SEARCH_URL}")
    
    # Wait for server to be ready
    print("\nWaiting for server to be ready...")
    for i in range(30):
        try:
            requests.get(f"{BASE_URL}/", timeout=2)
            print("✓ Server is ready!")
            break
        except:
            print(f"  Attempt {i+1}/30 - Server not ready yet...")
            time.sleep(1)
    else:
        print("✗ Server failed to start")
        return
    
    # Run tests
    results = []
    results.append(("Health Check", test_health()))
    
    # Wait for model to load
    print("\nWaiting for model to load (this may take a few minutes on first run)...")
    for i in range(120):
        try:
            response = requests.get(f"{VISUAL_SEARCH_URL}/health", timeout=5)
            data = response.json()
            if data.get("ready"):
                print("✓ Model loaded and ready!")
                break
            else:
                print(f"  Model loading... ({i+1}/120)")
                time.sleep(1)
        except:
            print(f"  Waiting for model... ({i+1}/120)")
            time.sleep(1)
    
    results.append(("Text Search", test_text_search()))
    results.append(("Product Search", test_product_search()))
    results.append(("Category Search", test_category_search()))
    
    # Summary
    print("\n" + "="*60)
    print("TEST SUMMARY")
    print("="*60)
    for test_name, passed in results:
        status = "✓ PASSED" if passed else "✗ FAILED"
        print(f"{test_name}: {status}")
    
    passed_count = sum(1 for _, p in results if p)
    total_count = len(results)
    print(f"\nTotal: {passed_count}/{total_count} tests passed")
    
    if passed_count == total_count:
        print("\n✓ All tests passed! Visual search API is working correctly.")
        sys.exit(0)
    else:
        print(f"\n✗ {total_count - passed_count} test(s) failed.")
        sys.exit(1)

if __name__ == "__main__":
    main()
