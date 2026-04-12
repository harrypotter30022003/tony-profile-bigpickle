import express from 'express';
import cors from 'cors';
import fs from 'fs';
import path from 'path';

const app = express();
const PORT = 3001;
const PROJECT_DIR = 'P:\\OpenCode_Projects\\Tony-cv-cloud\\tony-portfolio';
const DATA_FILE = path.join(PROJECT_DIR, 'src/admin/data.json');

app.use(cors());
app.use(express.json());

console.log('Data file:', DATA_FILE);

// Simple auth
function hash(s) { let h=0; for(let i=0;i<s.length;i++)h=((h<<5)-h)+s.charCodeAt(i); return (h>>>0).toString(16); }

// Get data
app.get('/api/data', (req, res) => {
  try {
    console.log('Reading from:', DATA_FILE);
    const data = JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
    console.log('Read name:', data.name);
    res.json(data);
  } catch(e) { 
    console.log('Error reading:', e.message);
    res.status(500).json({error:e.message}); 
  }
});

// Save data (protected)
app.post('/api/save', (req, res) => {
  console.log('Request body:', JSON.stringify(req.body).substring(0, 200));
  const {password, data} = req.body;
  console.log('Save request received:', { password: password ? 'Yes' : 'No', hasData: !!data });
  if(password !== 'admin123') {
    console.log('Invalid password');
    return res.status(401).json({error:'Invalid password'});
  }
  try {
    console.log('Writing to:', DATA_FILE);
    fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
    console.log('Save complete');
    res.json({success:true});
  } catch(e) { 
    console.log('Error:', e.message);
    res.status(500).json({error:e.message}); 
  }
});

console.log(`Admin API: http://localhost:${PORT}`);
app.listen(PORT);