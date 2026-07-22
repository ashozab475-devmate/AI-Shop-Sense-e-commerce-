@echo off
REM ============================================================================
REM ShopSense - Start Frontend and Backend
REM ============================================================================
REM This script starts both services and opens the website in browser
REM ============================================================================

setlocal enabledelayedexpansion

title ShopSense - Service Manager

cls
echo.
echo ============================================================================
echo                    ShopSense - Starting Services
echo ============================================================================
echo.

REM Check if Node.js is installed
echo [1/6] Checking Node.js installation...
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
echo [2/6] Checking Python installation...
python --version >nul 2>&1
if errorlevel 1 (
    echo.
    echo WARNING: Python is not installed
    echo Search service will not start
    echo.
    set PYTHON_AVAILABLE=0
) else (
    echo OK - Python found
    python --version
    set PYTHON_AVAILABLE=1
)

REM Check if .env file exists
echo.
echo [3/6] Checking environment configuration...
if not exist ".env" (
    echo.
    echo Creating .env file...
    (
        echo DATABASE_URL=postgresql://user:password@localhost:5432/fypapp
        echo NEXTAUTH_SECRET=your-secret-key-here
        echo NEXTAUTH_URL=http://localhost:3000
    ) > .env
    echo OK - .env file created
) else (
    echo OK - .env file found
)

REM Check if .env.local exists
if not exist ".env.local" (
    echo Creating .env.local file...
    (
        echo NEXTAUTH_SECRET=your-secret-key-here
        echo NEXTAUTH_URL=http://localhost:3000
    ) > .env.local
    echo OK - .env.local file created
) else (
    echo OK - .env.local file found
)

REM Install dependencies if node_modules doesn't exist
echo.
echo [4/6] Checking dependencies...
if not exist "node_modules" (
    echo.
    echo Installing npm dependencies...
    echo This may take a few minutes...
    echo.
    call npm install
    if errorlevel 1 (
        echo.
        echo ERROR: Failed to install npm dependencies
        echo.
        pause
        exit /b 1
    )
    echo OK - Dependencies installed
) else (
    echo OK - Dependencies already installed
)

REM Check database
echo.
echo [5/6] Checking database...
if exist "prisma\schema.prisma" (
    echo OK - Prisma schema found
    echo.
    echo Applying database migrations...
    call npx prisma migrate deploy >nul 2>&1
    if errorlevel 1 (
        echo WARNING: Could not apply migrations
        echo Make sure your database is running
    ) else (
        echo OK - Database migrations applied
    )
) else (
    echo WARNING: Prisma schema not found
)

REM Create logs directory
echo.
echo [6/6] Preparing logs directory...
if not exist "logs" mkdir logs
echo OK - Logs directory ready

REM Start services
echo.
echo ============================================================================
echo                    Starting Services
echo ============================================================================
echo.

echo [1/2] Starting Frontend (Next.js)...
echo Frontend will be available at: http://localhost:3000
echo.

REM Start frontend in a new window
start "ShopSense Frontend" cmd /k "npm run dev"

REM Wait for frontend to start
echo Waiting for frontend to start (10 seconds)...
timeout /t 10 /nobreak

REM Start backend if Python is available
if !PYTHON_AVAILABLE! equ 1 (
    echo.
    echo [2/2] Starting Backend (AI Search Service)...
    echo Backend will be available at: http://localhost:5000
    echo.
    
    if exist "search_service\start_server.py" (
        start "ShopSense Backend" cmd /k "python search_service/start_server.py"
        timeout /t 3 /nobreak
    ) else (
        echo WARNING: search_service/start_server.py not found
        echo Trying alternative: python search_service/app.py
        if exist "search_service\app.py" (
            start "ShopSense Backend" cmd /k "python search_service/app.py"
            timeout /t 3 /nobreak
        ) else (
            echo ERROR: Could not find search service
        )
    )
) else (
    echo.
    echo [2/2] Skipping Backend (Python not available)
    echo.
)

REM Display startup information
cls
echo.
echo ============================================================================
echo                    ShopSense - Services Running
echo ============================================================================
echo.
echo SUCCESS! All services have been started!
echo.
echo ============================================================================
echo                    Website Address
echo ============================================================================
echo.
echo MAIN WEBSITE: http://localhost:3000
echo.
echo Opening website in your browser...
echo.
echo ============================================================================
echo                    Quick Links
echo ============================================================================
echo.
echo Home:                http://localhost:3000
echo Shopping:            http://localhost:3000/shopping
echo Search:              http://localhost:3000/search
echo Admin Dashboard:      http://localhost:3000/admin/dashboard
echo Seller Dashboard:     http://localhost:3000/seller/products
echo Contact:             http://localhost:3000/contact
echo FAQ:                 http://localhost:3000/faq
echo Help:                http://localhost:3000/help
echo.
echo ============================================================================
echo                    Service Information
echo ============================================================================
echo.
echo Frontend Window:  "ShopSense Frontend" (Next.js on port 3000)
echo Backend Window:   "ShopSense Backend" (AI Search Service on port 5000)
echo.
echo To stop services: Close the service windows or press Ctrl+C
echo.
echo ============================================================================
echo.

REM Open website in default browser
timeout /t 2 /nobreak
start http://localhost:3000

echo Website opened in your default browser!
echo.
echo This window will close in 5 seconds...
echo (Services will continue running in their own windows)
echo.

timeout /t 5 /nobreak

endlocal
