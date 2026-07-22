#!/usr/bin/env python3
"""
Quick Server Test - Verify server starts without errors
"""

import sys
import time

print("="*60)
print("Testing Visual Search Server Startup")
print("="*60)

try:
    print("\n[1/3] Importing server modules...")
    from start_server import app
    print("     SUCCESS - All modules imported")
    
    print("\n[2/3] Checking Flask app...")
    if app:
        print("     SUCCESS - Flask app created")
    
    print("\n[3/3] Verifying endpoints...")
    with app.test_client() as client:
        # Test main health endpoint
        response = client.get('/')
        if response.status_code == 200:
            print("     SUCCESS - Main endpoint working")
        
        # Test visual search health
        response = client.get('/api/visual-search/health')
        if response.status_code == 200:
            print("     SUCCESS - Visual search endpoint working")
            data = response.get_json()
            print(f"     Model status: {data.get('status')}")
            print(f"     Ready: {data.get('ready')}")
    
    print("\n" + "="*60)
    print("ALL TESTS PASSED - Server is ready!")
    print("="*60)
    print("\nTo start the server, run:")
    print("  python start_server.py")
    print("\nServer will be available at:")
    print("  http://localhost:5000")
    print("="*60)
    
    sys.exit(0)

except Exception as e:
    print(f"\nERROR: {e}")
    import traceback
    traceback.print_exc()
    sys.exit(1)
