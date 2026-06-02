// Shared serverless helpers.
// Imported by data.js to provide RSS, comments, and reactions without consuming
// additional Vercel serverless function slots (Hobby plan limit: 12).

import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { kv } from '@vercel/kv';

const DATA_FILE = path.join(process.cwd(), 'src/admin/data.json');

export const defaultBlogArticles = [
  {
    "title": "Building High-Performance Tech Teams in Vietnam: A Senior PM's Blueprint for 2026",
    "slug": "building-high-performance-tech-teams-vietnam-blueprint",
    "date": "2026-06-01",
    "author": "Do Minh Tuan",
    "category": "Business Hackers 🚀",
    "summary": "Drawing on 15+ years of experience leading Vietnamese tech teams, this blueprint covers hiring, retaining talent, Agile delivery, and scaling startups in Vietnam's booming tech ecosystem.",
    "image": "https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&w=1200&q=80",
    "content": "Vietnam's tech industry is growing at an unprecedented pace. With over 530,000 developers, a thriving startup ecosystem, and global tech giants setting up engineering hubs in Ho Chi Minh City, Hanoi, and Danang, the demand for skilled project managers and tech leaders has never been higher.\n\n### 1. Hiring for Attitude, Training for Skill\nIn Vietnam's competitive talent market, you cannot afford to hire purely for technical credentials. The best engineers I have worked with were not the ones with the longest resumes — they were the ones who showed intellectual curiosity and ownership mentality.\n\nWhen hiring, I prioritize three traits:\n- **Communication clarity**: Can they explain a technical problem in simple terms?\n- **Learning velocity**: Do they pick up new tools and frameworks quickly?\n- **Ownership**: When something breaks, do they hide or do they fix?\n\nTechnical skills can be taught in weeks. Attitude takes years to change.\n\n### 2. Retaining Talent Beyond Salary\nVietnamese developers are among the most sought-after in Southeast Asia. Global remote opportunities mean your best engineers get pinged by recruiters on LinkedIn daily. To retain them, salary alone is not enough.\n\nWhat actually works:\n- **Clear career progression paths**: Engineers need to see where they will be in 2 years.\n- **Meaningful project ownership**: Give them real problems to solve, not just tickets to close.\n- **Learning budgets**: Allocate monthly stipends for courses and conferences.\n- **Flexible remote work**: Post-pandemic, this is the #1 retention lever in Vietnam."
  },
  {
    "title": "How to Save 5 Hours Every Week: 5 Free AI Tools Anyone Can Use",
    "slug": "save-hours-free-ai-tools-beginners",
    "date": "2026-05-15",
    "author": "Do Minh Tuan",
    "category": "Tech Made Simple 💡",
    "summary": "A plain-English guide to using free AI tools for beginners to automate writing, designing, scheduling, and repetitive everyday tasks.",
    "image": "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=1200&q=80",
    "content": "Artificial Intelligence is no longer just for software engineers. Today, AI can act as your personal assistant, saving you hours of work every single week. Best of all, these tools are completely free and require absolutely zero coding knowledge.\n\n### 1. ChatGPT: Your Personal Ghostwriter\nWriting emails, creating meeting summaries, or drafting social media posts often takes up hours of our week. ChatGPT can do this in seconds.\n\n### 2. Gamma App: Instant Presentations\nNeed to create a presentation for a client or a team meeting? Gamma App uses AI to generate beautiful, structured slideshows in under a minute.\n\n### 3. Canva Magic Studio: Design Made Easy\nCreating graphics for your small business doesn't require complex software like Photoshop. Canva's built-in AI tools let you erase unwanted objects from photos and generate custom images from a text description.\n\n### 4. Otter.ai: Automatic Meeting Transcripts\nStop wasting time typing notes during meetings. Otter.ai joins your video calls, records the audio, transcribes every word, and automatically emails you a bulleted summary.\n\n### 5. Goblin Tools: Break Down Hard Tasks\nIf you struggle with organizing a massive project, Goblin Tools is a lifesaver. You type in a major goal, and the AI breaks it down into tiny, manageable checkboxes."
  },
  {
    "title": "Choosing a Website Platform: A Simple Guide for Small Business Owners",
    "slug": "choosing-website-platform-small-business",
    "date": "2026-05-10",
    "author": "Do Minh Tuan",
    "category": "Business Hackers 🚀",
    "summary": "WordPress, Shopify, or Wix? We compare the website builders for beginners and small businesses to help you launch cheap and secure.",
    "image": "https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&w=1200&q=80",
    "content": "For any modern business, a website is your virtual storefront. It is the first place potential clients check to see if you are legitimate. Let's break down the best options for beginners in plain language.\n\n### 1. WordPress: The Flexible Powerhouse\nWordPress powers over 43% of all websites on the internet. It is highly customizable and excellent for SEO. However, it requires a little bit of setup and manual maintenance.\n\n### 2. Wix: The Visual Drag-and-Drop\nIf you have zero technical skills and want a website live by tonight, Wix is a fantastic choice. However, it can become expensive as your site grows.\n\n### 3. Shopify: The Ultimate Online Shop\nIf your main goal is to sell physical or digital products online, don't overthink it — use Shopify. It handles secure credit card payments, shipping labels, and inventory automatically."
  },
  {
    "title": "AI in Project Management: Can Chatbots Help Run Your Team?",
    "slug": "ai-project-management-chatbots-run-team",
    "date": "2026-05-08",
    "author": "Do Minh Tuan",
    "category": "Business Hackers 🚀",
    "summary": "Can AI replace a Project Manager? Learn how beginners and non-technical business leaders can use simple tools like Trello and AI to stay organized.",
    "image": "https://images.unsplash.com/photo-1531403009284-440f080d1e12?auto=format&fit=crop&w=1200&q=80",
    "content": "Running a project requires keeping track of a hundred moving parts. Let's look at how simple AI can make task-tracking easy.\n\n### What is Agile and Scrum? (Simply Explained)\nAgile is not a complex code pattern; it is just a way of working. Instead of trying to build everything at once, you break your project into 2-week blocks called 'sprints'.\n\n### How AI Speeds Up Your Team\nModern project tools like Trello, Jira, or Monday.com now have AI built right in.\n- **Auto-drafting tasks**: Tell the AI 'Create a list of steps to set up our payment system,' and it will automatically generate detailed cards.\n- **Risk Prediction**: AI can look at your team's velocity and warn you if you are going to miss a deadline."
  },
  {
    "title": "Why is My Website Slow? The Non-Coder's Guide to Speeding Up Your Pages",
    "slug": "why-website-slow-non-coder-guide",
    "date": "2026-05-05",
    "author": "Do Minh Tuan",
    "category": "Developer Corner 💻",
    "summary": "Is a slow page hurting your Google rankings and costing you sales? Learn the common website bottlenecks and simple fixes that don't require coding.",
    "image": "https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&w=1200&q=80",
    "content": "Did you know that 53% of mobile visitors will leave a website if it takes longer than 3 seconds to load? A slow website doesn't just frustrate your users; it actually pushes your business down in Google's search rankings.\n\n### The Three Biggest Slowdown Culprits\n1. **Massive Images**: Pushing high-res raw images straight from your camera to your website is the #1 slowdown cause. Always compress images first.\n2. **Lack of Caching**: Without caching, your server has to build the page from scratch for every single visitor.\n3. **Unoptimized Plugins**: Having too many complex features running at once will bog down even the strongest web servers."
  },
  {
    "title": "What is Green Cloud Computing? How Optimizing Servers Saves Your Wallet",
    "slug": "green-cloud-computing-save-money-planet",
    "date": "2026-05-01",
    "author": "Do Minh Tuan",
    "category": "Future Pulse 🔮",
    "summary": "Did you know servers produce more CO2 emissions than the airline industry? Learn how optimizing web structures saves the planet and cuts server bills.",
    "image": "https://images.unsplash.com/photo-1504384308090-c894fdcc538d?auto=format&fit=crop&w=1200&q=80",
    "content": "When we upload photos or run apps, we think of the 'cloud' as an abstract, weightless place. In reality, the cloud runs on massive physical data centers packed with thousands of hot servers running 24/7.\n\n### Why Green Tech is Great for Business\nSustainable tech isn't just about charity; it is directly tied to your company's expenses. Optimizing your website's server structure means your server works less, draws less power, and requires smaller hosting plans."
  }
];

