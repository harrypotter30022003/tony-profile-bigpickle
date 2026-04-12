import crypto from 'crypto';

const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'admin123';

export default function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { password } = req.body;
  if (password === ADMIN_PASSWORD) {
    // Generate a stateless token based on the password
    const token = crypto.createHmac('sha256', ADMIN_PASSWORD).update('cms-session').digest('hex');
    res.json({ token });
  } else {
    res.status(401).json({ error: 'Invalid password' });
  }
}