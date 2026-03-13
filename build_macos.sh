#!/bin/bash

echo "🚀 Starting macOS M4 DMG Build Process..."

# 1. Clean up
echo "🧹 Cleaning up..."
rm -rf node_modules package-lock.json dist

# 2. Install dependencies (now includes Electron)
echo "📦 Installing project dependencies..."
npm install

# 3. Build the web application
echo "🏗️ Building React app..."
npm run build

# 4. Build DMG for M4
echo "📦 Packaging DMG for macOS M4 (ARM64)..."
npm run electron:build

echo "✅ Build Complete! Check the 'dist' folder for your DMG file."
