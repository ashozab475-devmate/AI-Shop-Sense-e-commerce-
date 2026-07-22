# ============================================================================
# ShopSense - Start Services (PowerShell)
# ============================================================================
# This script starts both the Next.js frontend and Python search service
# Usage: .\start.ps1
# ============================================================================

param(
    [ValidateSet('frontend', 'backend', 'both', 'stop', 'status')]
    [string]$Service = 'both'
)

# Set error action preference
$ErrorActionPreference = 'Continue'

# Colors
$colors = @{
    'Success' = 'Green'
    'Error'   = 'Red'
    'Warning' = 'Yellow'
    'Info'    = 'Cyan'
}

function Write-Header {
    param([string]$Text)
    Write-Host ""
    Write-Host "============================================================================" -ForegroundColor Cyan
    Write-Host "                    $Text" -ForegroundColor Cyan
    Write-Host "============================================================================" -ForegroundColor Cyan
    Write-Host ""
}

function Write-Success {
    param([string]$Text)
    Write-Host "✓ $Text" -ForegroundColor Green
}

function Write-Error-Custom {
    param([string]$Text)
    Write-Host "✗ $Text" -ForegroundColor Red
}

function Write-Warning-Custom {
    param([string]$Text)
    Write-Host "⚠ $Text" -ForegroundColor Yellow
}

function Write-Info {
    param([string]$Text)
    Write-Host "ℹ $Text" -ForegroundColor Cyan
}

function Check-Prerequisites {
    Write-Header "Checking Prerequisites"
    
    # Check Node.js
    Write-Host "Checking Node.js..."
    $nodeVersion = node --version 2>$null
    if ($LASTEXITCODE -eq 0) {
        Write-Success "Node.js found: $nodeVersion"
    } else {
        Write-Error-Custom "Node.js is not installed"
        Write-Host "Please install Node.js from https://nodejs.org/" -ForegroundColor Yellow
        exit 1
    }
    
    # Check npm
    Write-Host "Checking npm..."
    $npmVersion = npm --version 2>$null
    if ($LASTEXITCODE -eq 0) {
        Write-Success "npm found: $npmVersion"
    } else {
        Write-Error-Custom "npm is not installed"
        exit 1
    }
    
    # Check Python (optional)
    Write-Host "Checking Python..."
    $pythonVersion = python --version 2>$null
    if ($LASTEXITCODE -eq 0) {
        Write-Success "Python found: $pythonVersion"
    } else {
        Write-Warning-Custom "Python is not installed (Backend will not work)"
    }
    
    # Check .env file
    Write-Host "Checking environment configuration..."
    if (-not (Test-Path ".env")) {
        Write-Warning-Custom ".env file not found, creating..."
        @"
DATABASE_URL=postgresql://user:password@localhost:5432/fypapp
NEXTAUTH_SECRET=your-secret-key-here
NEXTAUTH_URL=http://localhost:3000
"@ | Out-File -FilePath ".env" -Encoding UTF8
        Write-Success ".env file created"
    } else {
        Write-Success ".env file found"
    }
    
    # Check node_modules
    Write-Host "Checking dependencies..."
    if (-not (Test-Path "node_modules")) {
        Write-Warning-Custom "Dependencies not installed, installing..."
        npm install
        if ($LASTEXITCODE -ne 0) {
            Write-Error-Custom "Failed to install dependencies"
            exit 1
        }
        Write-Success "Dependencies installed"
    } else {
        Write-Success "Dependencies already installed"
    }
}

function Start-Frontend {
    Write-Header "Starting Frontend (Next.js)"
    Write-Info "Frontend will be available at: http://localhost:3000"
    Write-Host ""
    
    Start-Process -FilePath "cmd.exe" -ArgumentList "/k npm run dev" -WindowStyle Normal -PassThru | Out-Null
    
    Write-Success "Frontend started"
}

function Start-Backend {
    Write-Header "Starting Backend (Python Search Service)"
    
    if (-not (Test-Path "search_service")) {
        Write-Error-Custom "search_service directory not found"
        return
    }
    
    Write-Info "Backend will be available at: http://localhost:5000"
    Write-Host ""
    
    Start-Process -FilePath "cmd.exe" -ArgumentList "/k cd search_service && python app.py" -WindowStyle Normal -PassThru | Out-Null
    
    Write-Success "Backend started"
}

function Start-Both {
    Write-Header "Starting All Services"
    
    Write-Host "[1/2] Starting Frontend (Next.js)..."
    Start-Frontend
    
    Start-Sleep -Seconds 3
    
    Write-Host "[2/2] Starting Backend (Python Search Service)..."
    Start-Backend
    
    Write-Header "All Services Started"
    Write-Info "Frontend: http://localhost:3000"
    Write-Info "Backend:  http://localhost:5000"
    Write-Host ""
}

function Stop-Services {
    Write-Header "Stopping Services"
    
    Write-Host "Stopping all ShopSense services..."
    Get-Process | Where-Object { $_.MainWindowTitle -like "*ShopSense*" } | Stop-Process -Force -ErrorAction SilentlyContinue
    
    Write-Success "All services stopped"
}

function Get-Status {
    Write-Header "Service Status"
    
    $frontendRunning = Get-Process | Where-Object { $_.MainWindowTitle -eq "ShopSense Frontend" }
    $backendRunning = Get-Process | Where-Object { $_.MainWindowTitle -eq "ShopSense Backend" }
    
    if ($frontendRunning) {
        Write-Success "Frontend is running on http://localhost:3000"
    } else {
        Write-Error-Custom "Frontend is not running"
    }
    
    if ($backendRunning) {
        Write-Success "Backend is running on http://localhost:5000"
    } else {
        Write-Error-Custom "Backend is not running"
    }
    
    Write-Host ""
}

# Main execution
Write-Header "ShopSense - Service Manager"

# Check prerequisites
Check-Prerequisites

Write-Host ""

# Execute based on parameter
switch ($Service) {
    'frontend' {
        Start-Frontend
    }
    'backend' {
        Start-Backend
    }
    'both' {
        Start-Both
    }
    'stop' {
        Stop-Services
    }
    'status' {
        Get-Status
    }
    default {
        Start-Both
    }
}

Write-Host ""
Write-Host "============================================================================" -ForegroundColor Cyan
Write-Host ""
