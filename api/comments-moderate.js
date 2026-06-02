// Admin moderation endpoint for comments.
// Auth: same HMAC token pattern as other admin endpoints.
// Actions: list (with status filter), approve, reject, delete

import crypto from 'crypto';
import { kv } from '@vercel/kv';
import fs from 'fs';
import path from 'path';

const LOCAL_FILE = path.join(process.cwd(), 'src/admin/comments.json');
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'admin123';

function verifyToken(token) {
  if (!token) return false;
  const expected = crypto.createHmac('sha256', ADMIN_PASSWORD).update('cms-session').digest('hex');
  return token === expected;
}

function stripBearer(token) {
  if (!token) return null;
  if (token.startsWith('Bearer ')) return token.slice(7);
  return token;
}

async function loadAllComments() {
  if (process.env.VERCEL && process.env.KV_REST_API_URL) {
    // KV doesn't support list-by-prefix easily; use SCAN
    const all = {};
    let cursor = 0;
    do {
      const result = await kv.scan(cursor, { match: 'comments:*', count: 100 });
      cursor = Number(result[0]);
      const keys = result[1] || [];
      for (const key of keys) {
        const slug = key.replace('comments:', '');
        const data = await kv.get(key);
        if (Array.isArray(data)) all[slug] = data;
      }
    } while (cursor !== 0);
    return all;
  }
  // Local fallback
  try {
    if (fs.existsSync(LOCAL_FILE)) {
      return JSON.parse(fs.readFileSync(LOCAL_FILE, 'utf8'));
    }
  } catch (err) {
    console.error('Local load failed:', err);
  }
  return {};
}

async function saveAllComments(all) {
  if (process.env.VERCEL && process.env.KV_REST_API_URL) {
    for (const [slug, comments] of Object.entries(all)) {
      await kv.set(`comments:${slug}`, comments);
    }
    return;
  }
  const dir = path.dirname(LOCAL_FILE);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(LOCAL_FILE, JSON.stringify(all, null, 2), 'utf8');
}

export default async function handler(req, res) {
  res.setHeader('Content-Type', 'application/json; charset=utf-8');

  // Auth
  const token = stripBearer(req.query.token) || stripBearer(req.headers.authorization);
  if (!verifyToken(token)) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  if (req.method === 'GET') {
    // List all comments, optionally filtered
    const { status, slug } = req.query;
    const all = await loadAllComments();
    let flat = [];
    for (const [s, comments] of Object.entries(all)) {
      for (const c of comments) {
        if (slug && s !== slug) continue;
        if (status && c.status !== status) continue;
        flat.push({ ...c, slug: s });
      }
    }
    flat.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    return res.status(200).json({ comments: flat, count: flat.length });
  }

  if (req.method === 'POST') {
    // Action: { action: 'approve' | 'reject' | 'spam' | 'delete', slug, id }
    const { action, slug, id } = req.body || {};
    if (!action || !slug || !id) {
      return res.status(400).json({ error: 'Missing action, slug, or id' });
    }

    const all = await loadAllComments();
    const comments = all[slug];
    if (!comments) {
      return res.status(404).json({ error: 'No comments for that slug' });
    }

    const idx = comments.findIndex(c => c.id === id);
    if (idx === -1) {
      return res.status(404).json({ error: 'Comment not found' });
    }

    if (action === 'delete') {
      comments.splice(idx, 1);
    } else if (['approve', 'reject', 'spam', 'pending'].includes(action)) {
      comments[idx].status = action;
      comments[idx].moderatedAt = new Date().toISOString();
    } else {
      return res.status(400).json({ error: 'Invalid action' });
    }

    all[slug] = comments;
    await saveAllComments(all);

    return res.status(200).json({ ok: true, action, slug, id });
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
