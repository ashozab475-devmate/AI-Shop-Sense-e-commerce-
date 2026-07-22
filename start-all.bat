@echo off
REM ============================================================================
REM ShopSense - Start All Services (Frontend + Node.js Backend + Python Backend)
REM ============================================================================
REM This script starts frontend, Node.js backend, and Python search service
REM ============================================================================

setlocal enabledelayedexpansion

title ShopSense - All Services Manager

cls
echo.
echo ============================================================================
echo                 ShopSense - Starting All Services
echo ============================================================================
echo.

REM Check if Node.js is installed
echo [1/7] Checking Node.js installation...
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
echo [2/7] Checking Python installation...
python --version >nul 2>&1
if errorlevel 1 (
    echo.
    echo ERROR: Python is not installed or not in PATH
    echo Please install Python from https://www.python.org/
    echo.
    pause
    exit /b 1
) else (
    echo OK - Python found
    python --version
)

REM Check if .env file exists
echo.
echo [3/7] Checking environment configuration...
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

REM Install Node.js dependencies if node_modules doesn't exist
echo.
echo [4/7] Checking Node.js dependencies...
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
    echo OK - Node.js dependencies installed
) else (
    echo OK - Node.js dependencies already installed
)

REM Install Python dependencies if not already installed
echo.
echo [5/7] Checking Python dependencies...
if exist "search_service\requirements.txt" (
    echo Checking if Flask is installed...
    python -c "import flask" >nul 2>&1
    if errorlevel 1 (
        echo.
        echo Installing Python dependencies...
        call pip install -r search_service\requirements.txt
        if errorlevel 1 (
            echo.
            echo ERROR: Failed to install Python dependencies
            echo.
            pause
            exit /b 1
        )
        echo OK - Python dependencies installed
    ) else (
        echo OK - Python dependencies already installed
    )
) else (
    echo WARNING: search_service\requirements.txt not found
)

REM Check database
echo.
echo [6/7] Checking database...
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
echo [7/7] Preparing logs directory...
if not exist "logs" mkdir logs
echo OK - Logs directory ready

REM Start services
echo.
echo ============================================================================
echo                    Starting All Services
echo ============================================================================
echo.

echo [1/3] Starting Frontend (Next.js on port 3000)...
echo.
start "ShopSense Frontend" cmd /k "npm run dev"

echo Waiting for frontend to start (10 seconds)...
timeout /t 10 /nobreak

echo.
echo [2/3] Starting Node.js Backend...
echo.
if exist "server.js" (
    start "ShopSense Node Backend" cmd /k "node server.js"
    timeout /t 3 /nobreak
) else if exist "backend\server.js" (
    start "ShopSense Node Backend" cmd /k "node backend\server.js"
    timeout /t 3 /nobreak
) else (
    echo WARNING: Node.js backend server.js not found
)

echo.
echo [3/3] Starting Python Backend (AI Search Service on port 5000)...
echo.
if exist "search_service\start_server.py" (
    start "ShopSense Python Backend" cmd /k "python search_service/start_server.py"
    timeout /t 3 /nobreak
) else if exist "search_service\app.py" (
    start "ShopSense Python Backend" cmd /k "python search_service/app.py"
    timeout /t 3 /nobreak
) else (
    echo ERROR: Could not find Python search service
)

REM Display startup information
cls
echo.
echo ============================================================================
echo                    ShopSense - All Services Running
echo ============================================================================
echo.
echo SUCCESS! All services have been started!
echo.
echo ============================================================================
echo                    Service Ports
echo ============================================================================
echo.
echo Frontend (Next.js):           http://localhost:3000
echo Node.js Backend:              http://localhost:3001 (or configured port)
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
echo                    Service Windows
echo ============================================================================
echo.
echo "ShopSense Frontend"           - Next.js frontend (port 3000)
echo "ShopSense Node Backend"       - Node.js backend server
echo "ShopSense Python Backend"     - Python AI Search Service (port 5000)
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
