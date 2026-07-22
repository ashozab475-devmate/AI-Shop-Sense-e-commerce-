# Demo: Test Visual Search with a Sample Image

Write-Host ""
Write-Host "============================================================" -ForegroundColor Cyan
Write-Host "   Visual Search API Demo" -ForegroundColor Cyan
Write-Host "============================================================" -ForegroundColor Cyan
Write-Host ""

# Find a sample image
$sampleImagePath = Get-ChildItem -Path "abo-images-small (1)/images/small/00" -Filter "*.jpg" | Select-Object -First 1

if ($sampleImagePath) {
    Write-Host "Using sample image: $($sampleImagePath.Name)" -ForegroundColor Yellow
    Write-Host ""
    
    # Test 1: Text-based Visual Search
    Write-Host "[Test 1] Text-based Visual Search" -ForegroundColor Cyan
    Write-Host "Query: 'laptop computer'" -ForegroundColor Gray
    
    $body = @{
        query = "laptop computer"
        top_k = 5
    } | ConvertTo-Json
    
    try {
        $response = Invoke-RestMethod -Uri "http://localhost:5000/api/visual-search/search" `
            -Method Post `
            -ContentType "application/json" `
            -Body $body
        
        Write-Host "  Status: $($response.status)" -ForegroundColor Green
        Write-Host "  Predicted Category: $($response.predicted_category)" -ForegroundColor Green
        Write-Host "  Classifier Confidence: $($response.classifier_confidence)" -ForegroundColor Green
        Write-Host "  Results Found: $($response.results_count)" -ForegroundColor Green
        
        if ($response.products -and $response.products.Count -gt 0) {
            Write-Host ""
            Write-Host "  Top Results:" -ForegroundColor White
            $response.products | Select-Object -First 3 | ForEach-Object {
                Write-Host "    - $($_.product_name) ($($_.category)) - Score: $([math]::Round($_.similarity_score, 3))" -ForegroundColor Gray
            }
        }
    } catch {
        Write-Host "  Error: $_" -ForegroundColor Red
    }
    
    Write-Host ""
    Write-Host "[Test 2] Image-based Search (via Next.js API)" -ForegroundColor Cyan
    Write-Host "Testing the frontend API proxy route..." -ForegroundColor Gray
    Write-Host "  Endpoint: http://localhost:3000/api/visual-search" -ForegroundColor Gray
    Write-Host "  Note: This requires multipart/form-data upload" -ForegroundColor Gray
    Write-Host "  Best tested via the UI at http://localhost:3000" -ForegroundColor Yellow
    
} else {
    Write-Host "No sample images found in abo-images-small (1)/images/small/00/" -ForegroundColor Red
}

Write-Host ""
Write-Host "============================================================" -ForegroundColor Cyan
Write-Host "   Available Categories (20 total)" -ForegroundColor Cyan
Write-Host "============================================================" -ForegroundColor Cyan
Write-Host ""

try {
    $categories = Invoke-RestMethod -Uri "http://localhost:5000/api/visual-search/categories" -Method Get
    $categories.categories | ForEach-Object {
        Write-Host "  - $_" -ForegroundColor Gray
    }
} catch {
    Write-Host "Could not fetch categories" -ForegroundColor Red
}

Write-Host ""
Write-Host "============================================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Next Steps:" -ForegroundColor White
Write-Host "1. Open http://localhost:3000 in your browser" -ForegroundColor Yellow
Write-Host "2. Click the 'Visual Search' button (bottom-right)" -ForegroundColor Yellow
Write-Host "3. Upload any product image to test the full pipeline" -ForegroundColor Yellow
Write-Host ""
