@echo off
echo ============================================================
echo Starting Visual Search Server
echo ============================================================
echo.

cd /d "%~dp0search_service"

echo [1/3] Checking Python installation...
python --version >nul 2>&1
if errorlevel 1 (
    echo ERROR: Python not found!
    echo Please install Python 3.9 or higher
    pause
    exit /b 1
)
echo     SUCCESS - Python found

echo.
echo [2/3] Checking dependencies...
python -c "import flask, torch, faiss, open_clip" >nul 2>&1
if errorlevel 1 (
    echo WARNING: Some dependencies missing
    echo Installing dependencies...
    pip install -r requirements.txt
)
echo     SUCCESS - Dependencies OK

echo.
echo [3/3] Starting server...
echo.
echo Server will be available at: http://localhost:5000
echo.
echo Models will load in background (5-10 minutes first time)
echo Server responds immediately with "loading" status
echo.
echo Press Ctrl+C to stop the server
echo.
echo ============================================================
echo.

python start_server.py

if errorlevel 1 (
    echo.
    echo ERROR: Server failed to start
    echo Check the error messages above
    pause
    exit /b 1
)
