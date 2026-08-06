# Changelog

All notable changes to Tidy Roll are documented here. The format follows
[Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and versions follow
[Semantic Versioning](https://semver.org/).

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
- [`CODE_OF_CONDUCT.md`](CODE_OF_CONDUCT.md), so expectations are written down
  before the repo opens to the public.

### Fixed

- Removed a contributor's local filesystem paths from
  `mobile/store/submission-checklist.md` before the repo goes public.
- Seven files were missing their trailing newline; fixed by the pre-commit
  `end-of-file-fixer` hook, which CI's new `hygiene` job now enforces.

### Security

- **Dependency patches across the repo.** The mobile lockfile picks up the
  fixed `brace-expansion` (1.1.18), `fast-uri` (3.1.5), `js-yaml`, and `ws`
  releases (consolidating Dependabot PRs #23 and #24), and both `mobile/` and
  `site/` pin `postcss` ≥ 8.5.23 via npm `overrides` — closing every high
  severity advisory without waiting on the Expo SDK 57 / Next 16 majors. The
  site also pins `sharp` ≥ 0.35 for the libvips CVEs; `npm audit` for the site
  is now clean, and the 17 advisories left in `mobile/` are all moderates
  confined to Expo's dev-time CLI/prebuild tooling, to be cleared by the SDK 57
  migration (Dependabot PR #22).
- **CI no longer depends on private infrastructure.** The eight `org-*`
  workflows called reusable workflows in the private `gr8monk3ys/github` repo —
  which a public repo cannot use, so every one of them (including
  `org-release-please`, which fired on each push to `main`) would fail once the
  repo goes public. They're replaced by a public, self-contained set: a real
  [CodeQL](.github/workflows/codeql.yml) workflow for SAST (free on public
  repos), a `hygiene` job in [`ci.yml`](.github/workflows/ci.yml) running the
  repo's pre-commit hooks (including `detect-private-key`), and pinned Node 22
  setup for reproducible test runs. The placeholder `security-baseline.yml`
  (which only echoed a message), the deprecated `returntocorp/semgrep-action`
  workflow, and the Scorecard seed file are gone. Secret scanning, push
  protection, and Dependabot alerts activate natively when the repo flips
  public.

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
