# Changelog

All notable changes to Tidy Roll are documented here. The format follows
[Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and versions follow
[Semantic Versioning](https://semver.org/).

## 1.0.0 (2026-09-02)


### Features

* bring the Expo mobile app into mobile/ (Android + iOS) ([26c337a](https://github.com/gr8monk3ys/tidy-roll/commit/26c337ad7a98c59481d12600cc9c06e2647320b9))
* showcase site in Next.js 15, deployed to Vercel + marketing playbook ([5f0b844](https://github.com/gr8monk3ys/tidy-roll/commit/5f0b844473a7c730b9d0d67dbd49f4b957063022))
* Tidy Roll browser extension with full brand identity, tests, and store kit ([a8f1583](https://github.com/gr8monk3ys/tidy-roll/commit/a8f158313d316e7b105db81b0f58fe3d72c83b4e))


### Bug Fixes

* **ci:** repoint org workflows to the public reusable home ([#29](https://github.com/gr8monk3ys/tidy-roll/issues/29)) ([ca96091](https://github.com/gr8monk3ys/tidy-roll/commit/ca96091326732d1170dda13ed2fab6a961bb869e))
* pre-public cleanup — brand the mobile app, licence exception, contact + docs ([13a9398](https://github.com/gr8monk3ys/tidy-roll/commit/13a939857fd2caae9e8efae7b598a3938f2da978))
* **site:** absolute nav anchors so they work from subpages ([65de42c](https://github.com/gr8monk3ys/tidy-roll/commit/65de42c5d67d107a43b34654f29864b7175c0d4d))

## [Unreleased]

### Changed

- **The mobile app now carries the Tidy Roll brand.** `mobile/src/theme.ts`
  moved to the shared sunset palette, the four mode-card gradients became
  centralized tokens instead of hardcoded hex values, and the app icons,
  adaptive icon (with a real gradient background layer) and splash are now
  generated from `assets/logo.svg` by `npm run assets`.
- **Support, privacy and terms are now first-class pages on the site**
  (`/support`, `/privacy`, `/terms`), sharing the site's design system instead
  of a separate stylesheet. The old `/privacy.html` and `/terms.html` URLs
  permanently redirect, and the duplicated `mobile/static-site/` bundle is gone.
- Contact points at GitHub Issues rather than an email address on a domain the
  project may not control.
- README and site copy lead with Android/iOS; the browser extension is
  presented as the optional bonus it is.

### Added

- **App store distribution exception to the licence**
  ([`LICENSE-EXCEPTION.md`](LICENSE-EXCEPTION.md)), so outside contributions can
  never block an iOS release, plus the matching term in `CONTRIBUTING.md`.
- Monetization policy in `docs/MARKETING.md` — no ads, ever — and
  `.github/FUNDING.yml`.

### Fixed

- Removed a contributor's local filesystem paths from
  `mobile/store/submission-checklist.md` before the repo goes public.

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
