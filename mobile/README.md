# tidy-roll
A swipe UI for cleaning up your camera roll (iOS + Android) using Expo.

## Run

```bash
npm install
npm run ios
# or
npm run android
```

## Quality

```bash
npm run typecheck
npm run lint
```

## Builds (EAS)

This repo includes `eas.json` with `development`, `preview`, and `production` profiles.

```bash
# Android/iOS dev build (recommended for Android media-library testing)
eas build --profile development --platform android
eas build --profile development --platform ios

# Internal distribution builds
eas build --profile preview --platform android
eas build --profile preview --platform ios

# Store-ready builds
eas build --profile production --platform android
eas build --profile production --platform ios
```

Notes:
- iOS works in Expo Go.
- Android may require a development build for full media-library access on newer Android versions.

## Legal (Support/Privacy URLs)

See `store/deploy-legal-site.md`.
