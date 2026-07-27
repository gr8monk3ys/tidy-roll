# Tidy Roll — Marketing Playbook

The product is done and verifiably works. This is the plan for getting it in
front of people. Live site: <https://tidyroll-legal.vercel.app>.

## Positioning

**One-liner:** Tinder for your camera roll — swipe right to keep, left to toss.

**Elevator pitch:** Everyone has thousands of photos they'll never look at
again, and cleaning them up feels like homework. Tidy Roll turns it into a
game: photos come at you one card at a time, you swipe, and a counter shows
the space you're winning back. Nothing is deleted until you confirm, and
nothing ever leaves your device.

**Category:** Personal productivity / digital decluttering. Adjacent to
"digital minimalism" and "storage full" pain.

### The three messaging pillars

1. **Fun** — it's a game, not a chore. The swipe is the hook; the "MB
   reclaimed" counter is the dopamine. Lead with this everywhere.
2. **Safe** — nothing touches disk while you swipe; the summary screen and
   safety folder mean a stray swipe never costs a memory. This converts the
   hesitant.
3. **Private** — no account, no upload, no analytics, open source, one
   permission. This wins the privacy-conscious crowd and is the sharpest
   differentiator vs. cloud "storage cleaner" apps (which are notorious
   data-grabbers).

### Tagline bank

- Swipe your camera roll clean. *(primary)*
- Right to keep. Left to toss. *(mechanic)*
- Cleaning up, but make it satisfying. *(social)*
- 3,000 photos. Two minutes. *(outcome)*
- Your photos never leave your device. Period. *(privacy)*

## Audiences

| Segment | Pain | Where they are | Lead pillar |
| --- | --- | --- | --- |
| "Storage full" phone owners | iOS/Android nag screens, can't take a photo at the concert | TikTok/Reels/Shorts, r/iphone, r/Android | Fun |
| Data hoarders & self-hosters | 400 GB of unsorted dumps | r/DataHoarder, r/selfhosted, Hacker News | Private + keyboard-first |
| Photographers | SD card triage after every shoot | r/photography, photo Discords | Speed (largest-first sort) |
| Parents | 10k near-identical kid photos | Facebook groups, Instagram | Safe |
| Privacy-conscious | Distrust cleaner apps that phone home | HN, Lobsters, Mastodon, r/privacy | Private + open source |

## Launch sequence

**Phase 0 — ready (done):** live site with interactive demo, README with
screenshots, store zip, privacy policy, store listing copy.

**Phase 1 — stores:** submit the extension to the Chrome Web Store
(`docs/STORE_LISTING.md` has everything). Start EAS production builds and
store submissions for mobile (`mobile/store/submission-checklist.md`).
Store review lead time is the long pole — start it first.

**Phase 2 — community launch (pick one week, in this order):**

- **Product Hunt** — Tuesday–Thursday launch. Assets ready: logo, tagline,
  gallery (marquee + 4 screenshots), first comment explaining the safety
  folder + privacy stance. The interactive site demo is the differentiator —
  link it prominently.
- **Hacker News** — "Show HN: Tidy Roll – Tinder-style swipe deck to clean
  up your photo folders (no upload, MV3, no build step)". Lead with the
  engineering: File System Access API, zero dependencies, pure-logic core
  with tests. HN loves auditable privacy claims.
- **Reddit** — tailored posts, not cross-posts: r/DataHoarder (triage
  workflow angle), r/chrome_extensions, r/SideProject, r/InternetIsBeautiful
  (the live demo), r/androidapps + r/iosapps when mobile ships.

**Phase 3 — short-form video (evergreen):** screen recordings of a real
cleanup session are inherently satisfying content. Formats that work:
"watching me delete 2,000 screenshots in 4 minutes", before/after storage
bars, the toss-count going up with the sound on. Post natively to
TikTok/Reels/Shorts; 3 posts/week for the first month.

**Phase 4 — durable channels:** SEO blog posts on the site ("How to clean
up 10,000 photos without losing your mind", "Why photo cleaner apps want
your data — and how to avoid them"), a launch listing on AlternativeTo
(alternative to: Slidebox, Swipewipe, Gemini Photos), and awesome-lists for
browser extensions.

## Keywords

**SEO/site:** photo cleanup, delete duplicate photos, clean camera roll,
photo declutter, swipe to delete photos, free up storage, tinder for photos.

**Chrome Web Store:** photo cleaner, folder cleanup, downloads folder,
declutter, storage.

**ASO (mobile):** camera roll cleaner, photo cleaner no ads, swipe photo
delete, storage cleaner private.

## Metrics that matter

- Site: demo completion rate (finishing the 7-card deck) → CTA clicks.
- Extension: Chrome Web Store installs + weekly users; GitHub stars as a
  proxy for the technical audience.
- Mobile: store installs, D7 retention.
- Qualitative: screenshots people share of their "done" screen — the
  "X GB reclaimed" number is the shareable artifact. Make it easy to brag.

## Voice & style

Playful, kind, a little cheeky ("Everything's a keeper!", "made with a
suspicious number of sunset photos"). Never guilt-trip about mess; the enemy
is the chore, not the user. Privacy claims are always specific and provable
— link the source, never say "we care about your privacy".

## Asset inventory

| Asset | Path |
| --- | --- |
| Logo (source of truth) | `assets/logo.svg` |
| Icon set + 512 master | `extension/icons/`, `assets/icon-512.png` |
| README banner | `assets/banner.png` |
| Store promo tiles | `assets/promo/` |
| Store screenshots (1280×800) | `assets/screenshots/` |
| OG/social card | generated at `/opengraph-image` on the live site |
| Store listing copy | `docs/STORE_LISTING.md` |
| Mobile store metadata | `mobile/store/` |
