# Store Submission Checklist (Tidy Roll)

The codebase is production-ready; this covers the store-side setup that has to
happen in Apple's and Google's consoles.

## Accounts

- **Google Play Console** — $25, one time.
- **Apple Developer Program** — $99, billed annually. Apps are removed if the
  membership lapses. See `docs/MARKETING.md` for how this is funded.

> Launching Android first is the cheapest path: one $25 fee, no recurring cost.

## Contact details you must supply

- [ ] **Support email for App Store Connect.** Apple requires a working contact
      address on the app record. This is entered in the console, not in the
      repo. The published pages point users at GitHub Issues instead of an
      email, so no dead address ships in the app.
- [ ] Verify the support/privacy/terms URLs below resolve before submitting.

## Required URLs

- Support: https://tidyroll-legal.vercel.app/support
- Privacy: https://tidyroll-legal.vercel.app/privacy
- Terms: https://tidyroll-legal.vercel.app/terms

## Build + test

```bash
eas build --profile production --platform android
eas build --profile production --platform ios
```

Test on real devices — iOS via TestFlight, Android via the Internal testing
track — then submit:

```bash
eas submit --platform android --profile production
eas submit --platform ios --profile production
```

## App Store Connect (iOS)

- App name: `Tidy Roll`
- Bundle ID: `com.tidyroll.app` (`mobile/app.json` → `expo.ios.bundleIdentifier`)
- Version: `1.0.0` (`mobile/app.json` → `expo.version`)
- Build number: `1` (`mobile/app.json` → `expo.ios.buildNumber`)
- Privacy labels: see `store-privacy-answers.md`
- Screenshots: iPhone required, iPad optional

## Google Play Console (Android)

- Package name: `com.tidyroll.app` (`mobile/app.json` → `expo.android.package`)
- Version: `1.0.0` (`mobile/app.json` → `expo.version`)
- Version code: `1` (`mobile/app.json` → `expo.android.versionCode`)
- Data safety: see `store-privacy-answers.md`
- Screenshots plus a feature graphic

> Google is rolling out mandatory developer identity verification — required in
> Brazil, Indonesia, Singapore and Thailand from 30 September 2026, and
> globally during 2027. Budget time for the identity check.

## Metadata

- App Store copy: `app-store-metadata.md`
- Google Play copy: `google-play-metadata.md`

## Naming note

There is an existing App Store app called **TinyRoll** with a similar name and
overlapping feature set. The names differ ("tidy" vs "tiny") and "tidy"
describes the function, but if Apple raises a similarity objection under the
copycat guidelines, be ready to respond or to adjust the store display name.
