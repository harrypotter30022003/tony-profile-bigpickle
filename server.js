import express from 'express';
import cors from 'cors';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import dotenv from 'dotenv';
dotenv.config();

const app = express();
const PORT = 3001;
const PROJECT_DIR = process.env.PROJECT_DIR || 'P:\\OpenCode_Projects\\Tony-cv-cloud\\tony-portfolio';
const DATA_FILE = path.join(PROJECT_DIR, 'src/admin/data.json');
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'admin123';

app.use(cors());
app.use(express.json());

// Rate limiting
let requestCount = 0;
setInterval(() => requestCount = 0, 60000);

// Simple token store (in production, use proper session)
const validTokens = new Set();

function generateToken() {
  return crypto.randomBytes(32).toString('hex');
}

console.log('Data file:', DATA_FILE);

// Login endpoint
app.post('/api/login', (req, res) => {
  const { password } = req.body;
  const trimmed = password?.trim();
  if (trimmed === ADMIN_PASSWORD) {
    const token = generateToken();
    validTokens.add(token);
    res.json({ token });
  } else {
    res.status(401).json({ error: 'Invalid password' });
  }
});

// Verify token middleware
function verifyToken(token) {
  return validTokens.has(token);
}

// Get data (public - for frontend)
app.get('/api/data', (req, res) => {
  try {
    const data = JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
    res.json(data);
  } catch(e) { 
    res.status(500).json({error:e.message}); 
  }
});

// Save data (protected)
app.post('/api/save', (req, res) => {
  // Rate limit: 10 requests per minute
  requestCount++;
  if(requestCount > 10) {
    return res.status(429).json({error:'Too many requests'});
  }
  
  const { token, data } = req.body;
  if(!verifyToken(token)) {
    return res.status(401).json({error:'Unauthorized'});
  }
  try {
    fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
    res.json({success:true});
  } catch(e) { 
    res.status(500).json({error:e.message}); 
  }
});

console.log(`Admin API: http://localhost:${PORT}`);
app.listen(PORT);