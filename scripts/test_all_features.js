// test_all_features.js
// This script runs a comprehensive test of all core backend functionalities:
// 1. Database Connectivity & Seeding Status
// 2. Dynamic Pricing Engine Calculation
// 3. Visual Search Service Connectivity & Accuracy (via API)

const { PrismaClient } = require('@prisma/client');
const { calculatePrice } = require('../lib/pricingEngine');
const http = require('http');

const prisma = new PrismaClient();

// Helper to make HTTP POST requests to the local search service
function postJSON(url, data) {
    return new Promise((resolve, reject) => {
        const urlObj = new URL(url);
        const options = {
            hostname: urlObj.hostname,
            port: urlObj.port,
            path: urlObj.pathname,
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            }
        };

        const req = http.request(options, (res) => {
            let body = '';
            res.on('data', (chunk) => body += chunk);
            res.on('end', () => {
                try {
                    resolve({ status: res.statusCode, data: JSON.parse(body) });
                } catch (e) {
                    resolve({ status: res.statusCode, data: body });
                }
            });
        });

        req.on('error', (e) => reject(e));
        req.write(JSON.stringify(data));
        req.end();
    });
}

const fs = require('fs');
const path = require('path');

// Helper to make HTTP POST request with multipart/form-data for image upload
function postMultipart(url, filePath, fieldName = 'image') {
    return new Promise((resolve, reject) => {
        const boundary = '----WebKitFormBoundary7MA4YWxkTrZu0gW';
        const urlObj = new URL(url);
        const options = {
            hostname: urlObj.hostname,
            port: urlObj.port,
            path: urlObj.pathname,
            method: 'POST',
            headers: {
                'Content-Type': `multipart/form-data; boundary=${boundary}`
            }
        };

        const req = http.request(options, (res) => {
            let body = '';
            res.on('data', (chunk) => body += chunk);
            res.on('end', () => {
                try {
                    resolve({ status: res.statusCode, data: JSON.parse(body) });
                } catch (e) {
                    resolve({ status: res.statusCode, data: body });
                }
            });
        });

        req.on('error', (e) => reject(e));

        try {
            const fileName = path.basename(filePath);
            const fileData = fs.readFileSync(filePath);
            
            req.write(`--${boundary}\r\n`);
            req.write(`Content-Disposition: form-data; name="${fieldName}"; filename="${fileName}"\r\n`);
            req.write('Content-Type: image/jpeg\r\n\r\n');
            req.write(fileData);
            req.write(`\r\n--${boundary}--\r\n`);
            req.end();
        } catch (e) {
            reject(e);
        }
    });
}

// Helper to make HTTP GET requests
function getJSON(url) {
    return new Promise((resolve, reject) => {
        const req = http.get(url, (res) => {
            let body = '';
            res.on('data', (chunk) => body += chunk);
            res.on('end', () => {
                try {
                    resolve({ status: res.statusCode, data: JSON.parse(body) });
                } catch (e) {
                    resolve({ status: res.statusCode, data: body });
                }
            });
        });
        req.on('error', (e) => reject(e));
    });
}

