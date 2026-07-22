@echo off
REM ============================================================================
REM ShopSense - Advanced Start Script
REM ============================================================================
REM This script provides options to start frontend, backend, or both
REM ============================================================================

setlocal enabledelayedexpansion

REM Set title
title ShopSense - Service Manager

REM Colors and formatting
cls
echo.
echo ============================================================================
echo                    ShopSense - Service Manager
echo ============================================================================
echo.

REM Check prerequisites
call :check_prerequisites

REM Show menu
:menu
cls
echo.
echo ============================================================================
echo                    ShopSense - Service Manager
echo ============================================================================
echo.
echo Select an option:
echo.
echo   1. Start Frontend Only (Next.js)
echo   2. Start Backend Only (Python Search Service)
echo   3. Start Both Frontend and Backend
echo   4. Stop All Services
echo   5. View Logs
echo   6. Check Status
echo   7. Install Dependencies
echo   8. Run Database Migrations
echo   9. Exit
echo.
echo ============================================================================
echo.

set /p choice="Enter your choice (1-9): "

if "%choice%"=="1" goto start_frontend
if "%choice%"=="2" goto start_backend
if "%choice%"=="3" goto start_both
if "%choice%"=="4" goto stop_services
if "%choice%"=="5" goto view_logs
if "%choice%"=="6" goto check_status
if "%choice%"=="7" goto install_deps
if "%choice%"=="8" goto run_migrations
if "%choice%"=="9" goto exit_script

echo Invalid choice. Please try again.
timeout /t 2 /nobreak
goto menu

REM ============================================================================
REM START FRONTEND
REM ============================================================================
:start_frontend
cls
echo.
echo Starting Frontend (Next.js)...
echo.
echo Frontend will be available at: http://localhost:3000
echo.
echo Press Ctrl+C to stop the frontend
echo.

start "ShopSense Frontend" cmd /k "npm run dev"
goto menu

REM ============================================================================
REM START BACKEND
REM ============================================================================
:start_backend
cls
echo.
echo Starting Backend (Python Search Service)...
echo.

if not exist "search_service" (
    echo ERROR: search_service directory not found
    echo.
    pause
    goto menu
)

echo Backend will be available at: http://localhost:5000
echo.
echo Press Ctrl+C to stop the backend
echo.

start "ShopSense Backend" cmd /k "cd search_service && python app.py"
goto menu

REM ============================================================================
REM START BOTH
REM ============================================================================
:start_both
cls
echo.
echo ============================================================================
echo                    Starting All Services
echo ============================================================================
echo.

echo [1/2] Starting Frontend (Next.js)...
echo Frontend will be available at: http://localhost:3000
echo.
start "ShopSense Frontend" cmd /k "npm run dev"

timeout /t 3 /nobreak

if exist "search_service" (
    echo [2/2] Starting Backend (Python Search Service)...
    echo Backend will be available at: http://localhost:5000
    echo.
    start "ShopSense Backend" cmd /k "cd search_service && python app.py"
) else (
    echo [2/2] Backend directory not found - skipping
)

echo.
echo ============================================================================
echo                    All Services Started
echo ============================================================================
echo.
echo Frontend: http://localhost:3000
echo Backend:  http://localhost:5000 (if available)
echo.
echo Close this window or press Ctrl+C to return to menu
echo.

timeout /t 5 /nobreak
goto menu

REM ============================================================================
REM STOP SERVICES
REM ============================================================================
:stop_services
cls
echo.
echo Stopping all services...
echo.

taskkill /FI "WINDOWTITLE eq ShopSense*" /T /F >nul 2>&1

echo ✓ All services stopped
echo.
timeout /t 2 /nobreak
goto menu

REM ============================================================================
REM VIEW LOGS
REM ============================================================================
:view_logs
cls
echo.
echo ============================================================================
echo                    View Logs
echo ============================================================================
echo.

if not exist "logs" (
    echo No logs directory found
    echo.
    pause
    goto menu
)

echo Available log files:
echo.
dir /B logs\
echo.
echo Enter log filename to view (or press Enter to skip):
set /p logfile="Filename: "

if not "!logfile!"=="" (
    if exist "logs\!logfile!" (
        type "logs\!logfile!"
    ) else (
        echo File not found
    )
)

echo.
pause
goto menu

REM ============================================================================
REM CHECK STATUS
REM ============================================================================
:check_status
cls
echo.
echo ============================================================================
echo                    Service Status
echo ============================================================================
echo.

echo Checking Frontend (Next.js)...
tasklist /FI "WINDOWTITLE eq ShopSense Frontend" 2>nul | find /I /N "cmd.exe">nul
if "%ERRORLEVEL%"=="0" (
    echo ✓ Frontend is running on http://localhost:3000
) else (
    echo ✗ Frontend is not running
)

echo.
echo Checking Backend (Python)...
tasklist /FI "WINDOWTITLE eq ShopSense Backend" 2>nul | find /I /N "cmd.exe">nul
if "%ERRORLEVEL%"=="0" (
    echo ✓ Backend is running on http://localhost:5000
) else (
    echo ✗ Backend is not running
)

echo.
echo Checking Database...
if exist ".env" (
    echo ✓ Environment file found
) else (
    echo ✗ Environment file not found
)

echo.
pause
goto menu

REM ============================================================================
REM INSTALL DEPENDENCIES
REM ============================================================================
:install_deps
cls
echo.
echo ============================================================================
echo                    Installing Dependencies
echo ============================================================================
echo.

echo Installing npm dependencies...
call npm install

if errorlevel 1 (
    echo.
    echo ERROR: Failed to install dependencies
    echo.
) else (
    echo.
    echo ✓ Dependencies installed successfully
    echo.
)

pause
goto menu

REM ============================================================================
REM RUN MIGRATIONS
REM ============================================================================
:run_migrations
cls
echo.
echo ============================================================================
echo                    Database Migrations
echo ============================================================================
echo.

if not exist "prisma\schema.prisma" (
    echo ERROR: Prisma schema not found
    echo.
    pause
    goto menu
)

echo Running database migrations...
echo.
call npx prisma migrate deploy

if errorlevel 1 (
    echo.
    echo ERROR: Migration failed
    echo Make sure your database is running and DATABASE_URL is correct
    echo.
) else (
    echo.
    echo ✓ Migrations completed successfully
    echo.
)

pause
goto menu

REM ============================================================================
REM EXIT
REM ============================================================================
:exit_script
cls
echo.
echo ============================================================================
echo                    Goodbye!
echo ============================================================================
echo.
echo Thank you for using ShopSense
echo.
exit /b 0

REM ============================================================================
REM CHECK PREREQUISITES
REM ============================================================================
:check_prerequisites
echo Checking prerequisites...
echo.

REM Check Node.js
node --version >nul 2>&1
if errorlevel 1 (
    echo ERROR: Node.js is not installed
    echo Please install Node.js from https://nodejs.org/
    echo.
    pause
    exit /b 1
)

REM Check npm
npm --version >nul 2>&1
if errorlevel 1 (
    echo ERROR: npm is not installed
    echo.
    pause
    exit /b 1
)

REM Check Python (optional)
python --version >nul 2>&1
if errorlevel 1 (
    echo WARNING: Python is not installed (Backend will not work)
)

echo ✓ Prerequisites check completed
echo.
timeout /t 2 /nobreak

exit /b 0
