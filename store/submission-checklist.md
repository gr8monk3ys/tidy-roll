# Store Submission Checklist (TidyRoll)

This repo gets you to a production-ready codebase, but App Store / Play rollout still requires the store-side setup.

## Accounts

- Apple Developer Program (App Store Connect access)
- Google Play Console account

## Build + Testing

- Create an EAS production build:
  - `eas build --profile production --platform ios`
  - `eas build --profile production --platform android`
- Test on real devices:
  - iOS via TestFlight
  - Android via Internal testing track

## Submit

- iOS: `eas submit --platform ios --profile production`
- Android: `eas submit --platform android --profile production`

## Required URLs

- Support URL (HTTPS)
- Privacy policy URL (HTTPS)

This repo includes a simple static support/privacy/terms site in `static-site/` that you can deploy.
Current deployment:
- Support: https://tidyroll-legal.vercel.app
- Privacy: https://tidyroll-legal.vercel.app/privacy.html
- Terms: https://tidyroll-legal.vercel.app/terms.html

## App Store Connect (iOS)

- App name: `TidyRoll`
- Bundle ID: `com.tidyroll.app` (`/Users/natalyscaturchio/code/tidy-roll/app.json:18`)
- Version: `1.0.0` (`/Users/natalyscaturchio/code/tidy-roll/app.json:5`)
- Build number: `1` (`/Users/natalyscaturchio/code/tidy-roll/app.json:19`)
- Privacy labels: see `store/store-privacy-answers.md`
- Upload screenshots (iPhone required; iPad optional)

## Google Play Console (Android)

- Package name: `com.tidyroll.app` (`/Users/natalyscaturchio/code/tidy-roll/app.json:22`)
- Version: `1.0.0` (`/Users/natalyscaturchio/code/tidy-roll/app.json:5`)
- Version code: `1` (`/Users/natalyscaturchio/code/tidy-roll/app.json:23`)
- Data safety: see `store/store-privacy-answers.md`
- Upload screenshots + feature graphic

## Metadata

- App Store copy: `store/app-store-metadata.md`
- Google Play copy: `store/google-play-metadata.md`
