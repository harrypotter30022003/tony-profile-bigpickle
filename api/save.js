import fs from 'fs';
import path from 'path';
import crypto from 'crypto';

const DATA_FILE = path.join(process.cwd(), 'src/admin/data.json');
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'admin123';

function verifyToken(token) {
  const expectedToken = crypto.createHmac('sha256', ADMIN_PASSWORD).update('cms-session').digest('hex');
  return token === expectedToken;
}

export default function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { token, data } = req.body;
  if (!verifyToken(token)) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    if (process.env.VERCEL) {
      // Persistence check for Vercel
      return res.status(403).json({ error: 'Persistence not supported on Vercel without a database. Changes are lost on restart.' });
    }

    const dir = path.dirname(DATA_FILE);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
}
