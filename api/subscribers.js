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

    let smtpLimits = null;
    let smtpErrorDetail = null;
    try {
      const clientId = process.env.SENDPULSE_CLIENT_ID;
      const clientSecret = process.env.SENDPULSE_CLIENT_SECRET;
      if (!clientId || !clientSecret) {
        smtpErrorDetail = 'SendPulse API credentials (SENDPULSE_CLIENT_ID or SENDPULSE_CLIENT_SECRET) are not configured inside your Vercel Dashboard.';
      } else {
        const authRes = await fetch('https://api.sendpulse.com/oauth/access_token', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            grant_type: 'client_credentials',
            client_id: clientId,
            client_secret: clientSecret
          })
        });
        if (authRes.ok) {
          const authData = await authRes.json();
          const token = authData.access_token;
          const limitsRes = await fetch('https://api.sendpulse.com/smtp/limits', {
            method: 'GET',
            headers: { 'Authorization': `Bearer ${token}` }
          });
          if (limitsRes.ok) {
            smtpLimits = await limitsRes.json();
          } else {
            smtpErrorDetail = `SendPulse SMTP limits query failed: ${limitsRes.status} ${limitsRes.statusText}`;
          }
        } else {
          const authErrText = await authRes.text();
          smtpErrorDetail = `SendPulse OAuth authentication failed: ${authErrText}`;
        }
      }
    } catch (err) {
      console.error('Subscribers API: SendPulse SMTP limit fetch failed:', err);
      smtpErrorDetail = `SendPulse API connection error: ${err.message}`;
    }

    let kvStats = null;
    let kvErrorDetail = null;
    try {
      if (process.env.VERCEL && process.env.KV_REST_API_URL) {
        kvStats = {};
        
        try {
          const dbsize = await kv.dbsize();
          kvStats.keys = dbsize;
        } catch (keysErr) {
          console.error('Subscribers API: dbsize failed:', keysErr);
          kvErrorDetail = `KV keys query failed: ${keysErr.message}`;
        }

        try {
          const infoText = await kv.info();
          let usedMemory = '0 B';
          const lines = infoText.split('\r\n').join('\n').split('\n');
          for (const line of lines) {
            if (line.startsWith('used_memory_human:')) {
              usedMemory = line.split(':')[1].trim();
            }
          }
          kvStats.storage = usedMemory;
        } catch (infoErr) {
          console.error('Subscribers API: info failed, using fallback:', infoErr);
          kvStats.storage = 'Under 1 MB'; // Fallback estimate for restricted INFO commands
        }
      } else {
        kvErrorDetail = 'Vercel KV database is not configured or not running on Vercel environment.';
      }
    } catch (kvErr) {
      console.error('Subscribers API: Vercel KV stats fetch failed:', kvErr);
      kvErrorDetail = `KV connection error: ${kvErr.message}`;
    }

    return res.status(200).json({ success: true, subscribers, smtpLimits, smtpErrorDetail, kvStats, kvErrorDetail });

  } catch (err) {
    console.error('Subscribers list API error:', err);
    return res.status(500).json({ error: 'Internal server error fetching subscribers.' });
  }
}
