# Contributing to Tidy Roll

Thanks for helping tidy the world's camera rolls! This repo contains two
apps that share one identity:

| Path | What it is | Stack |
| --- | --- | --- |
| `extension/` | Browser extension (Chrome/Edge/Brave/Arc/Opera) | Vanilla ES modules, MV3, no build step |
| `mobile/` | Android/iOS app | Expo / React Native / TypeScript |

## Extension development

```bash
npm test              # node:test — session logic + manifest checks
npm run package       # dist/tidy-roll-v<version>.zip for the Chrome Web Store
npm run assets        # regenerate icons/banner/promo from assets/logo.svg
npm run screenshots   # re-capture README/store screenshots
```

Load it in a browser: `chrome://extensions` → Developer mode →
**Load unpacked** → select `extension/`.

Ground rules:

- No dependencies and no build step in `extension/` — it ships as-is.
- All disk writes stay in `extension/app/files.js`, and nothing may touch
  disk before the user confirms the summary screen.
- Keep `extension/app/core.js` free of DOM/filesystem imports; it must stay
  unit-testable in Node.
- If you change the manifest or version, keep `package.json` in sync
  (`tests/manifest.test.mjs` enforces this).

## Mobile development

```bash
cd mobile
npm install
npm run ios        # or: npm run android
npm run lint && npm run typecheck && npm test
```

See [`mobile/README.md`](mobile/README.md) for EAS build profiles and
store-submission notes.

## Before you open a PR

1. Run the relevant test suite(s) above — CI runs both.
2. Install the pre-commit hooks (`pre-commit install`) or at least make
   sure files end with a newline and carry no trailing whitespace.
3. Keep PRs focused; screenshots or screen recordings are hugely welcome
   for UI changes.

## Brand

Palette: gradient `#FF7A59 → #FF3D81` on ink `#0F1220`; keep `#34D399`;
toss `#FF4D67`. The logo source of truth is `assets/logo.svg` — regenerate
raster art with `npm run assets` rather than editing PNGs.
