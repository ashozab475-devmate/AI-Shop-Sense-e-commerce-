@echo off
REM ============================================================================
REM Train AI Visual Search Model with 2000 Products
REM ============================================================================

title Training AI Model - 2000 Products

cls
echo.
echo ============================================================================
echo          Training AI Visual Search Model with 2000 Products
echo ============================================================================
echo.
echo This will:
echo   1. Load 2000 products from the dataset
echo   2. Extract CLIP embeddings (512-dim vectors)
echo   3. Train category classifier (20 categories)
echo   4. Build FAISS search index
echo   5. Save all models
echo.
echo Estimated time: 10-20 minutes (depending on CPU/GPU)
echo.
echo ============================================================================
echo.

REM Check Python
python --version >nul 2>&1
if errorlevel 1 (
    echo ERROR: Python not found
    pause
    exit /b 1
)

REM Check dependencies
echo Checking dependencies...
python -c "import torch, faiss, open_clip" >nul 2>&1
if errorlevel 1 (
    echo.
    echo ERROR: Missing dependencies (PyTorch, FAISS, or CLIP)
    echo Installing dependencies...
    pip install -r search_service\requirements.txt
)

echo.
echo Starting training...
echo.
echo ============================================================================
echo.

cd /d "%~dp0"
python search_service/train_2000_products.py

if errorlevel 1 (
    echo.
    echo ============================================================================
    echo ERROR: Training failed
    echo ============================================================================
    echo.
    pause
    exit /b 1
)

echo.
echo ============================================================================
echo          Training Complete!
echo ============================================================================
echo.
echo New model files created:
echo   - visual_search_train_embeddings.npy
echo   - visual_search_train_metadata.pkl
echo   - category_classifier.pkl
echo   - category_label_map.json
echo   - visual_search_faiss_index.bin
echo.
echo ============================================================================
echo          Next Steps
echo ============================================================================
echo.
echo 1. Restart the Python search service:
echo    python search_service/start_server.py
echo.
echo 2. Or use the start script:
echo    start-frontend-backends.bat
echo.
echo 3. Test the Visual Search at:
echo    http://localhost:3000
echo.
echo ============================================================================
echo.

pause
