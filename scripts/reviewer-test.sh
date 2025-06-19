#!/bin/bash

# 🧪 Automated Reviewer Testing Script
# This script helps reviewers quickly test the PR functionality

set -e  # Exit on any error

echo "🚀 Starting Automated Reviewer Test Suite..."
echo "================================================"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[PASS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

print_error() {
    echo -e "${RED}[FAIL]${NC} $1"
}

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    print_error "Please run this script from the project root directory"
    exit 1
fi

print_status "Checking project structure..."

# Check required files
required_files=(
    "package.json"
    "turbo.json"
    "apps/frontend/package.json"
    "apps/backend/package.json"
    "shared/types/package.json"
)

for file in "${required_files[@]}"; do
    if [ -f "$file" ]; then
        print_success "Found $file"
    else
        print_error "Missing $file"
        exit 1
    fi
done

# Check if pnpm is installed
if ! command -v pnpm &> /dev/null; then
    print_error "pnpm is not installed. Please install it first:"
    echo "npm install -g pnpm"
    exit 1
fi

print_success "pnpm is installed"

# Install dependencies
print_status "Installing dependencies..."
if pnpm install; then
    print_success "Dependencies installed successfully"
else
    print_error "Failed to install dependencies"
    exit 1
fi

# Run linting
print_status "Running linting checks..."
if pnpm lint; then
    print_success "Linting passed"
else
    print_warning "Linting issues found (check output above)"
fi

# Run type checking
print_status "Running TypeScript type checking..."
if pnpm type-check; then
    print_success "Type checking passed"
else
    print_error "Type checking failed"
    exit 1
fi

# Run tests
print_status "Running test suite..."
if pnpm test; then
    print_success "All tests passed"
else
    print_warning "Some tests failed (check output above)"
fi

# Build project
print_status "Building project..."
if pnpm build; then
    print_success "Build completed successfully"
else
    print_error "Build failed"
    exit 1
fi

# Check if ports are available
print_status "Checking port availability..."

check_port() {
    local port=$1
    local service=$2
    
    if lsof -Pi :$port -sTCP:LISTEN -t >/dev/null 2>&1; then
        print_warning "Port $port is already in use (needed for $service)"
        return 1
    else
        print_success "Port $port is available for $service"
        return 0
    fi
}

ports_available=true
check_port 5173 "Frontend" || ports_available=false
check_port 3000 "Backend" || ports_available=false
check_port 8000 "Whisper Service" || ports_available=false

if [ "$ports_available" = false ]; then
    print_warning "Some ports are in use. You may need to stop other services."
    echo "To kill processes on ports:"
    echo "  lsof -ti:5173 | xargs kill -9"
    echo "  lsof -ti:3000 | xargs kill -9"
    echo "  lsof -ti:8000 | xargs kill -9"
fi

# Test environment files
print_status "Checking environment configuration..."

if [ ! -f "apps/backend/.env" ]; then
    if [ -f "apps/backend/.env.example" ]; then
        print_status "Creating backend .env from example..."
        cp apps/backend/.env.example apps/backend/.env
        print_success "Backend .env created"
    else
        print_warning "No backend .env.example found"
    fi
else
    print_success "Backend .env exists"
fi

if [ ! -f "apps/frontend/.env" ]; then
    if [ -f "apps/frontend/.env.example" ]; then
        print_status "Creating frontend .env from example..."
        cp apps/frontend/.env.example apps/frontend/.env
        print_success "Frontend .env created"
    else
        print_warning "No frontend .env.example found"
    fi
else
    print_success "Frontend .env exists"
fi

# Summary
echo ""
echo "================================================"
echo -e "${GREEN}🎉 Automated Testing Complete!${NC}"
echo ""
echo "Next steps for manual testing:"
echo "1. Run 'pnpm dev' to start all services"
echo "2. Open http://localhost:5173 in your browser"
echo "3. Test authentication flow (register/login)"
echo "4. Test audio recording and poll generation"
echo "5. Test real-time features with multiple browser tabs"
echo ""
echo "For detailed testing instructions, see:"
echo "📖 REVIEWER_TESTING_GUIDE.md"
echo ""

if [ "$ports_available" = true ]; then
    echo -e "${GREEN}✅ All ports are available - ready to start services!${NC}"
else
    echo -e "${YELLOW}⚠️  Some ports are in use - you may need to stop other services first${NC}"
fi

echo ""
echo "Happy testing! 🧪"
