/**
 * Tidy Roll — screenshot builder.
 *
 * Serves the extension directory over localhost, drives the demo roll in
 * headless Chromium, and captures the 1280x800 screenshots used in the
 * README and the Chrome Web Store listing.
 *
 *   npm run screenshots
 *
 * Requires `playwright` to be resolvable (see build-assets.mjs).
 */

import { createRequire } from 'node:module';
import { createServer } from 'node:http';
import { readFile, mkdir } from 'node:fs/promises';
import path from 'node:path';

const require = createRequire(import.meta.url);

function loadPlaywright() {
  try {
    return require('playwright');
  } catch {
    const globalRoot = process.env.NODE_PATH || '/opt/node22/lib/node_modules';
    return createRequire(path.join(globalRoot, 'noop.js'))('playwright');
  }
}

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const OUT = path.join(ROOT, 'assets', 'screenshots');

const MIME = {
  '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css',
  '.svg': 'image/svg+xml', '.png': 'image/png', '.json': 'application/json',
};

function serve(rootDir) {
  const server = createServer(async (request, response) => {
    try {
      const url = new URL(request.url, 'http://localhost');
      const file = path.join(rootDir, path.normalize(url.pathname));
      const body = await readFile(file);
      response.writeHead(200, { 'Content-Type': MIME[path.extname(file)] || 'application/octet-stream' });
      response.end(body);
    } catch {
      response.writeHead(404);
      response.end('not found');
    }
  });
  return new Promise((resolve) => {
    server.listen(0, '127.0.0.1', () => resolve(server));
  });
}

async function main() {
  const { chromium } = loadPlaywright();
  const server = await serve(path.join(ROOT, 'extension'));
  const base = `http://127.0.0.1:${server.address().port}`;
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
  await mkdir(OUT, { recursive: true });

  // 1 — home screen
  await page.goto(`${base}/app/app.html`);
  await page.waitForTimeout(400);
  await page.screenshot({ path: path.join(OUT, '01-home.png') });
  console.log('01-home.png');

  // 2 — deck mid-swipe, KEEP stamp showing
  await page.goto(`${base}/app/app.html?demo=1`);
  await page.waitForSelector('.card.top img');
  await page.waitForTimeout(500);
  const card = await page.locator('.card.top').boundingBox();
  const cx = card.x + card.width / 2;
  const cy = card.y + card.height / 2;
  await page.mouse.move(cx, cy);
  await page.mouse.down();
  await page.mouse.move(cx + 85, cy - 12, { steps: 12 });
  await page.screenshot({ path: path.join(OUT, '02-deck.png') });
  console.log('02-deck.png');
  await page.mouse.move(cx, cy, { steps: 6 });
  await page.mouse.up();
  await page.waitForTimeout(400);

  // 3 — decide the whole roll (toss the dupes, blur, and screenshot), then summary
  const decisions = ['right', 'left', 'left', 'right', 'right', 'right',
    'right', 'right', 'right', 'left', 'left', 'right'];
  for (const direction of decisions) {
    await page.keyboard.press(direction === 'right' ? 'ArrowRight' : 'ArrowLeft');
    await page.waitForTimeout(180);
  }
  await page.waitForSelector('#screen-summary.active');
  await page.waitForTimeout(600);
  await page.screenshot({ path: path.join(OUT, '03-summary.png') });
  console.log('03-summary.png');

  // 4 — done screen
  await page.click('#btn-confirm');
  await page.waitForSelector('#screen-done.active');
  await page.waitForTimeout(400);
  await page.screenshot({ path: path.join(OUT, '04-done.png') });
  console.log('04-done.png');

  await browser.close();
  server.close();
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
