# Chrome Web Store listing

Copy-paste-ready material for publishing the extension. (Google Play /
App Store metadata for the mobile app lives in
[`mobile/store/`](../mobile/store/).)

## Basics

| Field | Value |
| --- | --- |
| Name | Tidy Roll: Swipe to Clean Your Photos |
| Category | Productivity → Tools |
| Language | English |
| Summary (132 max) | Swipe right to keep, left to toss. Clean up any photo folder in minutes - fast, fun, and 100% on your device. |

## Detailed description

```text
Your downloads folder has 3,000 photos. Your screenshots folder is a museum
of expired boarding passes. Tidy Roll turns cleaning them up into something
you'll actually finish — a swipe deck for your files.

HOW IT WORKS
• Pick any folder — Tidy Roll deals your photos out one card at a time
• Swipe right (or press →) to keep, left (or ←) to toss
• Skip the hard calls with ↓, undo with Z
• Review everything you tossed on one summary screen, rescue anything
  with one click, then confirm

SAFE BY DEFAULT
Nothing touches your disk while you swipe. When you confirm, tossed files
move into a "Tidy Roll - Tossed" folder inside the folder you tidied — so
a hasty swipe never costs you a memory. Permanent delete is available in
settings if you like living dangerously (it asks twice).

PRIVATE BY DESIGN
No account. No uploads. No analytics. No network access at all. Tidy Roll
asks for a single permission (storage — for your settings and stats) and
reads your photos straight from disk via your browser's own folder picker.

FAST
• Keyboard-first: tidy hundreds of photos in minutes
• Videos play right on the card
• Review oldest-first, newest-first, largest-first, or shuffled
• Live counter of the space you're about to reclaim, plus lifetime stats
• Recent folders to pick up where you left off

Try the built-in demo roll before pointing it at real files.

Also tidying phones: Tidy Roll's companion mobile app for Android and iOS
lives at github.com/gr8monk3ys/tidy-roll.
```

## Assets

| Asset | File |
| --- | --- |
| Icon 128 | `extension/icons/icon128.png` |
| Screenshots (1280×800) | `assets/screenshots/01-home.png`, `02-deck.png`, `03-summary.png`, `04-done.png` |
| Small promo tile (440×280) | `assets/promo/small-tile-440x280.png` |
| Marquee (1400×560) | `assets/promo/marquee-1400x560.png` |

## Privacy tab answers

- **Single purpose:** Review photos/videos in a user-chosen local folder
  and move or delete the ones the user discards.
- **Permission justification (`storage`):** Persists user settings (review
  order, toss mode) and aggregate lifetime stats locally.
- **Host permissions:** None requested.
- **Remote code:** None — all code is packaged; no external scripts, fonts,
  or requests.
- **Data usage:** No user data is collected or transmitted. Certify the
  "does not collect or use data" disclosures accordingly.
- **Privacy policy URL:** `https://github.com/gr8monk3ys/tidy-roll/blob/main/PRIVACY.md`

## Publish steps

1. `npm run package` → upload `dist/tidy-roll-v<version>.zip`.
2. Fill the listing from this file; upload the four screenshots and both
   promo tiles.
3. Complete the privacy tab with the answers above.
4. Submit for review. MV3, no host permissions, no remote code — reviews
   are typically quick.
