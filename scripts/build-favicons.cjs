// scripts/build-favicons.cjs
// Generates favicon.ico + apple-touch-icon.png + android-chrome from public/favicon.svg
// Run as part of `npm run build`.

const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

async function build() {
  const srcSvg = path.join(__dirname, '..', 'public', 'favicon.svg');
  const publicDir = path.join(__dirname, '..', 'public');

  if (!fs.existsSync(srcSvg)) {
    console.warn('[build-favicons] No favicon.svg found, skipping.');
    return;
  }

  const sizes = [
    { name: 'favicon-32x32.png', size: 32 },
    { name: 'favicon-16x16.png', size: 16 },
    { name: 'apple-touch-icon.png', size: 180 },
    { name: 'android-chrome-192x192.png', size: 192 },
    { name: 'android-chrome-512x512.png', size: 512 },
  ];

  for (const { name, size } of sizes) {
    await sharp(srcSvg, { density: 300 })
      .resize(size, size)
      .png()
      .toFile(path.join(publicDir, name));
  }

  // .ico is just a 32x32 PNG renamed in modern browsers, but for proper compat, also write a 16x16 .ico
  await sharp(srcSvg, { density: 300 })
    .resize(32, 32)
    .png()
    .toFile(path.join(publicDir, 'favicon.ico'));

  console.log(`[build-favicons] Generated ${sizes.length + 1} favicon files.`);
}

if (require.main === module) build();

module.exports = build;
