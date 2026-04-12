import fs from 'fs';
import path from 'path';
import crypto from 'crypto';

const DATA_FILE = path.join(process.cwd(), 'src/admin/data.json');
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'admin123';

const validTokens = new Set();

function generateToken() {
  return crypto.randomBytes(32).toString('hex');
}

function verifyToken(token) {
  return validTokens.has(token);
}

export default function handler(req, res) {
  if (req.method === 'POST') {
    const { token, data } = req.body;
    if (!verifyToken(token)) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    try {
      fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
      validTokens.delete(token);
      res.json({ success: true });
    } catch (e) {
      res.status(500).json({ error: e.message });
    }
  } else {
    res.status(405).json({ error: 'Method not allowed' });
  }
}