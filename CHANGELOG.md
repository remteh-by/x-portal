# Changes

## 1.1.0 candidate

- Keep gamepad polling alive during input throttling; edge-trigger confirm/back and clean up the loop.
- Preserve physical gamepads and release virtual input on focus/visibility/pointer-lock loss.
- Add saved, validated controls profiles and explicit pointer capture.
- Separate local and remote preloads; sandbox renderers and restrict navigation, permissions and IPC.
- Upgrade the pinned Electron runtime, remove unused Capacitor packages, use reproducible lockfile and packaged preload bundles.
- Fix the inherited light-theme styles; use readable controls and focus states.
- Correct site/README platform, release and latency claims; support 360–3840 px layouts.

These source/build checks do not establish actual Xbox gameplay compatibility.
