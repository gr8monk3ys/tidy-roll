import { ImageResponse } from 'next/og';
import { readFile } from 'node:fs/promises';
import path from 'node:path';

export const runtime = 'nodejs';
export const alt = 'Tidy Roll — Swipe your camera roll clean';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

async function interFont(weight: 400 | 800) {
  const css = await fetch(
    `https://fonts.googleapis.com/css2?family=Inter:wght@${weight}&display=swap`,
    { headers: { 'User-Agent': 'Mozilla/5.0' } },
  ).then((response) => response.text());
  const url = css.match(/src: url\((.+?)\) format\('(?:woff2?|truetype)'\)/)?.[1];
  if (!url) throw new Error('font url not found');
  return fetch(url).then((response) => response.arrayBuffer());
}

export default async function OGImage() {
  const logo = await readFile(
    path.join(process.cwd(), 'public', 'assets', 'logo.svg'),
    'utf8',
  );
  const logoURI = `data:image/svg+xml,${encodeURIComponent(logo)}`;
  const [inter, interBold] = await Promise.all([interFont(400), interFont(800)]);

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 56,
          backgroundColor: '#0f1220',
          backgroundImage:
            'radial-gradient(660px 570px at 8% -12%, rgba(255,122,89,.22), transparent 65%), radial-gradient(720px 600px at 96% 115%, rgba(255,61,129,.20), transparent 65%)',
          fontFamily: 'Inter',
        }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={logoURI} alt="" width={230} height={230} />
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', fontSize: 96, fontWeight: 800, letterSpacing: '-0.03em', color: '#f4f5fb' }}>
            Tidy&nbsp;
            <span
              style={{
                backgroundImage: 'linear-gradient(135deg, #ff7a59, #ff3d81)',
                backgroundClip: 'text',
                color: 'transparent',
              }}
            >
              Roll
            </span>
          </div>
          <div style={{ display: 'flex', marginTop: 12, fontSize: 32, fontWeight: 400, color: '#9aa1bc' }}>
            Swipe your camera roll clean.
          </div>
        </div>
      </div>
    ),
    {
      ...size,
      fonts: [
        { name: 'Inter', data: inter, weight: 400, style: 'normal' },
        { name: 'Inter', data: interBold, weight: 800, style: 'normal' },
      ],
    },
  );
}
