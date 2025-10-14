#!/bin/bash
# Render Build Script - Simple and Reliable

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

# Try the improved build command that includes fallback
echo "🔨 Building with improved npm script (includes fallback)..."
npm run render:build

# Final check
if [ -f "dist/index.js" ]; then
    echo "✅ Build successful: dist/index.js found"
    echo "📂 Build output:"
    ls -la dist/
    echo "✅ Render build completed successfully!"
else
    echo "❌ All build methods failed"
    echo "📂 Current directory contents:"
    ls -la
    echo "📂 Source directory contents:"
    ls -la src/
    echo "📂 TypeScript info:"
    npx tsc --version || echo "TypeScript not available"
    exit 1
fi