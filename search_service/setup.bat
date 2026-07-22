@echo off
REM ============================================================================
REM ShopSense - Search Service Setup
REM ============================================================================
REM This script installs Python dependencies for the search service
REM ============================================================================

echo.
echo ============================================================================
echo                    ShopSense - Search Service Setup
echo ============================================================================
echo.

REM Check if Python is installed
echo Checking Python installation...
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

REM Check if pip is installed
echo.
echo Checking pip installation...
pip --version >nul 2>&1
if errorlevel 1 (
    echo.
    echo ERROR: pip is not installed
    echo.
    pause
    exit /b 1
)
echo OK - pip found
pip --version

REM Install requirements
echo.
echo Installing Python dependencies...
echo This may take a few minutes...
echo.

pip install -r requirements.txt

if errorlevel 1 (
    echo.
    echo ERROR: Failed to install dependencies
    echo.
    pause
    exit /b 1
)

echo.
echo ============================================================================
echo                    Setup Complete
echo ============================================================================
echo.
echo Python dependencies installed successfully!
echo.
echo To start the search service, run:
echo   python start_server.py
echo.
echo Or from the project root:
echo   python search_service/start_server.py
echo.
echo ============================================================================
echo.

pause
