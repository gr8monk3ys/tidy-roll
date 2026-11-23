# Everything runs on the device, with no backend

The extension makes no network requests and requests no host permissions; it reads and writes photos through the File System Access API and keeps only settings and lifetime stats in browser storage. The mobile app likewise works directly against the device photo library via `expo-media-library`. The only server-side piece is the static marketing site in `site/`. We chose this so photos never leave the device (see `PRIVACY.md`), at the cost of no sync, accounts or cross-device progress.

## Consequences

- Features that need a server (cloud backup, shared albums, analytics) are out of scope.
- The extension is Chromium-only because it depends on `showDirectoryPicker`.
