@echo off
REM ============================================================================
REM ShopSense - AI Visual Search Model Training Setup
REM ============================================================================
REM This script sets up the environment and starts model training
REM ============================================================================

setlocal enabledelayedexpansion

title ShopSense - Visual Search Training

cls
echo.
echo ============================================================================
echo              ShopSense - AI Visual Search Model Training
echo ============================================================================
echo.

REM Check Python installation
echo [1/5] Checking Python installation...
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

REM Check TensorFlow installation
echo.
echo [2/5] Checking TensorFlow installation...
python -c "import tensorflow" >nul 2>&1
if errorlevel 1 (
    echo.
    echo Installing TensorFlow and dependencies...
    call pip install tensorflow keras scikit-learn pandas numpy Pillow requests
    if errorlevel 1 (
        echo.
        echo ERROR: Failed to install dependencies
        echo.
        pause
        exit /b 1
    )
    echo OK - Dependencies installed
) else (
    echo OK - TensorFlow already installed
)

REM Create data directory
echo.
echo [3/5] Preparing directories...
if not exist "search_service\data" mkdir search_service\data
if not exist "search_service\models" mkdir search_service\models
if not exist "search_service\images" mkdir search_service\images
echo OK - Directories created

REM Check dataset
echo.
echo [4/5] Checking dataset...
if exist "search_service\data\abo_dataset_6000.csv" (
    echo OK - Dataset found
) else (
    echo WARNING: Dataset not found
    echo Please ensure abo_dataset_6000.csv is in search_service\data\
)

REM Start training
echo.
echo [5/5] Starting model training...
echo.
echo ============================================================================
echo                    Starting Training Process
echo ============================================================================
echo.

cd search_service

python train_visual_search_model.py

if errorlevel 1 (
    echo.
    echo ERROR: Training failed
    echo.
    pause
    exit /b 1
)

echo.
echo ============================================================================
echo                    Training Complete!
echo ============================================================================
echo.
echo Generated files:
echo   - visual_search_model.h5
echo   - visual_search_model_best.h5
echo   - visual_search_model_info.json
echo   - visual_search_model_train_features.npy
echo   - visual_search_model_test_features.npy
echo.
echo Next steps:
echo   1. Review model performance in visual_search_model_info.json
echo   2. Integrate model with search service
echo   3. Test visual search API
echo   4. Deploy to production
echo.
echo ============================================================================
echo.

pause

endlocal
