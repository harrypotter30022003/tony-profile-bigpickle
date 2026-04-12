import fs from 'fs';
import path from 'path';

const DATA_FILE = path.join(process.cwd(), 'src/admin/data.json');

export default function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    if (!fs.existsSync(DATA_FILE)) {
      // Return default if file doesn't exist yet
      return res.status(200).json({
        name: 'Do Minh Tuan',
        title: 'Senior Project Manager & Tech Leader',
        hero: { greeting: 'Welcome to my universe' },
        experience: [],
        skills: {},
        projects: []
      });
    }
    const data = JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
    res.status(200).json(data);
  } catch (e) {
    res.status(200).json({ error: 'Fallback', name: 'Tony' });
  }
}