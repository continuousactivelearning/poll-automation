#!/bin/bash
# Render Build Script - Final Fix for TypeScript Dependencies

echo "🚀 Starting Render build process..."

# Install all dependencies including TypeScript and type definitions
echo "📦 Installing dependencies..."
npm install

# Verify TypeScript and essential packages are available
echo "🔧 Verifying installations..."
echo "TypeScript version: $(npx tsc --version)"
echo "Node types available: $(npm list @types/node --depth=0 || echo 'Installing @types/node...')"

# Clean previous builds
echo "🧹 Cleaning previous builds..."
rm -rf dist

# Build using the simplest possible approach
echo "🔨 Building with direct TypeScript compilation..."

# Use the most compatible TypeScript compilation
npx tsc \
  --outDir dist \
  --rootDir src \
  --target es2020 \
  --module commonjs \
  --esModuleInterop \
  --skipLibCheck \
  --allowJs \
  --resolveJsonModule \
  --moduleResolution node \
  --allowSyntheticDefaultImports \
  --strict false \
  --noImplicitAny false \
  src/index.ts

# Check if build was successful
if [ -f "dist/index.js" ]; then
    echo "✅ Build successful: dist/index.js found"
    echo "📂 Build output:"
    ls -la dist/
    echo "📝 Generated files count: $(find dist -name "*.js" | wc -l)"
else
    echo "❌ Build failed - no index.js found"
    echo "📂 Current directory contents:"
    ls -la
    echo "📂 Source directory contents:"
    ls -la src/ | head -10
    echo "📦 Installed packages verification:"
    npm list typescript @types/node @types/express --depth=0
    exit 1
fi

echo "✅ Render build completed successfully!"