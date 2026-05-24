import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { kv } from '@vercel/kv';

const DATA_FILE = path.join(process.cwd(), 'src/admin/subscribers.json');
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'admin123';

export default async function handler(req, res) {
  res.setHeader('Content-Type', 'application/json; charset=utf-8');

  // 1. Authenticate using stateless HMAC token
  const token = req.query.token || req.headers.authorization;
  if (!token) {
    return res.status(401).json({ error: 'Unauthorized. Token missing.' });
  }

  const expectedToken = crypto.createHmac('sha256', ADMIN_PASSWORD).update('cms-session').digest('hex');
  if (token !== expectedToken) {
    return res.status(401).json({ error: 'Unauthorized. Invalid session token.' });
  }

  let subscribers = [];

  try {
    // 2. Load subscriber list
    if (process.env.VERCEL && process.env.KV_REST_API_URL) {
      try {
        const cloudData = await kv.get('portfolio_subscribers');
        if (Array.isArray(cloudData)) {
          subscribers = cloudData;
        }
      } catch (kvErr) {
        console.error('Subscribers list API: KV load failed:', kvErr);
      }
    } else {
      try {
        if (fs.existsSync(DATA_FILE)) {
          const fileData = JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
          if (Array.isArray(fileData)) {
            subscribers = fileData;
          }
        }
      } catch (fsError) {
        console.error('Subscribers list API: Disk read failed:', fsError);
      }
    }

    return res.status(200).json({ success: true, subscribers });

  } catch (err) {
    console.error('Subscribers list API error:', err);
    return res.status(500).json({ error: 'Internal server error fetching subscribers.' });
  }
}
