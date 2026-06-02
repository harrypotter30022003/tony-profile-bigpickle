// Lightweight article reactions (like / insightful / inspired).
// Storage: Vercel KV with key `reactions:<slug>` -> { like: 0, insightful: 0, inspired: 0 }
// Per-user dedup: client tracks in localStorage which reactions they've sent for which slug

import { kv } from '@vercel/kv';
import fs from 'fs';
import path from 'path';

const LOCAL_FILE = path.join(process.cwd(), 'src/admin/reactions.json');

async function loadReactions(slug) {
  if (process.env.VERCEL && process.env.KV_REST_API_URL) {
    try {
      const data = await kv.get(`reactions:${slug}`);
      return data && typeof data === 'object' ? data : { like: 0, insightful: 0, inspired: 0 };
    } catch (err) {
      console.error('KV reactions load failed:', err);
    }
  }
  try {
    if (fs.existsSync(LOCAL_FILE)) {
      const all = JSON.parse(fs.readFileSync(LOCAL_FILE, 'utf8'));
      return all[slug] || { like: 0, insightful: 0, inspired: 0 };
    }
  } catch (err) {
    console.error('Local reactions load failed:', err);
  }
  return { like: 0, insightful: 0, inspired: 0 };
}

async function saveReactions(slug, data) {
  if (process.env.VERCEL && process.env.KV_REST_API_URL) {
    await kv.set(`reactions:${slug}`, data);
    return;
  }
  let all = {};
  try {
    if (fs.existsSync(LOCAL_FILE)) {
      all = JSON.parse(fs.readFileSync(LOCAL_FILE, 'utf8'));
    }
  } catch {}
  all[slug] = data;
  const dir = path.dirname(LOCAL_FILE);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(LOCAL_FILE, JSON.stringify(all, null, 2), 'utf8');
}

export default async function handler(req, res) {
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Cache-Control', 'no-store');

  const { slug } = req.query;
  if (!slug || !/^[a-z0-9-]+$/i.test(slug)) {
    return res.status(400).json({ error: 'Invalid slug' });
  }

  if (req.method === 'GET') {
    const data = await loadReactions(slug);
    return res.status(200).json({ reactions: data });
  }

  if (req.method === 'POST') {
    const { type } = req.body || {};
    if (!['like', 'insightful', 'inspired'].includes(type)) {
      return res.status(400).json({ error: 'Invalid reaction type' });
    }

    const data = await loadReactions(slug);
    data[type] = (data[type] || 0) + 1;
    await saveReactions(slug, data);

    return res.status(200).json({ reactions: data });
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
