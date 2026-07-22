@echo off
REM ============================================================================
REM ShopSense - Start Frontend and All Backends
REM ============================================================================
REM This script starts Next.js frontend and Python search service together
REM ============================================================================

setlocal enabledelayedexpansion

title ShopSense - Frontend & Backends Manager

cls
echo.
echo ============================================================================
echo              ShopSense - Starting Frontend and All Backends
echo ============================================================================
echo.

REM Check if Node.js is installed
echo [1/5] Checking Node.js installation...
node --version >nul 2>&1
if errorlevel 1 (
    echo.
    echo ERROR: Node.js is not installed or not in PATH
    echo Please install Node.js from https://nodejs.org/
    echo.
    pause
    exit /b 1
)
echo OK - Node.js found
node --version

REM Check if Python is installed
echo.
echo [2/5] Checking Python installation...
python --version >nul 2>&1
if errorlevel 1 (
    echo.
    echo ERROR: Python is not installed or not in PATH
    echo Please install Python from https://www.python.org/
    echo.
    pause
    exit /b 1
)
echo OK - Python found
python --version

REM Install Node.js dependencies if needed
echo.
echo [3/5] Checking Node.js dependencies...
if not exist "node_modules" (
    echo.
    echo Installing npm dependencies...
    call npm install
    if errorlevel 1 (
        echo.
        echo ERROR: Failed to install npm dependencies
        pause
        exit /b 1
    )
    echo OK - Dependencies installed
) else (
    echo OK - Dependencies already installed
)

REM Install Python dependencies if needed
echo.
echo [4/5] Checking Python dependencies...
if exist "search_service\requirements.txt" (
    python -c "import flask, torch, faiss, open_clip" >nul 2>&1
    if errorlevel 1 (
        echo.
        echo Installing Python dependencies...
        echo This may take several minutes (PyTorch, FAISS, CLIP)...
        call pip install -r search_service\requirements.txt
        if errorlevel 1 (
            echo.
            echo WARNING: Some Python dependencies may have failed to install
            echo The service may still work with basic features
        )
        echo OK - Python dependencies installation attempted
    ) else (
        echo OK - Python dependencies already installed
    )
) else (
    echo WARNING: search_service\requirements.txt not found
)

REM Check environment files
echo.
echo [5/5] Checking configuration files...
if not exist ".env.local" (
    echo.
    echo WARNING: .env.local not found
    echo Creating default .env.local file...
    (
        echo NEXT_PUBLIC_API_URL=http://localhost:3000
        echo DATABASE_URL="postgresql://postgres:password@localhost:5432/fypapp"
        echo SEARCH_SERVICE_URL="http://127.0.0.1:5000/api/image-search/search"
        echo STRIPE_PUBLIC_KEY="pk_test_your_public_key"
        echo STRIPE_SECRET_KEY="sk_test_your_secret_key"
        echo NEXT_PUBLIC_STRIPE_PUBLIC_KEY="pk_test_your_public_key"
    ) > .env.local
    echo OK - .env.local file created with defaults
    echo IMPORTANT: Update database and Stripe credentials in .env.local
) else (
    echo OK - .env.local file found
)

if not exist ".env" (
    echo OK - .env file not needed (using .env.local)
) else (
    echo OK - .env file found
)

REM Start services
echo.
echo ============================================================================
echo                    Starting Services
echo ============================================================================
echo.

echo [1/2] Starting Frontend (Next.js on port 3000)...
echo.
start "ShopSense Frontend" cmd /k "cd /d "%~dp0" && npm run dev"

echo Waiting for frontend to initialize (10 seconds)...
timeout /t 10 /nobreak >nul

echo.
echo [2/2] Starting Python AI Search Backend (port 5000)...
echo.
start "ShopSense Python Backend" cmd /k "cd /d "%~dp0" && python search_service/start_server.py"

echo Waiting for Python backend to initialize (5 seconds)...
timeout /t 5 /nobreak >nul

REM Display information
cls
echo.
echo ============================================================================
echo              ShopSense - Frontend and Backends Running
echo ============================================================================
echo.
echo SUCCESS! All services have been started!
echo.
echo ============================================================================
echo                    Service Ports
echo ============================================================================
echo.
echo Frontend (Next.js):           http://localhost:3000
echo Python Backend (Search):      http://localhost:5000
echo.
echo ============================================================================
echo                    Quick Links
echo ============================================================================
echo.
echo Home:                         http://localhost:3000
echo Shopping:                     http://localhost:3000/shopping
echo Search:                       http://localhost:3000/search
echo Admin Dashboard:              http://localhost:3000/admin/dashboard
echo Seller Dashboard:             http://localhost:3000/seller/products
echo Contact:                      http://localhost:3000/contact
echo FAQ:                          http://localhost:3000/faq
echo Help:                         http://localhost:3000/help
echo.
echo ============================================================================
echo                    API Endpoints
echo ============================================================================
echo.
echo Health Check:                 http://localhost:5000/
echo Image Search:                 http://localhost:5000/api/image-search/search
echo Visual Search:                http://localhost:5000/api/visual-search/search
echo Text Search:                  http://localhost:5000/api/search?q=laptop
echo Products:                     http://localhost:5000/api/products
echo Categories:                   http://localhost:5000/api/categories
echo Recommendations:              http://localhost:5000/api/recommendations
echo.
echo ============================================================================
echo                    AI Visual Search
echo ============================================================================
echo.
echo The AI Visual Search feature is now available!
echo.
echo How to use:
echo   1. Go to http://localhost:3000
echo   2. Click the "Visual Search" button (bottom-right)
echo   3. Upload a product image
echo   4. View AI-powered similar products
echo.
echo Features:
echo   - CLIP image embeddings (512-dim vectors)
echo   - Category classifier (20 categories)
echo   - FAISS similarity search
echo   - Category-aware filtering
echo.
echo ============================================================================
echo                    Service Windows
echo ============================================================================
echo.
echo "ShopSense Frontend"           - Next.js frontend (port 3000)
echo "ShopSense Python Backend"     - Python search service (port 5000)
echo.
echo ============================================================================
echo                    How to Stop Services
echo ============================================================================
echo.
echo Option 1: Close each service window individually
echo Option 2: Press Ctrl+C in each service window
echo Option 3: Use Task Manager to end the processes
echo.
echo ============================================================================
echo.

REM Open website in default browser
timeout /t 2 /nobreak
start http://localhost:3000

echo Website opened in your default browser!
echo.
echo This window will close in 5 seconds...
echo (All services will continue running in their own windows)
echo.

timeout /t 5 /nobreak

endlocal
