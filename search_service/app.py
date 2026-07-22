#!/usr/bin/env python3
"""
ShopSense - AI Search Service (Alternative Entry Point)
This is a fallback entry point for the search service
"""

from start_server import app

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=False)
