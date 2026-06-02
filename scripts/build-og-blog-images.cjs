// scripts/build-og-blog-images.cjs
// Pre-renders branded OG images for every default blog article at build time.
// Output: dist/og/blog/<slug>.png (1200x630)
//
// Each image: article hero photo (Unsplash) + dark gradient overlay + article title + author.

const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const BLOG_DATA_FILE = path.join(__dirname, '..', 'api', '_lib.js');
const PUBLIC_DIR = path.join(__dirname, '..', 'public', 'og', 'blog');
const DIST_DIR = path.join(__dirname, '..', 'dist', 'og', 'blog');

async function ensureDir(dir) {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

function escapeXml(s) {
  return String(s || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function wrapText(text, maxCharsPerLine, maxLines = 3) {
  const words = text.split(/\s+/);
  const lines = [];
  let cur = '';
  for (const w of words) {
    if ((cur + ' ' + w).trim().length > maxCharsPerLine) {
      lines.push(cur.trim());
      cur = w;
      if (lines.length >= maxLines) break;
    } else {
      cur = (cur + ' ' + w).trim();
    }
  }
  if (cur && lines.length < maxLines) lines.push(cur);
  if (lines.length === maxLines) {
    const lastWords = words.slice(words.indexOf(lines[lines.length - 1].split(' ').pop()) + 1);
    if (lastWords.length > 0) {
      const last = lines[maxLines - 1];
      lines[maxLines - 1] = (last + ' ' + lastWords.join(' ')).slice(0, maxCharsPerLine - 1) + '…';
    }
  }
  return lines;
}

function buildSvg(article) {
  const titleLines = wrapText(article.title, 38, 3);
  const titleSvg = titleLines.map((line, i) =>
    `<text x="60" y="${340 + i * 64}" font-family="Inter, -apple-system, sans-serif" font-size="56" font-weight="800" fill="#ffffff">${escapeXml(line)}</text>`
  ).join('\n');

  const categoryColor = '#00f5d4';
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 630" width="1200" height="630">
  <defs>
    <linearGradient id="bg" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="rgba(0,0,0,0)"/>
      <stop offset="40%" stop-color="rgba(0,0,0,0)"/>
      <stop offset="100%" stop-color="rgba(0,0,0,0.95)"/>
    </linearGradient>
    <linearGradient id="accent" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="${categoryColor}"/>
      <stop offset="100%" stop-color="#7b2cbf"/>
    </linearGradient>
  </defs>
  <image href="${escapeXml(article.image)}" x="0" y="0" width="1200" height="630" preserveAspectRatio="xMidYMid slice"/>
  <rect x="0" y="0" width="1200" height="630" fill="url(#bg)"/>
  <rect x="60" y="500" width="80" height="6" fill="url(#accent)" rx="3"/>
  <text x="150" y="510" font-family="Inter, -apple-system, sans-serif" font-size="20" font-weight="600" fill="#cccccc">${escapeXml(article.author || 'Do Minh Tuan')}</text>
  <text x="60" y="555" font-family="Inter, -apple-system, sans-serif" font-size="18" font-weight="400" fill="#999999">me.tony.do</text>
  <text x="60" y="290" font-family="Inter, -apple-system, sans-serif" font-size="16" font-weight="700" fill="${categoryColor}" letter-spacing="3">${escapeXml((article.category || 'TECH').toUpperCase())}</text>
  ${titleSvg}
</svg>`;
}

async function fetchDefaultArticles() {
  // Use the existing data endpoint to get the merged article list
  // (works in both build-time and post-deploy contexts)
  const { execSync } = require('child_process');
  try {
    // Try reading the seed file directly
    const src = fs.readFileSync(BLOG_DATA_FILE, 'utf8');
    const start = src.indexOf('export const defaultBlogArticles = [');
    const end = src.indexOf('];', start) + 2;
    const arrayText = src.substring(start + 'export const defaultBlogArticles = '.length, end);
    return eval(arrayText);
  } catch (e) {
    console.error('Failed to parse defaultBlogArticles:', e.message);
    return [];
  }
}

async function build() {
  const articles = await fetchDefaultArticles();
  if (articles.length === 0) {
    console.warn('[build-og-blog-images] No articles found, skipping.');
    return;
  }

  await ensureDir(PUBLIC_DIR);
  await ensureDir(DIST_DIR);

  let count = 0;
  for (const article of articles) {
    if (!article.slug || !article.title || !article.image) continue;
    const svg = buildSvg(article);
    const outPath = path.join(PUBLIC_DIR, `${article.slug}.png`);
    const distPath = path.join(DIST_DIR, `${article.slug}.png`);
    try {
      await sharp(Buffer.from(svg), { density: 96 })
        .resize(1200, 630)
        .png({ quality: 85, compressionLevel: 9 })
        .toFile(outPath);
      fs.copyFileSync(outPath, distPath);
      const size = fs.statSync(outPath).size;
      console.log(`  ✓ ${article.slug}.png (${(size / 1024).toFixed(1)} KB)`);
      count++;
    } catch (e) {
      console.error(`  ✗ Failed for ${article.slug}:`, e.message);
    }
  }
  console.log(`[build-og-blog-images] Generated ${count} article OG images.`);
}

if (require.main === module) build();

module.exports = build;
