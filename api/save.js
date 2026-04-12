import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { kv } from '@vercel/kv';

const DATA_FILE = path.join(process.cwd(), 'src/admin/data.json');
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'admin123';

function verifyToken(token) {
  const expectedToken = crypto.createHmac('sha256', ADMIN_PASSWORD).update('cms-session').digest('hex');
  return token === expectedToken;
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { token, data } = req.body;
  if (!verifyToken(token)) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    // 1. If on Vercel, save to KV
    if (process.env.VERCEL) {
      if (!process.env.KV_REST_API_URL) {
        return res.status(500).json({ error: 'KV Database not configured in Vercel dashboard.' });
      }
      await kv.set('portfolio_data', data);
      return res.json({ success: true, message: 'Saved to Cloud KV' });
    }

    // 2. If Local, save to File
    const dir = path.dirname(DATA_FILE);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
    res.json({ success: true, message: 'Saved to Local File' });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
}
