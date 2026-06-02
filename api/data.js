import fs from 'fs';
import path from 'path';
import { kv } from '@vercel/kv';
import {
  loadBlogArticles,
  defaultBlogArticles,
  handleRss,
  handleCommentsGet,
  handleCommentsPost,
  handleCommentsModerate,
  handleReactionsGet,
  handleReactionsPost,
  handleViewsGet,
  handleViewIncrement,
} from './_lib.js';

const DATA_FILE = path.join(process.cwd(), 'src/admin/data.json');


export default async function handler(req, res) {
  // Set strict headers to bypass browser, CDN, and edge server caching
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0');

  // Sub-endpoint routing via ?type= (saves us Vercel serverless function slots)
  // Each ?type= maps to a handler in _lib.js; URL paths /api/rss, /api/comments, /api/reactions
  // are rewrites in vercel.json -> /api/data?type=...
  const type = req.query.type;
  if (type === 'rss') return handleRss(req, res);
  if (type === 'comments') {
    if (req.query.action === 'moderate' && req.method === 'POST') return handleCommentsModerate(req, res);
    if (req.method === 'POST') return handleCommentsPost(req, res);
    return handleCommentsGet(req, res);
  }
  if (type === 'reactions') {
    if (req.method === 'POST') return handleReactionsPost(req, res);
    return handleReactionsGet(req, res);
  }
  if (type === 'views') return handleViewsGet(req, res);
  if (type === 'view' && req.method === 'POST') return handleViewIncrement(req, res);

  // Default: portfolio data (backwards compatible)
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // 1. Try Vercel KV if on Vercel
    if (process.env.VERCEL && process.env.KV_REST_API_URL) {
      try {
        const cloudData = await kv.get('portfolio_data');
        if (cloudData) {
          let merged = { ...cloudData };
          let needsKvSave = false;

          // Auto-upgrade projects: Replace Le Duy Hotels with EZ Fast Tech case study in Vercel KV database
          if (merged.projects) {
            let updatedProjects = false;
            merged.projects = merged.projects.map(proj => {
              if (proj.name === 'Le Duy Hotels' || proj.link.includes('leduyhotel.vn')) {
                updatedProjects = true;
                return {
                  name: "EZ Fast Tech",
                  link: "https://ezfasttech.com",
                  desc: "SEO web design & bespoke software development platform for SMEs",
                  tags: ["WordPress", "SEO", "React"]
                };
              }
              return proj;
            });
            if (updatedProjects) {
              needsKvSave = true;
            }
          }

          // Auto-upgrade projects: Add Wizard Chess if missing in Vercel KV
          if (merged.projects) {
            const hasChess = merged.projects.some(p => p.name === 'Wizard Chess' || p.link.includes('chess.tony.do'));
            if (!hasChess) {
              merged.projects.push({
                name: "Wizard Chess",
                icon: "♟️",
                link: "https://chess.tony.do",
                desc: "Harry Potter style wizard chess game built with Firebase Auth, Cloud Firestore, and Stockfish Online API (with random local fallback).",
                tags: ["Firebase", "Firestore", "AI Engine", "CI/CD"]
              });
              needsKvSave = true;
            }
          }

          // Auto-upgrade database schema: Merge seed articles + apply version-based updates
          // Each seed article has a `version` field; if the version differs from what's in KV, update it.
          if (!merged.blog || merged.blog.length === 0) {
            merged.blog = defaultBlogArticles;
            needsKvSave = true;
          } else {
            let addedSeeds = false;
            let updatedSeeds = false;

            defaultBlogArticles.forEach(seed => {
              const existing = merged.blog.find(b => b.slug === seed.slug);
              if (!existing) {
                merged.blog.unshift(seed);
                addedSeeds = true;
              } else if (seed.version && existing.version !== seed.version) {
                // Content update: replace fields with new seed (preserve existing post id/date if newer)
                Object.assign(existing, {
                  title: seed.title,
                  summary: seed.summary,
                  content: seed.content,
                  image: seed.image,
                  category: seed.category,
                  author: seed.author,
                  version: seed.version,
                });
                updatedSeeds = true;
              }
            });

            const originalLength = merged.blog.length;
            // Clean out old pre-category placeholders
            merged.blog = merged.blog.filter(post => 
              post.category && 
              post.image && 
              post.slug !== 'maximizing-roi-agile-methodologies' &&
              post.slug !== 'scaling-web-infrastructure-best-practices' &&
              post.slug !== 'art-remote-team-leadership-tech'
            );

            if (addedSeeds || updatedSeeds || merged.blog.length !== originalLength) {
              needsKvSave = true;
            }
          }

          // If we merged new seed data, save it back to Vercel KV permanently
          if (needsKvSave) {
            try {
              await kv.set('portfolio_data', merged);
            } catch (writeErr) {
              console.error('Error auto-persisting merged schema to KV:', writeErr);
            }
          }

          return res.status(200).json(merged);
        }
      } catch (kvError) {
        console.error('KV Error:', kvError);
      }
    }

    // 2. Fallback to Local File
    if (fs.existsSync(DATA_FILE)) {
      const data = JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
      if (!data.blog || data.blog.length === 0) {
        data.blog = defaultBlogArticles;
      }
      return res.status(200).json(data);
    }

    // 3. Default Initial Data
    res.status(200).json({
      name: 'Do Minh Tuan',
      title: 'Senior Project Manager',
      phone: '+84 96 288 2315',
      hero: { greeting: 'Welcome to my universe' },
      experience: [],
      skills: {},
      projects: [],
      blog: defaultBlogArticles,
      footer: { text: 'Crafted with passion', year: '2026' }
    });
  } catch (e) {
    res.status(200).json({ error: 'Fallback', name: 'Tony', blog: defaultBlogArticles });
  }
}
