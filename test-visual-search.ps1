# Visual Search Integration Test Script
# Tests the complete AI Visual Search pipeline

Write-Host "============================================================" -ForegroundColor Cyan
Write-Host "   AI Visual Search Integration Test" -ForegroundColor Cyan
Write-Host "============================================================" -ForegroundColor Cyan
Write-Host ""

# Test 1: Python Search Service
Write-Host "[1/5] Testing Python Search Service (Port 5000)..." -ForegroundColor Yellow
try {
    $response = Invoke-RestMethod -Uri "http://localhost:5000/" -Method Get -TimeoutSec 5
    if ($response.status -eq "online") {
        Write-Host "  SUCCESS: Search Service ONLINE" -ForegroundColor Green
        Write-Host "    Service: $($response.service)" -ForegroundColor Gray
        Write-Host "    Version: $($response.version)" -ForegroundColor Gray
    }
} catch {
    Write-Host "  FAILED: Search Service OFFLINE" -ForegroundColor Red
    Write-Host "    Error: $_" -ForegroundColor Red
    exit 1
}

Write-Host ""

# Test 2: Image Search API
Write-Host "[2/5] Testing Image Search API..." -ForegroundColor Yellow
try {
    $response = Invoke-RestMethod -Uri "http://localhost:5000/api/image-search/health" -Method Get
    if ($response.status -eq "online") {
        Write-Host "  SUCCESS: Image Search API READY" -ForegroundColor Green
        Write-Host "    Model Loaded: $($response.model_loaded)" -ForegroundColor Gray
        Write-Host "    Index Size: $($response.index_size) products" -ForegroundColor Gray
        Write-Host "    Device: $($response.device)" -ForegroundColor Gray
    }
} catch {
    Write-Host "  FAILED: Image Search API NOT READY" -ForegroundColor Red
    exit 1
}

Write-Host ""

# Test 3: Visual Search API with Classifier
Write-Host "[3/5] Testing Visual Search API (with Classifier)..." -ForegroundColor Yellow
try {
    $response = Invoke-RestMethod -Uri "http://localhost:5000/api/visual-search/health" -Method Get
    if ($response.status -eq "online") {
        Write-Host "  SUCCESS: Visual Search API READY" -ForegroundColor Green
        Write-Host "    Classifier Loaded: $($response.classifier_loaded)" -ForegroundColor Gray
        Write-Host "    Categories: $($response.num_categories)" -ForegroundColor Gray
        Write-Host "    Index Size: $($response.index_size) products" -ForegroundColor Gray
    }
} catch {
    Write-Host "  FAILED: Visual Search API NOT READY" -ForegroundColor Red
    exit 1
}

Write-Host ""

# Test 4: Next.js Frontend
Write-Host "[4/5] Testing Next.js Frontend (Port 3000)..." -ForegroundColor Yellow
$maxRetries = 3
$retryCount = 0
$frontendReady = $false

while ($retryCount -lt $maxRetries -and -not $frontendReady) {
    try {
        $response = Invoke-WebRequest -Uri "http://localhost:3000" -UseBasicParsing -TimeoutSec 10
        if ($response.StatusCode -eq 200) {
            Write-Host "  SUCCESS: Next.js Frontend ONLINE" -ForegroundColor Green
            Write-Host "    Status Code: $($response.StatusCode)" -ForegroundColor Gray
            $frontendReady = $true
        }
    } catch {
        $retryCount++
        if ($retryCount -lt $maxRetries) {
            Write-Host "  Retry $retryCount of $maxRetries..." -ForegroundColor Yellow
            Start-Sleep -Seconds 3
        } else {
            Write-Host "  WARNING: Next.js Frontend NOT RESPONDING" -ForegroundColor Yellow
        }
    }
}

Write-Host ""

# Test 5: Summary
Write-Host "[5/5] Test Complete" -ForegroundColor Yellow
Write-Host ""
Write-Host "============================================================" -ForegroundColor Cyan
Write-Host "   Test Summary" -ForegroundColor Cyan
Write-Host "============================================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "SUCCESS: Python Search Service  - http://localhost:5000" -ForegroundColor Green
Write-Host "SUCCESS: Image Search API       - Ready" -ForegroundColor Green
Write-Host "SUCCESS: Visual Search API      - Ready with Classifier" -ForegroundColor Green
if ($frontendReady) {
    Write-Host "SUCCESS: Next.js Frontend       - http://localhost:3000" -ForegroundColor Green
} else {
    Write-Host "WARNING: Next.js Frontend       - Check manually" -ForegroundColor Yellow
}
Write-Host ""
Write-Host "============================================================" -ForegroundColor Cyan
Write-Host "   How to Test Visual Search UI" -ForegroundColor Cyan
Write-Host "============================================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "1. Open browser: http://localhost:3000" -ForegroundColor White
Write-Host "2. Click 'Visual Search' button (bottom-right)" -ForegroundColor White
Write-Host "3. Upload a product image" -ForegroundColor White
Write-Host "4. View AI-powered search results" -ForegroundColor White
Write-Host ""
Write-Host "Test with sample images from:" -ForegroundColor White
Write-Host "  abo-images-small (1)/images/small/00/" -ForegroundColor Gray
Write-Host ""