async function runTests() {
    console.log('==================================================');
    console.log('        ShopSense Comprehensive Test Suite        ');
    console.log('==================================================\n');

    let dbPassed = false;
    let pricingPassed = false;
    let searchPassed = false;

    // ---------------------------------------------------------
    // TEST 1: Database Integrity
    // ---------------------------------------------------------
    console.log('📝 TEST 1: Checking Database Integrity...');
    try {
        const productCount = await prisma.product.count();
        const competitorCount = await prisma.competitorPrice.count();
        const config = await prisma.pricingConfig.findFirst();

        console.log(`  - Products found: ${productCount}`);
        console.log(`  - Competitor Prices found: ${competitorCount}`);
        console.log(`  - Pricing Config found: ${config ? 'Yes' : 'No'}`);

        if (productCount > 0 && competitorCount > 0 && config) {
            console.log('  ✅ Database Integrity: PASSED\n');
            dbPassed = true;
        } else {
            console.log('  ❌ Database Integrity: FAILED (Missing seeded data)\n');
        }
    } catch (e) {
        console.log('  ❌ Database Integrity: FAILED Error:', e.message, '\n');
    }

    // ---------------------------------------------------------
    // TEST 2: Dynamic Pricing Engine
    // ---------------------------------------------------------
    console.log('📝 TEST 2: Checking Dynamic Pricing Engine...');
    try {
        // Find a product to test
        const testProduct = await prisma.product.findFirst({
            where: { category: 'Audio' } // Using 'Audio' as an example
        });

        if (!testProduct) {
             const anyProduct = await prisma.product.findFirst();
             if(!anyProduct) throw new Error("No products in DB to test pricing");
        }

        const idToTest = testProduct ? testProduct.id : (await prisma.product.findFirst()).id;
        console.log(`  - Testing with Product ID: ${idToTest}`);
        
        const priceResult = await calculatePrice(idToTest);
        
        console.log(`  - Base Price: $${priceResult.basePrice}`);
        console.log(`  - Calculated New Price: $${priceResult.newPrice}`);
        console.log(`  - Price Multiplier applied: ${priceResult.priceMultiplier}`);
        
        if (priceResult.newPrice !== undefined && priceResult.priceMultiplier !== undefined) {
             console.log('  ✅ Dynamic Pricing Engine: PASSED\n');
             pricingPassed = true;
        } else {
             console.log('  ❌ Dynamic Pricing Engine: FAILED (Invalid calculation output)\n');
        }

    } catch (e) {
        console.log('  ❌ Dynamic Pricing Engine: FAILED Error:', e.message, '\n');
    }

    // ---------------------------------------------------------
    // TEST 3: Visual Search Service
    // ---------------------------------------------------------
    console.log('📝 TEST 3: Checking Visual Search Service (Requires running server)...');
    try {
        // 3A. Check Health
        console.log('  - Pinging visual search health endpoint...');
        const health = await getJSON('http://localhost:5000/api/visual-search/health');
        
        if (health.status !== 200) {
            console.log(`  ⚠️ Search Service returned status: ${health.status}. Is it running?`);
        } else {
            console.log(`  - Service Status: ${health.data.status}`);
            console.log(`  - Index Size: ${health.data.index_size} items`);
            
            // 3B. Test Accuracy
            console.log('  - Testing search query "headphones"...');
            const searchRes = await postJSON('http://localhost:5000/api/visual-search/search', {
                query: "headphones",
                top_k: 2
            });

            if (searchRes.status === 200 && searchRes.data.products && searchRes.data.products.length > 0) {
                const topMatch = searchRes.data.products[0];
                console.log(`  - Top Match: ${topMatch.name || 'Unknown'} (Score: ${topMatch.similarity_score.toFixed(2)})`);
                console.log(`  - Match Image Path: ${topMatch.image_url}`);
                
                // Verify it's a store product
                if (topMatch.id && (topMatch.id.startsWith('mock') || topMatch.id.startsWith('new'))) {
                     console.log('  ✅ Text Search: PASSED\n');
                     searchPassed = true;
                } else {
                     console.log('  ❌ Text Search: FAILED (Returned non-store product data)\n');
                }
            } else {
                console.log('  ❌ Text Search: FAILED (No results or error from server)\n');
            }

            // 3C. Test Image Upload Search
            console.log('  - Testing image upload search with "headphone.png"...');
            const testImagePath = path.join(process.cwd(), 'public', 'product-images', 'headphone.png');
            if (fs.existsSync(testImagePath)) {
                const imgSearchRes = await postMultipart('http://localhost:5000/api/image-search/search', testImagePath);
                
                if (imgSearchRes.status === 200 && imgSearchRes.data.products && imgSearchRes.data.products.length > 0) {
                    const topImgMatch = imgSearchRes.data.products[0];
                    console.log(`  - Top Image Match: ${topImgMatch.name || 'Unknown'} (Score: ${topImgMatch.similarity_score.toFixed(2)})`);
                    console.log(`  - Match Image Path: ${topImgMatch.image_url}`);
                    
                    if (topImgMatch.id && (topImgMatch.id.startsWith('mock') || topImgMatch.id.startsWith('new'))) {
                         console.log('  ✅ Image Upload Search: PASSED\n');
                    } else {
                         console.log('  ❌ Image Upload Search: FAILED (Returned non-store product data)\n');
                         searchPassed = false;
                    }
                } else {
                    console.log('  ❌ Image Upload Search: FAILED (No results or error from server)\n');
                    searchPassed = false;
                }
            } else {
                console.log(`  ⚠️ Test image not found at ${testImagePath}. Skipping image upload test.\n`);
            }
            
        }
    } catch (e) {
        console.log('  ❌ Visual Search Service: FAILED Error:', e.message);
        console.log('  💡 Note: Ensure the Python search service is running (python search_service/app.py)\n');
        searchPassed = false;
    }

    // ---------------------------------------------------------
    // SUMMARY
    // ---------------------------------------------------------
    console.log('==================================================');
    console.log('                   TEST SUMMARY                   ');
    console.log('==================================================');
    console.log(`1. Database Integrity:   ${dbPassed ? '✅ PASSED' : '❌ FAILED'}`);
    console.log(`2. Dynamic Pricing:      ${pricingPassed ? '✅ PASSED' : '❌ FAILED'}`);
    console.log(`3. Visual Search API:    ${searchPassed ? '✅ PASSED' : '❌ FAILED'}`);
    console.log('==================================================');

    await prisma.$disconnect();
}

runTests();
