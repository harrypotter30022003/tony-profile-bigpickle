import fs from 'fs';
import path from 'path';
import { kv } from '@vercel/kv';

const DATA_FILE = path.join(process.cwd(), 'src/admin/data.json');

const defaultBlogArticles = [
  { "slug": "save-hours-free-ai-tools-beginners", "date": "2026-05-15" },
  { "slug": "choosing-website-platform-small-business", "date": "2026-05-10" },
  { "slug": "ai-project-management-chatbots-run-team", "date": "2026-05-08" },
  { "slug": "why-website-slow-non-coder-guide", "date": "2026-05-05" },
  { "slug": "green-cloud-computing-save-money-planet", "date": "2026-05-01" }
];

export default async function handler(req, res) {
  res.setHeader('Content-Type', 'application/xml; charset=utf-8');
  res.setHeader('Cache-Control', 's-maxage=86400, stale-while-revalidate=3600');

  let blogArticles = defaultBlogArticles;

  try {
    if (process.env.VERCEL && process.env.KV_REST_API_URL) {
      try {
        const cloudData = await kv.get('portfolio_data');
        if (cloudData && cloudData.blog && cloudData.blog.length > 0) {
          blogArticles = cloudData.blog;
        }
      } catch (kvError) {
        console.error('Sitemap: KV fetch failed, falling back to disk:', kvError);
      }
    }

    if (blogArticles === defaultBlogArticles) {
      try {
        if (fs.existsSync(DATA_FILE)) {
          const fileData = JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
          if (fileData && fileData.blog && fileData.blog.length > 0) {
            blogArticles = fileData.blog;
          }
        }
      } catch (fsError) {
        console.error('Sitemap: Disk read failed, using default blog list:', fsError);
      }
    }
  } catch (err) {
    console.error('Sitemap generation error:', err);
  }

  const today = new Date().toISOString().split('T')[0];

  const seen = new Set();
  const normTitle = (s) => String(s || '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
  const titleWords = (s) => new Set(normTitle(s).split(' ').filter((w) => w.length > 3));
  const isNearDuplicate = (a, b) => {
    const wa = titleWords(a);
    const wb = titleWords(b);
    if (wa.size === 0 || wb.size === 0) return false;
    let overlap = 0;
    wa.forEach((w) => { if (wb.has(w)) overlap += 1; });
    return overlap / Math.max(wa.size, wb.size) >= 0.6;
  };
  const wordCount = (s) => String(s || '').trim().split(/\s+/).filter(Boolean).length;
  const MIN_SITEMAP_WORDS = 500;
  const uniqueArticles = [];
  [...blogArticles].sort((a, b) => new Date(b.date) - new Date(a.date)).forEach((post) => {
    if (!post.slug || seen.has(post.slug)) return;
    if (wordCount(post.content) < MIN_SITEMAP_WORDS) return;
    if (uniqueArticles.some((u) => isNearDuplicate(u.title, post.title))) return;
    seen.add(post.slug);
    uniqueArticles.push(post);
  });

  let xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>https://me.tony.do/</loc>
    <lastmod>${today}</lastmod>
    <changefreq>daily</changefreq>
    <priority>1.0</priority>
  </url>
  <url>
    <loc>https://me.tony.do/blog</loc>
    <lastmod>${today}</lastmod>
    <changefreq>daily</changefreq>
    <priority>0.8</priority>
  </url>
  <url>
    <loc>https://me.tony.do/about</loc>
    <changefreq>monthly</changefreq>
    <priority>0.7</priority>
  </url>
  <url>
    <loc>https://me.tony.do/contact</loc>
    <changefreq>monthly</changefreq>
    <priority>0.7</priority>
  </url>
  <url>
    <loc>https://me.tony.do/privacy-policy</loc>
    <lastmod>2026-05-24</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.3</priority>
  </url>
  <url>
    <loc>https://me.tony.do/terms</loc>
    <changefreq>monthly</changefreq>
    <priority>0.3</priority>
  </url>
  <url>
    <loc>https://me.tony.do/disclaimer</loc>
    <changefreq>monthly</changefreq>
    <priority>0.3</priority>
  </url>
`;

  uniqueArticles.forEach(post => {
    let postDate = today;
    if (post.date) {
      try {
        postDate = new Date(post.date).toISOString().split('T')[0];
      } catch (_e) {
        postDate = today;
      }
    }
    
    xml += `  <url>
    <loc>https://me.tony.do/blog/${post.slug}</loc>
    <lastmod>${postDate}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.7</priority>
  </url>\n`;
  });

  xml += `</urlset>`;

  return res.status(200).send(xml);
}
