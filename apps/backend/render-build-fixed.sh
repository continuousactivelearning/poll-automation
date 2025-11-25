#!/bin/bash
# Render Build Script - Updated for proper TypeScript dependency

echo "🚀 Starting Render build process..."

# Install dependencies (including TypeScript which is now in dependencies)
echo "📦 Installing dependencies..."
npm install

# Verify TypeScript is available
echo "🔧 Verifying TypeScript installation..."
npx tsc --version

# Clean previous builds
echo "🧹 Cleaning previous builds..."
rm -rf dist

# Build using npm script (which uses tsconfig.production.json)
echo "🔨 Building with npm script..."
npm run build:simple

# Check if build was successful
if [ -f "dist/index.js" ]; then
    echo "✅ Build successful: dist/index.js found"
    echo "📂 Build output:"
    ls -la dist/
else
    echo "❌ Build failed, trying alternative method..."
    
    # Fallback: Create dist directory and compile manually
    mkdir -p dist
    
    # Use npx to ensure we use the locally installed TypeScript
    echo "🔧 Using fallback build method..."
    npx tsc src/index.ts --outDir dist --target es2020 --module commonjs --esModuleInterop --skipLibCheck --allowJs --resolveJsonModule
    
    # Check again
    if [ -f "dist/index.js" ]; then
        echo "✅ Fallback build successful"
        echo "📂 Build output:"
        ls -la dist/
    else
        echo "❌ All build methods failed"
        echo "📂 Current directory contents:"
        ls -la
        echo "📂 Source directory contents:"
        ls -la src/
        echo "📂 Node modules typescript:"
        ls -la node_modules/.bin/tsc || echo "TypeScript not found in node_modules"
        exit 1
    fi
fi

echo "✅ Render build completed successfully!"