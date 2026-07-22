@echo off
title ShopSense Launcher
cls
echo ============================================================================
echo                    Starting ShopSense Platform
echo ============================================================================
echo.
echo Starting the AI Backend Service...
start "ShopSense AI Search Service" cmd /k "cd /d "%~dp0" && python search_service/app.py"

echo Starting the Next.js Frontend...
start "ShopSense Web Frontend" cmd /k "cd /d "%~dp0" && npm run dev"

echo.
echo Both services are now starting in separate windows.
echo Please wait about 10-15 seconds for the servers to boot up.
echo.
echo Opening your default browser to http://localhost:3000...
timeout /t 5 /nobreak >nul
start http://localhost:3000

echo.
echo ============================================================================
echo  To stop the application, simply close the two command prompt windows.
echo ============================================================================
echo.
pause
