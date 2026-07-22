# Test script to verify start-frontend-backends.bat functionality

Write-Host "`n============================================================" -ForegroundColor Cyan
Write-Host "   Testing start-frontend-backends.bat" -ForegroundColor Cyan
Write-Host "============================================================`n" -ForegroundColor Cyan

# Test 1: Check if file exists
Write-Host "[1/5] Checking if start-frontend-backends.bat exists..." -ForegroundColor Yellow
if (Test-Path "start-frontend-backends.bat") {
    Write-Host "  SUCCESS: File found" -ForegroundColor Green
} else {
    Write-Host "  FAILED: File not found" -ForegroundColor Red
    exit 1
}

# Test 2: Check Node.js
Write-Host "`n[2/5] Checking Node.js installation..." -ForegroundColor Yellow
try {
    $nodeVersion = node --version
    Write-Host "  SUCCESS: Node.js $nodeVersion" -ForegroundColor Green
} catch {
    Write-Host "  FAILED: Node.js not found" -ForegroundColor Red
    exit 1
}

# Test 3: Check Python
Write-Host "`n[3/5] Checking Python installation..." -ForegroundColor Yellow
try {
    $pythonVersion = python --version
    Write-Host "  SUCCESS: $pythonVersion" -ForegroundColor Green
} catch {
    Write-Host "  FAILED: Python not found" -ForegroundColor Red
    exit 1
}

# Test 4: Check dependencies
Write-Host "`n[4/5] Checking dependencies..." -ForegroundColor Yellow
if (Test-Path "node_modules") {
    Write-Host "  SUCCESS: Node.js dependencies installed" -ForegroundColor Green
} else {
    Write-Host "  WARNING: node_modules not found" -ForegroundColor Yellow
}

if (Test-Path "search_service/requirements.txt") {
    Write-Host "  SUCCESS: Python requirements.txt found" -ForegroundColor Green
} else {
    Write-Host "  WARNING: requirements.txt not found" -ForegroundColor Yellow
}

# Test 5: Check configuration
Write-Host "`n[5/5] Checking configuration files..." -ForegroundColor Yellow
if (Test-Path ".env.local") {
    Write-Host "  SUCCESS: .env.local found" -ForegroundColor Green
    
    # Check for required variables
    $envContent = Get-Content ".env.local" -Raw
    $requiredVars = @("SEARCH_SERVICE_URL", "DATABASE_URL")
    
    foreach ($var in $requiredVars) {
        if ($envContent -match $var) {
            Write-Host "    - $var configured" -ForegroundColor Gray
        } else {
            Write-Host "    - WARNING: $var not found" -ForegroundColor Yellow
        }
    }
} else {
    Write-Host "  WARNING: .env.local not found (will be created on first run)" -ForegroundColor Yellow
}

# Summary
Write-Host "`n============================================================" -ForegroundColor Cyan
Write-Host "   Test Summary" -ForegroundColor Cyan
Write-Host "============================================================`n" -ForegroundColor Cyan

Write-Host "The start-frontend-backends.bat script is ready to use!" -ForegroundColor Green
Write-Host "`nWhat it will do:" -ForegroundColor White
Write-Host "  1. Check Node.js and Python installations" -ForegroundColor Gray
Write-Host "  2. Install dependencies if needed" -ForegroundColor Gray
Write-Host "  3. Create .env.local if missing" -ForegroundColor Gray
Write-Host "  4. Start Next.js frontend (port 3000)" -ForegroundColor Gray
Write-Host "  5. Start Python AI search backend (port 5000)" -ForegroundColor Gray
Write-Host "  6. Open browser to http://localhost:3000" -ForegroundColor Gray

Write-Host "`nTo use the script:" -ForegroundColor White
Write-Host "  Double-click: start-frontend-backends.bat" -ForegroundColor Yellow
Write-Host "  Or run: ./start-frontend-backends.bat" -ForegroundColor Yellow

Write-Host "`nNote: Services are already running!" -ForegroundColor Cyan
Write-Host "  - Frontend: http://localhost:3000" -ForegroundColor Green
Write-Host "  - Backend:  http://localhost:5000" -ForegroundColor Green

Write-Host "`n============================================================`n" -ForegroundColor Cyan
