// scripts/build-og-image.cjs
// Converts og-image.svg → og-image.png for Open Graph / Twitter card compatibility.
// Run automatically as part of `npm run build`.

const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

async function build() {
  const srcSvg = path.join(__dirname, '..', 'public', 'og-image.svg');
  const dstPng = path.join(__dirname, '..', 'public', 'og-image.png');

  if (!fs.existsSync(srcSvg)) {
    console.warn('[build-og-image] No og-image.svg found, skipping.');
    return;
  }

  try {
    await sharp(srcSvg, { density: 96 })
      .resize(1200, 630)
      .png({ quality: 92, compressionLevel: 9 })
      .toFile(dstPng);
    const size = fs.statSync(dstPng).size;
    console.log(`[build-og-image] Generated ${dstPng} (${(size / 1024).toFixed(1)} KB)`);
  } catch (e) {
    console.error('[build-og-image] Failed:', e.message);
    process.exit(1);
  }
}

if (require.main === module) build();

module.exports = build;
