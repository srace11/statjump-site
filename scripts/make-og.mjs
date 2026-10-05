// Generates public/og.png (1200x630 link preview image) from app.config.ts.
// Run `npm run og` after changing the app name, tagline or colors, then commit the PNG.
import sharp from 'sharp';
import { readFile } from 'node:fs/promises';
import { app } from '../src/app.config.ts';

const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const wrap = (text, max) => {
  const lines = [''];
  for (const word of text.split(' ')) {
    const line = lines[lines.length - 1];
    if ((line + ' ' + word).trim().length > max) lines.push(word);
    else lines[lines.length - 1] = (line + ' ' + word).trim();
  }
  return lines.slice(0, 3);
};

// Stat Jump: navy ground, reversed lockup, slogan in Volt (brand colours from the design system).
const lockup = await sharp(await readFile(new URL('../public/brand/stat-jump-lockup-reverse.svg', import.meta.url)), { density: 300 })
  .resize({ width: 760 }).png().toBuffer();

const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630">
  <rect width="1200" height="630" fill="#0b1b33"/>
  <rect x="0" y="600" width="1200" height="30" fill="#9be15d"/>
  <text x="80" y="470" fill="#9be15d" font-family="Helvetica Neue, Helvetica, Arial, sans-serif" font-size="92" font-weight="800" font-style="italic">${esc(app.tagline.toUpperCase())}</text>
  <text x="80" y="540" fill="#a9b6cc" font-family="Helvetica Neue, Helvetica, Arial, sans-serif" font-size="30" font-weight="700">${esc(new URL(app.url).host)}</text>
</svg>`;

await sharp(Buffer.from(svg))
  .composite([{ input: lockup, left: 80, top: 90 }])
  .png()
  .toFile(new URL('../public/og.png', import.meta.url).pathname);
console.log('Wrote public/og.png');
