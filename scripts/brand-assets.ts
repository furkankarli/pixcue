/**
 * Generates the brand images from the wordmark data, into apps/studio/public:
 * the favicon (SVG), app icons for home screens (PNG), the web app manifest
 * and the social preview (og.png). Run `pnpm brand` after changing the
 * wordmark or the brand colors, and commit the results.
 */
import { writeFileSync } from 'node:fs';
import { createCanvas, GlobalFonts, type SKRSContext2D } from '@napi-rs/canvas';
import { BRAND, type Matrix, MONOGRAM, WORDMARK } from '../apps/studio/src/brand/wordmark.ts';

const root = new URL('..', import.meta.url);
const out = (name: string) => new URL(`apps/studio/public/${name}`, root);
const font = (path: string, family: string) => {
  if (!GlobalFonts.registerFromPath(new URL(path, root).pathname, family))
    throw new Error(`Could not load ${path}`);
};
font(
  'apps/studio/node_modules/@fontsource-variable/geist/files/geist-latin-wght-normal.woff2',
  'Geist',
);
font(
  'apps/studio/node_modules/@fontsource-variable/geist-mono/files/geist-mono-latin-wght-normal.woff2',
  'Geist Mono',
);

/** The public address, used for the social preview's footer. */
const SITE = 'pixcue.furkankarli.com';

/** Draws a matrix with its top-left at (x, y): LEDs `led` wide on a `pitch` grid. */
function drawMatrix(c: SKRSContext2D, m: Matrix, x: number, y: number, pitch: number, led: number) {
  for (const cell of m.cells) {
    if (cell.lit) continue;
    c.fillStyle = BRAND.unlit;
    c.fillRect(x + cell.x * pitch, y + cell.y * pitch, led, led);
  }
  c.save();
  c.shadowColor = 'rgba(255, 42, 42, 0.55)';
  c.shadowBlur = pitch * 0.9;
  c.fillStyle = BRAND.ink;
  for (const cell of m.cells)
    if (cell.lit) c.fillRect(x + cell.x * pitch, y + cell.y * pitch, led, led);
  c.restore();
}

/** Favicon: the monogram as vector LEDs on a rounded black tile. */
function favicon(): string {
  const { cols, rows, cells } = MONOGRAM;
  const rects = cells
    .map(
      (cell) =>
        `<rect x="${cell.x + 0.1}" y="${cell.y + 0.1}" width="0.8" height="0.8" fill="${cell.lit ? BRAND.ink : BRAND.unlit}"/>`,
    )
    .join('');
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="-0.5 -0.5 ${cols + 1} ${rows + 1}"><title>Pixcue</title><rect x="-0.5" y="-0.5" width="${cols + 1}" height="${rows + 1}" rx="2" fill="${BRAND.ground}"/>${rects}</svg>\n`;
}

/** A square app icon: the monogram filling most of a black square. */
function icon(size: number, share = 0.72): Buffer {
  const canvas = createCanvas(size, size);
  const c = canvas.getContext('2d');
  c.fillStyle = BRAND.ground;
  c.fillRect(0, 0, size, size);
  const pitch = Math.floor((size * share) / MONOGRAM.cols);
  const span = pitch * MONOGRAM.cols;
  const at = Math.round((size - span) / 2);
  drawMatrix(c, MONOGRAM, at, at, pitch, Math.round(pitch * 0.8));
  return canvas.toBuffer('image/png');
}

/** The social preview: the wordmark on its LED screen, a line about Pixcue and the address. */
function socialPreview(): Buffer {
  const W = 1200;
  const H = 630;
  const canvas = createCanvas(W, H);
  const c = canvas.getContext('2d');
  c.fillStyle = BRAND.ground;
  c.fillRect(0, 0, W, H);
  // The editor's pasteboard: a faint dot grid.
  c.fillStyle = 'rgba(255, 255, 255, 0.06)';
  for (let y = 15; y < H; y += 30) for (let x = 15; x < W; x += 30) c.fillRect(x, y, 2, 2);

  const pitch = 26;
  const screenW = WORDMARK.cols * pitch + 36;
  const screenH = WORDMARK.rows * pitch + 36;
  const sx = (W - screenW) / 2;
  const sy = 112;
  c.fillStyle = '#0a0a0b';
  c.beginPath();
  c.roundRect(sx, sy, screenW, screenH, 18);
  c.fill();
  c.strokeStyle = 'rgba(255, 255, 255, 0.12)';
  c.lineWidth = 2;
  c.stroke();
  drawMatrix(c, WORDMARK, sx + 18 + 2, sy + 18 + 2, pitch, 21);

  c.textAlign = 'center';
  c.fillStyle = BRAND.text;
  c.font = '600 46px Geist';
  c.fillText('Motion graphics for video creators', W / 2, 452);
  c.fillStyle = 'rgba(255, 255, 255, 0.64)';
  c.font = '400 27px Geist';
  c.fillText('Free and open source · Runs in your browser · No account', W / 2, 500);
  c.fillStyle = 'rgba(255, 255, 255, 0.5)';
  c.font = '400 22px "Geist Mono"';
  c.fillText(SITE, W / 2, 576);
  return canvas.toBuffer('image/png');
}

const manifest = {
  name: 'Pixcue',
  short_name: 'Pixcue',
  description: 'Free motion graphics for video creators, made in your browser.',
  start_url: '/',
  display: 'standalone',
  background_color: BRAND.ground,
  theme_color: BRAND.ground,
  icons: [
    { src: '/icon-192.png', sizes: '192x192', type: 'image/png' },
    { src: '/icon-512.png', sizes: '512x512', type: 'image/png' },
    { src: '/icon-maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
  ],
};

writeFileSync(out('favicon.svg'), favicon());
writeFileSync(out('apple-touch-icon.png'), icon(180));
writeFileSync(out('icon-192.png'), icon(192));
writeFileSync(out('icon-512.png'), icon(512));
// Maskable icons are cropped to a circle by some launchers: keep to the middle.
writeFileSync(out('icon-maskable-512.png'), icon(512, 0.56));
writeFileSync(out('og.png'), socialPreview());
writeFileSync(out('manifest.webmanifest'), `${JSON.stringify(manifest, null, 2)}\n`);
console.log('brand assets written to apps/studio/public');
