# Deploy Support + Privacy Policy Site

This repo includes a minimal static site in `static-site/` for:
- Support URL (index)
- Privacy policy
- Terms

## Deploy to Vercel (fastest)

1. Install/login (one-time):
   - `npx vercel login`
2. Deploy:
   - `npx vercel deploy --prod ./static-site`

Vercel will print URLs. Use:
- Support URL: `<your-url>/`
- Privacy policy URL: `<your-url>/privacy.html`
- Terms URL: `<your-url>/terms.html`

Current deployment:
- Support: https://tidyroll-legal.vercel.app
- Privacy: https://tidyroll-legal.vercel.app/privacy.html
- Terms: https://tidyroll-legal.vercel.app/terms.html

## Deploy to Cloudflare Pages (alternative)

Create a Pages project with `static-site/` as the output directory and no build command.
