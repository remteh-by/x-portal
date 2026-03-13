#!/bin/bash

# ==========================================
# X Play TV - Final Release Script
# ==========================================

echo "🚀 Starting X Play TV Final Release Process..."

# 1. Check for DMG file and rename for consistency
echo "🔍 Looking for build artifacts..."
ORIGINAL_DMG=$(ls ./dist/*.dmg | head -n 1)

if [ -z "$ORIGINAL_DMG" ]; then
    echo "❌ Error: DMG file not found in ./dist. Please run ./build_macos.sh first."
    exit 1
fi

# Ensure the final name is professional
FINAL_DMG="./dist/X_Play_TV_Gamer_Edition.dmg"
cp "$ORIGINAL_DMG" "$FINAL_DMG"
echo "✅ Prepared: $FINAL_DMG"

# 2. Configure Git
echo "⚙️ Configuring Remote..."
git remote set-url origin https://github.com/remteh-by/x-portal.git 2>/dev/null || git remote add origin https://github.com/remteh-by/x-portal.git

# 3. Push Code (Requires repo to exist)
echo "📤 Pushing code to main (branch: main)..."
git branch -M main
if git push -u origin main --force; then
    echo "✅ Code uploaded successfully!"
else
    echo "❌ Error: Could not push code."
    echo "⚠️ Please make sure you created the repository 'x-portal' at https://github.com/new"
    exit 1
fi

# 4. Create Release and Upload DMG
echo "🎁 Creating GitHub Release v1.0.0..."
if gh release create v1.0.0 "$FINAL_DMG" \
    --title "X Play TV v1.0.0 (Gamer Edition)" \
    --notes "Official release of X Play TV for macOS M4. 
    
Features:
- Professional Keyboard & Mouse emulation (PC Gamer Style)
- Pointer Lock for 360° camera control
- Xbox-inspired UI (Glassmorphism)
- Optimized for Apple Silicon (M4)"; then
    echo "✅ Release created and DMG uploaded!"
    echo "🏁 DONE! View your project at: https://github.com/remteh-by/x-portal"
else
    echo "❌ Error: Could not create release. Check if 'gh' is logged in."
fi