// Anti-spam patterns
const SPAM_PATTERNS = [
  /\b(viagra|cialis|casino|crypto|bitcoin|forex|loan)\b/i,
  /\b(buy now|click here|free money|make \$\d+)\b/i,
  /https?:\/\/[^\s]+.*https?:\/\/[^\s]+/i, // multiple URLs
];

const DISPOSABLE_EMAIL_DOMAINS = [
  'mailinator.com', 'guerrillamail.com', 'tempmail.com', '10minutemail.com',
  'throwaway.email', 'yopmail.com', 'temp-mail.org', 'fakeinbox.com',
  'maildrop.cc', 'getnada.com', 'sharklasers.com', 'trashmail.com'
];

// Rate limit (per-instance; in-memory)
const rateLimit = new Map();
const RATE_LIMIT_WINDOW_MS = 60 * 1000;
const RATE_LIMIT_MAX = 1;

function getClientIp(req) {
  return (
    req.headers['x-forwarded-for']?.split(',')[0]?.trim() ||
    req.headers['x-real-ip'] ||
    req.socket?.remoteAddress ||
    'unknown'
  );
}

function escapeXml(str) {
  return String(str || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function stripHtml(str) {
  return String(str || '').replace(/<[^>]+>/g, '').trim();
}

function summarizeContent(content, maxLen = 280) {
  const plain = stripHtml(content);
  if (plain.length <= maxLen) return plain;
  return plain.substring(0, maxLen).replace(/\s+\S*$/, '') + '…';
}

// Load blog articles: prefer Vercel KV, fall back to local file, fall back to seeds
export async function loadBlogArticles() {
  if (process.env.VERCEL && process.env.KV_REST_API_URL) {
    try {
      const cloudData = await kv.get('portfolio_data');
      if (cloudData && cloudData.blog && cloudData.blog.length > 0) {
        return cloudData.blog;
      }
    } catch (e) {
      console.error('KV load error in lib:', e);
    }
  }
  if (fs.existsSync(DATA_FILE)) {
    try {
      const data = JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
      if (data.blog && data.blog.length > 0) return data.blog;
    } catch (e) {
      console.error('Local file load error:', e);
    }
  }
  return defaultBlogArticles;
}

// ===== RSS HANDLER =====
export async function handleRss(req, res) {
  try {
    const blog = await loadBlogArticles();
    const SITE_URL = process.env.SITE_URL || 'https://me.tony.do';
    const SITE_TITLE = 'Do Minh Tuan — Senior PM & Tech Leader';
    const SITE_DESC = 'Insights on project management, AI, scaling teams, and Vietnam tech ecosystem.';

    const items = blog
      .slice(0, 30)
      .map(post => `    <item>
      <title>${escapeXml(post.title)}</title>
      <link>${SITE_URL}/#/${post.slug}</link>
      <guid isPermaLink="false">${SITE_URL}/#/${post.slug}</guid>
      <pubDate>${new Date(post.date).toUTCString()}</pubDate>
      <description>${escapeXml(post.summary || summarizeContent(post.content))}</description>
      <author>${escapeXml(post.author || 'admin@tony.do')} (${escapeXml(post.author || 'Do Minh Tuan')})</author>
      ${post.category ? `<category>${escapeXml(post.category)}</category>` : ''}
    </item>`)
      .join('\n');

    const lastBuild = blog.length > 0 ? new Date(blog[0].date).toUTCString() : new Date().toUTCString();

    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>${escapeXml(SITE_TITLE)}</title>
    <link>${SITE_URL}</link>
    <description>${escapeXml(SITE_DESC)}</description>
    <language>en-us</language>
    <lastBuildDate>${lastBuild}</lastBuildDate>
    <atom:link href="${SITE_URL}/rss.xml" rel="self" type="application/rss+xml" />
${items}
  </channel>
</rss>`;

    res.setHeader('Content-Type', 'application/rss+xml; charset=utf-8');
    res.setHeader('Cache-Control', 'public, max-age=3600, s-maxage=3600');
    return res.status(200).send(xml);
  } catch (e) {
    console.error('RSS error:', e);
    return res.status(500).json({ error: 'Failed to generate RSS' });
  }
}

// ===== COMMENTS HANDLERS =====
function checkRateLimit(ip) {
  const now = Date.now();
  const entry = rateLimit.get(ip);
  if (!entry) {
    rateLimit.set(ip, [now]);
    return { allowed: true, remaining: RATE_LIMIT_MAX - 1 };
  }
  const recent = entry.filter(t => now - t < RATE_LIMIT_WINDOW_MS);
  if (recent.length >= RATE_LIMIT_MAX) {
    return { allowed: false, remaining: 0, retryAfter: Math.ceil((RATE_LIMIT_WINDOW_MS - (now - recent[0])) / 1000) };
  }
  recent.push(now);
  rateLimit.set(ip, recent);
  return { allowed: true, remaining: RATE_LIMIT_MAX - recent.length };
}

function isSpam({ author, email, content, honeypot }) {
  if (honeypot) return { spam: true, reason: 'honeypot' };
  const emailDomain = (email || '').split('@')[1]?.toLowerCase() || '';
  if (DISPOSABLE_EMAIL_DOMAINS.includes(emailDomain)) {
    return { spam: true, reason: 'disposable_email' };
  }
  const text = `${author} ${content}`;
  for (const pattern of SPAM_PATTERNS) {
    if (pattern.test(text)) return { spam: true, reason: 'pattern' };
  }
  return { spam: false };
}

function genId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

function safeEqual(a, b) {
  const ba = Buffer.from(a || '');
  const bb = Buffer.from(b || '');
  if (ba.length !== bb.length) return false;
  return crypto.timingSafeEqual(ba, bb);
}

export async function handleCommentsGet(req, res) {
  const slug = req.query.slug;
  if (!slug) return res.status(400).json({ error: 'slug required' });

  try {
    let comments = [];
    if (process.env.VERCEL && process.env.KV_REST_API_URL) {
      comments = (await kv.get(`comments:${slug}`)) || [];
    }
    // Filter to only approved (unless admin token)
    const token = req.headers['x-admin-token'];
    const isAdmin = token && process.env.ADMIN_PASSWORD && safeEqual(token, process.env.ADMIN_PASSWORD);
    const filtered = isAdmin ? comments : comments.filter(c => c.status === 'approved');
    return res.status(200).json({ comments: filtered, total: filtered.length });
  } catch (e) {
    console.error('Comments GET error:', e);
    return res.status(500).json({ error: 'Failed to load comments' });
  }
}

export async function handleCommentsPost(req, res) {
  const ip = getClientIp(req);
  const limit = checkRateLimit(ip);
  if (!limit.allowed) {
    res.setHeader('Retry-After', String(limit.retryAfter || 60));
    return res.status(429).json({ error: 'Too many comments, slow down', retryAfter: limit.retryAfter });
  }

  let body = req.body;
  if (typeof body === 'string') {
    try { body = JSON.parse(body); } catch { return res.status(400).json({ error: 'Invalid JSON' }); }
  }
  body = body || {};

  const { slug, author, email, content, honeypot } = body;
  if (!slug || !author || !email || !content) {
    return res.status(400).json({ error: 'Missing required fields' });
  }
  if (String(content).length < 3 || String(content).length > 2000) {
    return res.status(400).json({ error: 'Content must be 3-2000 characters' });
  }
  if (String(author).length > 100 || String(email).length > 200) {
    return res.status(400).json({ error: 'Author/email too long' });
  }

  const spamCheck = isSpam({ author, email, content, honeypot });
  const newComment = {
    id: genId(),
    slug,
    author: String(author).slice(0, 100),
    email: String(email).slice(0, 200),
    content: String(content).slice(0, 2000),
    date: new Date().toISOString(),
    status: spamCheck.spam ? 'spam' : 'pending',
    flagged: spamCheck.spam ? spamCheck.reason : null,
  };

  try {
    let existing = [];
    if (process.env.VERCEL && process.env.KV_REST_API_URL) {
      existing = (await kv.get(`comments:${slug}`)) || [];
      existing.push(newComment);
      await kv.set(`comments:${slug}`, existing);
    } else {
      // Local file fallback
      const localFile = path.join(process.cwd(), 'src/admin/comments.json');
      let all = {};
      if (fs.existsSync(localFile)) {
        try { all = JSON.parse(fs.readFileSync(localFile, 'utf8')); } catch { all = {}; }
      }
      all[slug] = all[slug] || [];
      all[slug].push(newComment);
      fs.mkdirSync(path.dirname(localFile), { recursive: true });
      fs.writeFileSync(localFile, JSON.stringify(all, null, 2));
    }

    return res.status(201).json({
      ok: true,
      status: newComment.status,
      message: newComment.status === 'spam' ? 'Comment flagged' : 'Comment submitted for review',
    });
  } catch (e) {
    console.error('Comments POST error:', e);
    return res.status(500).json({ error: 'Failed to save comment' });
  }
}

export async function handleCommentsModerate(req, res) {
  const token = req.headers['x-admin-token'];
  if (!token || !process.env.ADMIN_PASSWORD || !safeEqual(token, process.env.ADMIN_PASSWORD)) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  let body = req.body;
  if (typeof body === 'string') {
    try { body = JSON.parse(body); } catch { return res.status(400).json({ error: 'Invalid JSON' }); }
  }
  body = body || {};
  const { action, slug, id, status: filterStatus } = body;

  try {
    if (action === 'list') {
      // List all comments across slugs, optionally filtered by status
      const all = {};
      if (process.env.VERCEL && process.env.KV_REST_API_URL) {
        // Use SCAN to iterate comment keys
        let cursor = '0';
        do {
          const [next, keys] = await kv.scan(cursor, { match: 'comments:*', count: 100 });
          cursor = next;
          for (const k of keys) {
            const slugFromKey = k.replace('comments:', '');
            const list = (await kv.get(k)) || [];
            all[slugFromKey] = list;
          }
        } while (cursor !== '0');
      } else {
        const localFile = path.join(process.cwd(), 'src/admin/comments.json');
        if (fs.existsSync(localFile)) {
          try { all = JSON.parse(fs.readFileSync(localFile, 'utf8')); } catch { all = {}; }
        }
      }
      let flat = [];
      for (const [s, list] of Object.entries(all)) {
        for (const c of list) flat.push({ ...c, slug: c.slug || s });
      }
      if (filterStatus) flat = flat.filter(c => c.status === filterStatus);
      flat.sort((a, b) => new Date(b.date) - new Date(a.date));
      return res.status(200).json({ comments: flat, total: flat.length });
    }

    if (!slug || !id || !action) {
      return res.status(400).json({ error: 'slug, id, action required' });
    }

    if (process.env.VERCEL && process.env.KV_REST_API_URL) {
      const list = (await kv.get(`comments:${slug}`)) || [];
      const idx = list.findIndex(c => c.id === id);
      if (idx === -1) return res.status(404).json({ error: 'Comment not found' });

      if (action === 'delete') {
        list.splice(idx, 1);
      } else if (['approve', 'reject', 'spam'].includes(action)) {
        list[idx].status = action === 'approve' ? 'approved' : action === 'reject' ? 'rejected' : 'spam';
        list[idx].moderatedAt = new Date().toISOString();
      } else {
        return res.status(400).json({ error: 'Unknown action' });
      }
      await kv.set(`comments:${slug}`, list);
      return res.status(200).json({ ok: true, comment: list[idx] });
    }
    return res.status(501).json({ error: 'Moderation requires KV (Vercel deployment)' });
  } catch (e) {
    console.error('Moderation error:', e);
    return res.status(500).json({ error: 'Moderation failed' });
  }
}

// ===== REACTIONS HANDLERS =====
export async function handleReactionsGet(req, res) {
  const slug = req.query.slug;
  if (!slug) return res.status(400).json({ error: 'slug required' });
  try {
    let counts = { like: 0, insightful: 0, inspired: 0 };
    if (process.env.VERCEL && process.env.KV_REST_API_URL) {
      counts = (await kv.get(`reactions:${slug}`)) || counts;
    }
    return res.status(200).json({ slug, counts });
  } catch (e) {
    console.error('Reactions GET error:', e);
    return res.status(500).json({ error: 'Failed to load reactions' });
  }
}

export async function handleReactionsPost(req, res) {
  let body = req.body;
  if (typeof body === 'string') {
    try { body = JSON.parse(body); } catch { return res.status(400).json({ error: 'Invalid JSON' }); }
  }
  body = body || {};
  const { slug, type } = body;
  if (!slug || !type) return res.status(400).json({ error: 'slug and type required' });
  if (!['like', 'insightful', 'inspired'].includes(type)) {
    return res.status(400).json({ error: 'Invalid reaction type' });
  }

  try {
    let counts = { like: 0, insightful: 0, inspired: 0 };
    if (process.env.VERCEL && process.env.KV_REST_API_URL) {
      counts = (await kv.get(`reactions:${slug}`)) || counts;
    }
    counts[type] = (counts[type] || 0) + 1;
    if (process.env.VERCEL && process.env.KV_REST_API_URL) {
      await kv.set(`reactions:${slug}`, counts);
    }
    return res.status(200).json({ ok: true, counts });
  } catch (e) {
    console.error('Reactions POST error:', e);
    return res.status(500).json({ error: 'Failed to save reaction' });
  }
}

// ===== VIEW COUNTERS =====
// Lightweight article view counter. Stores per-slug counts in KV.
// GET  /api/data?type=views[&slug=xxx]   → counts (single slug or all)
// POST /api/data?type=view&slug=xxx      → increment + return new count
//   Body (optional): { sessionId } to dedup per session (1 per 30 min).

const VIEW_DEDUP_TTL_SEC = 30 * 60; // 30 minutes

export async function handleViewsGet(req, res) {
  try {
    const slug = req.query.slug;
    if (process.env.VERCEL && process.env.KV_REST_API_URL) {
      if (slug) {
        const count = (await kv.get(`views:${slug}`)) || 0;
        return res.status(200).json({ slug, count });
      }
      // No slug → return all view counts (for feed display)
      const all = await kv.keys('views:*');
      const counts = {};
      if (all && all.length > 0) {
        const values = await kv.mget(...all);
        all.forEach((k, i) => {
          const s = k.replace(/^views:/, '');
          counts[s] = values[i] || 0;
        });
      }
      return res.status(200).json({ counts });
    }
    // No KV → return empty (graceful degradation)
    if (slug) return res.status(200).json({ slug, count: 0 });
    return res.status(200).json({ counts: {} });
  } catch (e) {
    console.error('Views GET error:', e);
    return res.status(500).json({ error: 'Failed to load views' });
  }
}

export async function handleViewIncrement(req, res) {
  const slug = req.query.slug;
  if (!slug) return res.status(400).json({ error: 'slug required' });

  // Optional dedup via sessionId
  let body = req.body;
  if (typeof body === 'string') {
    try { body = JSON.parse(body); } catch { body = {}; }
  }
  body = body || {};
  const sessionId = body.sessionId;

  try {
    if (!process.env.VERCEL || !process.env.KV_REST_API_URL) {
      return res.status(200).json({ slug, count: 0, kvDisabled: true });
    }

    // Dedup: if sessionId provided, check if a view was already counted recently
    if (sessionId) {
      const lastView = await kv.get(`view-ts:${slug}:${sessionId}`);
      if (lastView) {
        const count = (await kv.get(`views:${slug}`)) || 0;
        return res.status(200).json({ slug, count, deduped: true });
      }
      await kv.set(`view-ts:${slug}:${sessionId}`, Date.now(), { ex: VIEW_DEDUP_TTL_SEC });
    }

    const newCount = await kv.incr(`views:${slug}`);
    return res.status(200).json({ slug, count: newCount });
  } catch (e) {
    console.error('View increment error:', e);
    return res.status(500).json({ error: 'Failed to increment view' });
  }
}

// ===== GITHUB BACKUP =====
// Backs up portfolio data + comments + reactions + subscribers to a dedicated
// `data-backups` branch in the GitHub repo. Daily snapshots kept for 30 days,
// weekly snapshots for 30 weeks. Uses GitHub Contents API + a classic PAT.
//
// Required env var: GITHUB_BACKUP_TOKEN (classic PAT, scope: repo)
// Optional: GITHUB_REPO_OWNER (default: harrypotter30022003)
//           GITHUB_REPO_NAME  (default: tony-profile-bigpickle)

const GH_API = 'https://api.github.com';
const GH_OWNER = process.env.GITHUB_REPO_OWNER || 'harrypotter30022003';
const GH_REPO = process.env.GITHUB_REPO_NAME || 'tony-profile-bigpickle';
const GH_BRANCH = 'data-backups';
const GH_BASE = process.env.GITHUB_REPO_BASE_BRANCH || 'main';

function ghHeaders() {
  const token = process.env.GITHUB_BACKUP_TOKEN;
  return {
    'Authorization': `Bearer ${token}`,
    'Accept': 'application/vnd.github+json',
    'X-GitHub-Api-Version': '2022-11-28',
    'User-Agent': 'tony-portfolio-backup-bot',
  };
}

async function gh(path, options = {}) {
  const token = process.env.GITHUB_BACKUP_TOKEN;
  if (!token) throw new Error('GITHUB_BACKUP_TOKEN missing');
  const url = `${GH_API}/repos/${GH_OWNER}/${GH_REPO}${path}`;
  const resp = await fetch(url, {
    ...options,
    headers: { ...ghHeaders(), ...(options.headers || {}) },
  });
  const text = await resp.text();
  if (!resp.ok) {
    throw new Error(`GitHub ${resp.status} on ${path}: ${text.slice(0, 200)}`);
  }
  return text ? JSON.parse(text) : null;
}

async function ensureBranch() {
  try {
    await gh(`/branches/${GH_BRANCH}`);
  } catch {
    const mainRef = await gh(`/git/ref/heads/${GH_BASE}`);
    await gh('/git/refs', {
      method: 'POST',
      body: JSON.stringify({
        ref: `refs/heads/${GH_BRANCH}`,
        sha: mainRef.object.sha,
      }),
    });
  }
}

async function getFileSha(filePath) {
  try {
    const file = await gh(`/contents/${encodeURIComponent(filePath)}?ref=${GH_BRANCH}`);
    return file.sha;
  } catch {
    return null;
  }
}

async function commitFile(filePath, contentObj, message) {
  await ensureBranch();
  const sha = await getFileSha(filePath);
  const body = {
    message,
    content: Buffer.from(JSON.stringify(contentObj, null, 2)).toString('base64'),
    branch: GH_BRANCH,
  };
  if (sha) body.sha = sha;
  return gh(`/contents/${encodeURIComponent(filePath)}`, {
    method: 'PUT',
    body: JSON.stringify(body),
  });
}

async function listDir(dirPath) {
  try {
    const items = await gh(`/contents/${encodeURIComponent(dirPath)}?ref=${GH_BRANCH}`);
    return Array.isArray(items) ? items : [];
  } catch {
    return [];
  }
}

async function deleteFile(filePath, sha, message) {
  return gh(`/contents/${encodeURIComponent(filePath)}`, {
    method: 'DELETE',
    body: JSON.stringify({ message, sha, branch: GH_BRANCH }),
  });
}

async function pruneOld(dirPath, maxAgeMs) {
  const files = await listDir(dirPath);
  const now = Date.now();
  let removed = 0;
  for (const f of files) {
    if (f.type !== 'file') continue;
    const dateMatch = f.name.match(/(\d{4}-\d{2}-\d{2})/);
    if (!dateMatch) continue;
    const fileTime = new Date(dateMatch[1]).getTime();
    if (now - fileTime > maxAgeMs) {
      try {
        await deleteFile(f.path, f.sha, `chore: prune expired backup ${f.name}`);
        removed++;
      } catch (e) {
        console.error('Prune error for', f.path, e.message);
      }
    }
  }
  return removed;
}

async function gatherAllData() {
  const portfolio = (process.env.VERCEL && process.env.KV_REST_API_URL)
    ? ((await kv.get('portfolio_data')) || {})
    : null;

  // Comments
  const comments = {};
  if (process.env.VERCEL && process.env.KV_REST_API_URL) {
    let cursor = '0';
    do {
      const [next, keys] = await kv.scan(cursor, { match: 'comments:*', count: 100 });
      cursor = next;
      for (const k of keys) {
        const slug = k.replace('comments:', '');
        comments[slug] = (await kv.get(k)) || [];
      }
    } while (cursor !== '0');
  }

  // Reactions
  const reactions = {};
  if (process.env.VERCEL && process.env.KV_REST_API_URL) {
    let cursor = '0';
    do {
      const [next, keys] = await kv.scan(cursor, { match: 'reactions:*', count: 100 });
      cursor = next;
      for (const k of keys) {
        const slug = k.replace('reactions:', '');
        reactions[slug] = (await kv.get(k)) || { like: 0, insightful: 0, inspired: 0 };
      }
    } while (cursor !== '0');
  }

  // Subscribers (just the count, not PII for security)
  let subscribers = [];
  if (process.env.VERCEL && process.env.KV_REST_API_URL) {
    try {
      subscribers = (await kv.get('subscribers')) || [];
    } catch { /* ignore */ }
  }

  return {
    portfolio,
    comments,
    reactions,
    subscriberCount: subscribers.length,
    // Include list (emails are PII; redact in case repo becomes public)
    subscribers: subscribers.map(s => ({
      email: s.email ? s.email.replace(/(?<=.).(?=[^@]*?@)/g, '*') : '',
      createdAt: s.createdAt || null,
    })),
  };
}

// Run a backup snapshot. type = 'daily' | 'weekly'
export async function handleBackup(req, res, type) {
  if (!process.env.GITHUB_BACKUP_TOKEN) {
    return res.status(200).json({
      ok: false,
      skipped: true,
      reason: 'GITHUB_BACKUP_TOKEN not set. Create a classic PAT (scope: repo) and add as Vercel env var to enable backups.',
      help: 'https://github.com/settings/tokens/new?scopes=repo',
    });
  }

  try {
    const data = await gatherAllData();
    const now = new Date();
    const ts = now.toISOString();

    let filePath, label, pruned;
    if (type === 'daily') {
      const date = now.toISOString().split('T')[0];
      filePath = `backups/daily/${date}.json`;
      label = date;
      const payload = { type: 'daily', date, timestamp: ts, ...data };
      await commitFile(filePath, payload, `backup(daily): ${date}`);
      pruned = await pruneOld('backups/daily', 30 * 24 * 60 * 60 * 1000);
    } else if (type === 'weekly') {
      // ISO week label: YYYY-Wxx
      const target = new Date(now.valueOf());
      const dayNr = (target.getDay() + 6) % 7;
      target.setDate(target.getDate() - dayNr + 3);
      const firstThursday = target.valueOf();
      target.setMonth(0, 1);
      if (target.getDay() !== 4) {
        target.setMonth(0, 1 + ((4 - target.getDay()) + 7) % 7);
      }
      const weekNum = 1 + Math.ceil((firstThursday - target) / 604800000);
      const weekId = `${now.getFullYear()}-W${String(weekNum).padStart(2, '0')}`;
      filePath = `backups/weekly/${weekId}.json`;
      label = weekId;
      const payload = { type: 'weekly', weekId, timestamp: ts, ...data };
      await commitFile(filePath, payload, `backup(weekly): ${weekId}`);
      pruned = await pruneOld('backups/weekly', 30 * 7 * 24 * 60 * 60 * 1000);
    } else {
      return res.status(400).json({ error: 'type must be daily or weekly' });
    }

    return res.status(200).json({
      ok: true,
      type,
      label,
      path: filePath,
      pruned,
      stats: {
        comments: Object.keys(data.comments).length,
        reactions: Object.keys(data.reactions).length,
        subscribers: data.subscriberCount,
        blogPosts: (data.portfolio?.blog || []).length,
      },
    });
  } catch (e) {
    console.error('Backup error:', e);
    return res.status(500).json({ ok: false, error: e.message });
  }
}

// List available backups (for the admin UI to show)
export async function handleBackupList(req, res) {
  if (!process.env.GITHUB_BACKUP_TOKEN) {
    return res.status(200).json({ ok: false, skipped: true, daily: [], weekly: [] });
  }
  try {
    const [daily, weekly] = await Promise.all([
      listDir('backups/daily'),
      listDir('backups/weekly'),
    ]);
    const toInfo = f => ({ name: f.name, size: f.size, sha: f.sha, path: f.path });
    return res.status(200).json({
      ok: true,
      daily: daily.filter(f => f.type === 'file').map(toInfo).sort((a, b) => b.name.localeCompare(a.name)),
      weekly: weekly.filter(f => f.type === 'file').map(toInfo).sort((a, b) => b.name.localeCompare(a.name)),
    });
  } catch (e) {
    return res.status(500).json({ ok: false, error: e.message });
  }
}
