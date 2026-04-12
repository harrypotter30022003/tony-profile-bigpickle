import fs from 'fs';
import path from 'path';

const DATA_FILE = path.join(process.cwd(), 'src/admin/data.json');
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'admin123';

export default function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { password, data } = req.body;

    if (password !== ADMIN_PASSWORD) {
      return res.status(401).json({ error: 'Invalid password' });
    }

    fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
    res.status(200).json({ success: true });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
}