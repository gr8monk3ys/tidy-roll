/**
 * Tidy Roll — demo roll.
 *
 * A bundled set of sample "photos" (SVG scenes) so people can feel the
 * swipe flow before pointing Tidy Roll at a real folder. Demo sessions
 * never touch the filesystem; sizes and dates are plausible fakes.
 */

const DAY = 86_400_000;

const SAMPLES = [
  { file: 'sunset-01.svg', name: 'IMG_2041.jpg', size: 3_481_204, daysAgo: 214 },
  { file: 'sunset-02.svg', name: 'IMG_2042.jpg', size: 3_512_997, daysAgo: 214 },
  { file: 'sunset-03.svg', name: 'IMG_2043.jpg', size: 3_396_150, daysAgo: 214 },
  { file: 'ocean.svg', name: 'IMG_1830.jpg', size: 2_804_223, daysAgo: 301 },
  { file: 'city.svg', name: 'IMG_2210.jpg', size: 4_112_580, daysAgo: 158 },
  { file: 'forest.svg', name: 'IMG_1502.jpg', size: 5_248_811, daysAgo: 402 },
  { file: 'desert.svg', name: 'IMG_1988.jpg', size: 2_366_402, daysAgo: 246 },
  { file: 'night.svg', name: 'IMG_2307.jpg', size: 1_922_034, daysAgo: 121 },
  { file: 'lake.svg', name: 'IMG_2119.jpg', size: 6_017_326, daysAgo: 187 },
  { file: 'blurry.svg', name: 'IMG_2044.jpg', size: 3_405_112, daysAgo: 214 },
  { file: 'screenshot.svg', name: 'Screenshot 2026-03-14.png', size: 812_450, daysAgo: 135 },
  { file: 'plant.svg', name: 'IMG_2450.jpg', size: 2_950_774, daysAgo: 64 },
];

export function demoItems() {
  const now = Date.now();
  return SAMPLES.map((sample, index) => ({
    id: `demo-${index}`,
    name: sample.name,
    path: sample.name,
    size: sample.size,
    lastModified: now - sample.daysAgo * DAY,
    kind: 'image',
    renderable: true,
    demo: true,
    url: new URL(`samples/${sample.file}`, import.meta.url).href,
  }));
}
