# Changelog

All notable changes to Tidy Roll are documented here. The format follows
[Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and versions follow
[Semantic Versioning](https://semver.org/).

## [1.0.0] - 2026-07-27

### Added

- **Browser extension (Manifest V3)** — the full swipe-to-tidy flow:
  - Card deck with drag/swipe physics, KEEP/TOSS stamps, and a demo roll.
  - Keyboard controls: `←` toss, `→` keep, `↓` skip, `Z` undo.
  - Folder access via the File System Access API, with recursive scanning,
    video support, review-order settings, and recent-folder memory.
  - Safety-first deletion: tossed files move to a `Tidy Roll - Tossed`
    folder by default; permanent delete is opt-in and double-confirmed.
  - Summary screen with per-photo restore before anything touches disk.
  - Popup with lifetime stats (reviewed / tossed / space reclaimed).
- **Mobile app (Android + iOS)** — the Expo/React Native app now lives in
  [`mobile/`](mobile/): camera-roll sessions, bookmarks, albums, On This Day,
  stats, and staged deletes via the system media library, with its own
  store-submission metadata under `mobile/store/`.
- **Brand identity** — logo, icon set, banner, and Chrome Web Store promo
  art generated from `assets/logo.svg` by `scripts/build-assets.mjs`.
- **Tooling** — unit tests (`node --test` for the extension, Vitest for
  mobile), store-zip packaging (`npm run package`), screenshot automation,
  and a CI workflow covering both apps.

[1.0.0]: https://github.com/gr8monk3ys/tidy-roll/releases/tag/v1.0.0
