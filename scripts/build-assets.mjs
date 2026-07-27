/**
 * Tidy Roll — brand asset builder.
 *
 * Rasterizes assets/logo.svg into the extension icons and renders the
 * README banner and Chrome Web Store promo images. Committed assets are
 * the output of this script; re-run it after editing the logo:
 *
 *   npm run assets
 *
 * Requires `playwright` to be resolvable (a global install works:
 * `npm i -g playwright` plus a Chromium it can launch).
 */

import { createRequire } from 'node:module';
import { pathToFileURL } from 'node:url';
import { mkdir, readFile } from 'node:fs/promises';
import path from 'node:path';

const require = createRequire(import.meta.url);

function loadPlaywright() {
  try {
    return require('playwright');
  } catch {
    // Fall back to a global install (npm i -g playwright).
    const globalRoot = process.env.NODE_PATH || '/opt/node22/lib/node_modules';
    return createRequire(path.join(globalRoot, 'noop.js'))('playwright');
  }
}

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const LOGO = path.join(ROOT, 'assets', 'logo.svg');

const BRAND = {
  gradA: '#FF7A59',
  gradB: '#FF3D81',
  ink: '#0F1220',
  surface: '#181D31',
  line: '#2C3352',
  text: '#F4F5FB',
  muted: '#9AA1BC',
};

const FONT_CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700;800&display=swap');
  * { box-sizing: border-box; margin: 0; }
  body {
    font-family: 'Inter', -apple-system, 'Segoe UI', Roboto, sans-serif;
    background: ${BRAND.ink};
    color: ${BRAND.text};
    -webkit-font-smoothing: antialiased;
  }
`;

function promoHTML({ width, height, markSize, titleSize, taglineSize, showCards, logoSVG, photoSVG }) {
  return `<!DOCTYPE html><html><head><style>
    ${FONT_CSS}
    .stage {
      position: relative; width: ${width}px; height: ${height}px; overflow: hidden;
      display: flex; align-items: center; justify-content: center; gap: ${Math.round(width * 0.045)}px;
      background:
        radial-gradient(${width * 0.55}px ${height * 0.9}px at 8% -12%, rgba(255,122,89,.22), transparent 65%),
        radial-gradient(${width * 0.6}px ${height * 0.95}px at 96% 115%, rgba(255,61,129,.20), transparent 65%),
        ${BRAND.ink};
    }
    .mark { width: ${markSize}px; height: ${markSize}px; flex: none;
      filter: drop-shadow(0 ${Math.round(markSize * 0.1)}px ${Math.round(markSize * 0.3)}px rgba(255,70,110,.45)); }
    .mark svg { width: 100%; height: 100%; display: block; }
    .copy h1 { font-size: ${titleSize}px; font-weight: 800; letter-spacing: -0.03em; }
    .copy h1 span { background: linear-gradient(135deg, ${BRAND.gradA}, ${BRAND.gradB});
      -webkit-background-clip: text; background-clip: text; color: transparent; }
    .copy p { margin-top: ${Math.round(taglineSize * 0.45)}px; font-size: ${taglineSize}px; color: ${BRAND.muted}; font-weight: 600; }
    .cards { position: relative; width: ${Math.round(height * 0.56)}px; height: ${Math.round(height * 0.74)}px; flex: none; }
    .ghost { position: absolute; inset: 0; border-radius: 16px; background: ${BRAND.surface};
      border: 1px solid ${BRAND.line}; transform: rotate(-10deg) translateX(-10%); opacity: .55; }
    .photo { position: absolute; inset: 0; border-radius: 16px; overflow: hidden;
      border: 6px solid #fff; transform: rotate(7deg); box-shadow: 0 20px 44px rgba(0,0,0,.5); }
    .photo svg { width: 100%; height: 100%; display: block; }
    .photo .stamp { position: absolute; top: 9%; left: 8%; transform: rotate(-14deg);
      padding: .12em .45em; border: ${Math.max(3, Math.round(height * 0.012))}px solid #34D399; border-radius: .3em;
      color: #34D399; font-size: ${Math.round(height * 0.085)}px; font-weight: 800; letter-spacing: .12em;
      background: none; }
  </style></head><body>
    <div class="stage">
      <div class="mark">${logoSVG}</div>
      <div class="copy">
        <h1>Tidy&nbsp;<span>Roll</span></h1>
        <p>Swipe your camera roll clean.</p>
      </div>
      ${showCards ? `<div class="cards"><i class="ghost"></i><div class="photo">${photoSVG}<span class="stamp">KEEP</span></div></div>` : ''}
    </div>
  </body></html>`;
}

async function main() {
  const { chromium } = loadPlaywright();
  const browser = await chromium.launch();
  const page = await browser.newPage();

  const logoSVG = await readFile(LOGO, 'utf8');
  const photoSVG = (await readFile(
    path.join(ROOT, 'extension', 'app', 'samples', 'sunset-01.svg'), 'utf8',
  )).replace('<svg ', '<svg preserveAspectRatio="xMidYMid slice" ');

  // --- extension icons ---------------------------------------------------
  await mkdir(path.join(ROOT, 'extension', 'icons'), { recursive: true });
  for (const size of [16, 32, 48, 128]) {
    await page.setViewportSize({ width: size, height: size });
    await page.goto(pathToFileURL(LOGO).href);
    await page.screenshot({
      path: path.join(ROOT, 'extension', 'icons', `icon${size}.png`),
      omitBackground: true,
    });
  }
  // Large master for docs / store artwork.
  await page.setViewportSize({ width: 512, height: 512 });
  await page.goto(pathToFileURL(LOGO).href);
  await page.screenshot({ path: path.join(ROOT, 'assets', 'icon-512.png'), omitBackground: true });
  console.log('icons: 16 32 48 128 + 512 written');

  // --- README banner -----------------------------------------------------
  await page.goto('about:blank'); // leave the SVG document so setContent works
  await page.setViewportSize({ width: 1280, height: 400 });
  await page.setContent(promoHTML({
    width: 1280, height: 400, markSize: 168, titleSize: 84, taglineSize: 26, showCards: true,
    logoSVG, photoSVG,
  }));
  await page.waitForTimeout(600); // give the webfont a beat to load
  await page.screenshot({ path: path.join(ROOT, 'assets', 'banner.png') });
  console.log('banner written');

  // --- Chrome Web Store promo images -------------------------------------
  await mkdir(path.join(ROOT, 'assets', 'promo'), { recursive: true });
  await page.setViewportSize({ width: 440, height: 280 });
  await page.setContent(promoHTML({
    width: 440, height: 280, markSize: 108, titleSize: 44, taglineSize: 15, showCards: false,
    logoSVG, photoSVG,
  }));
  await page.waitForTimeout(600);
  await page.screenshot({ path: path.join(ROOT, 'assets', 'promo', 'small-tile-440x280.png') });

  await page.setViewportSize({ width: 1400, height: 560 });
  await page.setContent(promoHTML({
    width: 1400, height: 560, markSize: 216, titleSize: 96, taglineSize: 30, showCards: true,
    logoSVG, photoSVG,
  }));
  await page.waitForTimeout(600);
  await page.screenshot({ path: path.join(ROOT, 'assets', 'promo', 'marquee-1400x560.png') });
  console.log('promo tiles written');
  // (The site's social/OG card is generated in code by site/app/opengraph-image.tsx.)

  await browser.close();
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
