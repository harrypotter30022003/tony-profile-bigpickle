import fs from 'fs';
import path from 'path';
import { kv } from '@vercel/kv';

const DATA_FILE = path.join(process.cwd(), 'src/admin/subscribers.json');

export default async function handler(req, res) {
  res.setHeader('Content-Type', 'application/json; charset=utf-8');

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { email } = req.body;
  if (!email || !email.includes('@') || email.length < 5) {
    return res.status(400).json({ error: 'Invalid email address provided.' });
  }

  const cleanEmail = email.trim().toLowerCase();
  let subscribers = [];

  try {
    // 1. Load current list from Vercel KV or local disk
    if (process.env.VERCEL && process.env.KV_REST_API_URL) {
      try {
        const cloudData = await kv.get('portfolio_subscribers');
        if (Array.isArray(cloudData)) {
          subscribers = cloudData;
        }
      } catch (kvErr) {
        console.error('Subscribe: KV load failed:', kvErr);
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
        console.error('Subscribe: Disk read failed:', fsError);
      }
    }

    // 2. Check if already subscribed
    const isAlreadySubscribed = subscribers.some(sub => sub.email === cleanEmail);
    if (isAlreadySubscribed) {
      return res.status(200).json({ message: 'You are already subscribed to the weekly stream!' });
    }

    // 3. Append and save
    subscribers.push({
      email: cleanEmail,
      subscribedAt: new Date().toISOString()
    });

    if (process.env.VERCEL && process.env.KV_REST_API_URL) {
      await kv.set('portfolio_subscribers', subscribers);
    } else {
      const parentDir = path.dirname(DATA_FILE);
      if (!fs.existsSync(parentDir)) {
        fs.mkdirSync(parentDir, { recursive: true });
      }
      fs.writeFileSync(DATA_FILE, JSON.stringify(subscribers, null, 2), 'utf8');
    }

    return res.status(200).json({ message: 'Welcome aboard! Successfully subscribed to the weekly tech stream.' });

  } catch (err) {
    console.error('Subscribe endpoint error:', err);
    return res.status(500).json({ error: 'Internal server registration error. Please try again later.' });
  }
}
