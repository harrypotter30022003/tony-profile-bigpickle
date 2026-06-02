// RSS 2.0 feed for blog articles.
// Output: /api/rss.xml (or /api/rss for content negotiation)

import { kv } from '@vercel/kv';
import fs from 'fs';
import path from 'path';

const SITE_URL = 'https://me.tony.do';
const SITE_TITLE = "Tony Do — Senior PM, Tech Lead, AI Builder";
const SITE_DESCRIPTION = 'Insights on product management, AI, and building tech teams in Southeast Asia.';
const SITE_AUTHOR = 'Do Minh Tuan (Tony)';

const LOCAL_DATA = path.join(process.cwd(), 'src/admin/data.json');

function escapeXml(str = '') {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function cdata(str = '') {
  // CDATA cannot contain "]]>"
  return String(str).replace(/]]>/g, ']]&gt;');
}

function stripMarkdown(str = '') {
  return String(str)
    .replace(/^#{1,6}\s+/gm, '')
    .replace(/\*\*(.+?)\*\*/g, '$1')
    .replace(/_(.+?)_/g, '$1')
    .replace(/`(.+?)`/g, '$1')
    .replace(/\[(.+?)\]\((.+?)\)/g, '$1 ($2)')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

function buildItem(article) {
  const url = `${SITE_URL}/#blog/${article.slug}`;
  const pubDate = new Date(article.date).toUTCString();
  const description = stripMarkdown((article.summary || '') + '\n\n' + (article.content || '').slice(0, 500));
  const categories = article.category ? `<category>${escapeXml(article.category)}</category>` : '';
  const image = article.image ? `
    <enclosure url="${escapeXml(article.image)}" type="image/jpeg" length="0" />` : '';

  return `    <item>
      <title>${escapeXml(article.title)}</title>
      <link>${url}</link>
      <guid isPermaLink="false">${escapeXml(article.slug)}</guid>
      <pubDate>${pubDate}</pubDate>
      <author>noreply@tony.do (${escapeXml(SITE_AUTHOR)})</author>
      <description><![CDATA[${cdata(description)}]]></description>
      ${categories}
      ${image}
    </item>`;
}

async function getArticles() {
  let articles = [];
  if (process.env.VERCEL && process.env.KV_REST_API_URL) {
    try {
      const data = await kv.get('portfolio_articles');
      if (Array.isArray(data)) articles = data;
    } catch (err) {
      console.error('KV load failed:', err);
    }
  }
  if (articles.length === 0 && fs.existsSync(LOCAL_DATA)) {
    try {
      const local = JSON.parse(fs.readFileSync(LOCAL_DATA, 'utf8'));
      if (Array.isArray(local.blog)) articles = local.blog;
    } catch (err) {
      console.error('Local load failed:', err);
    }
  }
  return articles;
}

export default async function handler(req, res) {
  res.setHeader('Content-Type', 'application/rss+xml; charset=utf-8');
  res.setHeader('Cache-Control', 'public, max-age=300, s-maxage=300'); // 5 min

  const articles = (await getArticles())
    .slice()
    .sort((a, b) => new Date(b.date) - new Date(a.date))
    .slice(0, 30); // Latest 30 articles

  const lastBuildDate = articles.length
    ? new Date(articles[0].date).toUTCString()
    : new Date().toUTCString();

  const items = articles.map(buildItem).join('\n');

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom" xmlns:content="http://purl.org/rss/1.0/modules/content/" xmlns:dc="http://purl.org/dc/elements/1.1/">
  <channel>
    <title>${escapeXml(SITE_TITLE)}</title>
    <link>${SITE_URL}</link>
    <description>${escapeXml(SITE_DESCRIPTION)}</description>
    <language>en-us</language>
    <lastBuildDate>${lastBuildDate}</lastBuildDate>
    <atom:link href="${SITE_URL}/api/rss" rel="self" type="application/rss+xml" />
    <generator>Tony Do Portfolio RSS</generator>
${items}
  </channel>
</rss>`;

  res.status(200).send(xml);
}
