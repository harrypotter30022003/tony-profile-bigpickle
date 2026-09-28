const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const DIST = path.join(ROOT, 'dist');

function esc(s) {
  return String(s || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function mdToText(md) {
  return String(md || '')
    .replace(/```[\s\S]*?```/g, ' ')
    .replace(/[#>*`_-]/g, ' ')
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    .replace(/\s+/g, ' ')
    .trim();
}

async function loadArticles() {
  try {
    const { pathToFileURL } = require('url');
    const lib = await import(pathToFileURL(path.join(ROOT, 'api', '_lib.js')).href);
    if (lib && Array.isArray(lib.defaultBlogArticles)) return lib.defaultBlogArticles;
  } catch (e) {
    console.error('Prerender: _lib import failed, trying data.json:', e.message);
  }
  try {
    const data = JSON.parse(fs.readFileSync(path.join(ROOT, 'src', 'admin', 'data.json'), 'utf8'));
    if (Array.isArray(data.blog) && data.blog.length > 0) return data.blog;
  } catch (e) {
    console.error('Prerender: data.json read failed:', e.message);
  }
  return [];
}

function pageShell({ title, desc, canonical, body, extra = '', spaAssets = '', ogImage = '', jsonLd = null }) {
  const ogImageTags = ogImage ? `<meta property="og:image" content="${esc(ogImage)}" />
<meta name="twitter:card" content="summary_large_image" />
<meta name="twitter:title" content="${esc(title)}" />
<meta name="twitter:description" content="${esc(desc)}" />
<meta name="twitter:image" content="${esc(ogImage)}" />` : '';
  const jsonLdTag = jsonLd ? `<script type="application/ld+json">${JSON.stringify(jsonLd)}</script>` : '';
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<title>${esc(title)}</title>
<meta name="description" content="${esc(desc)}" />
<link rel="canonical" href="${canonical}" />
<meta property="og:title" content="${esc(title)}" />
<meta property="og:description" content="${esc(desc)}" />
<meta property="og:url" content="${canonical}" />
<meta property="og:type" content="website" />
<meta name="robots" content="index, follow, max-image-preview:large" />
${ogImageTags}
${jsonLdTag}
${extra}
${spaAssets}
</head>
<body>
<div id="root"><main id="main-content">
${body}
<p><a href="/">Home</a> · <a href="/blog">Blog</a> · <a href="/about">About</a> · <a href="/contact">Contact</a> · <a href="/privacy-policy">Privacy</a> · <a href="/terms">Terms</a> · <a href="/disclaimer">Disclaimer</a></p>
</main></div>
</body>
</html>`;
}

async function main() {
  const articles = await loadArticles();
  const seen = new Set();
  let spaAssets = '';
  try {
    const indexHtml = fs.readFileSync(path.join(DIST, 'index.html'), 'utf8');
    const tags = [];
    const seenTags = new Set();
    // Capture full tags: scripts include their closing </script> so the
    // browser doesn't swallow following <link> tags as script content.
    const re = /<(script|link)[^>]*(src|href)="\/assets\/[^"]*"[^>]*>(?:<\/script>)?/g;
    let m;
    while ((m = re.exec(indexHtml)) !== null) {
      if (!seenTags.has(m[0])) {
        seenTags.add(m[0]);
        tags.push(m[0]);
      }
    }
    const moduleRe = /<script type="module"[^>]*><\/script>|<script type="module"[^>]*src="[^"]*"[^>]*><\/script>/g;
    let mm;
    while ((mm = moduleRe.exec(indexHtml)) !== null) {
      if (!seenTags.has(mm[0])) {
        seenTags.add(mm[0]);
        tags.push(mm[0]);
      }
    }
    spaAssets = tags.join('\n');
    const styleRe = /<style>[\s\S]*?<\/style>/g;
    const styles = [];
    while ((m = styleRe.exec(indexHtml)) !== null) styles.push(m[0]);
    if (styles.length > 0) spaAssets = styles.join('\n') + '\n' + spaAssets;
  } catch (e) {
    console.error('Prerender: could not extract SPA assets:', e.message);
  }
  const unique = [];
  articles.forEach((a) => {
    if (!a || !a.slug || seen.has(a.slug)) return;
    seen.add(a.slug);
    unique.push(a);
  });
  unique.sort((a, b) => new Date(b.date) - new Date(a.date));

  const write = (rel, html) => {
    const full = path.join(DIST, rel);
    fs.mkdirSync(path.dirname(full), { recursive: true });
    fs.writeFileSync(full, html);
    console.log('Prerendered', rel);
  };

  const trust = [
    { slug: 'about', title: 'About Tony Do — Senior PM & Tech Leader (15+ Years Vietnam)', desc: 'Do Minh Tuan (Tony Do): 15+ years leading Vietnamese tech teams — StratAgile, CoffeeMug, Finantaged. Wollongong CS, IELTS 7.5.', body: `<p>I am Do Minh Tuan (Tony Do), Senior Project Manager and Tech Leader based in Ho Chi Minh City, Vietnam. For 15+ years I have built and led software teams across Southeast Asia: Developer and Senior Developer at StratAgile Singapore, Lead PHP and Mobile, Technical Director at StratAgile Vietnam managing PHP, mobile and marketing teams, Senior PM at CoffeeMug running global projects across Singapore, Korea, Australia and the UK, and COO at Finantaged building IT, creative and HR teams for an AI fintech product.</p><p>My stack is hands-on: PHP, WordPress, Magento, JavaScript, React, iOS with Xcode, AWS EC2, LAMP, CentOS, SSL. Education: Computer Science, University of Wollongong (2007-2010). English: IELTS 7.5, British Council. I have shipped 50+ projects with teams of up to 30 people across 7 countries.</p><p>This site is my publisher site: portfolio plus first-hand technical notes. I draft from experience, use AI only to structure, then review and approve every post. Contact: tonydo.pm@gmail.com, +84 96 288 2315, Ho Chi Minh City. LinkedIn via tony.do/linkedin.</p>` },
    { slug: 'contact', title: 'Contact Tony Do — Senior PM & Tech Leader', desc: 'Reach Do Minh Tuan in Ho Chi Minh City: tonydo.pm@gmail.com, +84 96 288 2315.', body: `<p>Best way to reach me is email at tonydo.pm@gmail.com or WhatsApp at +84 96 288 2315. I am based in Ho Chi Minh City (GMT+7) and reply within 1-2 business days.</p><p>For project inquiries, include goals, timeline, budget range, and links. For hiring or consulting on Agile delivery, team leadership, or Vietnam tech hiring, mention team size and stack.</p><p>Professional profiles: LinkedIn (tony.do/linkedin), portfolio (me.tony.do), hobby build (chess.tony.do).</p>` },
    { slug: 'privacy-policy', title: 'Privacy Policy — me.tony.do', desc: 'How Tony Do portfolio handles contact data, cookies, AdSense DART cookies, GDPR/CCPA rights.', body: `<p>At Tony Do Portfolio (me.tony.do), privacy of visitors is a priority. This policy covers information collected via contact forms, WhatsApp, email, log files (IP, browser, ISP, timestamps), cookies for preferences, and Google DoubleClick DART cookies for ads. See https://policies.google.com/technologies/ads for opt-out.</p><p>By using the site you consent to this policy. Contact data is used only to reply. Log data is for trends and administration, not linked to personal identity. Third-party ad servers receive IP automatically for campaign measurement; we have no control over their cookies.</p><p>GDPR and CCPA rights: access, rectification, erasure, restrict processing, object, portability. Requests answered within one month via tonydo.pm@gmail.com.</p>` },
    { slug: 'terms', title: 'Terms of Service — me.tony.do', desc: 'Fair-use quoting, no scraping, comments policy for Tony Do portfolio and blog.', body: `<p>By accessing me.tony.do you agree to these terms. Content is my opinion from 15 years of production experience for education, not legal, financial, or medical advice. Code samples as-is without warranty.</p><p>You may share links and quote up to 150 words with attribution and link back. Do not republish full articles, scrape the feed, or use content to train competing auto-generated sites without permission.</p><p>Comments are moderated. Spam, hate speech, promotional links removed. Contact tonydo.pm@gmail.com for permissions or takedowns.</p>` },
    { slug: 'disclaimer', title: 'Disclaimer & AI Disclosure — me.tony.do', desc: 'AI-assisted drafts, human-reviewed by Do Minh Tuan from 15 years of production experience.', body: `<p>Some articles start from public tech news as a topic hook, then add first-hand experience, opinions, Vietnam market context, and case studies. AI tools assist drafting; I review, edit, and approve every post. Errors are mine — email corrections to tonydo.pm@gmail.com.</p><p>Affiliate policy: no affiliate links in reviews. Recommendations come from production use. Ads served by Google AdSense after approval are labeled and do not influence editorial content.</p><p>External links belong to owners. Ad choices at policies.google.com/technologies/ads.</p>` },
  ];
  trust.forEach((t) => {
    write(path.join(t.slug, 'index.html'), pageShell({
      title: t.title, desc: t.desc, canonical: `https://me.tony.do/${t.slug}`, spaAssets,
      body: `<h1>${esc(t.title)}</h1><p>${esc(t.desc)}</p>${t.body}<p>Full interactive version loads in the app.</p>`,
    }));
  });

  const listItems = unique.slice(0, 50).map((a) =>
    `<article><h2><a href="/blog/${esc(a.slug)}">${esc(a.title)}</a></h2><p>${esc(a.summary || mdToText(a.content).slice(0, 200))}</p><p>${esc(a.date || '')} · ${esc(a.author || 'Do Minh Tuan')}</p></article>`
  ).join('\n');
  write(path.join('blog', 'index.html'), pageShell({
    title: 'Blog & Technical Insights | Tony Do - Tech Leader',
    desc: 'First-hand programming tips, technology tutorials, and business growth notes by Do Minh Tuan from 15 years leading Vietnamese tech teams.',
    canonical: 'https://me.tony.do/blog', spaAssets,
    ogImage: 'https://me.tony.do/og-image.png',
    body: `<h1>Blog & Technical Insights</h1><p>First-hand notes from 15 years leading Vietnamese tech teams.</p>${listItems}`,
  }));

  unique.forEach((a) => {
    const text = mdToText(a.content);
    const pageUrl = `https://me.tony.do/blog/${a.slug}`;
    const brandedOg = `https://me.tony.do/og/blog/${a.slug}.png`;
    const ogImage = `https://me.tony.do/og-image.png`;
    write(path.join('blog', a.slug, 'index.html'), pageShell({
      title: `${a.title} | Tony Do - Tech Leader`,
      desc: a.summary || text.slice(0, 160),
      canonical: pageUrl, spaAssets,
      ogImage: brandedOg,
      jsonLd: {
        '@context': 'https://schema.org',
        '@graph': [
          {
            '@type': 'BlogPosting',
            'headline': a.title,
            'image': brandedOg,
            'datePublished': a.date,
            'dateModified': a.date,
            'author': { '@type': 'Person', 'name': a.author || 'Do Minh Tuan', 'url': 'https://me.tony.do/about', 'sameAs': ['http://tony.do/linkedin'] },
            'publisher': { '@type': 'Person', 'name': 'Do Minh Tuan (Tony)', 'url': 'https://me.tony.do' },
            'mainEntityOfPage': { '@type': 'WebPage', '@id': pageUrl },
            'url': pageUrl,
            'description': a.summary || text.slice(0, 160),
            'inLanguage': 'en-US',
          },
          {
            '@type': 'BreadcrumbList',
            'itemListElement': [
              { '@type': 'ListItem', 'position': 1, 'name': 'Home', 'item': 'https://me.tony.do/' },
              { '@type': 'ListItem', 'position': 2, 'name': 'Blog', 'item': 'https://me.tony.do/blog' },
              { '@type': 'ListItem', 'position': 3, 'name': a.title, 'item': pageUrl },
            ],
          },
        ],
      },
      extra: `<meta property="og:type" content="article" /><meta property="article:published_time" content="${esc(a.date || '')}" />`,
      body: `<article><h1>${esc(a.title)}</h1><p>${esc(a.date || '')} · ${esc(a.author || 'Do Minh Tuan')} · ${esc(a.category || '')}</p><p><img src="${esc(a.image || ogImage)}" alt="${esc(a.title)}" width="1200" height="675" /></p><p>${esc(a.summary || '')}</p><div>${esc(text)}</div><p>Written with AI assistance, reviewed and edited by Do Minh Tuan.</p></article>`,
    }));
  });
  console.log(`Prerender done: ${trust.length} trust pages, 1 blog index, ${unique.length} articles.`);

  try {
    const swPath = path.join(DIST, 'sw.js');
    if (fs.existsSync(swPath)) {
      const stamp = new Date().toISOString().slice(0, 10).replace(/-/g, '') + '-' + Date.now().toString(36);
      const sw = fs.readFileSync(swPath, 'utf8');
      fs.writeFileSync(swPath, sw.replace(/const CACHE_VERSION = '[^']*';/, `const CACHE_VERSION = 'auto-${stamp}';`));
      console.log('Stamped sw.js version:', stamp);
    }
  } catch (e) {
    console.error('SW stamp failed:', e.message);
  }
}

main().catch((e) => { console.error(e); process.exit(1); });
