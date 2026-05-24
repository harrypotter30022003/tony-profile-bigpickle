import fs from 'fs';
import path from 'path';
import { kv } from '@vercel/kv';

const DATA_FILE = path.join(process.cwd(), 'src/admin/subscribers.json');

export default async function handler(req, res) {
  res.setHeader('Content-Type', 'text/html; charset=utf-8');

  const { email } = req.query;
  if (!email || !email.includes('@')) {
    return res.status(400).send(`
      <div style="font-family: system-ui, -apple-system, sans-serif; text-align: center; padding: 4rem 2rem; background: #0a0a0f; color: #fff; min-height: 100vh;">
        <h1 style="color: #ff006e; font-size: 2rem; margin-bottom: 1rem;">⚠️ Invalid Unsubscribe request</h1>
        <p style="color: #888; font-size: 1.1rem; margin-bottom: 2rem;">No valid email address was supplied.</p>
        <a href="https://me.tony.do" style="color: #00f5d4; text-decoration: none; border: 1px solid #00f5d4; padding: 0.6rem 1.5rem; borderRadius: 4px;">Back to me.tony.do</a>
      </div>
    `);
  }

  const targetEmail = email.trim().toLowerCase();
  let subscribers = [];

  try {
    if (process.env.VERCEL && process.env.KV_REST_API_URL) {
      try {
        const cloudData = await kv.get('portfolio_subscribers');
        if (Array.isArray(cloudData)) {
          subscribers = cloudData;
        }
      } catch (kvErr) {
        console.error('Unsubscribe: KV load failed:', kvErr);
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
        console.error('Unsubscribe: Disk read failed:', fsError);
      }
    }

    // Filter out the subscriber
    const beforeCount = subscribers.length;
    subscribers = subscribers.filter(sub => sub.email !== targetEmail);
    const afterCount = subscribers.length;

    if (process.env.VERCEL && process.env.KV_REST_API_URL) {
      await kv.set('portfolio_subscribers', subscribers);
    } else {
      const parentDir = path.dirname(DATA_FILE);
      if (!fs.existsSync(parentDir)) {
        fs.mkdirSync(parentDir, { recursive: true });
      }
      fs.writeFileSync(DATA_FILE, JSON.stringify(subscribers, null, 2), 'utf8');
    }

    return res.status(200).send(`
      <div style="font-family: system-ui, -apple-system, sans-serif; text-align: center; padding: 6rem 2rem; background: #0a0a0f; color: #fff; min-height: 100vh; display: flex; flex-direction: column; align-items: center; justify-content: center;">
        <div style="border: 1px solid rgba(255,255,255,0.05); padding: 3rem; borderRadius: 12px; background: rgba(255,255,255,0.01); max-width: 500px; box-shadow: 0 8px 32px 0 rgba(0,0,0,0.3); backdrop-filter: blur(10px);">
          <span style="font-size: 3rem; margin-bottom: 1.5rem; display: block;">📬</span>
          <h1 style="color: #00f5d4; font-size: 2rem; margin-bottom: 1rem;">Unsubscribed Successfully</h1>
          <p style="color: #b0b0b8; font-size: 1.05rem; line-height: 1.6; margin-bottom: 2rem;">
            You have been cleanly removed from Tony Do's weekly tech stream (<strong>${targetEmail}</strong>). We are sorry to see you go!
          </p>
          <a href="https://me.tony.do" style="color: #000; background: #00f5d4; text-decoration: none; font-weight: bold; padding: 0.8rem 2rem; border-radius: 6px; box-shadow: 0 0 15px rgba(0, 245, 212, 0.3); transition: all 0.2s;">
            Back to me.tony.do
          </a>
        </div>
      </div>
    `);

  } catch (err) {
    console.error('Unsubscribe endpoint error:', err);
    return res.status(500).send(`
      <div style="font-family: system-ui, -apple-system, sans-serif; text-align: center; padding: 4rem 2rem; background: #0a0a0f; color: #fff; min-height: 100vh;">
        <h1 style="color: #ff006e; font-size: 2rem; margin-bottom: 1rem;">⚠️ Internal Error</h1>
        <p style="color: #888; font-size: 1.1rem; margin-bottom: 2rem;">Could not process your request at this time. Please try again later.</p>
        <a href="https://me.tony.do" style="color: #00f5d4; text-decoration: none; border: 1px solid #00f5d4; padding: 0.6rem 1.5rem; borderRadius: 4px;">Back to me.tony.do</a>
      </div>
    `);
  }
}
