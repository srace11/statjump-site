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

const iconPath = new URL(`../public${app.icon}`, import.meta.url);
const icon = await sharp(await readFile(iconPath)).resize(180, 180).png().toBuffer();
const tagline = wrap(app.tagline, 44)
  .map((l, i) => `<tspan x="80" dy="${i === 0 ? 0 : 52}">${esc(l)}</tspan>`)
  .join('');

const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630">
  <rect width="1200" height="630" fill="#0d0d10"/>
  <rect x="0" y="600" width="1200" height="30" fill="${app.colors.accent}"/>
  <text x="80" y="330" fill="#ffffff" font-family="Helvetica, Arial, sans-serif" font-size="88" font-weight="700">${esc(app.name)}</text>
  <text x="80" y="410" fill="#b4b4c2" font-family="Helvetica, Arial, sans-serif" font-size="40">${tagline}</text>
  <text x="80" y="140" fill="${app.colors.accentDark}" font-family="Helvetica, Arial, sans-serif" font-size="30" font-weight="700">${esc(new URL(app.url).host)}</text>
</svg>`;

await sharp(Buffer.from(svg))
  .composite([{ input: icon, left: 940, top: 90 }])
  .png()
  .toFile(new URL('../public/og.png', import.meta.url).pathname);
console.log('Wrote public/og.png');
