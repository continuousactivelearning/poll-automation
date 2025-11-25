#!/bin/bash
# Render Build Script - Simplified and Robust

echo "🚀 Starting Render build process..."

# Install dependencies
echo "📦 Installing dependencies..."
npm install

# Install TypeScript globally to ensure it's available
echo "🔧 Installing TypeScript..."
npm install -g typescript

# Clean previous builds
echo "🧹 Cleaning previous builds..."
rm -rf dist

# Create dist directory
mkdir -p dist

# Copy source files and compile manually if needed
echo "🔨 Compiling TypeScript..."

# Simple TypeScript compilation without complex paths
tsc src/index.ts --outDir dist --target es2020 --module commonjs --esModuleInterop --skipLibCheck --allowJs --resolveJsonModule

# If that fails, try alternative approach
if [ ! -f "dist/index.js" ]; then
    echo "� Trying alternative build approach..."
    
    # Copy all source files to dist and compile in place
    cp -r src/* dist/
    
    # Try direct compilation
    cd dist
    find . -name "*.ts" -exec tsc {} --target es2020 --module commonjs --esModuleInterop --skipLibCheck --allowJs \;
    cd ..
fi

# Check if we have a working index.js
if [ -f "dist/index.js" ]; then
    echo "✅ Build successful: dist/index.js found"
elif [ -f "dist/src/index.js" ]; then
    echo "✅ Build successful: dist/src/index.js found"
    # Move to expected location
    mv dist/src/* dist/
    rmdir dist/src
else
    echo "❌ Build failed - no index.js found"
    echo "📂 Current directory contents:"
    ls -la
    echo "📂 Dist directory contents:"
    ls -la dist/ || echo "No dist directory"
    exit 1
fi

echo "✅ Render build completed successfully!"