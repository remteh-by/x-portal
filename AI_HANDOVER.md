# 🤖 AI Handover: Project X Play macOS

This document is for future AI coding assistants to understand the current state, history, and roadmap of the project.

## 📌 Project Identity
- **Full Name**: X Play macOS (formerly X Play TV)
- **Repo**: [remteh-by/x-portal](https://github.com/remteh-by/x-portal)
- **Tech Stack**: Electron + React + Vite.
- **Key Target**: High-performance Xbox Remote Play for Apple Silicon Macs (M1-M4).

## ✅ What has been done
1. **Repository Cleanup**: Removed over 1.2 GB of Android-related bloat and caches. Reset Git history for a lean repo (~2 MB source size).
2. **Rebranding**: Renamed from "X Play TV" to "X Play macOS" across all components.
3. **Landing Page**: Created a premium glassmorphism landing page at [remteh-by.github.io/x-portal/](https://remteh-by.github.io/x-portal/).
4. **Release Automation**: Configured GitHub CLI for release management. Released v1.0.0 (Gamer Edition).
5. **Monetization**: Configured GitHub Sponsors and PayPal.Me (https://paypal.me/remtehby). 

## 🛠 Currently Released Version (v1.0.0)
- **Tag**: `v1.0.0`
- **Asset**: `X_Play_macOS.dmg` (renamed from previous TV tag to stay consistent).
- **App Name**: The installed app in `/Applications` is named `X Play.app`.

## ⚠️ Known Glitches & Troubleshooting
1. **Gatekeeper (Unsigned App)**: Since the app is not officially signed with an Apple Developer ID ($99/year), macOS marks it as "damaged".
   - **Solution**: Users must run:
     ```bash
     sudo xattr -rd com.apple.quarantine /Applications/X\ Play.app
     ```
   - This instruction is added to `README.md` and the Landing Page.

## 🚀 Future Roadmap & Monetization Goals
The user wants to earn revenue to cover the **$99/year Apple Developer Fee**. Future Pro Features include:
- **Advanced Keyboard Remapping** (custom binds).
- **Mouse Sensitivity & Acceleration** tuning.
- **Integrated Gamepad Tester** for calibration.

## 📂 Project Structure
- `/src`: Main application logic.
- `/docs`: Landing page files (HTML/CSS).
- `package.json`: Build configurations and product name.
- `/dist`: Build artifacts (DMG).

## 💡 Important Context for next AI
- The user is using a **MacBook M4**. High performance is a priority.
- Do NOT re-add Android components. This is a macOS-only fork now.
- Keep the repository lean. Do not commit heavy `dist` or `node_modules`.

---
*Created on 2026-03-13 by Antigravity AI.*
