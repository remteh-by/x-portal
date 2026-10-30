# X Play macOS 1.1.0 preview

Independent Xbox Remote Play launcher for Apple Silicon macOS. The **1.1.0 preview is published** without physical-device acceptance. The ARM64 DMG is ad-hoc signed, not notarized. Public release 1.0.0 is retained as a historical version. See [actual releases](https://github.com/remteh-by/x-portal/releases) and the [site](https://remteh-by.github.io/x-portal/).

[Download 1.1.0 ARM64 DMG](https://github.com/remteh-by/x-portal/releases/download/v1.1.0/X-Play-1.1.0-arm64.dmg) · [Checksums and source](https://github.com/remteh-by/x-portal/releases/tag/v1.1.0)

## Controls / управление

Open Controls settings to choose physical gamepad or keyboard/mouse mode. Save a named profile, change sensitivity/inversion and assign keys. JSON export/import is limited to the validated schema. Settings apply to the **next game window**; the app does not claim to alter an existing stream silently.

В режиме клавиатуры/мыши нажмите отдельную кнопку захвата на странице игры. Escape освобождает курсор; он не назначается игровой кнопке. Физические геймпады сохраняются в Gamepad API. Потеря фокуса, скрытие окна, переход в текстовое поле и потеря pointer lock очищают виртуальный ввод. В режиме физического геймпада API не подменяется.

Default keys: WASD movement, mouse look, left/right mouse RT/LT, Space A, Q B, E X, R Y, F/G shoulders, Tab View, Enter Menu, Shift/Control stick clicks. Profile import rejects duplicate or unsupported keys. Microphone requests are disabled unless enabled explicitly in the profile.

## Security and limits

Electron renderer sandbox and context isolation are enabled; Node integration is off. Local launcher IPC validates the sending frame. Game navigation is limited to explicit HTTPS Xbox/Microsoft sign-in hosts. Remote pages receive only the validated controls configuration through an isolated preload; they do not receive a general Electron bridge.

Remote Play still depends on Xbox service/account/network requirements. The keyboard adapter uses browser Gamepad API behavior and needs verification in actual games. It does not guarantee all games, 4K, zero latency, Intel Mac support or compatibility with future sign-in routes. Android/Windows/Linux packages are not provided. Unused Capacitor dependencies were removed from the macOS distribution.

## Build and verify

Use Node.js 24 LTS (minimum 22.12):

```sh
npm ci
npm test
npm run lint
npm run build
npm run electron:start
npm run electron:build
```

Electron is pinned to 45.1.0; electron-builder to 26.18.0. App code is in dist, isolated preloads in build-preloads, packaged files in release. Do not distribute development node_modules or signing credentials. CI builds macOS candidates and keeps validation separate from publication.

For an isolated development check, XPLAY_TEST_PROFILE can point to a temporary directory. Packaged apps ignore that variable. Production preferences live in Electron's userData directory; do not export account cookies or the complete browser profile for support.

## Installation and acceptance

A prepared DMG is a candidate until installation and gameplay are accepted. Preserve your working application and profile before testing an update. The candidate has a verified ad-hoc signature for local testing, not an Apple Developer ID signature or notarization. CI uses the explicit ad-hoc identity and loads no signing secrets. A macOS warning is not automatically proof of a harmless issue: verify the source and SHA-256; do not run blanket quarantine-removal commands.

Automated checks cover navigation loop continuity, single confirmation per press, empty focus lists, profile validation, URL restrictions, physical-pad preservation and input reset. A native macOS launch and profile save were checked separately. Xbox sign-in, real controller input, gameplay, reconnect and a sustained session remain physical/service acceptance items.

## License

[MIT](LICENSE), unchanged. Independent project, not affiliated with Microsoft. [Support development](https://paypal.me/remtehby). Donations do not imply a separate software license purchase.

Additional QA: `npm run test:site` checks the static site at 360–3840px with JavaScript disabled; install Playwright Chromium first. `npm run test:native` launches the real Electron app using a temporary empty profile and an intercepted Xbox test page. It checks sandboxed preloads and SPA cleanup without signing into Microsoft or claiming gameplay.
