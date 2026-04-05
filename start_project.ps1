# AI Knowledge Graph Builder - Forensic Intelligence Startup Script

# 1. Branding & Initialization
$Emerald = "Green"
$Gold = "Yellow"
$Slate = "DarkGray"

Clear-Host
Write-Host "VIDZAI DIGITAL PLATFORM" -ForegroundColor Green -NoNewline
Write-Host ""

# 2. Prerequisite Checks
Write-Host "[SYSTEM] Validating environment..." -ForegroundColor $Slate

# Check Python
if (!(Get-Command python -ErrorAction SilentlyContinue)) {
    Write-Host "ERROR: Python is not installed or not in PATH." -ForegroundColor Red
    exit
}

# Check Node.js
if (!(Get-Command npm -ErrorAction SilentlyContinue)) {
    Write-Host "ERROR: Node.js/NPM is not installed or not in PATH." -ForegroundColor Red
    exit
}

# 3. Backend Preparation
Write-Host "[BACKEND] Checking dependencies..." -ForegroundColor $Slate
if (!(Test-Path "backend\.venv")) {
    Write-Host "WARNING: Virtual environment (.venv) not found in backend/." -ForegroundColor $Gold
    $choice = Read-Host "Would you like to create it and install requirements? (y/n)"
    if ($choice -eq 'y') {
        Write-Host "Creating .venv and installing requirements..." -ForegroundColor Green
        cd backend
        python -m venv .venv
        .\.venv\Scripts\activate
        python -m pip install --upgrade pip
        pip install -r requirements.txt
        cd ..
    }
}

# 4. Frontend Preparation
Write-Host "[FRONTEND] Checking dependencies..." -ForegroundColor $Slate
if (!(Test-Path "frontend\node_modules")) {
    Write-Host "WARNING: node_modules not found in frontend/." -ForegroundColor $Gold
    $choice = Read-Host "Would you like to run 'npm install'? (y/n)"
    if ($choice -eq 'y') {
        Write-Host "Installing frontend dependencies..." -ForegroundColor Green
        cd frontend
        npm install
        cd ..
    }
}

# 5. Service Orchestration
Write-Host ""
Write-Host ">> Launching Forensic Intelligence Suite..." -ForegroundColor $Emerald

# Start Backend (FastAPI)
Write-Host "   [+] Starting Backend on http://localhost:8000" -ForegroundColor Green
Start-Process powershell -ArgumentList "-NoExit", "-Command", "`$Host.UI.RawUI.WindowTitle = 'Vidzai Backend'; cd backend; .\.venv\Scripts\activate; uvicorn main:app --host 0.0.0.0 --port 8000 --reload"

# Start Frontend (Vite)
Write-Host "   [+] Starting Frontend on http://localhost:5173" -ForegroundColor Cyan
Start-Process powershell -ArgumentList "-NoExit", "-Command", "`$Host.UI.RawUI.WindowTitle = 'Vidzai Frontend'; cd frontend; npm run dev"

Write-Host ""
Write-Host "SYSTEM ONLINE" -ForegroundColor Green
Write-Host "Please ensure Neo4j is running at neo4j://127.0.0.1:7687" -ForegroundColor $Slate
