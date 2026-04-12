import fs from 'fs';
import path from 'path';

const DATA_FILE = path.join(process.cwd(), 'src/admin/data.json');

export default function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const data = JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
    res.status(200).json(data);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
}