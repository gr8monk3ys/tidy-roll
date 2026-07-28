# Support, Privacy & Terms pages

The store-required pages are part of the showcase site in `site/` (Next.js),
not a separate static bundle. They share the site's design system, so they
stay on-brand automatically.

| Page | Source | URL |
| --- | --- | --- |
| Support | `site/app/support/page.tsx` | https://tidyroll-legal.vercel.app/support |
| Privacy policy | `site/app/privacy/page.tsx` | https://tidyroll-legal.vercel.app/privacy |
| Terms | `site/app/terms/page.tsx` | https://tidyroll-legal.vercel.app/terms |

The older `/privacy.html` and `/terms.html` URLs permanently redirect to the
new ones (see `redirects()` in `site/next.config.ts`), so anything already
submitted with those addresses keeps working.

## Deploying

```bash
cd site
npm ci
npm run build
npx vercel deploy --prod        # or push to main if the repo is Vercel-linked
```

## If you move to a custom domain

1. Add the domain in the Vercel project.
2. Update `SITE_URL` in `site/app/layout.tsx` (drives canonical + OpenGraph URLs).
3. Update the URLs in this file, `app-store-metadata.md`,
   `google-play-metadata.md`, and `submission-checklist.md`.
