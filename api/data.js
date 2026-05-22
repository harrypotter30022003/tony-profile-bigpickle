import fs from 'fs';
import path from 'path';
import { kv } from '@vercel/kv';

const DATA_FILE = path.join(process.cwd(), 'src/admin/data.json');

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // 1. Try Vercel KV if on Vercel
    if (process.env.VERCEL && process.env.KV_REST_API_URL) {
      try {
        const cloudData = await kv.get('portfolio_data');
        if (cloudData) {
          // Robust Schema Merging: if cloud database is missing the new 'blog' schema, merge it from local data.json seed
          let merged = { ...cloudData };
          let needsKvSave = false;

          if (!merged.blog || merged.blog.length === 0) {
            if (fs.existsSync(DATA_FILE)) {
              try {
                const defaultData = JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
                if (defaultData.blog && defaultData.blog.length > 0) {
                  merged.blog = defaultData.blog;
                  needsKvSave = true;
                }
              } catch (readErr) {
                console.error('Error reading fallback file for seed:', readErr);
              }
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
      footer: { text: 'Crafted with passion', year: '2026' }
    });
  } catch (e) {
    res.status(200).json({ error: 'Fallback', name: 'Tony' });
  }
}
