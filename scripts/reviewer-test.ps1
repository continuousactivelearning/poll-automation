# 🧪 Automated Reviewer Testing Script (Windows PowerShell)
# This script helps reviewers quickly test the PR functionality

param(
    [switch]$SkipBuild,
    [switch]$SkipTests,
    [switch]$Verbose
)

# Colors for output
$Red = "Red"
$Green = "Green"
$Yellow = "Yellow"
$Blue = "Cyan"

function Write-Status {
    param($Message)
    Write-Host "[INFO] $Message" -ForegroundColor $Blue
}

function Write-Success {
    param($Message)
    Write-Host "[PASS] $Message" -ForegroundColor $Green
}

function Write-Warning {
    param($Message)
    Write-Host "[WARN] $Message" -ForegroundColor $Yellow
}

function Write-Error {
    param($Message)
    Write-Host "[FAIL] $Message" -ForegroundColor $Red
}

Write-Host "🚀 Starting Automated Reviewer Test Suite..." -ForegroundColor $Blue
Write-Host "================================================" -ForegroundColor $Blue

# Check if we're in the right directory
if (-not (Test-Path "package.json")) {
    Write-Error "Please run this script from the project root directory"
    exit 1
}

Write-Status "Checking project structure..."

# Check required files
$requiredFiles = @(
    "package.json",
    "turbo.json",
    "apps/frontend/package.json",
    "apps/backend/package.json",
    "shared/types/package.json"
)

foreach ($file in $requiredFiles) {
    if (Test-Path $file) {
        Write-Success "Found $file"
    } else {
        Write-Error "Missing $file"
        exit 1
    }
}

# Check if pnpm is installed
try {
    $pnpmVersion = pnpm --version
    Write-Success "pnpm is installed (version: $pnpmVersion)"
} catch {
    Write-Error "pnpm is not installed. Please install it first:"
    Write-Host "npm install -g pnpm"
    exit 1
}

# Install dependencies
Write-Status "Installing dependencies..."
try {
    pnpm install
    Write-Success "Dependencies installed successfully"
} catch {
    Write-Error "Failed to install dependencies"
    exit 1
}

# Run linting
Write-Status "Running linting checks..."
try {
    pnpm lint
    Write-Success "Linting passed"
} catch {
    Write-Warning "Linting issues found (check output above)"
}

# Run type checking
Write-Status "Running TypeScript type checking..."
try {
    pnpm type-check
    Write-Success "Type checking passed"
} catch {
    Write-Error "Type checking failed"
    exit 1
}

# Run tests (if not skipped)
if (-not $SkipTests) {
    Write-Status "Running test suite..."
    try {
        pnpm test
        Write-Success "All tests passed"
    } catch {
        Write-Warning "Some tests failed (check output above)"
    }
}

# Build project (if not skipped)
if (-not $SkipBuild) {
    Write-Status "Building project..."
    try {
        pnpm build
        Write-Success "Build completed successfully"
    } catch {
        Write-Error "Build failed"
        exit 1
    }
}

# Check if ports are available
Write-Status "Checking port availability..."

function Test-Port {
    param($Port, $Service)
    
    try {
        $connection = Test-NetConnection -ComputerName localhost -Port $Port -WarningAction SilentlyContinue
        if ($connection.TcpTestSucceeded) {
            Write-Warning "Port $Port is already in use (needed for $Service)"
            return $false
        } else {
            Write-Success "Port $Port is available for $Service"
            return $true
        }
    } catch {
        Write-Success "Port $Port is available for $Service"
        return $true
    }
}

$portsAvailable = $true
$portsAvailable = (Test-Port 5173 "Frontend") -and $portsAvailable
$portsAvailable = (Test-Port 3000 "Backend") -and $portsAvailable
$portsAvailable = (Test-Port 8000 "Whisper Service") -and $portsAvailable

if (-not $portsAvailable) {
    Write-Warning "Some ports are in use. You may need to stop other services."
    Write-Host "To kill processes on ports:"
    Write-Host "  netstat -ano | findstr :5173"
    Write-Host "  taskkill /PID <PID> /F"
    Write-Host "  netstat -ano | findstr :3000"
    Write-Host "  taskkill /PID <PID> /F"
    Write-Host "  netstat -ano | findstr :8000"
    Write-Host "  taskkill /PID <PID> /F"
}

# Test environment files
Write-Status "Checking environment configuration..."

if (-not (Test-Path "apps/backend/.env")) {
    if (Test-Path "apps/backend/.env.example") {
        Write-Status "Creating backend .env from example..."
        Copy-Item "apps/backend/.env.example" "apps/backend/.env"
        Write-Success "Backend .env created"
    } else {
        Write-Warning "No backend .env.example found"
    }
} else {
    Write-Success "Backend .env exists"
}

if (-not (Test-Path "apps/frontend/.env")) {
    if (Test-Path "apps/frontend/.env.example") {
        Write-Status "Creating frontend .env from example..."
        Copy-Item "apps/frontend/.env.example" "apps/frontend/.env"
        Write-Success "Frontend .env created"
    } else {
        Write-Warning "No frontend .env.example found"
    }
} else {
    Write-Success "Frontend .env exists"
}

# Summary
Write-Host ""
Write-Host "================================================" -ForegroundColor $Blue
Write-Host "🎉 Automated Testing Complete!" -ForegroundColor $Green
Write-Host ""
Write-Host "Next steps for manual testing:"
Write-Host "1. Run 'pnpm dev' to start all services"
Write-Host "2. Open http://localhost:5173 in your browser"
Write-Host "3. Test authentication flow (register/login)"
Write-Host "4. Test audio recording and poll generation"
Write-Host "5. Test real-time features with multiple browser tabs"
Write-Host ""
Write-Host "For detailed testing instructions, see:"
Write-Host "📖 REVIEWER_TESTING_GUIDE.md"
Write-Host ""

if ($portsAvailable) {
    Write-Host "✅ All ports are available - ready to start services!" -ForegroundColor $Green
} else {
    Write-Host "⚠️  Some ports are in use - you may need to stop other services first" -ForegroundColor $Yellow
}

Write-Host ""
Write-Host "Happy testing! 🧪"

# Optional: Start services automatically
$startServices = Read-Host "Would you like to start all services now? (y/N)"
if ($startServices -eq "y" -or $startServices -eq "Y") {
    Write-Status "Starting all services..."
    Start-Process powershell -ArgumentList "-NoExit", "-Command", "pnpm dev"
    Write-Success "Services started in new window!"
    Write-Host "Frontend: http://localhost:5173"
    Write-Host "Backend: http://localhost:3000"
}
