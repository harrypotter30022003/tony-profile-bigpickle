import { chromium } from '@playwright/test';
import { spawn } from 'child_process';

const PORT = 5190;

console.log('Starting vite server...');
const server = spawn('npx', ['vite', 'preview', '--port', String(PORT), '--host', '127.0.0.1'], {
  cwd: process.cwd(),
  shell: true
});

server.stdout.on('data', (data) => {
  console.log('[SERVER]', data.toString().trim());
});

server.stderr.on('data', (data) => {
  console.log('[SERVER ERR]', data.toString().trim());
});

console.log('Waiting for server...');
await new Promise(r => setTimeout(r, 4000));

console.log('Launching browser...');
const browser = await chromium.launch({ headless: true });
const page = await browser.newPage();

const errors = [];
const logs = [];

page.on('console', msg => {
  const text = msg.text();
  logs.push(`[${msg.type().toUpperCase()}] ${text}`);
  if (msg.type() === 'error') errors.push(text);
});

page.on('pageerror', error => {
  errors.push(`[PAGE ERROR] ${error.message}`);
});

page.on('requestfailed', request => {
  errors.push(`[FAILED] ${request.url()}`);
});

try {
  console.log(`Opening http://127.0.0.1:${PORT}...`);
  await page.goto(`http://127.0.0.1:${PORT}`, { timeout: 15000 });
  await page.waitForTimeout(3000);
  
  const title = await page.title();
  console.log('Title:', title);
  
  console.log('\n=== CONSOLE ===');
  logs.forEach(l => console.log(l));
  
  if (errors.length > 0) {
    console.log('\n=== ERRORS ===');
    errors.forEach(e => console.error(e));
  } else {
    console.log('\n✓ No errors!');
  }
} catch (e) {
  console.error('Error:', e.message);
} finally {
  await browser.close();
  server.kill();
}
