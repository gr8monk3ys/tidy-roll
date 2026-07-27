# Tidy Roll Privacy Policy

_Last updated: 2026-07-27_

Tidy Roll is built on a simple rule: **your photos are yours, and they never
leave your device.**

## What the browser extension collects

Nothing. The extension:

- makes **no network requests** — there is no server, no analytics, no
  telemetry, no crash reporting, and no third-party SDKs;
- requests **no host permissions** — it cannot read or modify any website;
- uses the browser's `storage` permission only to save your settings
  (review order, toss mode, etc.) and your lifetime tidying stats
  (counts and byte totals — never file names or file contents) locally
  in your browser profile.

## How folder access works

When you pick a folder, the browser's own File System Access permission
prompt grants Tidy Roll temporary read/write access to that folder only.
Photos are read directly from disk to render them on screen and are never
transmitted anywhere. Folders you have tidied recently are remembered
locally (in the extension's own IndexedDB) so you can jump back in; the
browser re-asks for permission before any of them can be reopened.

Files you toss are, by default, moved to a `Tidy Roll - Tossed` folder
inside the folder you are tidying. If you enable permanent delete in
settings, tossed files are deleted from disk only after you confirm the
summary screen.

## The mobile app (Android / iOS)

The mobile app in [`mobile/`](mobile/) follows the same rule. It requests
the operating system's photo-library permission to show and (only when you
confirm) delete photos, stores its settings and stats on your device, and
sends nothing to any server.

## Changes

If this policy ever changes, the change will be visible in this file's
git history.

## Contact

Questions? Open an issue at
[github.com/gr8monk3ys/tidy-roll](https://github.com/gr8monk3ys/tidy-roll/issues)
or use the contact channels in [SECURITY.md](SECURITY.md).
