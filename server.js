#!/usr/bin/env node
import express from 'express';
import cors from 'cors';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const PORT = 3001;
const DATA_FILE = path.join(__dirname, 'src/admin/data.json');
const SESSION_FILE = path.join(__dirname, 'src/admin/sessions.json');

// Security config - CHANGE THESE
const ADMIN_PASSWORD_HASH = '5baa61e4c9b93fcf6cf6c9b93f6cf00f1d8e120b'; // admin (sha1)
const TOTP_SECRET = 'JBSWY3DPEHPK3PXP'; // Change this to your secret
const SESSION_SECRET = crypto.randomBytes(32).toString('hex');

app.use(cors());
app.use(express.json());

// Simple TOTP generator (compatible with Google Authenticator)
function generateTOTP(secret) {
  try {
    const counter = Math.floor(Date.now() / 30000);
    const buf = Buffer.alloc(8);
    buf.writeBigInt64BE(BigInt(counter));
    const key = base32ToBuf(secret);
    const hmac = crypto.createHmac('sha1', key);
    hmac.update(buf);
    const hash = hmac.digest();
    const offset = hash[hash.length - 1] & 0xf;
    const code = (hash[offset] & 0x7f) << 24 | hash[offset + 1] << 16 | hash[offset + 2] << 8 | hash[offset + 3];
    return (code % 1000000).toString().padStart(6, '0');
  } catch (e) {
    return '000000';
  }
}

function base32ToBuf(base32) {
  const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
  let bits = '';
  for (const char of base32.toUpperCase()) {
    bits += alphabet.indexOf(char).toString(2).padStart(5, '0');
  }
  const buf = [];
  for (let i = 0; i + 8 <= bits.length; i += 8) {
    buf.push(parseInt(bits.slice(i, i + 8), 2));
  }
  return Buffer.from(buf);
}

function verifyTOTP(token, secret) {
  const expected = generateTOTP(secret);
  return token === expected;
}

// Session management
let sessions = {};
try {
  if (fs.existsSync(SESSION_FILE)) {
    sessions = JSON.parse(fs.readFileSync(SESSION_FILE));
  }
} catch (e) {}

function saveSessions() {
  fs.writeFileSync(SESSION_FILE, JSON.stringify(sessions));
}

function createSession() {
  const id = crypto.randomBytes(32).toString('hex');
  sessions[id] = { created: Date.now(), expires: Date.now() + 86400000 };
  saveSessions();
  return id;
}

function validateSession(id) {
  if (!sessions[id]) return null;
  if (sessions[id].expires < Date.now()) {
    delete sessions[id];
    saveSessions();
    return null;
  }
  sessions[id].expires = Date.now() + 86400000;
  saveSessions();
  return sessions[id];
}

function destroySession(id) {
  delete sessions[id];
  saveSessions();
}

// Get all site data
app.get('/api/data', (req, res) => {
  try {
    const data = JSON.parse(fs.readFileSync(DATA_FILE));
    res.json(data);
  } catch (e) {
    res.status(500).json({ error: 'No data found' });
  }
});

// Login endpoint
app.post('/api/login', (req, res) => {
  const { password, totp } = req.body;
  
  // Verify password (SHA1 hash)
  const passwordHash = crypto.createHash('sha1').update(password).digest('hex');
  if (passwordHash !== ADMIN_PASSWORD_HASH) {
    return res.status(401).json({ error: 'Invalid password' });
  }
  
  // Verify TOTP
  if (!verifyTOTP(totp, TOTP_SECRET)) {
    return res.status(401).json({ error: 'Invalid 2FA code' });
  }
  
  const sessionId = createSession();
  res.json({ session: sessionId });
});

// Logout
app.post('/api/logout', (req, res) => {
  const sessionId = req.headers.authorization;
  if (sessionId) destroySession(sessionId);
  res.json({ success: true });
});

// Update data (protected)
app.put('/api/data', (req, res) => {
  const sessionId = req.headers.authorization;
  if (!validateSession(sessionId)) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  
  try {
    fs.writeFileSync(DATA_FILE, JSON.stringify(req.body, null, 2));
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ error: 'Failed to save' });
  }
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' });
});

console.log(`
============================================
  Tony Portfolio Admin CMS
============================================
  Server running at: http://localhost:${PORT}
  Open CMS at: http://localhost:${PORT}/admin
============================================
`);

app.listen(PORT, () => {
  console.log(`Admin API ready at http://localhost:${PORT}/api`);
});