// One-off (re-runnable) script that generates the PWA icon set from
// public/roofberries-logo.jpg. Re-run this if the logo ever changes.
//
// Usage: node scripts/generate-pwa-icons.js

const path = require('path');
const fs = require('fs');
const sharp = require('sharp');

const SRC = path.join(__dirname, '..', 'public', 'roofberries-logo.jpg');
const OUT_DIR = path.join(__dirname, '..', 'public', 'icons');

// Matches the app's own dark background (--background in globals.css) so
// the padding added around maskable icons — and any letterboxing — blends
// in on home screens/app switchers instead of showing a mismatched color.
const BG = '#000000';

async function makeIcon(size, outName) {
  await sharp(SRC).resize(size, size).png().toFile(path.join(OUT_DIR, outName));
}

/** Maskable icons get clipped into a circle/squircle/whatever shape the OS
 *  picks — only the inner ~80% ("safe zone") is guaranteed visible, so pad
 *  the logo down to fit within that instead of risking the wordmark
 *  getting clipped. */
async function makeMaskableIcon(size, outName) {
  const inner = Math.round(size * 0.8);
  const logo = await sharp(SRC).resize(inner, inner).toBuffer();
  await sharp({
    create: { width: size, height: size, channels: 3, background: BG },
  })
    .composite([{ input: logo, gravity: 'center' }])
    .png()
    .toFile(path.join(OUT_DIR, outName));
}

async function main() {
  fs.mkdirSync(OUT_DIR, { recursive: true });
  await makeIcon(192, 'icon-192.png');
  await makeIcon(512, 'icon-512.png');
  await makeMaskableIcon(192, 'icon-maskable-192.png');
  await makeMaskableIcon(512, 'icon-maskable-512.png');
  await makeIcon(180, 'apple-touch-icon.png'); // iOS: no maskable concept, no transparency needed
  console.log('PWA icons written to public/icons/');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
